/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: Apache-2.0
 */


#include <zephyr/sys/printk.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <bluetooth/scan.h>


#define BT_TIMEOUT_MAX 100
#define BT_TIMEOUT_MIN 3

// uint16_t scan_interval = BT_GAP_SCAN_FAST_INTERVAL_MIN; 
// uint16_t scan_window = BT_GAP_SCAN_SLOW_WINDOW_1;
// uint16_t scan_timeout = BT_TIMEOUT_MIN;


uint16_t scan_interval = (uint16_t) 96; // 60ms
uint16_t scan_window = (uint16_t) 96; // 60ms
uint16_t scan_timeout = (uint16_t) 36; // 360 ms

uint16_t scan_interval_max = (uint16_t) 160; // 100 ms
uint16_t scan_window_max = (uint16_t) 160; // 100 ms
uint16_t scan_timeout_max = (uint16_t) 360; // 3600 ms


/* GPIO configuration for buttons (2 buttons in this example) */
static const struct gpio_dt_spec button1 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw0), gpios, {0});
static const struct gpio_dt_spec button2 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw1), gpios, {0});
static const struct gpio_dt_spec button3 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw2), gpios, {0});

static struct gpio_callback button1_cb_data;
static struct gpio_callback button2_cb_data;
static struct gpio_callback button3_cb_data;

int observer_start(uint16_t interval, uint16_t window, uint16_t timeout);
int scan_reset(uint16_t interval, uint16_t window, uint16_t timeout);

static void bt_ready_button_pressed(int err) 
{
	if (err) {
		printk("Bluetooth init failed (err %d)\n", err);
		return;
	}

	printk("Bluetooth initialized\n"); 

    //printk("Added bt_scan_filter_disable\n");
    
    //bt_scan_filter_disable();

	(void)observer_start(scan_interval, scan_window, scan_timeout);
    
    //printk("Interval: %d, window: %d, timeout: %d\n", scan_interval, scan_window, scan_timeout);

	printk("Interval: %d, window: %d, timeout: %d\n", scan_interval, scan_window, scan_timeout);
}

/* Button press handlers */
void button1_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
    if (scan_interval < scan_interval_max) { 
        
		scan_interval = scan_interval + 6;

	    // Ensure the intervals don't go above a maximum value
		if (scan_interval > scan_interval_max) scan_interval = scan_interval_max;

        scan_reset(scan_interval, scan_window, scan_timeout);

    } 
	else printk("Maximum interval reached. No further decrease allowed.\n");
}

void button2_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{  
    if (scan_window < scan_window_max) { //current_min_interval <= 0x0030

        if (scan_window + 6.25 > scan_interval) printk("Scan window > scan interval. Increase not allowed.\n");
        else{

            scan_window = scan_window + 6.25;
            
            if (scan_window > scan_window_max) scan_window = scan_window_max;

            bt_disable();
        
            int err = bt_enable(bt_ready_button_pressed);
            if (err) {
                printk("Bluetooth init failed (err %d)\n", err);
            }
        }
    }
    
    else  printk("Maximum window reached. No further increase allowed.\n");        
}

void button3_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
    if (scan_timeout < scan_timeout_max) { //current_min_interval <= 0x0030
		
		scan_timeout = scan_timeout + 6.25;
		
		if (scan_timeout > scan_timeout_max) scan_timeout = scan_timeout_max;

	    bt_disable();
     
	    int err = bt_enable(bt_ready_button_pressed);
        if (err) {
            printk("Bluetooth init failed (err %d)\n", err);
        }
    }
	
	else  printk("Maximum timeout reached. No further increase allowed.\n");
         
}

/* Bluetooth ready callback */
static void bt_ready(int err)
{

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n");

	(void)observer_start(scan_interval, scan_window, scan_timeout);


    /* Configure buttons */
    if (!device_is_ready(button1.port)) {
        printk("Error: Button 1 device not ready\n");
        return;
    }

    if (!device_is_ready(button2.port)) {
        printk("Error: Button 2 device not ready\n");
        return;
    }

    if (!device_is_ready(button3.port)) {
        printk("Error: Button 3 device not ready\n");
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

    /* Configure Button 3 */
    gpio_pin_configure_dt(&button3, GPIO_INPUT);
    gpio_pin_interrupt_configure_dt(&button3, GPIO_INT_EDGE_TO_ACTIVE);
    gpio_init_callback(&button3_cb_data, button3_pressed, BIT(button3.pin));
    gpio_add_callback(button3.port, &button3_cb_data);


    /*printf Instructions for every button*/
    printk("Buttons configured, waiting for presses...\n");
    printk("Button 1 to increase interval\n");
    printk("Button 2 to increase window\n"); 
    printk("Button 3 to increase timeout\n");

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
