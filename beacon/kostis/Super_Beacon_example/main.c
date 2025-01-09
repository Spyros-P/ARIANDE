#include <zephyr/types.h>
#include <stddef.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/util.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/kernel.h>  // For k_timer 

#include <zephyr/bluetooth/hci.h>// /* main.c - Application main entry point */
#include <zephyr/bluetooth/hci_vs.h>
#include <zephyr/sys/byteorder.h>
#include <zephyr/bluetooth/uuid.h> //extra

#define DEVICE_NAME CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)
#define BT_TIMEOUT_MAX 100
#define BT_TIMEOUT_MIN 3

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
int  observer_start(uint16_t interval, uint16_t window, uint16_t timeout);
void scan_reset(uint16_t interval, uint16_t window, uint16_t timeout); 

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
    (void)observer_start(scan_interval, scan_window, scan_timeout);
     
    k_sleep(K_MSEC(2000));
    bt_le_scan_stop();
    printk("SCAN STOPED \n");

    /* Start advertising */ 
    adv_start();
    printk("Interval Default: MIN=%d, MAX=%d\n", BT_GAP_ADV_FAST_INT_MIN_1, BT_GAP_ADV_FAST_INT_MAX_1);

    bt_id_get(&addr, &count);
    bt_addr_le_to_str(&addr, addr_s, sizeof(addr_s));
    printk("Beacon started , advertising as %s\n", addr_s);

    k_sleep(K_MSEC(2000));

     current_min_interval = current_min_interval * 1.3;
     current_max_interval = current_max_interval * 1.3;
     Tx_id ++;
     tx_on = true;
     adv_reset();

     k_sleep(K_MSEC(2000));

     scan_interval += 6;
     (void)scan_reset(scan_interval, scan_window, scan_timeout);

      bt_le_adv_stop();
      printk("adv STOPED \n");
      

      k_sleep(K_MSEC(2000));
      bt_le_scan_stop();
      printk("SCAN STOPED \n");

      k_sleep(K_MSEC(4000));
      adv_start();
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