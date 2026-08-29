# 💧 Hazard Water Detector

An IoT-based **Smart Water Quality Monitoring System** using ESP32 that measures **TDS (Total Dissolved Solids)** and **Turbidity** of water in real time. The system determines whether the water is **SAFE or UNSAFE** based on predefined limits and sends sensor data to a web server using Wi-Fi.

## 🚀 Features

* 📊 Real-time TDS measurement in **PPM**
* 💧 Turbidity measurement in **NTU**
* 📟 16×2 I2C LCD display
* 🔔 Buzzer alert when water is unsafe
* 💡 LED status indication
* 🔘 Push-button ON/OFF control
* 📡 ESP32 Wi-Fi connectivity
* 🌐 Sends sensor data to a PHP web server
* 🗄️ Data can be stored in MySQL database
* ⏱️ Automatic data transmission every 5 seconds
* 🔄 Sensor readings are averaged to reduce noise

## 🛠️ Technologies Used

* ESP32
* Arduino IDE
* C/C++
* TDS Sensor
* Turbidity Sensor
* 16×2 I2C LCD
* PHP
* MySQL
* HTML/CSS
* Wi-Fi
* HTTP

## 🔌 Hardware Components

| Component        | Purpose                   |
| ---------------- | ------------------------- |
| ESP32            | Main microcontroller      |
| TDS Sensor       | Measures dissolved solids |
| Turbidity Sensor | Measures water turbidity  |
| 16×2 I2C LCD     | Displays sensor values    |
| LED              | System status indication  |
| Buzzer           | Unsafe water alert        |
| Push Button      | System ON/OFF control     |
| Jumper Wires     | Connections               |
| Breadboard       | Circuit assembly          |

## 📌 Pin Configuration

| Component        | ESP32 Pin |
| ---------------- | --------: |
| TDS Sensor       |   GPIO 34 |
| Turbidity Sensor |   GPIO 32 |
| LED              |   GPIO 26 |
| Push Button      |   GPIO 27 |
| Buzzer           |   GPIO 25 |
| LCD SDA          |   GPIO 21 |
| LCD SCL          |   GPIO 22 |

## ⚙️ Working Principle

The system works in the following sequence:

```text
Water Sample
     ↓
TDS Sensor + Turbidity Sensor
     ↓
Analog Voltage
     ↓
ESP32 ADC
     ↓
Voltage Conversion
     ↓
TDS (PPM) + Turbidity (NTU)
     ↓
Compare With Safety Limits
     ↓
 ┌───────────────┐
 │ Safe / Unsafe │
 └───────────────┘
     ↓
LCD + LED + Buzzer
     ↓
Wi-Fi
     ↓
PHP Server
     ↓
MySQL Database
```

## 🧮 Measurement Method

### TDS

The ESP32 reads the analog voltage from the TDS sensor and converts the ADC reading into voltage.

```cpp
Voltage = (ADC / 4095.0) × 3.3
```

The current prototype uses an approximate conversion:

```cpp
EC = (Voltage / 2.3) × 1000
TDS = EC × 0.5
```

> **Note:** The `2.3` and `1000` values are calibration/scaling constants used in this prototype. For accurate measurements, the TDS sensor should be calibrated using an appropriate standard solution and the manufacturer's recommended formula.

### Turbidity

Turbidity is estimated from sensor voltage using linear mapping between the prototype calibration points:

```text
3.0 V → 3 NTU
2.0 V → 50 NTU
```

The system uses linear interpolation to estimate the NTU value.

## 🚨 Safety Logic

The current prototype uses:

```cpp
TDS_LIMIT = 500;
TB_LIMIT  = 5;
```

Water is considered **UNSAFE** when:

```cpp
TDS > 500 || Turbidity > 5
```

Otherwise, the system displays **SAFE**.

## 📡 Web Server Communication

Every 5 seconds, the ESP32 sends the measured values to the PHP server using an HTTP GET request.

Example:

```text
insert_data.php?tds=250&turbidity=4
```

The PHP backend can then store the values in a MySQL database for monitoring and analysis.

## 🧠 Algorithms / Techniques Used

* **ADC Sampling**
* **Moving/Average Sampling** using 10 sensor readings
* **Voltage Conversion**
* **Linear Interpolation** for turbidity estimation
* **Threshold-Based Decision Making**
* **Button Debouncing**
* **Toggle State Logic**
* **Time-Based Scheduling using `millis()`**
* **HTTP Client-Server Communication**

## 📁 Project Structure

```text
Hazard-Water-Detector/
│
├── ESP32/
│   └── water_detector.ino
│
├── Hazard water detector/
│   ├── index.html
│   ├── insert_data.php
│   ├── database.sql
│   └── ...  
│
└── README.md
```

## 🔧 Setup

### 1. ESP32

Open the `.ino` file in Arduino IDE and install the required libraries:

```text
Wire
LiquidCrystal_I2C
WiFi
HTTPClient
```

### 2. Wi-Fi

Update the Wi-Fi credentials:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 3. Server IP

Update the PHP server URL according to your computer's local IP address:

```cpp
const char* serverName =
"http://YOUR_IP/Hazard%20water%20detector/insert_data.php";
```

### 4. Database

Import the SQL file into MySQL and configure the PHP database connection.

## 📷 Project Demo

**Project Images :**

<p>
     <img width="1280" height="591" src="https://github.com/user-attachments/assets/e73232c8-b2a3-441e-8dc0-f6035c395515" />
     <img width="1280" height="706" src="https://github.com/user-attachments/assets/861386fd-275f-4e5b-83c7-562de6fef5b0" />

</p>

**Website Dashboard :**

<p>
     <img width="1891" height="862" alt="homepage" src="https://github.com/user-attachments/assets/c69500c1-cb0e-43c9-a7a0-33df771f79a9" />
     <img width="1866" height="870" alt="graph" src="https://github.com/user-attachments/assets/9a81ed84-d724-4e1f-a8f1-77e550bfd741" />
</p>

**Working Demo**
<p>
https://github.com/user-attachments/assets/f1f2ad87-ebc7-4784-9003-2fa2d6fa3692
</p>

## 🔮 Future Improvements

* Improve TDS and turbidity sensor calibration
* Add pH sensor
* Add temperature sensor
* Add mobile application
* Add cloud data storage
* Add graphical water-quality monitoring
* Add historical data analysis
* Improve water safety classification
* Add automatic notifications

## 👨‍💻 Author

**Pankaj Vasava**

Computer Science & Engineering Student

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐.

