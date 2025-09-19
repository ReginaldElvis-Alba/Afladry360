#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>

const char* ssid = "alientech";
const char* password = "12345681";

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

// MQTT broker settings
const char broker[] = "test.mosquitto.org";
int port = 1883;
const char topic[] = "AflaDry360/sensor_data";
const char statusTopic[] = "AflaDry360/status";

// Variables for sensor data
String lastSensorData = "";
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;  // Send heartbeat every 30 seconds

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);

  Serial.println("CONNECTING");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("CONNECTED");
  Serial.print("IP:");
  Serial.println(WiFi.localIP());

  Serial.print("Attempting to connect to the MQTT broker: ");
  Serial.println(broker);

  if (!mqttClient.connect(broker, port)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());
    while (1)
      ;
  }

  Serial.println("You're connected to the MQTT broker!");

  // Send initial status
  publishStatus("online");

  Serial.println("Ready to receive sensor data from Arduino Mega");
}

void loop() {
  // Keep MQTT connection alive
  mqttClient.poll();

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("DISCONNECTED");
    WiFi.reconnect();
    return;
  }

  // Reconnect MQTT if needed
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    if (mqttClient.connect(broker, port)) {
      Serial.println("MQTT reconnected");
      publishStatus("reconnected");
    } else {
      Serial.println("MQTT reconnection failed");
      delay(5000);
      return;
    }
  }

  // Handle commands from Arduino Mega
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.length() > 0) {
      if (command.startsWith("SENSOR_DATA:")) {
        String sensorData = command.substring(12);
        handleSensorData(sensorData);
      } else {
        Serial.println("UNKNOWN:" + command);
      }
    }
  }

  // Send periodic heartbeat
  if (millis() - lastHeartbeat > heartbeatInterval) {
    publishHeartbeat();
    lastHeartbeat = millis();
  }
}

void handleSensorData(String jsonData) {
  Serial.println("Received sensor data: " + jsonData);

  // Validate JSON
  StaticJsonDocument<400> doc;
  DeserializationError error = deserializeJson(doc, jsonData);
  doc["deviceId"] = "AflaDry360_ESP8266";  // Add device ID
  serializeJson(doc, jsonData);

  if (error) {
    Serial.println("Failed to parse sensor data JSON");
    Serial.println("MQTT_ERROR");
    return;
  }

  // Store the data
  lastSensorData = jsonData;

  // Publish to MQTT
  if (publishSensorData(jsonData)) {
    Serial.println("MQTT_PUBLISHED");
  } else {
    Serial.println("MQTT_ERROR");
  }
}

bool publishSensorData(String data) {
  Serial.println("Publishing sensor data to MQTT...");

  mqttClient.beginMessage(topic);
  mqttClient.print(data);
  if (mqttClient.endMessage()) {
    Serial.println("Sensor data published successfully");
    return true;
  } else {
    Serial.println("Failed to publish sensor data");
    return false;
  }
}

void publishStatus(String status) {
  StaticJsonDocument<200> statusDoc;
  statusDoc["device"] = "AflaDry360_ESP8266";
  statusDoc["status"] = status;
  statusDoc["timestamp"] = millis();
  statusDoc["ip"] = WiFi.localIP().toString();
  statusDoc["rssi"] = WiFi.RSSI();

  String statusJson;
  serializeJson(statusDoc, statusJson);

  mqttClient.beginMessage(statusTopic);
  mqttClient.print(statusJson);
  mqttClient.endMessage();

  Serial.println("Status published: " + status);
}

void publishHeartbeat() {
  StaticJsonDocument<300> heartbeatDoc;
  heartbeatDoc["device"] = "AflaDry360_ESP8266";
  heartbeatDoc["type"] = "heartbeat";
  heartbeatDoc["timestamp"] = millis();
  heartbeatDoc["uptime"] = millis();
  heartbeatDoc["free_heap"] = ESP.getFreeHeap();
  heartbeatDoc["wifi_rssi"] = WiFi.RSSI();
  heartbeatDoc["last_sensor_data"] = lastSensorData != "" ? "available" : "none";

  String heartbeatJson;
  serializeJson(heartbeatDoc, heartbeatJson);

  mqttClient.beginMessage(statusTopic);
  mqttClient.print(heartbeatJson);
  mqttClient.endMessage();

  Serial.println("Heartbeat sent");
}