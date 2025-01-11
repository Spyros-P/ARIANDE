/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 * Copyright (c) 2015-2016 Intel Corporation
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <zephyr/sys/printk.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>
#include <bluetooth/scan.h>
#include <zephyr/bluetooth/uuid.h>

uint16_t no_packets=0;	

static void scan_filter_match(struct bt_scan_device_info *device_info,
			      struct bt_scan_filter_match *filter_match,
			      bool connectable)
{
	// char addr[BT_ADDR_LE_STR_LEN];

	// const struct bt_le_scan_recv_info *info = device_info->recv_info;

	// bt_addr_le_to_str(info->addr, addr, sizeof(addr));

	//printk("Filters matched. Address: %s connectable: %d, sid %u, rssi %d, tx_power %d, adv_type %u, adv properties %u, periodic adv interval %u, primary phy %u, secondary phy %u\n",
	//	addr, connectable, info->sid, info->rssi, info->tx_power, info->adv_type, info->adv_props, info->interval, info->primary_phy, info->secondary_phy);

	++no_packets;

	printk("MATCH: No of FILTERED packets %u\n", no_packets);

	//printk("MATCH: No of FILTERED packets %u, No of UNFILTERED packets %u\n", no_packets, no_packets_wrong);
}

struct bt_le_scan_param scan_param;

BT_SCAN_CB_INIT(scan_cb, scan_filter_match, NULL, NULL, NULL);


static int scan_init()
{	

	struct bt_scan_init_param scan_init = {
		.scan_param = &scan_param,
	};

	bt_scan_init(&scan_init); // Stores the scanning parameters we set at scan_param struct and the default conn params in bt_scan struct

	printk("Scan window %u, Scan interval %u, Scan timeout %u\n", scan_param.window, scan_param.interval, scan_param.timeout);

	bt_scan_cb_register(&scan_cb);

	int err;


	static struct bt_uuid_16 my_uuid = BT_UUID_INIT_16(0xFEAA);

	err = bt_scan_filter_add(BT_SCAN_FILTER_TYPE_UUID, &my_uuid);
	if (err) {
		printk("Scanning filters cannot be set (err %d)", err);
		return err;
	}

	err = bt_scan_filter_enable(BT_SCAN_UUID_FILTER, false);
	if (err) {
		printk("Filters cannot be turned on (err %d)", err);
		return err;
	}

	printk("Scan module initialized\n");
	return err;
}

int observer_start(uint16_t interval, uint16_t window)
{
	scan_param.options	= BT_LE_SCAN_OPT_NONE;
	scan_param.interval	= interval;
	scan_param.window	= window;

	int err;

	err = scan_init();

	if (err) {
		printk("scan_init failed (err %d)\n", err);
		return err;
	}

	err = bt_scan_start(BT_SCAN_TYPE_SCAN_PASSIVE);
	if (err) {
		printk("Start scanning failed (err %d)\n", err);
		return err;
	}

	printk("Scanning successfully started\n");

	return err;
}

static void scan_reset_work_handler(struct k_work *work)
{
	int err;

	printk("Scan window %u, Scan interval %u, Scan timeout %u\n", scan_param.window, scan_param.interval, scan_param.timeout);

	err = bt_scan_params_set(&scan_param);

	if (err) {
		printk("Failed to set new scan parameters (err %d)\n", err);
	}

	printk("Reset parameters: SUCCESS\n");

	err = bt_scan_start(BT_SCAN_TYPE_SCAN_PASSIVE);

	if (err) {
		printk("Scanning failed to start (err %d)\n", err);
	}

	printk("Scanning successfully restarted\n");

	return;
}

K_WORK_DEFINE(scan_reset_work, scan_reset_work_handler);

void scan_reset(uint16_t interval, uint16_t window, uint16_t timeout)
{

	no_packets = 0;
	scan_param.interval	= interval;
	scan_param.window	= window;
	scan_param.timeout	= timeout;

    k_work_submit(&scan_reset_work);

	printk("Exited handler\n");

	return;
}