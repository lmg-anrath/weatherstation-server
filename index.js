const { Sequelize, DataTypes, Op } = require('sequelize');

const config = require('./config.json');
const logins = require('./logins.json');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const sequelize = new Sequelize(config.database, { logging: false });
const Log = sequelize.define('logs', {
	stationId: DataTypes.INTEGER,
	temperature: DataTypes.FLOAT,
	humidity: DataTypes.FLOAT,
	air_pressure: DataTypes.INTEGER,
});
Log.sync();

app.post('/post', async (req, res) => {
	const { stationId, accessToken } = req.body;
	if (!stationId || !accessToken) return res.status(400).send('You need to provide an stationId and accessToken!');
	if (!logins[stationId - 1]) return res.status(400).send('The specified stationId does not exist!');
	if (logins[stationId - 1].accessToken != accessToken) return res.status(400).send('The specified accessToken is invalid!');

	const { temperature, humidity, air_pressure } = req.body;
	if (!temperature) return res.status(400).send('Please specify the temperature!');
	if (!humidity) return res.status(400).send('Please specify the humidity!');
	if (!air_pressure) return res.status(400).send('Please specify the air pressure!');

	const entry = await Log.create({
		stationId: stationId,
		temperature: temperature,
		humidity: humidity,
		air_pressure: air_pressure,
	});
	console.log(`Added entry ${entry.id} to the database.`);
	res.sendStatus(200);
});

app.get('/get', async (req, res) => {
	var id = req.query.id;
	if (!id) id = 1;
	if (!logins[id - 1]) return res.status(400).send('The specified stationId does not exist!');

	const endDate = new Date();
	var startDate = new Date(endDate.getDate() - 1);

	var display = req.query.d;
	if (display && display != 'day') {
		if (display == 'week') startDate = new Date(endDate.getDate() - 7);
		else if (display == 'month') startDate = new Date(endDate.getMonth() - 1);
		else if (display == 'year') startDate = new Date(endDate.getMonth() - 12);
		else return res.status(400).send('Please specify an valid display query!');
	}

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

	entries.forEach(entry => {
		const date = new Date(entry.createdAt);
		var dateStr =
			('00' + (date.getMonth() + 1)).slice(-2) + '/' +
			('00' + date.getDate()).slice(-2) + '/' +
			date.getFullYear() + ' ' +
			('00' + date.getHours()).slice(-2) + ':' +
			('00' + date.getMinutes()).slice(-2) + ':' +
			('00' + date.getSeconds()).slice(-2);
		temperature.push({ x: dateStr, y: entry.temperature });
		humidity.push({ x: dateStr, y: entry.humidity });
		air_pressure.push({ x: dateStr, y: entry.air_pressure });
	});
	res.send({
		temperature: temperature,
		humidity: humidity,
		air_pressure: air_pressure,
	});
});

app.get('/stations', async (req, res) => {
	const locations = [];
	logins.forEach(station => locations.push(station.location));
	res.send(locations);
});

app.listen(config.port, console.log(`Started server at ${config.url}!`));