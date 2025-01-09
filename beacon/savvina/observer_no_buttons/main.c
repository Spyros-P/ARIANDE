/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: Apache-2.0
 */


#include <zephyr/sys/printk.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <bluetooth/scan.h>

uint16_t scan_interval = (uint16_t) 96; // 60ms
uint16_t scan_window = (uint16_t) 96; // 60ms
uint16_t scan_timeout = (uint16_t) 36; // 360 ms

int observer_start(uint16_t interval, uint16_t window, uint16_t timeout);
void scan_reset(uint16_t interval, uint16_t window, uint16_t timeout);


/* Bluetooth ready callback */
static void bt_ready(int err)
{

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

	(void)observer_start(scan_interval, scan_window, scan_timeout);

    (void)scan_reset(scan_interval, scan_window, scan_timeout);

}

int main(void)
{
	int err;

	printk("Starting Observer Demo\n");

	/* Initialize the Bluetooth Subsystem */
	err = bt_enable(bt_ready);
	if (err) {
		printk("Bluetooth init failed (err %d)\n", err);
		return 0;
	}

	printk("Exiting %s thread.\n", __func__);
	return 0;
}
