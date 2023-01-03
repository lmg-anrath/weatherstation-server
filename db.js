const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(require('./config.json').database, { logging: false });
const Log = sequelize.define('logs', {
	stationId: DataTypes.INTEGER,
	temperature: DataTypes.FLOAT,
	humidity: DataTypes.FLOAT,
	air_pressure: DataTypes.INTEGER,
	air_particle_pm25: DataTypes.FLOAT,
	air_particle_pm10: DataTypes.FLOAT,
});
Log.sync();

module.exports = Log;