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
#include <zephyr/bluetooth/uuid.h> //extra

#define DEVICE_NAME CONFIG_BT_DEVICE_NAME
#define DEVICE_NAME_LEN (sizeof(DEVICE_NAME) - 1)

//model parameters
int current_min_interval = BT_GAP_ADV_FAST_INT_MIN_1;
int current_max_interval = BT_GAP_ADV_FAST_INT_MAX_1; 
int Tx_id = 0;
bool tx_on = false; 

//static parameters
static struct bt_le_adv_param adv_param;
static const int8_t txpower[8] = {8, 4, 0, -4,-8,-12, -16, -20}; // hight --> low  Tx power  , (-62 dbm to -30dbm) //-20 to +8 dBm TX power, configurable in 4 dB steps

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

// tx functions // 
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

//Help functions// 
static void print_tx() { 
    int8_t txp_get= 0;
    printk("Get Tx power level -> ");
	get_tx_power(BT_HCI_VS_LL_HANDLE_TYPE_ADV,0, &txp_get);
	printk("TXP = %d\n", txp_get);
}

static void set_tx(int Tx_id){ 
    printk("Set Tx power level to %d\n", txpower[Tx_id]);
	set_tx_power(BT_HCI_VS_LL_HANDLE_TYPE_ADV,0, txpower[Tx_id]);
}

//handler functions//
static void start_advertising_handler(struct k_work *work)
{   
    bt_le_adv_stop();

    adv_param =  (struct bt_le_adv_param)BT_LE_ADV_PARAM_INIT(BT_LE_ADV_OPT_USE_IDENTITY | BT_LE_ADV_OPT_USE_TX_POWER|BT_LE_ADV_OPT_SCANNABLE|BT_LE_ADV_OPT_NOTIFY_SCAN_REQ ,
                                                        current_min_interval,
                                                        current_max_interval,
                                                        NULL); 
    
    int err;
    err = bt_le_adv_start(&adv_param, ad, ARRAY_SIZE(ad), NULL, 0);
    if (err) {
        printk("Advertising failed to start (err %d)\n", err);
        return;
    }
    
    if(tx_on) set_tx(Tx_id);

     printk("Advertise start again ..\n");

 }

K_WORK_DEFINE(start_advertising_work, start_advertising_handler);


/* Global Functions */
void adv_start()
{
    int err;
    char addr_s[BT_ADDR_LE_STR_LEN];
    bt_addr_le_t addr = {0};
    size_t count = 1;
   
    adv_param = (struct bt_le_adv_param)BT_LE_ADV_PARAM_INIT(BT_LE_ADV_OPT_USE_IDENTITY | BT_LE_ADV_OPT_USE_TX_POWER|BT_LE_ADV_OPT_SCANNABLE|BT_LE_ADV_OPT_NOTIFY_SCAN_REQ ,
                                                        current_min_interval,
                                                        current_max_interval,
                                                        NULL); 


    /* Start advertising */ 

	//set-1 default//
    err = bt_le_adv_start(&adv_param, ad, ARRAY_SIZE(ad), NULL, 0); //set scan respone data to NULL 
    if (err) {
        printk("Advertising failed to start (err %d)\n", err);
        return;
    }
    
}

void adv_reset() { 
       
        // Submit work to start advertising
        k_work_submit(&start_advertising_work);
        printk("Submit advertise Work\n");
}


