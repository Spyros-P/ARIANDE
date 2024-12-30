/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 * Copyright (c) 2015-2016 Intel Corporation
 *
 * SPDX-License-Identifier: Apache-2.0
 */

//#include <zephyr/sys/printk.h>
#include <zephyr/logging/log.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>

LOG_MODULE_REGISTER(Observer_module, LOG_LEVEL_DBG);

#define NAME_LEN 30

uint16_t no_packets=0;

static void device_found(const bt_addr_le_t *addr, int8_t rssi, uint8_t type,
			 struct net_buf_simple *ad)
{
	char addr_str[BT_ADDR_LE_STR_LEN];

	bt_addr_le_to_str(addr, addr_str, sizeof(addr_str));
	LOG_DBG("Device found: %s (RSSI %d), type %u, AD data len %u\n",
	       addr_str, rssi, type, ad->len);
	LOG_DBG("no. of packets scanned %u\n", ++no_packets);
}

int observer_start(uint16_t interval, uint16_t window, uint16_t timeout)
{
	//1st way to define scan parameters	

	struct bt_le_scan_param scan_param = {
		.type       = BT_LE_SCAN_TYPE_PASSIVE,
		.options    = BT_LE_SCAN_OPT_NONE,
		.interval   = interval, // 5 seconds //RULE: scan interval >= scan window
		.window     = window, // 5 seconds
		//.window	 = BT_GAP_SCAN_SLOW_WINDOW_1,
		.timeout	= timeout, // 5 seconds	
	};

	int err;
/*
	//2nd way to define scan parameters

	struct bt_le_scan_param scan_param = BT_LE_SCAN_PARAM_INIT(BT_LE_SCAN_TYPE_PASSIVE, BT_LE_SCAN_OPT_FILTER_DUPLICATE,
			      BT_GAP_SCAN_FAST_INTERVAL_MIN, BT_GAP_SCAN_SLOW_WINDOW_1);
*/

	LOG_DBG("Scan window %u, Scan timeout %u\n", scan_param.window, scan_param.timeout);	

	err = bt_le_scan_start(&scan_param, device_found);
	if (err) {
		LOG_ERR("Start scanning failed (err %d)\n", err);
		return err;
	}

	LOG_INF("Started scanning...\n");

	return 0;
}
