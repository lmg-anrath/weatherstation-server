const express = require('express');
const bodyParser = require('body-parser');
const app = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { Op } = require('sequelize');
const { Log } = require('./db.js');

const stations = require('../stations.json');

app.get('/stations', async (req, res) => {
	const locations = [];
	stations.forEach(station => locations.push({ name: station.name, position: station.position, color: station.color, active: station.active }));
	res.send(locations);
});

function isIsoDate(str) {
	if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
	const d = new Date(str);
	return d instanceof Date && !isNaN(d) && d.toISOString() === str;
}
app.get('/get', async (req, res) => {
	var id = req.query.id - 1;
	if (id == null) return res.status(400).send('Please specify a stationId!');
	if (!stations[id]) return res.status(400).send('The specified stationId does not exist!');

	let endDate = new Date();
	let startDate = new Date(endDate.getTime());

	var display = req.query.d;
	if (display) {
		if (display == 'day') startDate.setDate(startDate.getDate() - 1);
		else if (display == 'week') startDate.setDate(startDate.getDate() - 7);
		else if (display == 'month') startDate.setMonth(startDate.getMonth() - 1);
		else if (display == 'year') startDate.setMonth(startDate.getMonth() - 12);
		else return res.status(400).send('Please specify a valid display query!');
	}
	else if (req.query.min && req.query.max) {
		if (!(isIsoDate(req.query.min) && isIsoDate(req.query.max)))
			return res.status(400).send('Please specify valid ISO dates!');
		startDate = new Date(req.query.min);
		endDate = new Date(req.query.max);
		if (startDate.getTime() > endDate.getTime())
			return res.status(400).send('The start date cannot be after the end date!');
	}
	else startDate.setDate(startDate.getDate() - 1);

	const entries = await require('./filter.js').filter(await Log.findAll({
		where: {
			stationId: id,
			createdAt: {
				[Op.between]: [startDate.toISOString(), endDate.toISOString()],
			},
		},
		order: [['createdAt', 'ASC']],
	}));

	const temperature = [];
	const humidity = [];
	const air_pressure = [];
	const air_particle_pm25 = [];
	const air_particle_pm10 = [];

	entries.forEach(entry => {
		var date = entry.createdAt;
		date = date.setHours(date.getHours() + 2);
		if (entry.temperature != null) temperature.push({ x: date.toISOString(), y: entry.temperature });
		if (entry.humidity != null) humidity.push({ x: date.toISOString(), y: entry.humidity });
		if (entry.air_pressure != null) air_pressure.push({ x: date.toISOString(), y: entry.air_pressure });
		if (entry.air_particle_pm25 != null) air_particle_pm25.push({ x: date.toISOString(), y: entry.air_particle_pm25 });
		if (entry.air_particle_pm10 != null) air_particle_pm10.push({ x: date.toISOString(), y: entry.air_particle_pm10 });
	});
	res.send({
		temperature: temperature,
		humidity: humidity,
		air_pressure: air_pressure,
		air_particle_pm25: air_particle_pm25,
		air_particle_pm10: air_particle_pm10,
	});
});

app.post('/post', async (req, res) => {
	const stationId = req.body.stationId - 1;
	const { accessToken } = req.body;
	if (!stationId || !accessToken) return res.status(400).send('You need to provide a stationId and accessToken!');
	if (!stations[stationId]) return res.status(400).send('The specified stationId does not exist!');
	if (stations[stationId].accessToken != accessToken) return res.status(400).send('The specified accessToken is invalid!');

	const { temperature, humidity, air_pressure, air_particle_pm25, air_particle_pm10, timestamp } = req.body;

	let date = new Date();
	if (timestamp) date = new Date(timestamp * 1000);

	const e = {
		stationId: stationId,
		createdAt: date.toISOString(),
	};

	if (temperature != null) e.temperature = temperature;
	if (humidity != null) e.humidity = humidity;
	if (air_pressure != null) e.air_pressure = air_pressure;
	if (air_particle_pm25 != null) e.air_particle_pm25 = air_particle_pm25;
	if (air_particle_pm10 != null) e.air_particle_pm10 = air_particle_pm10;

	const entry = await Log.create(e);
	console.log(`Added entry ${entry.id} to the database.`);
	res.sendStatus(200);
});

module.exports = app;
