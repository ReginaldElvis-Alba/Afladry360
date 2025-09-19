const sensorDataModel = (sequelize, DataTypes)=>{
    const sensorData = sequelize.define("SensorData",{
        deviceId:{
            type:DataTypes.STRING,
        },
        timestamp:
        {
            type:DataTypes.STRING,
        },
        temperature:{
            type:DataTypes.STRING,
        },
        humidity:{
            type:DataTypes.STRING,
        },
        moisture_content:{
            type:DataTypes.FLOAT
        }
    })
    return sensorData
};

export default sensorDataModel;