import express from "express";
import cors from "cors";
import env from "dotenv"
import mqtt from "mqtt";
import database from "./db/index.js"
import routes from "./api/v1/Routes/routes.js";
import EMC from "./utils/gabMaizeEMC.js";

const { gabMaizeEMC } = EMC;

const { db } = database //sequelize database object

env.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));//similar to body-parser
//cors
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
//routes
app.use("/api/v1/", routes);

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const SENSOR_TOPIC = process.env.SENSOR_TOPIC || 'AflaDry360/sensor_data';
const STATUS_TOPIC = process.env.STATUS_TOPIC || 'AflaDry360/status';

// MQTT connection options
const mqttOptions = {
    ...(MQTT_USERNAME && MQTT_PASSWORD && {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD
    })
};

//sync database
await db.sequelize.sync({ force: true }).then(() => {
    console.log("Database synchronized...");
}).catch((err) => {
    console.log(err);
});

// Connect to MQTT broker
const mqttClient = mqtt.connect(MQTT_BROKER, mqttOptions);

// MQTT event handlers
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to both topics
    const topics = [SENSOR_TOPIC, STATUS_TOPIC];

    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${topic}:`, err);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    });
});

mqttClient.on('message', async (topic, message) => {
    try {
        console.log(`Received message on topic: ${topic}`);

        // Parse the incoming message
        const messageStr = message.toString();
        console.log('Raw message:', messageStr);

        let messageData;
        try {
            messageData = JSON.parse(messageStr);
        } catch (parseError) {
            console.error('Failed to parse JSON message:', parseError);
            return;
        }

        // Handle different message types based on topic
        if (topic === SENSOR_TOPIC) {
            await handleSensorData(topic, messageData);
        } else if (topic === STATUS_TOPIC) {
            await handleStatusData(topic, messageData);
        } else {
            console.log('Unknown topic:', topic);
        }

    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
});

mqttClient.on('error', (error) => {
    console.error('MQTT Client Error:', error);
});

mqttClient.on('close', () => {
    console.log('MQTT connection closed');
});

mqttClient.on('reconnect', () => {
    console.log('MQTT client reconnecting...');
});

// Handle sensor data messages
async function handleSensorData(topic, data) {
  console.log('Processing sensor data...');

  // Extract device ID from incoming JSON (sent by ESP8266)
  const deviceId = data.deviceId || 'AflaDry360_ESP8266';

  // Compute Equilibrium Moisture Content (your function)
  const EMC = gabMaizeEMC(data.humidity, data.temperature);
  console.log('Computed EMC:', EMC);

  // Initialize base data fields
  const dbData = {
    deviceId: deviceId,
    timestamp: data.timestamp || new Date().toISOString(),
    temperature: data.temperature?.toString() || null,
    humidity: data.humidity?.toString() || null,
    moisture_content: EMC?.moistureContent?.toString() || null,
    spectral_valid: data.spectral_valid || false,
  };

  // ✅ Handle spectral data array (if included)
  if (Array.isArray(data.spectral_data) && data.spectral_data.length >= 11) {
    for (let i = 0; i < 11; i++) {
      dbData[`ch${i}`] = parseInt(data.spectral_data[i]) || 0;
    }
  } else {
    // Fill with nulls or zeros if missing
    for (let i = 0; i < 11; i++) {
      dbData[`ch${i}`] = null;
    }
  }

  console.log('Prepared sensor data for DB:', dbData);

  try {
    await saveSensorData(dbData);
    console.log('Sensor data saved successfully.');
  } catch (err) {
    console.error('Error saving sensor data:', err);
  }
}


// Handle status/heartbeat messages
async function handleStatusData(topic, data) {
    console.log('Processing status data...');
    console.log('Device:', data.device);
    console.log('Status:', data.status || data.type);
    console.log('RSSI:', data.wifi_rssi || data.rssi);

    if (data.type === 'heartbeat') {
        console.log('Uptime:', data.uptime, 'ms');
        console.log('Free heap:', data.free_heap, 'bytes');
    }

    // You can store status data in a separate table if needed
    // For now, just log it
}

// Function to save sensor data to database
async function saveSensorData(data) {
    try {
        const savedData = await db.SensorData.create(data);
        console.log('Sensor data saved to database:', savedData.toJSON());
        return savedData;
    } catch (error) {
        console.error('Database save error:', error);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            console.error('Validation errors:', error.errors.map(e => e.message));
        } else if (error.name === 'SequelizeConnectionError') {
            console.error('Database connection error');
        }

        throw error;
    }
}

// Express middleware
app.use(express.json());

// API endpoints
app.get("/", (req, res) => {
    res.send("Hello world!")
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
    console.log(`MQTT broker: ${MQTT_BROKER}`)
    console.log(`Sensor topic: ${SENSOR_TOPIC}`)
    console.log(`Status topic: ${STATUS_TOPIC}`)
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    mqttClient.end();
    process.exit();
});