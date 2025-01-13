import { BleManager } from 'react-native-ble-plx';
import { KalmanFilter } from '../utils/kalmanFilter.js';

const bleManager = new BleManager();

export const startBleScan = (beaconsList, setDevices) => {

    const kalmanFilters = {};

    console.log("Starting BLE scan...");
    bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
        if (error) {
            console.error('BLE scan error: ', error);
            return;
        }

        const beacon = beaconsList.find((b) => device.name === b.name);
        if (beacon) {

            if (!kalmanFilters[beacon.name]) {
                kalmanFilters[beacon.name] = new KalmanFilter();
            }
            const rssiFiltered = device.rssi //kalmanFilters[beacon.name].update(device.rssi);

            setDevices((prevDevices) => {
                const deviceIndex = prevDevices.findIndex((d) => d.name === beacon.name)
                if (deviceIndex >= 0) {
                    const updatedDevices = [...prevDevices];
                    updatedDevices[deviceIndex] = {
                        ...updatedDevices[deviceIndex],
                        rssi: rssiFiltered,
                        timestamp: Date.now(),
                    };
                    // console.log("Updated devices list:", updatedDevices);
                    return updatedDevices;
                }
                const newDeviceList = [
                    ...prevDevices,
                    { name: beacon.name, x: beacon.x, y: beacon.y, rssi: rssiFiltered, timestamp: Date.now() },
                ];
                // console.log("Added new device. Updated devices list:", newDeviceList);
                return newDeviceList;
            });
        }
    });
}

export const stopBleScan = () => {
    console.log("Stopping BLE scan...");
    bleManager.stopDeviceScan();
}