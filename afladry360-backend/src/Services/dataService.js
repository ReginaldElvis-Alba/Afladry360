import database from "../db/index.js";
const { db } = database;
const SensorData = db.SensorData;

const get_all_data = async () => {
    //will fetch all existing data
    try {
        const sensorData = await SensorData.findAll();
        return sensorData;
    }
    catch (err) {
        return 500;
    }
}

export default { get_all_data }
