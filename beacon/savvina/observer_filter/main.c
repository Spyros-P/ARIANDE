/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: Apache-2.0
 */

//#include <zephyr/sys/printk.h>
#include <zephyr/logging/log.h>
#include <zephyr/bluetooth/bluetooth.h>

LOG_MODULE_REGISTER(Observer_main_module, LOG_LEVEL_DBG);

int observer_start(uint16_t interval, uint16_t window, uint16_t timeout);

int main(void)
{
	int err;

	LOG_INF("Starting Observer Demo\n");

	/* Initialize the Bluetooth Subsystem */
	err = bt_enable(NULL);
	if (err) {
		LOG_ERR("Bluetooth init failed (err %d)\n", err);
		return 0;
	}

	uint16_t scan_interval = (uint16_t) 8000; // 5 seconds
	uint16_t scan_window = (uint16_t) 8000; // 5 seconds
	uint16_t scan_timeout = (uint16_t) 500; // 5 seconds

	(void)observer_start(scan_interval, scan_window, scan_timeout);

	//bt_le_scan_stop();

	LOG_INF("Exiting %s thread.\n", __func__);
	return 0;
}
