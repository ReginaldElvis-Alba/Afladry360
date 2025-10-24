#include <DHT.h>
#include <ThreeWire.h>
#include <RtcDS1302.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_AS7341.h>

// AS7341 setup
Adafruit_AS7341 as7341 = Adafruit_AS7341();

// DHT setup
#define DHTPIN 3       // DHT sensor pin
#define DHTTYPE DHT11  // Change to DHT22 if using that sensor
DHT dht(DHTPIN, DHTTYPE);

// RTC setup
ThreeWire myWire(4, 5, 2);  // DAT, CLK, RST
RtcDS1302<ThreeWire> Rtc(myWire);

void setup() {
  Serial.begin(115200);

  // Initialize AS7341
  while (!Serial) delay(10);
  Serial.println("AS7341 on Mega2560 - start");

  Wire.begin();  // using default SDA/SCL (20/21)

  if (!as7341.begin()) {
    Serial.println("Couldn't find AS7341! Check wiring.");
    while (1) delay(10);
  }
  Serial.println("AS7341 ready");

  // Initialize DHT
  dht.begin();
  Serial.println("DHT sensor ready");

  // Initialize RTC
  Serial.print("compiled: ");
  Serial.print(__DATE__);
  Serial.println(__TIME__);

  Rtc.Begin();

  RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
  RtcDateTime now = Rtc.GetDateTime();

  // Define acceptable date range (e.g., within 5 years of compile date)
  int16_t yearDiff = abs((int)now.Year() - (int)compiled.Year());

  if (!Rtc.IsDateTimeValid() || yearDiff > 5) {
    Serial.println("RTC time invalid or out of range! Resetting to compile time...");
    Rtc.SetDateTime(compiled);
  } else if (now < compiled) {
    Serial.println("RTC is older than compile time, updating...");
    Rtc.SetDateTime(compiled);
  } else {
    Serial.println("RTC time seems valid.");
  }

  if (Rtc.GetIsWriteProtected()) {
    Serial.println("RTC was write protected, enabling writing now");
    Rtc.SetIsWriteProtected(false);
  }

  if (!Rtc.GetIsRunning()) {
    Serial.println("RTC was not actively running, starting now");
    Rtc.SetIsRunning(true);
  }
}

void loop() {
  String sensorData = getSensorData();
  Serial.println("SENSOR_DATA:" + sensorData);
  delay(5000);
}

String getSensorData() {
  RtcDateTime now = Rtc.GetDateTime();
  Serial.println();

  // Read DHT values
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Validate readings
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    humidity = 0.0;
    temperature = 0.0;
  }

  // Read AS7341 spectral data
  uint16_t ch[11];
  bool spectralValid = as7341.readAllChannels(ch);

  if (spectralValid) {
    Serial.print("Ch: ");
    for (uint8_t i = 0; i < 11; i++) {
      Serial.print(ch[i]);
      if (i < 10) Serial.print(", ");
    }
    Serial.println();
  } else {
    Serial.println("Spectral read failed");
  }

  // JSON document
  StaticJsonDocument<600> doc;  // increased size to fit spectral data

  doc["deviceId"] = "AflaDry360_Device01";
  doc["timestamp"] = getTimestampString(now);
  doc["rtc_valid"] = now.IsValid();
  doc["temperature"] = round(temperature * 100) / 100.0;
  doc["humidity"] = round(humidity * 100) / 100.0;
  doc["spectral_valid"] = spectralValid;

  // Add spectral data
  JsonArray spectral = doc.createNestedArray("spectral_data");
  for (uint8_t i = 0; i < 11; i++) {
    spectral.add(spectralValid ? ch[i] : 0);
  }

  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

// RTC helper functions
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
