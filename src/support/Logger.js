import fs from 'fs-jetpack';
import { app } from 'electron';
import winston, { format, transports } from 'winston';
import { Tail } from 'tail';

class Logger {
  constructor() {
    this.location_error = `${app.getPath('userData')}/error.log`;
    if (!fs.exists(this.location_error)) {
      fs.write(this.location_error, '');
    }

    this.location_info = `${app.getPath('userData')}/info.log`;
    if (!fs.exists(this.location_info)) {
      fs.write(this.location_info, '');
    }

    this.location_debug = `${app.getPath('userData')}/debug.log`;
    if (!fs.exists(this.location_debug)) {
      fs.write(this.location_debug, '');
    }

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

    const tail = new Tail(this.log.getPaths().debug);
    let tail_callback = null;

    this.log.tail = (callback) => {
      tail_callback = callback;
      tail.on('line', callback);
    };

    this.log.stopTail = () => {
      tail.removeListener('line', tail_callback);
    };

  }

  getLogger() {
    return this.log;
  }
}

export default (new Logger()).getLogger();
