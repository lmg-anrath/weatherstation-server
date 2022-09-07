const { Sequelize, DataTypes, Op } = require('sequelize');

const config = require('./config.json');
const logins = require('./logins.json');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

const sequelize = new Sequelize(config.database, { logging: false });
const Log = sequelize.define('logs', {
	stationId: DataTypes.INTEGER,
	temperature: DataTypes.FLOAT,
	humidity: DataTypes.FLOAT,
	air_pressure: DataTypes.INTEGER,
	air_particle_pm25: DataTypes.FLOAT,
	air_particle_pm10: DataTypes.FLOAT,
});
Log.sync();

app.post('/post', async (req, res) => {
	const { stationId, accessToken } = req.body;
	if (!stationId || !accessToken) return res.status(400).send('You need to provide a stationId and accessToken!');
	if (!logins[stationId - 1]) return res.status(400).send('The specified stationId does not exist!');
	if (logins[stationId - 1].accessToken != accessToken) return res.status(400).send('The specified accessToken is invalid!');

	const { temperature, humidity, air_pressure, air_particle_pm25, air_particle_pm10, timestamp } = req.body;
	if (!temperature) return res.status(400).send('Please specify the temperature!');
	if (!humidity) return res.status(400).send('Please specify the humidity!');
	if (!air_pressure) return res.status(400).send('Please specify the air pressure!');
	if (!air_particle_pm25) return res.status(400).send('Please specify the pm25 air particle!');
	if (!air_particle_pm10) return res.status(400).send('Please specify the pm10 air particle!');

	let date = new Date();
	if (timestamp) date = new Date(timestamp * 1000);

	const entry = await Log.create({
		stationId: stationId,
		temperature: temperature,
		humidity: humidity,
		air_pressure: air_pressure,
		air_particle_pm25: air_particle_pm25,
		air_particle_pm10: air_particle_pm10,
		createdAt: date.toISOString(),
	});
	console.log(`Added entry ${entry.id} to the database.`);
	res.sendStatus(200);
});

app.get('/get', async (req, res) => {
	var id = req.query.id;
	if (!id) return res.status(400).send('Please specify a stationId!');
	if (!logins[id - 1]) return res.status(400).send('The specified stationId does not exist!');

	const last = await Log.findOne({
		where: { stationId: id },
		order: [ [ 'createdAt', 'DESC' ] ],
	});
	const endDate = last ? new Date(last.createdAt) : new Date();
	const startDate = new Date(endDate.getTime());

	var display = req.query.d;
	if (display) {
		if (display == 'day') startDate.setDate(startDate.getDate() - 1);
		else if (display == 'week') startDate.setDate(startDate.getDate() - 7);
		else if (display == 'month') startDate.setMonth(startDate.getMonth() - 1);
		else if (display == 'year') startDate.setMonth(startDate.getMonth() - 12);
		else return res.status(400).send('Please specify a valid display query!');
	}
	else startDate.setDate(startDate.getDate() - 1);

	const entries = await Log.findAll({
		where: {
			stationId: id,
			createdAt: {
				[Op.between]: [startDate.toISOString(), endDate.toISOString()],
			},
		},
	});

	const temperature = [];
	const humidity = [];
	const air_pressure = [];
	const air_particle_pm25 = [];
	const air_particle_pm10 = [];

	entries.forEach(entry => {
		const date = new Date(entry.createdAt);
		date.setHours(date.getHours() + 2);
		temperature.push({ x: date.toISOString(), y: entry.temperature });
		humidity.push({ x: date.toISOString(), y: entry.humidity });
		air_pressure.push({ x: date.toISOString(), y: entry.air_pressure });
		air_particle_pm25.push({ x: date.toISOString(), y: entry.air_particle_pm25 });
		air_particle_pm10.push({ x: date.toISOString(), y: entry.air_particle_pm10 });
	});
	res.send({
		temperature: temperature,
		humidity: humidity,
		air_pressure: air_pressure,
		air_particle_pm25: air_particle_pm25,
		air_particle_pm10: air_particle_pm10,
	});
});

app.get('/stations', async (req, res) => {
	const locations = [];
	logins.forEach(station => locations.push(station.location));
	res.send(locations);
});

app.listen(config.port, console.log(`Started server at http://127.0.0.1:${config.port} !`));