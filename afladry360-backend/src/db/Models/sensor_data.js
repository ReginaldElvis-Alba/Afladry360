const sensorDataModel = (sequelize, DataTypes) => {
    const sensorData = sequelize.define("SensorData", {
        deviceId: DataTypes.STRING,
        timestamp: DataTypes.STRING,
        temperature: DataTypes.STRING,
        humidity: DataTypes.STRING,
        moisture_content: DataTypes.FLOAT,
        spectral_valid: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        ch0: DataTypes.INTEGER,
        ch1: DataTypes.INTEGER,
        ch2: DataTypes.INTEGER,
        ch3: DataTypes.INTEGER,
        ch4: DataTypes.INTEGER,
        ch5: DataTypes.INTEGER,
        ch6: DataTypes.INTEGER,
        ch7: DataTypes.INTEGER,
        ch8: DataTypes.INTEGER,
        ch9: DataTypes.INTEGER,
        ch10: DataTypes.INTEGER,
    });

    return sensorData;
};

export default sensorDataModel;
