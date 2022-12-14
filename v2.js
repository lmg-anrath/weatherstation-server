const express = require('express');
const app = express.Router();

const swaggerUi = require('swagger-ui-express');
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(require('./v2.json')));

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

app.get('/stations/aggregate', async (req, res) => {
	if (!req.query.ids) return res.status(400).send('Please specify station ids!');
	const ids = req.query.ids.split(',');
	ids.forEach(id => {
		if (!stations[id]) return res.status(400).send('One of the specified stationIds does not exist!');
	});
	ids.forEach((id, index) => ids[index] = parseInt(id));

	const startTimestamp = parseInt(req.query.start);
	const endTimestamp = parseInt(req.query.end);
	if (!(startTimestamp && endTimestamp))
		return res.status(400).send('Please specify valid start and end timestamps!');
	const startDate = new Date(startTimestamp * 1000);
	const endDate = new Date(endTimestamp * 1000);
	if (startDate.getTime() > endDate.getTime())
		return res.status(400).send('The start date cannot be after the end date!');

	const channels = (req.query.channels || 'temperature,humidity,air_pressure,air_particle_pm25,air_particle_pm10').split(',');
	if (!channels.every(channel => ['temperature', 'humidity', 'air_pressure', 'air_particle_pm25', 'air_particle_pm10'].includes(channel)))
		return res.status(400).send('One of the specified channels does not exist!');
	let step = parseInt(req.query.step) || 1;

	const entries = await Log.findAll({
		where: {
			stationId: {
				[Op.in]: ids,
			},
			createdAt: {
				[Op.between]: [startDate.toISOString(), endDate.toISOString()],
			},
		},
	});

	const response = {
		meta: {
			start: startDate.getTime() / 1000,
			end: endDate.getTime() / 1000,
			step: step,
			stations: ids,
			channels: channels,
		},
		data: [],
	};
	ids.forEach(id => {
		const data = [];
		channels.forEach(channel => {
			const channelData = entries
				.filter(entry => entry.stationId === id && entry[channel] != null)
				.map(entry => ({ time: entry.createdAt.getTime() / 1000, value: entry[channel] }));
			let averageData = [];

			let left = 1;
			let right = channelData.length;

			while (left <= right) {
				step = Math.floor((left + right) / 2);
				averageData = [];
				for (let i = 0; i < channelData.length; i += step) {
					const currentStep = channelData.slice(i, i + step);
					const avg = currentStep.reduce((a, b) => a + b.value, 0) / currentStep.length;
					averageData.push({ time: currentStep[0].time, value: avg });
				}
				if (averageData.length <= 1000) break;
				else if (averageData.length > 1000) right = step - 1;
				else left = step + 1;
			}
			data.push(averageData);
		});
		response.data.push(data);
	});
	res.send(response);
});
app.get('/stations/:id', async (req, res) => {
	var id = parseInt(req.params.id);
	if (!stations[id]) return res.status(400).send('The specified stationId does not exist!');

	const startTimestamp = parseInt(req.query.start);
	const endTimestamp = parseInt(req.query.end);
	if (!(startTimestamp && endTimestamp))
		return res.status(400).send('Please specify valid start and end timestamps!');
	const startDate = new Date(startTimestamp * 1000);
	const endDate = new Date(endTimestamp * 1000);
	if (startDate.getTime() > endDate.getTime())
		return res.status(400).send('The start date cannot be after the end date!');

	const channels = (req.query.channels || 'temperature,humidity,air_pressure,air_particle_pm25,air_particle_pm10').split(',');
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
				data[channel].push({ time: date.toISOString(), value: entry[channel] });
		});
	});
	res.send(data);
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