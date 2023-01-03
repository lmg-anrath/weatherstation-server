const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.use('/', require('./v1.js'));
app.use('/v1', require('./v1.js'));

app.use(express.json());
app.use('/v2', require('./v2.js'));

const config = require('./config.json');
app.listen(config.port, console.log(`Started server at http://127.0.0.1:${config.port} !`));

module.exports = app;