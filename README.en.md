# Weather Station Server
The source code of the weather station server.
This takes care of the storage of the weather data in a SQL database and the data queries via API, which are required for the website.

## Installation
### Downloading the repository
For installation, it is first necessary to download the source code of the server to your own computer or virtual machine.

For this purpose, the distributed version management program [Git](https://de.wikipedia.org/wiki/Git) is used. This can be installed for Windows under https://git-scm.com/downloads and under Linux, if not preinstalled, with the integrated package manager (e.g. with Debian/Ubuntu `sudo apt-get install git`).

You can then clone the repository with `git clone https://github.com/lmg-anrath/weatherstation-server.git wetter` into the directory "wetter".

### Node.JS
The weather station server is based on the [Node.JS Engine](https://nodejs.org/en).
To install the server, the required modules must be downloaded. This is done with the [Node Package Manager (NPM)](https://www.npmjs.com/).

In the previously created directory the following command can now be executed:
``bash
npm install
```

## Setup
For the weather station server to work properly, `config.example.json` must be copied or renamed to `config.json` and the file `stations.example.json` must be renamed to `stations.json`.

On Linux this can be done in the same directory with `cp config.example.json config.json` and `cp stations.example.json stations.json`.

### Database
To use the weather station server, a database connection must be set up.

This can be done with SQLite, but preferably with PostgreSQL or MySQL.
An example configuration with MySQL can be seen in the file [config.example.json](./config.example.json).

The setup with other databases can be found in the following documentation: https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database

### Port
The weather station server starts an HTTP web server under the port specified in the `config.json`, by default this is `1111`.

Important: To set up encryption via HTTPS, the port must be routed via a so-called reverse proxy, which is strongly recommended for production use. This can be done with Apache2 or Nginx for example. Instructions for the respective service can be easily found on the Internet. For Apache2 and Nginx this is explained here: https://www.atatus.com/blog/how-to-set-up-a-reverse-proxy-in-nginx-and-apache/.

## Contributing
To edit the server the respective JavaScript files can be changed.
For the execution of the server, the use of a MySQL server with the program [XAMPP](https://www.apachefriends.org/de/) is suitable under Windows.
The server can restart itself automatically when changes are made with the tool `nodemon`. An installation with NPM is possible with the command `sudo npm install -g nodemon`.

## Production Use
To start the weather server for longer use, this can best be set up using the SystemD service.

This allows the server to run in the background and also restarts itself automatically when the machine is rebooted.

Instructions on how to do this can be found at: https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/.

To do this, the command `node index.js` must be executed in the appropriate directory or entered in the service file.

## Usage
Once the server is started, you can access the API documentation at http://localhost:1111/v2/.
Attention: If the port has changed or if you call it from another machine, change the URL accordingly!

New stations can be added in the [stations.json](./stations.example.json) file.

Translated with www.DeepL.com/Translator (free version)
