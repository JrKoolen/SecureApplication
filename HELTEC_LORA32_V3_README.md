# Heltec WiFi LoRa 32 (V3) - Setup Guide

## Device Specifications

- **Microcontroller**: ESP32-S3FN8 (Xtensa 32-bit LX7 dual-core, up to 240 MHz)
- **LoRa Chip**: SX1262
- **USB to Serial**: CP2102
- **Frequency Bands**: 433MHz, 470-510MHz, 863-870MHz, 902-928MHz
- **WiFi**: 802.11 b/g/n (up to 150Mbps)
- **Bluetooth**: Bluetooth 5 (LE)
- **Display**: 0.96-inch 128x64 OLED
- **Memory**: 384KB ROM, 512KB SRAM, 16KB RTC SRAM, 8MB Flash

## Arduino IDE Setup

### Step 1: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In **Additional Board Manager URLs**, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "**esp32**" (by Espressif Systems)
6. Install **"esp32"** version 2.0.0 or higher

### Step 2: Install Heltec ESP32 Dev-Boards

1. Go to **Tools → Board → Boards Manager**
2. Search for "**Heltec ESP32 Dev-Boards**"
3. Install the latest version
4. Or manually add via: **Sketch → Include Library → Manage Libraries** → Search "Heltec ESP32"

### Step 3: Select Board

1. Go to **Tools → Board → ESP32 Arduino**
2. Select **"Heltec WiFi LoRa 32 (V3)"**

### Step 4: Configure Port

1. Connect board via USB-C cable
2. Go to **Tools → Port**
3. Select the COM port (usually shows as "USB Serial Port" or "CP2102")

## Required Libraries

### Core Libraries (Install via Library Manager)

1. **Heltec ESP32 Dev-Boards**
   - Includes board definitions and basic functions
   - Install via: Library Manager → Search "Heltec ESP32"

2. **RadioLib** (for SX1262 LoRa)
   - Library Manager → Search "RadioLib"
   - Author: Jan Gromeš
   - Version: 6.7.0 or higher
   - Supports SX1262 chip

3. **LoRaWAN Library** (if using LoRaWAN)
   - Library Manager → Search "LoRaWAN"
   - Or use Heltec's LoRaWAN library from their GitHub

### Alternative Libraries

**For LoRa (if not using RadioLib):**
- **LoRa by Sandeep Mistry** - Note: This is for SX1276/SX1278, NOT compatible with SX1262
- Use **RadioLib** instead for SX1262

**For OLED Display:**
- **U8g2** - Universal graphics library
- **Heltec ESP32 Dev-Boards** includes OLED functions

**For WiFi:**
- Built into ESP32 core (no additional library needed)

**For Bluetooth:**
- Built into ESP32 core (no additional library needed)

## Installation Steps

### Method 1: Library Manager (Recommended)

1. **Arduino IDE → Sketch → Include Library → Manage Libraries**
2. Search and install:
   - "Heltec ESP32 Dev-Boards"
   - "RadioLib"
3. Install each library

### Method 2: Manual Installation

1. Download libraries from:
   - Heltec ESP32: https://github.com/Heltec-Aaron-Lee/WiFi_Kit_series
   - RadioLib: https://github.com/jgromes/RadioLib
2. Extract to Arduino libraries folder:
   - Windows: `C:\Users\YourUsername\Documents\Arduino\libraries\`
   - Linux: `~/Arduino/libraries/`
   - Mac: `~/Documents/Arduino/libraries/`

## Basic Example Code

### Simple LoRa Transmit

```cpp
#include <RadioLib.h>

// SX1262 pin definitions for Heltec LoRa32 V3
// CS, RST, DIO1, BUSY pins
SX1262 radio = new Module(8, 14, 12, 13);

void setup() {
  Serial.begin(115200);
  
  // Initialize LoRa on 915 MHz (adjust for your region)
  Serial.print(F("[SX1262] Initializing ... "));
  int state = radio.begin(915.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("success!"));
  } else {
    Serial.print(F("failed, code "));
    Serial.println(state);
    while (true);
  }
}

void loop() {
  Serial.print(F("[SX1262] Transmitting packet ... "));
  
  int state = radio.transmit("Hello World!");
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("success!"));
  } else {
    Serial.print(F("failed, code "));
    Serial.println(state);
  }
  
  delay(5000);
}
```

### Simple LoRa Receive

```cpp
#include <RadioLib.h>

SX1262 radio = new Module(8, 14, 12, 13);

void setup() {
  Serial.begin(115200);
  
  Serial.print(F("[SX1262] Initializing ... "));
  int state = radio.begin(915.0);
  
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print(F("failed, code "));
    Serial.println(state);
    while (true);
  }
  
  Serial.println(F("success!"));
  Serial.println(F("[SX1262] Starting to listen ..."));
}

void loop() {
  String str;
  int state = radio.receive(str);
  
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("[SX1262] Received packet!"));
    Serial.print(F("[SX1262] Data: "));
    Serial.println(str);
  }
}
```

### OLED Display Example

```cpp
#include "heltec.h"

void setup() {
  Heltec.begin(true, false, true);
  
  Heltec.display->init();
  Heltec.display->flipScreenVertically();
  Heltec.display->setFont(ArialMT_Plain_10);
  
  Heltec.display->clear();
  Heltec.display->drawString(0, 0, "Heltec LoRa32 V3");
  Heltec.display->drawString(0, 10, "Hello World!");
  Heltec.display->display();
}

void loop() {
  delay(1000);
}
```

## Frequency Selection

Select your frequency band based on region:

- **433 MHz**: Some regions (check regulations)
- **470-510 MHz**: China
- **863-870 MHz**: Europe
- **902-928 MHz**: North America

Update frequency in code:
```cpp
radio.begin(915.0);  // For 915 MHz (North America)
// or
radio.begin(868.0);  // For 868 MHz (Europe)
```

## Pin Configuration (V3)

- **LoRa CS**: Pin 8
- **LoRa RST**: Pin 14
- **LoRa DIO1**: Pin 12
- **LoRa BUSY**: Pin 13
- **OLED SDA**: Pin 21
- **OLED SCL**: Pin 22
- **OLED RST**: Pin 16

## Troubleshooting

### Board Not Detected
- Check USB-C cable (data cable, not charging only)
- Install CP2102 USB drivers: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Try different USB port

### Upload Failed
- Hold BOOT button during upload
- Check COM port selection
- Lower upload speed in Tools → Upload Speed → 115200

### LoRa Not Working
- Verify antenna is connected
- Check frequency matches your region
- Ensure using RadioLib (not LoRa.h library - that's for SX1276)

### OLED Display Issues
- For Meshtastic: Set display to "SSD1306" in Radio configuration
- Check if display is initialized: `Heltec.begin(true, false, true)`

## Useful Resources

- **Official Heltec Docs**: https://docs.heltec.org/
- **Heltec GitHub**: https://github.com/Heltec-Aaron-Lee/WiFi_Kit_series
- **RadioLib Documentation**: https://jgromes.github.io/RadioLib/
- **Heltec Forum**: https://community.heltec.cn/
- **Product Page**: https://heltec.org/project/wifi-lora-32-v3/

## Development Environments Supported

- Arduino IDE (Recommended)
- Platform.io
- MicroPython
- Espressif IDE

## Quick Start Checklist

- [ ] Install ESP32 board support
- [ ] Install Heltec ESP32 Dev-Boards
- [ ] Install RadioLib library
- [ ] Select "Heltec WiFi LoRa 32 (V3)" board
- [ ] Select correct COM port
- [ ] Upload example code
- [ ] Verify antenna is connected
- [ ] Test basic LoRa transmission

## Notes

- V3 uses SX1262 chip (NOT SX1276) - use RadioLib, not LoRa.h
- V3 code is NOT compatible with V2 (different MCU)
- WiFi and Bluetooth cannot be used simultaneously (no external PSRAM)
- Battery connector: SH1.25 x 2 type

