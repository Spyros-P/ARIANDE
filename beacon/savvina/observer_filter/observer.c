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
uint16_t no_packets_wrong=0;

static void scan_filter_match(struct bt_scan_device_info *device_info,
			      struct bt_scan_filter_match *filter_match,
			      bool connectable)
{
	char addr[BT_ADDR_LE_STR_LEN];

	const struct bt_le_scan_recv_info *info = device_info->recv_info;

	bt_addr_le_to_str(info->addr, addr, sizeof(addr));

	LOG_INF("Filters matched. Address: %s connectable: %d, sid %u, rssi %d, tx_power %d, adv_type %u, adv properties %u, periodic adv interval %u, primary phy %u, secondary phy %u\n",
		addr, connectable, info->sid, info->rssi, info->tx_power, info->adv_type, info->adv_props, info->interval, info->primary_phy, info->secondary_phy);

	++no_packets;

	LOG_INF("MATCH: No of FILTERED packets %u, No of UNFILTERED packets %u\n", no_packets, no_packets_wrong);
}


static void scan_no_filter_match(struct bt_scan_device_info *device_info, bool connectable)
{
	char addr[BT_ADDR_LE_STR_LEN];

	const struct bt_le_scan_recv_info *info = device_info->recv_info;

	bt_addr_le_to_str(info->addr, addr, sizeof(addr));
	
	LOG_INF("Filters matched. Address: %s connectable: %d, sid %u, rssi %d, tx_power %d, adv_type %u, adv properties %u, periodic adv interval %u, primary phy %u, secondary phy %u\n",
	addr, connectable, info->sid, info->rssi, info->tx_power, info->adv_type, info->adv_props, info->interval, info->primary_phy, info->secondary_phy);

	++no_packets_wrong;
	
	LOG_INF("NO MATCH: No of FILTERED packets %u, No of UNFILTERED packets %u\n", no_packets, no_packets_wrong);
	
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

BT_SCAN_CB_INIT(scan_cb, scan_filter_match, scan_no_filter_match, NULL, NULL);
//BT_SCAN_CB_INIT(scan_cb, scan_filter_match, NULL, NULL, NULL);

static int scan_init(struct bt_le_scan_param scan_param)
{
	int err;
	struct bt_scan_init_param scan_init = {
		.scan_param = &scan_param,
	};

	bt_scan_init(&scan_init); // Stores the scanning parameters we set at scan_param struct and the default conn params in bt_scan struct
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
	struct bt_le_scan_param scan_param = {
		.options    = BT_LE_SCAN_OPT_NONE,
		.interval   = interval, // 5 seconds //RULE: scan interval >= scan window
		.window     = window, // 5 seconds
		//.window	 = BT_GAP_SCAN_SLOW_WINDOW_1,
		.timeout	= timeout, // 5 seconds	
	};

	int err;

	err = scan_init(scan_param);
	if (err) {
		LOG_ERR("scan_init failed (err %d)", err);
		return err;
	}

	LOG_DBG("Scan window %u, Scan timeout %u\n", scan_param.window, scan_param.timeout);	

	err = bt_scan_start(BT_SCAN_TYPE_SCAN_PASSIVE);
	if (err) {
		LOG_ERR("Start scanning failed (err %d)\n", err);
		return err;
	}

	LOG_INF("Scanning successfully started");

	return 0;
}
