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

#include <zephyr/bluetooth/hci.h>
#include <zephyr/bluetooth/hci_vs.h>
#include <zephyr/sys/byteorder.h>

#define DEVICE_NAME CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)

// TX FUNCTIONS // 
static void set_tx_power(uint8_t handle_type, uint16_t handle, int8_t tx_pwr_lvl)
{
	struct bt_hci_cp_vs_write_tx_power_level *cp;
	struct bt_hci_rp_vs_write_tx_power_level *rp;
	struct net_buf *buf, *rsp = NULL;
	int err;

	buf = bt_hci_cmd_create(BT_HCI_OP_VS_WRITE_TX_POWER_LEVEL,
				sizeof(*cp));
	if (!buf) {
		printk("Unable to allocate command buffer\n");
		return;
	}

	cp = net_buf_add(buf, sizeof(*cp));
	cp->handle = sys_cpu_to_le16(handle);
	cp->handle_type = handle_type;
	cp->tx_power_level = tx_pwr_lvl;

	err = bt_hci_cmd_send_sync(BT_HCI_OP_VS_WRITE_TX_POWER_LEVEL,
				   buf, &rsp);
	if (err) {
		printk("Set Tx power err: %d\n", err);
		return;
	}

	rp = (void *)rsp->data;
	printk("Actual Tx Power: %d\n", rp->selected_tx_power);

	net_buf_unref(rsp);
}

static void get_tx_power(uint8_t handle_type, uint16_t handle, int8_t *tx_pwr_lvl)
{
	struct bt_hci_cp_vs_read_tx_power_level *cp;
	struct bt_hci_rp_vs_read_tx_power_level *rp;
	struct net_buf *buf, *rsp = NULL;
	int err;

	*tx_pwr_lvl = 0xFF;
	buf = bt_hci_cmd_create(BT_HCI_OP_VS_READ_TX_POWER_LEVEL,
				sizeof(*cp));
	if (!buf) {
		printk("Unable to allocate command buffer\n");
		return;
	}

	cp = net_buf_add(buf, sizeof(*cp));
	cp->handle = sys_cpu_to_le16(handle);
	cp->handle_type = handle_type;

	err = bt_hci_cmd_send_sync(BT_HCI_OP_VS_READ_TX_POWER_LEVEL,
				   buf, &rsp);
	if (err) {
		printk("Read Tx power err: %d\n", err);
		return;
	}

	rp = (void *)rsp->data;
	*tx_pwr_lvl = rp->tx_power_level;

	net_buf_unref(rsp);
}

static const int8_t txpower[8] = {4, 0, -3, -8,-15, -18, -23, -30}; // hight --> low  Tx power 
int TX_ID = 0;

//Help functions// 
static void PRINT_TX(){ 
    int8_t txp_get = 0;
    printk("Get Tx power level -> ");
	get_tx_power(BT_HCI_VS_LL_HANDLE_TYPE_ADV,0, &txp_get);
	printk("TXP = %d\n", txp_get);
}

static void SET_TX(int tx_id){ 
    printk("Set Tx power level to %d\n", txpower[tx_id]);
	set_tx_power(BT_HCI_VS_LL_HANDLE_TYPE_ADV,0, txpower[tx_id]);
}

/* GPIO configuration for buttons (2 buttons in this example) */
static const struct gpio_dt_spec button1 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw0), gpios, {0});
static const struct gpio_dt_spec button2 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw1), gpios, {0});
static const struct gpio_dt_spec button3 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw2), gpios, {0});
static const struct gpio_dt_spec button4 = GPIO_DT_SPEC_GET_OR(DT_ALIAS(sw3), gpios, {0});

static struct gpio_callback button1_cb_data;
static struct gpio_callback button2_cb_data;
static struct gpio_callback button3_cb_data;
static struct gpio_callback button4_cb_data;

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

//initialize interval
static int current_min_interval = BT_GAP_ADV_FAST_INT_MIN_1;
static int current_max_interval = BT_GAP_ADV_FAST_INT_MAX_1; 

//Define PRECENTAGE 
#define  INCREASE_PERCENTAGE  1.1;  
#define  DECREASE_PERCENTAGE  0.9; 

// Define limits for the intervals  => Range: 0x0020 to 0x4000
#define MIN_INTERVAL_LIMIT 0x0030  // Lower limit 
#define MAX_INTERVAL_LIMIT 0x00F0  // Upper limit 

/* help functions */
/* Bluetooth ready callback */
 static void bt_ready_decrease_interval(int err) 
 {
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n"); 

    // Decrease by DECREASE_PERCENTAGE
    current_min_interval = current_min_interval * DECREASE_PERCENTAGE;
    current_max_interval = current_max_interval * DECREASE_PERCENTAGE;

       if (current_min_interval < MIN_INTERVAL_LIMIT) {
        current_min_interval = MIN_INTERVAL_LIMIT;
        current_max_interval = MIN_INTERVAL_LIMIT*1.2;
    } 

    /* Start advertising */ 

	    //set-1 default//
		err = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, \
							current_min_interval, \
							current_max_interval , \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started SLOW DOWN, advertising as %s\n", addr_s); 
    printk("Interval decreased: MIN=%d, MAX=%d\n", current_min_interval, current_max_interval);

}

 static void bt_ready_increase_interval(int err) 
 {
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;

    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
        return;
    }

    printk("Bluetooth initialized\n"); 

    current_min_interval = current_min_interval * INCREASE_PERCENTAGE;
    current_max_interval = current_max_interval * INCREASE_PERCENTAGE;

    // Ensure the intervals don't go above a maximum value
    if (current_max_interval > MAX_INTERVAL_LIMIT) {
        current_max_interval = MAX_INTERVAL_LIMIT;
        current_min_interval = MAX_INTERVAL_LIMIT*0.8;
    }
    /* Start advertising */ 

	    //set-1 default//
		err = bt_le_adv_start(BT_LE_ADV_PARAM(BT_LE_ADV_OPT_USE_IDENTITY, \
							current_min_interval, \
							current_max_interval, \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started SPEED UP, advertising as %s\n", addr_s);
    printk("Interval increased: MIN=%d, MAX=%d\n", current_min_interval, current_max_interval);
}

 static void bt_ready_decrease_tx(int err) 
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
							current_min_interval, \
							current_max_interval, \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started SLOW DOWN TX  advertising as %s\n", addr_s);
    SET_TX(TX_ID);
    
}

 static void bt_ready_increase_tx(int err) 
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
							current_min_interval, \
							current_max_interval, \
							NULL), ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
		if (err) {
			printk("Advertising failed to start (err %d)\n", err);
			return;
		}

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started SPEED UP TX  advertising as %s\n", addr_s);
    SET_TX(TX_ID);
    
}

/* Button press handlers */
void button1_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   

    if (current_min_interval > MIN_INTERVAL_LIMIT) { //current_min_interval <= 0x0030)
        bt_disable();
        int err = bt_enable(bt_ready_decrease_interval);
        if (err) {
            printk("Bluetooth init failed (err %d)\n", err);
        } 
    } else { 
        printk("Minimum interval reached. No further decrease allowed.\n");
    } 
}

void button2_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
    if (current_max_interval < MAX_INTERVAL_LIMIT) { //current_min_interval <= 0x0030
        bt_disable();
        int err = bt_enable(bt_ready_increase_interval);
        if (err) {
            printk("Bluetooth init failed (err %d)\n", err);
        }
    }else { 
        printk("Maximum interval reached. No further increase allowed.\n");
    }      
}

void button3_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
    if (TX_ID > 0) {
         TX_ID = TX_ID - 1;     
        bt_disable();
        int err = bt_enable(bt_ready_increase_tx);
        if (err) {
            printk("Bluetooth init failed (err %d)\n", err);
        }
    }else{ 
        printk("Maximum Tx reached. No further decrease allowed.\n");
    }   
}

void button4_pressed(const struct device *dev, struct gpio_callback *cb, uint32_t pins)
{   
    if (TX_ID < 7) {
        TX_ID = TX_ID + 1;     
        bt_disable();
        int err = bt_enable(bt_ready_decrease_tx);
        if (err) {
            printk("Bluetooth init failed (err %d)\n", err);
        }
    }else{ 
        printk("Minimum Tx reached. No further decrease allowed.\n");
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

   
    struct bt_le_adv_param adv_param = BT_LE_ADV_PARAM_INIT(BT_LE_ADV_OPT_USE_IDENTITY | BT_LE_ADV_OPT_USE_TX_POWER,
                                                        current_min_interval,
                                                        current_max_interval,
                                                        NULL); 


    /* Start advertising */ 
	//set-1 default//
    err = bt_le_adv_start(&adv_param, ad, ARRAY_SIZE(ad), sd, ARRAY_SIZE(sd));
    if (err) {
        printk("Advertising failed to start (err %d)\n", err);
        return;
    }
    printk("Interval Default: MIN=%d, MAX=%d\n", BT_GAP_ADV_FAST_INT_MIN_1, BT_GAP_ADV_FAST_INT_MAX_1);

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started , advertising as %s\n", addr_s);

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

    if (!device_is_ready(button4.port)) {
        printk("Error: Button 4 device not ready\n");
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

    /* Configure Button 4 */
    gpio_pin_configure_dt(&button4, GPIO_INPUT);
    gpio_pin_interrupt_configure_dt(&button4, GPIO_INT_EDGE_TO_ACTIVE);
    gpio_init_callback(&button4_cb_data, button4_pressed, BIT(button4.pin));
    gpio_add_callback(button4.port, &button4_cb_data);

    /*printf Instructions for every button*/
    printk("Buttons configured, waiting for presses...\n");
    printk("Button 1 to DECREASE interval\n");
    printk("Button 2 to INCREASE interval\n"); 
    printk("Button 3 to INCREASE TX\n");
    printk("Button 4 to DECREASE TX\n");  
     
    PRINT_TX(); 
    SET_TX(TX_ID);
}

int main(void)
{
    int err;

    printk("Starting Beacon KOSTAKISSS Demo\n");

    /* Initialize the Bluetooth Subsystem */
    err = bt_enable(bt_ready);
    if (err) {
        printk("Bluetooth init failed (err %d)\n", err);
    }  

    return 0;
}
