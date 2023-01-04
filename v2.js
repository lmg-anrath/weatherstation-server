const express = require('express');
const app = express.Router();

const { Op } = require('sequelize');
const Log = require('./db.js');

const stations = require('./stations.json');

app.get('/stations', async (req, res) => {
	const locations = [];
	stations.forEach(station => locations.push({
		name: station.name,
		position: station.position,
		color: station.color,
		active: station.active,
	}));
	res.send(locations);
});

async function getData(id, startDate, endDate, channels) {
	const entries = await Log.findAll({
		where: {
			stationId: id,
			createdAt: {
				[Op.between]: [startDate.toISOString(), endDate.toISOString()],
			},
		},
	});

	const data = {};
	channels.forEach(channel => data[channel] = []);
	entries.forEach(entry => {
		const date = entry.createdAt;
		channels.forEach(channel => {
			if (entry[channel] != null)
				data[channel].push({ x: date.toISOString(), y: entry[channel] });
		});
	});
	return data;
}
function isIsoDate(str) {
	if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
	const d = new Date(str);
	return d instanceof Date && !isNaN(d) && d.toISOString() === str;
}
app.get('/stations/:id', async (req, res) => {
	var id = parseInt(req.params.id);
	if (!stations[id]) return res.status(400).send('The specified stationId does not exist!');

	if (!(isIsoDate(req.query.start) && isIsoDate(req.query.end)))
		return res.status(400).send('Please specify valid ISO dates!');
	const startDate = new Date(req.query.start);
	const endDate = new Date(req.query.end);
	if (startDate.getTime() > endDate.getTime())
		return res.status(400).send('The start date cannot be after the end date!');

	const channels = (req.query.channels || 'temperature,humidity,air_pressure,air_particle_pm25,air_particle_pm10').split(',');
	res.send(await getData(id, startDate, endDate, channels));
});


function authorizedStation(req, res, next) {
	var id = parseInt(req.params.id);
	if (!stations[id]) return res.status(400).send('The specified stationId does not exist!');

	var auth = req.headers.authorization;
	if (!auth) return res.status(401).send('You need to provide an authorization header!');
	if (stations[id].accessToken != auth) return res.status(401).send('The specified accessToken is invalid!');

	next();
}
app.post('/stations/:id', authorizedStation, async (req, res) => {
	var id = parseInt(req.params.id);
	const { temperature, humidity, air_pressure, air_particle_pm25, air_particle_pm10, timestamp } = req.body;

	let date = new Date();
	if (timestamp) date = new Date(timestamp * 1000);

	const e = {
		stationId: id,
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