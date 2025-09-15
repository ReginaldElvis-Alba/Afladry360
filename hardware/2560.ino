//receive sensor data, and publish via wifi to mqtt
#include <dht11.h>
#define DHT11PIN 4
#include <ThreeWire.h>
#include <RtcDS1302.h>

dht11 DHT11;
ThreeWire myWire(4, 5, 2);  // IO, SCLK, CE
RtcDS1302<ThreeWire> Rtc(myWire);

void setup() {
  Serial.begin(115200);   // Debug/PC communication
  Serial1.begin(115200);  // D1 Mini communication

  Serial.println("Arduino Mega + D1 Mini Setup Starting...");
  Serial.println("Waiting for D1 Mini to initialize...");

  delay(5000);  // Give D1 Mini time to connect to WiFi

  // Clear any startup messages
  while (Serial1.available()) {
    Serial1.read();
  }

  Serial.println("Setup complete. Commands:");
  Serial.println("- Type any HTTP URL to make a request");
  Serial.println("- Type 'status' to check WiFi status");
  Serial.println("- Type 'ip' to get IP address");
  Serial.println("=====================================");

  //rtc stuff
  Serial.print("compiled: ");
  Serial.print(__DATE__);
  Serial.println(__TIME__);

  Rtc.Begin();

  RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
  printDateTime(compiled);
  Serial.println();

  if (!Rtc.IsDateTimeValid()) {
    // Common Causes:
    //    1) first time you ran and the device wasn't running yet
    //    2) the battery on the device is low or even missing

    Serial.println("RTC lost confidence in the DateTime!");
    Rtc.SetDateTime(compiled);
  }

  if (Rtc.GetIsWriteProtected()) {
    Serial.println("RTC was write protected, enabling writing now");
    Rtc.SetIsWriteProtected(false);
  }

  if (!Rtc.GetIsRunning()) {
    Serial.println("RTC was not actively running, starting now");
    Rtc.SetIsRunning(true);
  }

  RtcDateTime now = Rtc.GetDateTime();
  if (now < compiled) {
    Serial.println("RTC is older than compile time!  (Updating DateTime)");
    Rtc.SetDateTime(compiled);
  } else if (now > compiled) {
    Serial.println("RTC is newer than compile time. (this is expected)");
  } else if (now == compiled) {
    Serial.println("RTC is the same as compile time! (not expected but all is fine)");
  }
  //end of rtc stuff
}

void loop() {
  //rtc stuff
  RtcDateTime now = Rtc.GetDateTime();

  printDateTime(now);
  Serial.println();

  if (!now.IsValid()) {
    // Common Causes:
    //    1) the battery on the device is low or even missing and the power line was disconnected
    Serial.println("RTC lost confidence in the DateTime!");
  }
  //temp humidity sensor stuff
  int chk = DHT11.read(DHT11PIN);

  Serial.print("Humidity (%): ");
  Serial.println((float)DHT11.humidity, 2);

  Serial.print("Temperature  (C): ");
  Serial.println((float)DHT11.temperature, 2);

  // Handle user input from Serial Monitor
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() > 0) {
      Serial.println("Sending to D1 Mini: " + input);

      if (input.startsWith("http")) {
        Serial1.print("GET:" + input + "\n");
      } else if (input.equalsIgnoreCase("status")) {
        Serial1.print("STATUS\n");
      } else if (input.equalsIgnoreCase("ip")) {
        Serial1.print("IP\n");
      } else {
        Serial.println("Unknown command. Use http://... URL, 'status', or 'ip'");
      }
    }
  }

  // Handle responses from D1 Mini with buffering for large responses
  static String buffer = "";
  static bool collectingData = false;

  if (Serial1.available()) {
    String response = Serial1.readStringUntil('\n');
    response.trim();

    if (response.length() > 0) {

      // Check for data collection start/end markers
      if (response == "DATA_START") {
        collectingData = true;
        buffer = "";
        Serial.println("=== HTTP RESPONSE DATA ===");
        return;
      } else if (response == "DATA_END") {
        collectingData = false;
        Serial.println(buffer);
        Serial.println("=== END DATA ===");
        buffer = "";
        return;
      } else if (collectingData && response.startsWith("CHUNK:")) {
        // Collect data chunks
        String chunk = response.substring(6);  // Remove "CHUNK:" prefix
        buffer += chunk;
        return;  // Don't print individual chunks
      }

      // Handle other response types normally
      Serial.println("D1 Mini Response: " + response);

      // Parse different response types
      if (response.startsWith("DATA:")) {
        String data = response.substring(5);
        Serial.println("=== HTTP RESPONSE DATA ===");
        Serial.println(data);
        Serial.println("=== END DATA ===");
      } else if (response.startsWith("HTTP:")) {
        String code = response.substring(5);
        Serial.println("HTTP Status Code: " + code);
      } else if (response.startsWith("ERROR:")) {
        String error = response.substring(6);
        Serial.println("HTTP Error: " + error);
      } else if (response == "CONNECTED") {
        Serial.println("WiFi Status: Connected");
      } else if (response == "DISCONNECTED") {
        Serial.println("WiFi Status: Disconnected");
      } else if (response.indexOf(".") > 0) {
        // Probably an IP address
        Serial.println("IP Address: " + response);
      }
    }
  }
}


//rtc stuff
#define countof(a) (sizeof(a) / sizeof(a[0]))

void printDateTime(const RtcDateTime& dt) {
  char datestring[20];

  snprintf_P(datestring,
             countof(datestring),
             PSTR("%02u/%02u/%04u %02u:%02u:%02u"),
             dt.Month(),
             dt.Day(),
             dt.Year(),
             dt.Hour(),
             dt.Minute(),
             dt.Second());
  Serial.print(datestring);
}