#include <dht11.h>
#include <ThreeWire.h>
#include <RtcDS1302.h>
#include <ArduinoJson.h>

#define DHT11PIN 3

dht11 DHT11;

ThreeWire myWire(4, 5, 2);  // IO, SCLK, CE
RtcDS1302<ThreeWire> Rtc(myWire);

void setup() {
  Serial.begin(115200);

  //rtc stuff
  Serial.print("compiled: ");
  Serial.print(__DATE__);
  Serial.println(__TIME__);

  Rtc.Begin();

  RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
  printDateTime(compiled);
  Serial.println();

  //RTC validation
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
}

void loop() {
  String sensorData = getSensorData();
  Serial.println(sensorData);
  delay(5000);
}

String getSensorData() {
  RtcDateTime now = Rtc.GetDateTime();
  Serial.println();

  int chk = DHT11.read(DHT11PIN);

  //JSON
  StaticJsonDocument<300> doc;
  doc["deviceId"] = "AflaDry360_Device01";
  doc["timestamp"] = getTimestampString(now);
  doc["rtc_valid"] = now.IsValid();
  doc["temperature"] = round(DHT11.temperature * 100) / 100.0;  // 2 decimal places
  doc["humidity"] = round(DHT11.humidity * 100) / 100.0;

  String jsonString;
  serializeJson(doc, jsonString);

  return jsonString;
}

//RTC
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

String getTimestampString(const RtcDateTime& dt) {
  char datestring[20];
  snprintf_P(datestring,
             sizeof(datestring),
             PSTR("%04u-%02u-%02u %02u:%02u:%02u"),
             dt.Year(),
             dt.Month(),
             dt.Day(),
             dt.Hour(),
             dt.Minute(),
             dt.Second());
  return String(datestring);
}