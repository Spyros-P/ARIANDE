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
#include <bluetooth/scan.h>
#include <zephyr/bluetooth/uuid.h>

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


static void scan_filter_match(struct bt_scan_device_info *device_info,
			      struct bt_scan_filter_match *filter_match,
			      bool connectable)
{
	char addr[BT_ADDR_LE_STR_LEN];

	bt_addr_le_to_str(device_info->recv_info->addr, addr, sizeof(addr));

	LOG_INF("Filters matched. Address: %s connectable: %d",
		addr, connectable);
}

/*
static void scan_connecting_error(struct bt_scan_device_info *device_info)
{
	LOG_WRN("Connecting failed");
}

static void scan_connecting(struct bt_scan_device_info *device_info,
			    struct bt_conn *conn)
{
	default_conn = bt_conn_ref(conn);
}
*/

BT_SCAN_CB_INIT(scan_cb, scan_filter_match, NULL, NULL, NULL);

static int scan_init(void)
{
	int err;
	struct bt_scan_init_param scan_init = {};

	bt_scan_init(&scan_init);
	bt_scan_cb_register(&scan_cb);

	//const void* ptr = (const void *)BT_UUID_16_ENCODE(0xFEAA);
	static struct bt_uuid_16 my_uuid = BT_UUID_INIT_16(0xFEAA);

	err = bt_scan_filter_add(BT_SCAN_FILTER_TYPE_UUID, &my_uuid);
	if (err) {
		LOG_ERR("Scanning filters cannot be set (err %d)", err);
		return err;
	}

	err = bt_scan_filter_enable(BT_SCAN_UUID_FILTER, false);
	if (err) {
		LOG_ERR("Filters cannot be turned on (err %d)", err);
		return err;
	}

	LOG_INF("Scan module initialized");
	return err;
}

int observer_start(uint16_t interval, uint16_t window, uint16_t timeout)
{
	int err;

	err = scan_init();
	if (err) {
		LOG_ERR("scan_init failed (err %d)", err);
		return err;
	}

	//1st way to define scan parameters	

	struct bt_le_scan_param scan_param = {
		.type       = BT_LE_SCAN_TYPE_PASSIVE,
		.options    = BT_LE_SCAN_OPT_NONE,
		.interval   = interval, // 5 seconds //RULE: scan interval >= scan window
		.window     = window, // 5 seconds
		//.window	 = BT_GAP_SCAN_SLOW_WINDOW_1,
		.timeout	= timeout, // 5 seconds	
	};

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

	LOG_INF("Scanning successfully started");

	return 0;
}
