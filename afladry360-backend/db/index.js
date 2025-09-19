import {DataTypes, Sequelize} from "sequelize"
import env from "dotenv";

import sensorDataModel from "./Models/sensor_data.js";

env.config();

//configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    /*dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }*/
});

//test connection
const connect = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.log("Unable to connect to the database:", error);
    }
}
connect();

//db object
const db={};
db.Sequelize=Sequelize;
db.sequelize=sequelize;

//link models to database
db.SensorData = sensorDataModel(sequelize, DataTypes)

export default {db, sequelize};

