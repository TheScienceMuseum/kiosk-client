import fs from 'fs-jetpack';
import { app } from 'electron';
import winston, { format, transports } from 'winston';

class Logger {
  constructor() {
    this.location_error = `${app.getPath('userData')}/error.log`;
    this.location_info = `${app.getPath('userData')}/info.log`;
    this.location_debug = `${app.getPath('userData')}/debug.log`;

    console.log(this.location_error, this.location_debug);

    const loggingTransports = [
      new transports.File({ filename: this.location_error, level: 'error' }),
      new transports.File({ filename: this.location_info, level: 'info' }),
      new transports.File({ filename: this.location_debug, level: 'debug' }),
      new transports.Console(),
    ];

    this.log = winston.createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
      transports: loggingTransports,
    });

    this.log.getLogs = (type) => {
      try {
        return fs.read(this[`location_${type}`])
        .split('\n')
        .filter(line => line !== '')
        .map(line => JSON.parse(line))
        .filter(line => (line));
      } catch (e) {
        return null;
      }
    };

    this.log.getPaths = () => ({
      error: this.location_error,
      info: this.location_info,
      debug: this.location_debug,
    });

    this.log.trimLogs = (type) => {
      if (this[`location_${type}`] !== undefined) {
        fs.write(this[`location_${type}`], '');
      }
    };
  }
  getLogger() {
    return this.log;
  }
}

module.exports.Logger = Logger;
