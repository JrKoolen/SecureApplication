# LoRaWAN Setup Guide for Heltec WiFi LoRa 32 V3

## Overview

This guide shows how to configure your Heltec WiFi LoRa 32 V3 as a LoRaWAN end device to connect to your LoRaWAN router/server.

## Prerequisites

1. **LoRaWAN Gateway/Router** - Your router with LoRaWAN server
2. **LoRaWAN Network Server** - Running on your router
3. **Device Credentials** - You'll need these from your LoRaWAN server:
   - DevEUI (Device Extended Unique Identifier)
   - AppEUI / JoinEUI (Application Extended Unique Identifier)
   - AppKey (Application Key)
   - DevAddr (if using ABP instead of OTAA)
   - NwkSKey (Network Session Key - if ABP)
   - AppSKey (Application Session Key - if ABP)

## Required Libraries

1. **Heltec ESP32 Dev-Boards** - For board support
2. **Heltec ESP32 LoRaWAN Library** - Official LoRaWAN library
   - Install via: Library Manager → Search "Heltec ESP32 LoRaWAN"
   - Or from: https://github.com/HelTecAutomation/Heltec_ESP32

## Installation Steps

### Step 1: Install Library

1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search for "**Heltec ESP32 LoRaWAN**"
4. Install the library by Heltec Automation

### Step 2: Get Your Board License

The Heltec LoRaWAN library requires a license tied to your ESP32 Chip ID:

1. Upload a sketch to get your Chip ID:
```cpp
#include "heltec.h"

void setup() {
  Serial.begin(115200);
  Heltec.begin(true, false, true);
  Serial.print("Chip ID: ");
  Serial.println(ESP.getEfuseMac(), HEX);
}

void loop() {}
```

2. Query your license at: https://docs.heltec.org/ or contact Heltec support

### Step 3: Get Device Credentials

From your LoRaWAN server/router interface, you need to:

1. **Register a new device** (or use existing)
2. **Get credentials**:
   - DevEUI (8 bytes, hex format)
   - AppEUI / JoinEUI (8 bytes, hex format)
   - AppKey (16 bytes, hex format)

## Configuration Code

### OTAA (Over-The-Air Activation) - Recommended

```cpp
#include "heltec.h"
#include "LoRaWAN.h"

// LoRaWAN credentials from your server
// Replace with your actual values
uint8_t DevEUI[8] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
uint8_t AppEUI[8] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
uint8_t AppKey[16] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

void setup() {
  // Initialize Heltec board
  Heltec.begin(true, false, true);
  
  // Initialize display
  Heltec.display->init();
  Heltec.display->flipScreenVertically();
  Heltec.display->setFont(ArialMT_Plain_10);
  
  Serial.begin(115200);
  
  // Initialize LoRaWAN
  LoRaWAN.begin(CLASS_C);  // or CLASS_A for basic operation
  
  // Set region (adjust to your region)
  // Options: EU868, US915, AS923, AU915, KR920, IN865, CN470
  LoRaWAN.setSubBand(2);  // For US915, use sub-band 2
  
  // Set device credentials
  LoRaWAN.setDevEUI(DevEUI);
  LoRaWAN.setAppEUI(AppEUI);
  LoRaWAN.setAppKey(AppKey);
  
  // Set data rate (adjust based on your needs)
  LoRaWAN.setDataRate(DR0, US915);  // DR0 = SF10, BW125
  
  // Join the network
  Serial.println("Joining LoRaWAN network...");
  Heltec.display->clear();
  Heltec.display->drawString(0, 0, "Joining network...");
  Heltec.display->display();
  
  bool join_result = false;
  int join_attempts = 0;
  
  while (!join_result && join_attempts < 10) {
    join_result = LoRaWAN.join();
    join_attempts++;
    if (!join_result) {
      Serial.println("Join failed, retrying...");
      delay(5000);
    }
  }
  
  if (join_result) {
    Serial.println("Joined successfully!");
    Heltec.display->clear();
    Heltec.display->drawString(0, 0, "Joined LoRaWAN!");
    Heltec.display->display();
  } else {
    Serial.println("Join failed after 10 attempts");
    Heltec.display->clear();
    Heltec.display->drawString(0, 0, "Join failed!");
    Heltec.display->display();
  }
}

void loop() {
  // Send data to LoRaWAN server
  String message = "Hello from LoRaWAN!";
  uint8_t payload[message.length()];
  message.getBytes(payload, message.length());
  
  Serial.print("Sending: ");
  Serial.println(message);
  
  // Send unconfirmed message (no ACK required)
  bool result = LoRaWAN.send(1, payload, message.length(), false);
  
  if (result) {
    Serial.println("Message sent successfully!");
    Heltec.display->clear();
    Heltec.display->drawString(0, 0, "Message sent!");
    Heltec.display->display();
  } else {
    Serial.println("Send failed!");
  }
  
  // Wait before next transmission (respect duty cycle)
  delay(30000);  // 30 seconds
}
```

### ABP (Activation By Personalization)

If your server uses ABP instead of OTAA:

```cpp
#include "heltec.h"
#include "LoRaWAN.h"

// ABP credentials
uint8_t DevAddr[4] = {0x00, 0x00, 0x00, 0x00};
uint8_t NwkSKey[16] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                       0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
uint8_t AppSKey[16] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                       0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

void setup() {
  Heltec.begin(true, false, true);
  Serial.begin(115200);
  
  LoRaWAN.begin(CLASS_A);
  LoRaWAN.setSubBand(2);  // Adjust for your region
  
  // Set ABP credentials
  LoRaWAN.setDevAddr(DevAddr);
  LoRaWAN.setNwkSKey(NwkSKey);
  LoRaWAN.setAppSKey(AppSKey);
  
  Serial.println("LoRaWAN ABP device ready!");
}

void loop() {
  String message = "Hello LoRaWAN!";
  uint8_t payload[message.length()];
  message.getBytes(payload, message.length());
  
  LoRaWAN.send(1, payload, message.length(), false);
  delay(30000);
}
```

## Regional Configuration

### US915 (North America)
```cpp
LoRaWAN.setSubBand(2);  // Sub-band 2 (channels 8-15)
LoRaWAN.setDataRate(DR0, US915);  // SF10, BW125
```

### EU868 (Europe)
```cpp
LoRaWAN.setSubBand(1);  // Usually 1 for EU868
LoRaWAN.setDataRate(DR0, EU868);  // SF12, BW125
```

## Converting Hex Strings to Byte Arrays

If your server provides credentials as hex strings:

```cpp
// Example: DevEUI = "0011223344556677"
// Convert to byte array:
uint8_t DevEUI[8] = {0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77};

// Or use a conversion function:
void hexStringToBytes(String hex, uint8_t* bytes, int len) {
  for (int i = 0; i < len; i++) {
    bytes[i] = strtol(hex.substring(i*2, i*2+2).c_str(), NULL, 16);
  }
}
```

## Troubleshooting

### Cannot Join Network
- Verify DevEUI, AppEUI, and AppKey are correct
- Check frequency/region matches your gateway
- Ensure gateway is within range
- Check gateway is running and configured correctly

### No Response from Server
- Verify gateway is forwarding to network server
- Check network server is running
- Verify device is registered in network server
- Check data rate settings match gateway

### License Issues
- Get your Chip ID and request license from Heltec
- Check license is properly configured in library

## Testing

1. Upload code to your Heltec device
2. Monitor Serial output for join status
3. Check your LoRaWAN server dashboard for incoming messages
4. Verify data appears in your application server

## Next Steps

- Configure your LoRaWAN server to forward data to your application
- Set up uplink/downlink message handling
- Implement confirmed messages (require ACK)
- Add sensor data reading and transmission

