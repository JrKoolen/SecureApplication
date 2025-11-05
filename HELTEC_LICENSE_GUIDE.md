# Heltec LoRaWAN License Guide

## Overview

The Heltec ESP32 LoRaWAN library requires a free license tied to your device's Chip ID. This guide shows you how to get it.

## Step 1: Get Your Chip ID

### Upload This Code to Your Heltec Device

```cpp
#include "heltec.h"

void setup() {
  Serial.begin(115200);
  Heltec.begin(true, false, true);
  
  // Get Chip ID (MAC address)
  uint64_t chipid = ESP.getEfuseMac();
  
  Serial.println("=====================================");
  Serial.println("Heltec WiFi LoRa 32 V3");
  Serial.println("=====================================");
  Serial.print("Chip ID: ");
  Serial.println(chipid, HEX);
  
  // Display on OLED
  Heltec.display->init();
  Heltec.display->flipScreenVertically();
  Heltec.display->setFont(ArialMT_Plain_10);
  Heltec.display->clear();
  
  String chipIdStr = String(chipid, HEX);
  chipIdStr.toUpperCase();
  
  Heltec.display->drawString(0, 0, "Chip ID:");
  Heltec.display->drawString(0, 10, chipIdStr);
  Heltec.display->display();
}

void loop() {
  // Nothing to do
}
```

### Read the Chip ID

1. Open Serial Monitor (Tools → Serial Monitor)
2. Set baud rate to 115200
3. Press reset button on your board
4. You'll see output like:
   ```
   Chip ID: 240AC4XXXXXX
   ```
5. **Copy the full Chip ID** (12 hexadecimal characters)

## Step 2: Get Your License

### Method 1: Heltec License Query Website (Recommended)

1. **Visit the license query page:**
   - Go to: https://resource.heltec.cn/search
   - Or: https://docs.heltec.org/general/how_to_use_license.html

2. **Enter your Chip ID:**
   - Paste your 12-digit Chip ID (hex format, no spaces)
   - Example: `240AC4XXXXXX`
   - Click "Confirm" or "Search"

3. **Get your license:**
   - The page will generate a **32-character license key**
   - Example: `ABCD1234EFGH5678IJKL9012MNOP3456`
   - **Copy this license key**

### Method 2: Contact Heltec Support

If the website doesn't work:
- Email: support@heltec.cn
- Provide your Chip ID
- They'll send you the license key

## Step 3: Write License to Your Device

### Method 1: AT Command (Easiest)

1. **Open Serial Monitor** (Tools → Serial Monitor, 115200 baud)
2. **Enter AT command:**
   ```
   AT+CDKEY=YOUR32CHARACTERLICENSEKEY
   ```
   Replace `YOUR32CHARACTERLICENSEKEY` with your actual license (no spaces, no "0x")

3. **Example:**
   ```
   AT+CDKEY=ABCD1234EFGH5678IJKL9012MNOP3456
   ```

4. **Press Enter**
5. **If successful**, you'll see: `The board is active.`

### Method 2: In Your Code

Some Heltec LoRaWAN examples have a license field. Add it like this:

```cpp
#include "heltec.h"
#include "LoRaWAN.h"

// Your license key (32 characters)
const char* license = "ABCD1234EFGH5678IJKL9012MNOP3456";

void setup() {
  Heltec.begin(true, false, true);
  
  // Set license
  LoRaWAN.setLicense(license);
  
  // Rest of your code...
}
```

## Verification

After writing the license, try running a LoRaWAN example. If the license is correct, the device will work. If not, you'll get an error message.

## Troubleshooting

### License Not Working
- Verify Chip ID is correct (12 hex characters)
- Check license key is exactly 32 characters
- Ensure no spaces or special characters in license
- Try getting a new license from the website

### Website Not Loading
- Try different browser
- Use VPN if region blocked
- Contact Heltec support directly

### AT Command Not Working
- Make sure Serial Monitor is set to 115200 baud
- Check you're sending to correct COM port
- Try resetting the board and sending command again
- Ensure command format is exactly: `AT+CDKEY=LICENSEKEY` (no spaces)

## Important Notes

- **License is free** - No payment required
- **One license per device** - Each Chip ID gets its own license
- **License is permanent** - Once written, it stays on the device
- **License is tied to Chip ID** - Cannot be transferred to another device

## Quick Reference

1. **Get Chip ID**: Upload sketch → Read Serial Monitor
2. **Get License**: Visit https://resource.heltec.cn/search → Enter Chip ID
3. **Write License**: `AT+CDKEY=LICENSEKEY` in Serial Monitor
4. **Verify**: Run LoRaWAN example code

## Alternative: License-Free Libraries

If you don't want to deal with licenses, you can use:
- **RadioLib** - Works with SX1262, no license needed
- **Plain LoRa** - Basic LoRa communication without LoRaWAN protocol

But these won't have the full LoRaWAN protocol features (encryption, network management, etc.).

