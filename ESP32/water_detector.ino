#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>


// 1. Wi-Fi Configuration

const char* ssid = "myproject";
const char* password = "12345678";

// 2. Server Configuration

// Replace 192.168.1.X with your computer's actual IPv4 address
const char* serverName = "http://192.168.1.X/Hazard%20water%20detector/insert_data.php";

// Timer for sending data to the server
unsigned long lastHttpTime = 0;
const unsigned long httpDelay = 5000; // Send data every 5 seconds


// Hardware Setup

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Pins
const int TDS_PIN    = 34;
const int TURB_PIN   = 32;
const int LED_PIN    = 26;
const int SWITCH_PIN = 27;
const int BUZZER_PIN = 25;  

bool systemOn = false;
int lastButton = HIGH;
unsigned long lastDebounce = 0;
const unsigned long debounceDelay = 200;

// Limits (Matching website logic)
const float TDS_LIMIT = 500;   // ppm (Modified to 500 to match website logic)
const float TB_LIMIT  = 5;     // NTU

// Helper Functions

// Read averaged ADC voltage
float readVoltage(int pin){
  long sum = 0;
  for(int i=0;i<10;i++){
    sum += analogRead(pin);
    delay(5);
  }
  float avg = sum / 10.0;
  return (avg / 4095.0) * 3.3;
}

// Convert voltage to TDS
float voltageToTDS(float v){
  float ec = (v / 2.3) * 1000;
  return ec * 0.5;
}

// Convert voltage to Turbidity (NTU)
float voltageToTB(float v){
  const float V_clean = 3.0;
  const float V_dirty = 2.0;
  const float TB_clean = 3;
  const float TB_dirty = 50;

  float tb = (V_clean - v) * (TB_dirty - TB_clean) /
             (V_clean - V_dirty) + TB_clean;

  if(tb < TB_clean) tb = TB_clean;
  if(tb > TB_dirty) tb = TB_dirty;
  return tb;
}

void printLCD(int row, String msg){
  lcd.setCursor(0,row);
  lcd.print("                ");
  lcd.setCursor(0,row);
  lcd.print(msg);
}

// Setup
void setup(){
  Serial.begin(115200);
  Wire.begin(21,22);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SWITCH_PIN, INPUT_PULLUP);

  digitalWrite(BUZZER_PIN, HIGH);

  lcd.init();
  lcd.backlight();

  printLCD(0," Smart Water ");
  printLCD(1,"  Detector  ");
  
  // Connect to Wi-Fi
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("WiFi connected! IP: ");
  Serial.println(WiFi.localIP());

  lcd.clear();
  printLCD(0, "WiFi Connected!");
  delay(1200);
  lcd.clear();
}

// Main Loop
void loop(){

  int btn = digitalRead(SWITCH_PIN);
  if(lastButton == HIGH && btn == LOW &&
     millis() - lastDebounce > debounceDelay){
    systemOn = !systemOn;
    lastDebounce = millis();
  }
  lastButton = btn;

  if(!systemOn){
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, HIGH); 

    printLCD(0,"System: OFF");
    printLCD(1,"Press Button");
    delay(200);
    return;
  }

  // ---- System ON ----
  digitalWrite(LED_PIN, HIGH);        // LED ON

  float vTds  = readVoltage(TDS_PIN);
  float vTurb = readVoltage(TURB_PIN);

  float tds = voltageToTDS(vTds);
  float tb  = voltageToTB(vTurb);

  bool unsafe = (tds > TDS_LIMIT) || (tb > TB_LIMIT);

  // ---- LCD Display ----
  printLCD(0, "TDS:" + String((int)tds) + " PPM");
  printLCD(1, "TB :" + String((int)tb) + " NTU" + (unsafe ? " UNSAFE" : " SAFE"));

  if(unsafe){
    digitalWrite(BUZZER_PIN, LOW);  // Buzzer ON
  } else {
    digitalWrite(BUZZER_PIN, HIGH); // Buzzer OFF 
  }

  Serial.printf("TDS=%.1f | TB=%.1f | %s\n", tds, tb, unsafe?"UNSAFE":"SAFE");

  // ---- Send Data to Website ----
  // This sends data every 5 seconds (httpDelay) so it doesn't spam the server
  if ((millis() - lastHttpTime) > httpDelay) {
    
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      
      // Construct the URL with query parameters containing our calculated sensor values
      String serverPath = String(serverName) + "?tds=" + String(tds) + "&turbidity=" + String(tb);
      
      http.begin(serverPath.c_str());
      int httpResponseCode = http.GET(); // Make the HTTP Request
      
      if (httpResponseCode > 0) {
        Serial.print("Data Sent Successfully! HTTP Code: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("Error sending data. Code: ");
        Serial.println(httpResponseCode);
      }
      
      http.end(); // Free resources
    } else {
      Serial.println("WiFi Disconnected. Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
    
    lastHttpTime = millis();
  }

  delay(700);
}

