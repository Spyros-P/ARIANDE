import asyncio
import math
import time
from bleak import BleakScanner
from bleak.backends.scanner import AdvertisementData

TARGET_DEVICE_NAME = "ESP32 Beacon"

################################################################################
# 1. Unscented Kalman Filter for 1D Distance, with a Non-linear RSSI Measurement
################################################################################

class UKFDistance:
    """
    Unscented Kalman Filter for 1D distance estimation.
    State: distance (d)
    Measurement: RSSI(d) = TxPower - 10 * n * log10(d)
    """

    def __init__(
        self,
        initial_distance=1.0,
        process_std=0.1,
        measurement_std=2.0,
        tx_power=-59.0,
        pathloss_n=2.0,
    ):
        """
        :param initial_distance: initial guess for distance (meters)
        :param process_std: standard deviation for process noise
        :param measurement_std: standard deviation for measurement noise (dBm)
        :param tx_power: measured RSSI at 1 meter
        :param pathloss_n: path loss exponent
        """
        self.d = initial_distance  # our best distance estimate
        self.P = 1.0              # initial covariance
        self.Q = process_std**2   # process noise variance
        self.R = measurement_std**2  # measurement noise variance (dBm^2)
        self.tx_power = tx_power
        self.pathloss_n = pathloss_n

        # Tuning parameters for the unscented transform
        self.alpha = 1e-3
        self.beta = 2
        self.kappa = 0

    def _sigma_points(self, x, P):
        """
        Generate sigma points for a 1D state.
        For 1D, we have 2 sigma points: x + sqrt((lambda+1)*P) and x - sqrt((lambda+1)*P).
        """
        # For n=1, lambda = alpha^2 (n+kappa) - n = alpha^2*(1+kappa) - 1
        n = 1
        lam = (self.alpha**2) * (n + self.kappa) - n

        sigma_points = []
        c = math.sqrt((lam + n) * P)
        sigma_points.append(x + c)
        sigma_points.append(x - c)
        # We also have the mean point x itself
        # Some UKF definitions skip the raw mean as a separate sigma point in 1D, 
        # but let's keep it for clarity (giving 2n+1 points).
        sigma_points.append(x)

        # Weights
        w_m = []
        w_c = []
        w0_m = lam / (lam + n)
        w0_c = lam / (lam + n) + (1 - self.alpha**2 + self.beta)
        w_i = 1 / (2 * (lam + n))

        # For 1D we have 2n+1 = 3 points: (x+c), (x-c), (x)
        # We'll assign them in the order: 0->(x+c), 1->(x-c), 2->(x)
        w_m = [w_i, w_i, w0_m]
        w_c = [w_i, w_i, w0_c]

        return sigma_points, w_m, w_c

    def _process_model(self, d):
        """
        For 1D distance, let's assume no big changes: d_k = d_{k-1}.
        If needed, you can add or remove terms to reflect motion.
        """
        return d  # identity

    def _measurement_model(self, d):
        """
        RSSI(d) = TxPower - 10 * n * log10(d).
        We must handle d <= 0 gracefully (clip).
        """
        if d <= 0:
            d = 1e-3  # avoid log(0)
        rssi = self.tx_power - 10.0 * self.pathloss_n * math.log10(d)
        return rssi

    def predict(self):
        """
        Predict step: propagate sigma points through process model,
        then update mean and covariance.
        """
        sigma_points, w_m, w_c = self._sigma_points(self.d, self.P)

        # Propagate each sigma point
        sigma_pred = [self._process_model(sp) for sp in sigma_points]

        # Recompute mean
        d_mean = sum([wm * sp for wm, sp in zip(w_m, sigma_pred)])

        # Recompute covariance
        d_cov = 0.0
        for sp, wc in zip(sigma_pred, w_c):
            diff = sp - d_mean
            d_cov += wc * (diff**2)

        # Add process noise
        d_cov += self.Q

        self.d = d_mean
        self.P = d_cov

    def update(self, measurement_rssi):
        """
        Update step: pass sigma points through measurement function, 
        then correct the estimate with the actual measurement (rssi).
        """
        sigma_points, w_m, w_c = self._sigma_points(self.d, self.P)

        # Transform sigma points through measurement function
        z_sigma = [self._measurement_model(sp) for sp in sigma_points]

        # Predicted measurement mean
        z_mean = sum([wm * z for wm, z in zip(w_m, z_sigma)])

        # Predicted measurement covariance
        z_cov = 0.0
        for z, wc in zip(z_sigma, w_c):
            diff_z = z - z_mean
            z_cov += wc * (diff_z**2)

        # Add measurement noise
        z_cov += self.R

        # Cross-covariance
        Pxz = 0.0
        d_mean = self.d
        for sp, z, wc in zip(sigma_points, z_sigma, w_c):
            diff_x = sp - d_mean
            diff_z = z - z_mean
            Pxz += wc * diff_x * diff_z

        # Kalman gain
        K = Pxz / z_cov

        # Update estimate
        z_residual = measurement_rssi - z_mean
        self.d += K * z_residual

        # Update covariance
        self.P -= K * z_cov * K

        return self.d  # convenience

################################################################################
# 2. Bleak-based scanning + UKF
################################################################################

rssi_buffer = []

def detection_callback(device, adv_data: AdvertisementData):
    """
    Callback that fires whenever Bleak detects a BLE advertisement.
    If it's our target device, store the RSSI in a global buffer.
    """
    if device.name and TARGET_DEVICE_NAME.lower() in device.name.lower():
        rssi_buffer.append(device.rssi)

def rssi_to_distance_rough(rssi, tx_power=-59, pathloss_n=2.0):
    """
    A quick distance approximation from RSSI, often used for initial guess.
    d = 10^((tx_power - rssi)/(10*n))
    """
    return 10 ** ((tx_power - rssi) / (10.0 * pathloss_n))

async def main():
    # Start scanning in the background
    scanner = BleakScanner(detection_callback)
    await scanner.start()
    print(f"Scanning in background for '{TARGET_DEVICE_NAME}'... (Ctrl+C to stop)")

    # Initialize UKF
    # We'll guess an initial distance of 1.0m, with moderate noise parameters
    ukf = UKFDistance(
        initial_distance=1.0,
        process_std=0.1,       # how quickly we expect the distance to change
        measurement_std=2.0,   # typical std dev of RSSI in dBm
        tx_power=-59.0,
        pathloss_n=2.0
    )

    # If you want a better initial guess, wait for 1 or 2 raw RSSI measurements:
    # For example:
    init_samples = 5
    print("Gathering some initial RSSI samples for a better initial guess...")
    while len(rssi_buffer) < init_samples:
        await asyncio.sleep(0.1)

    # Compute a rough distance from the average of the initial RSSIs
    if rssi_buffer:
        init_rssi_avg = sum(rssi_buffer[:init_samples]) / len(rssi_buffer[:init_samples])
        init_d = rssi_to_distance_rough(init_rssi_avg, ukf.tx_power, ukf.pathloss_n)
        ukf.d = init_d  # set the initial distance guess
        print(f"Initial guess from avg RSSI {init_rssi_avg:.1f} dBm: {init_d:.2f} m")
        rssi_buffer.clear()

    # Timing
    poll_interval = 0.020     # how often we check for new RSSI
    update_interval = 0.020   # how often we do a UKF predict
    print_interval = 2.000    # how often we print the distance
    last_poll = time.time()
    last_predict = time.time()
    last_print = time.time()

    try:
        while True:
            now = time.time()

            # UKF "Predict" step every ~20ms
            if (now - last_predict) >= update_interval:
                ukf.predict()
                last_predict = now

            # If we have any new RSSI in the buffer, grab one
            if (now - last_poll) >= poll_interval:
                if rssi_buffer:
                    # Pop the oldest measurement
                    rssi = rssi_buffer.pop(0)
                    # UKF update
                    est_distance = ukf.update(rssi)
                last_poll = now

            # Print distance every 400ms
            if (now - last_print) >= print_interval:
                # Current best estimate
                print(
                    f"\rDistance: {ukf.d:.2f} m, Cov: {ukf.P:.4f}, "
                    f"Last RSSI used: {rssi if 'rssi' in locals() else 'N/A'}",
                    end="",
                    flush=True,
                )
                last_print = now

            await asyncio.sleep(0.005)

    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        await scanner.stop()

if __name__ == "__main__":
    asyncio.run(main())
