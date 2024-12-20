// /* main.c - Application main entry point */

// /*
//  * Copyright (c) 2015-2016 Intel Corporation
//  *
//  * SPDX-License-Identifier: Apache-2.0
//  */

#include <zephyr/types.h>
#include <stddef.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/util.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/kernel.h>  // For k_timer

#define DEVICE_NAME CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)

/* GPIO configuration for buttons (2 buttons in this example) */
static const struct gpio_dt_spec button1 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw0), gpios, {0});
static const struct gpio_dt_spec button2 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw1), gpios, {0});

static struct gpio_callback button1_cb_data;
static struct gpio_callback button2_cb_data;

static struct k_timer interval_timer;

/* Default interval in milliseconds (e.g., 1000ms = 1 second) */
static int interval_ms = 1000;

/* Flag to check if a button was pressed */
static bool button_pressed = false;

/* Advertisement data */
static const struct bt_data ad[] = {
    BT_DATA_BYTES(BT_DATA_FLAGS, BT_LE_AD_NO_BREDR),
    BT_DATA_BYTES(BT_DATA_UUID16_ALL, 0xaa, 0xfe),
    BT_DATA_BYTES(BT_DATA_SVC_DATA16,
                  0xaa, 0xfe, /* Eddystone UUID */
                  0x10, /* Eddystone-URL frame type */
                  0x00, /* Calibrated Tx power at 0m */
                  0x00, /* URL Scheme Prefix http://www. */
                  'z', 'e', 'p', 'h', 'y', 'r',
                  'p', 'r', 'o', 'j', 'e', 'c', 't',
                  0x08) /* .org */
};

/* Scan Response data */
static const struct bt_data sd[] = {
    BT_DATA(BT_DATA_NAME_COMPLETE, DEVICE_NAME, DEVICE_NAME_LEN),
};

/* Bluetooth ready callback */
 static void bt_ready_1(int err) 
 {
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

    /* Start advertising */ 
	int MIN_1  =    0x0030 ; /* 30 ms    */
	int MIN_2  =    0x0060 ; /* 60 ms    */

	    //set-1 default//
		err = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, \
							MIN_1, \
							MIN_2 , \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started, advertising as %s\n", addr_s);

}

 static void bt_ready_2(int err) 
 {
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

    /* Start advertising */ 
    
	int MIN_2 =  0x00a0;    /* 100 ms */
	int MAX_2 =  0x00f0;  /* 150 ms */	

	    //set-1 default//
		err = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, \
							MIN_2, \
							MAX_2, \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started, advertising as %s\n", addr_s);

}


/* Button press handlers */
void button1_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
	bt_disable();

    int err = bt_enable(bt_ready_1);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
    }  
}

void button2_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
	bt_disable();

    int err = bt_enable(bt_ready_2);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
    }  
}

/* Timer handler that prints a message at the current interval */
void interval_timer_handler(struct k_timer *dummy)
{
    if (button_pressed) {
        printk("Interval timer triggered!\n");
        button_pressed = false;  // Reset the flag after printing the message
    }
}

/* Bluetooth ready callback */
static void bt_ready(int err)
{
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

    /* Start advertising */ 
	
	//set-1 default//
    err = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, \
						 BT_GAP_ADV_FAST_INT_MIN_1, \
						 BT_GAP_ADV_FAST_INT_MAX_1, \
						 NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
    if (err) {
        printk("Advertising failed to start (err %d)\n", err);
        return;
    }

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started, advertising as %s\n", addr_s);

    /* Configure buttons */
    if (!device_is_ready(button1.port)) {
        printk("Error: Button 1 device not ready\n");
        return;
    }

    if (!device_is_ready(button2.port)) {
        printk("Error: Button 2 device not ready\n");
        return;
    }

    /* Configure Button 1 */
    gpio_pin_configure_dt(&button1, GPIO_INPUT);
    gpio_pin_interrupt_configure_dt(&button1, GPIO_INT_EDGE_TO_ACTIVE);
    gpio_init_callback(&button1_cb_data, button1_pressed, BIT(button1.pin));
    gpio_add_callback(button1.port, &button1_cb_data);

    /* Configure Button 2 */
    gpio_pin_configure_dt(&button2, GPIO_INPUT);
    gpio_pin_interrupt_configure_dt(&button2, GPIO_INT_EDGE_TO_ACTIVE);
    gpio_init_callback(&button2_cb_data, button2_pressed, BIT(button2.pin));
    gpio_add_callback(button2.port, &button2_cb_data);

    /*printf Instructions for every button*/
    printk("Buttons configured, waiting for presses...\n");
    printk("Button 1 to set-1 interval\n");
    printk("Button 2 to set-2 interval\n");
}

int main(void)
{
    int err;

    printk("Starting Beacon Demo\n");

    /* Initialize the Bluetooth Subsystem */
    err = bt_enable(bt_ready);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
    }  

    return 0;
}
