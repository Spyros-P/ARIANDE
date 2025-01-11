#include <zephyr/types.h>
#include <stddef.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/util.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/kernel.h>  // For k_timer 
#include <zephyr/drivers/counter.h>
#include <zephyr/device.h>

#include <zephyr/bluetooth/hci.h>// /* main.c - Application main entry point */
#include <zephyr/bluetooth/hci_vs.h>
#include <zephyr/sys/byteorder.h>
#include <zephyr/bluetooth/uuid.h> //extra

#define DEVICE_NAME CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)
#define BT_TIMEOUT_MAX 100
#define BT_TIMEOUT_MIN 3
#define ALARM_CHANNEL_ID 0
#define TIMER DT_NODELABEL(rtc2)
#define DELAY 2000000 // 2s

/* adv model parameters */
extern int current_min_interval;
extern int current_max_interval;
extern int Tx_id;
extern bool tx_on;

/* Observer model parameters*/
uint16_t scan_interval = (uint16_t) 96; // 60ms
uint16_t scan_window = (uint16_t) 96; // 60ms
uint16_t scan_timeout = (uint16_t) 36; // 360 ms

uint16_t scan_interval_max = (uint16_t) 160; // 100 ms
uint16_t scan_window_max = (uint16_t) 160; // 100 ms
uint16_t scan_timeout_max = (uint16_t) 360; // 3600 ms
extern int no_packets;

// advertise functions //
void adv_start();
void adv_reset();

// Observer function //
int  observer_start(uint16_t interval, uint16_t window);
void observer_stop();
void scan_reset(uint16_t interval, uint16_t window, uint16_t timeout); 


struct counter_alarm_cfg alarm_cfg;

static void counter_interrupt_fn(const struct device *counter_dev,
				      uint8_t chan_id, uint32_t ticks,
				      void *user_data)
{
    	struct counter_alarm_cfg *config = user_data;


}

/* Bluetooth ready callback */
static void bt_ready(int err)
{
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

    (void)observer_start(scan_interval, scan_window);

    adv_start();
}

int main(void)
{
	const struct device *const counter_dev = DEVICE_DT_GET(TIMER);
    int err;

    printk("Starting Beacon KOSTAKISSS Demo\n");

    if (!device_is_ready(counter_dev)) {
		printk("device not ready.\n");
		return 0;
	}

    counter_start(counter_dev);

	alarm_cfg.flags = 0;
	alarm_cfg.ticks = counter_us_to_ticks(counter_dev, DELAY);
	alarm_cfg.callback = counter_interrupt_fn;
	alarm_cfg.user_data = &alarm_cfg;

    err = counter_set_channel_alarm(counter_dev, ALARM_CHANNEL_ID,
					&alarm_cfg);

	if (-EINVAL == err) {
		printk("Alarm settings invalid\n");
	} else if (-ENOTSUP == err) {
		printk("Alarm setting request not supported\n");
	} else if (err != 0) {
		printk("Error\n");
	}

    /* Initialize the Bluetooth Subsystem */
    err = bt_enable(bt_ready);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
    }  

    return 0;
}