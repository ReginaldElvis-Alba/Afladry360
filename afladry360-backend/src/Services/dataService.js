import database from "../db/index.js";
import { afla_chain_backend } from '../chain';
const { db } = database;
const SensorData = db.SensorData;

const get_all_data = async () => {
    //will fetch all existing data
    try {
        const sensorData = await SensorData.findAll();
        return sensorData;
    }
    catch (err) {
        throw err;
    }
}

const upload_to_blockchain = async () => {
    try {
        // Fetch all data from database
        const dbData = await get_all_data();
        
        // Group data by deviceId
        const deviceGroups = dbData.reduce((acc, record) => {
            const deviceId = record.deviceId;
            if (!acc[deviceId]) {
                acc[deviceId] = [];
            }
            // Format record for chain storage
            const chainRecord = {
                id: record.id,
                timestamp: record.timestamp,
                temperature: record.temperature.toString(),
                humidity: record.humidity.toString(),
                moisture_content: record.moisture_content.toString(),
                spectral_data: {
                    spectral_valid: record.spectral_valid,
                    ch0: record.ch0,
                    ch1: record.ch1,
                    ch2: record.ch2,
                    ch3: record.ch3,
                    ch4: record.ch4,
                    ch5: record.ch5,
                    ch6: record.ch6,
                    ch7: record.ch7,
                    ch8: record.ch8,
                    ch9: record.ch9,
                    ch10: record.ch10
                }
            };
            acc[deviceId].push(chainRecord);
            return acc;
        }, {});

        // Process each device's data
        for (const deviceId of Object.keys(deviceGroups)) {
            try {
                // Fetch existing data from chain for this device
                const existingData = await afla_chain_backend.fetch_data(deviceId);
                
                // Find records that don't exist in chain yet
                // Using record ID for comparison
                const existingIds = new Set(existingData.map(d => d.id));
                const newData = deviceGroups[deviceId].filter(record => 
                    !existingIds.has(record.id)
                );

                if (newData.length > 0) {
                    // Upload new data chunks to chain
                    await afla_chain_backend.upload_data(deviceId, newData);
                    console.log(`Uploaded ${newData.length} new records for device ${deviceId}`);
                }
            } catch (error) {
                console.error(`Failed to process device ${deviceId}:`, error);
                // Continue with other devices even if one fails
            }
        }
    } catch (e) {
        console.error('Upload to blockchain failed:', e);
        throw e;
    }
}

export default { get_all_data, upload_to_blockchain}
