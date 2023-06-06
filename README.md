# Wetterstation Server
[README in english](./README.en.md)

Der Source-Code des Wetterstation Servers.
Dieser übernimmt die Speicherung der Wetter-Daten in einer SQL-Datenbank und die Datenabfragen per API, die für die Webseite erforderlich sind.

## Installation
### Herunterladen des Repositories
Zur Installation ist es zuerst erforderlich den Source Code des Servers auf den eigenen Rechner oder die virtuelle Machine herunterzuladen.

Dazu wird das verteilte Versionsverwaltung-Programm [Git](https://de.wikipedia.org/wiki/Git) benutzt. Dieses lässt sich für Windows unter https://git-scm.com/downloads installieren und unter Linux, falls nicht vorinstalliert, mit dem integrierten Paket-Manager (z.B. bei Debian/Ubuntu `sudo apt-get install git`).

Das Repository kann man dann mit `git clone https://github.com/lmg-anrath/weatherstation-server.git wetter` in das Verzeichnis "wetter" clonen.

### Node.JS
Der Wetterstations-Server basiert auf der [Node.JS Engine](https://nodejs.org/de).
Zur Installation des Servers müssen die benötigten Module heruntergeladen werden. Dies wird mit dem [Node Package Manager (NPM)](https://www.npmjs.com/) realisiert.

Im vorher erstellten Verzeichnis lässt sich nun folgender Befehl ausführen:
```bash
npm install
```

## Einrichtung
Damit der Wetterstations-Server funktionstüchtig agieren kann, muss die `config.example.json` kopiert oder unbenannt werden in `config.json` und die Datei `stations.example.json` in die Datei `stations.json` umbenannt werden muss.

Unter Linux lässt sich das im gleichen Verzeichnis mit `cp config.example.json config.json` und `cp stations.example.json stations.json` realisieren.

### Datenbank
Zur Verwendung des Wetterstations-Servers muss eine Datenbank-Verbindung eingerichtet werden.

Dies lässt sich mit SQLite verwenden, vorzugsweise allerdings mit PostgreSQL oder MySQL.
Eine Beispiel-Konfiguration mit MySQL lässt sich unter der Datei [config.example.json](./config.example.json) einsehen.

Die Einrichtung mit anderen Datenbanken lässt sich unter folgender Dokumentation weiter nachlesen: https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database

### Port
Der Wetterstations-Server startet einen HTTP-Webserver unter dem in der `config.json` angegebenen Port, standardmäßig ist dieser `1111`.

Wichtig: Um Verschlüsselung via HTTPS einzurichten, muss der Port über einen sog. Reverse-Proxy geroutet werden, was dringenst für den Production Use empfohlen ist. Dies geht beispielsweise mit Apache2 oder Nginx. Eine Anleitung für den jeweiligen Dienst lässt sich einfach im Internet finden. Für Apache2 und Nginx wird dies hier erklärt: https://www.atatus.com/blog/how-to-set-up-a-reverse-proxy-in-nginx-and-apache/

## Contributing
Zur Bearbeitung des Servers lassen sich die jeweiligen JavaScript-Dateien ändern.

Zur Ausführung des Servers bietet sich unter Windows die Verwendung eines MySQL-Servers mit dem Programm [XAMPP](https://www.apachefriends.org/de/) an.
Der Server kann sich automatisch bei Änderungen mit dem Tool `nodemon` neustarten. Eine Installation mit NPM ist mit dem Befehl `sudo npm install -g nodemon` möglich.

## Production Use
Um den Wetter-Server für die längere Verwendung zu starten, kann dies am besten per SystemD-Service eingerichtet werden.

Damit kann der Server im Hintergrund laufen und startet sich auch bei einem Neustart der Maschine automatisch neu.

Eine Anleitung dazu findet sich unter: https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/

Dazu muss der Befehl `node index.js` in dem entsprechenden Verzeichnis ausgeführt werden bzw. in die Service-Datei eingetragen werden.

## Verwendung
Wenn der Server fertig gestartet ist, kann man die API Dokumentation unter http://localhost:1111/v2/ aufrufen.
Achtung: Bei geändertem Port oder beim Aufruf von einer anderen Maschine die URL entsprechend abändern!

Neue Stationen können in der [stations.json](./stations.example.json) Datei hinzugefügt werden.
