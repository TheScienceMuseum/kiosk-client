import winston, { format, transports } from 'winston';
import _ from 'lodash';
import { app } from 'electron';
import { Config } from './config';

class Logger {
  constructor() {
    const loggingTransports = [
      new transports.File({ filename: `${app.getPath('userData')}/error.log`, level: 'error' }),
      new transports.File({ filename: `${app.getPath('userData')}/debug.log`, level: 'debug' }),
    ];

    // if (Config.get('environment') === 'development')
      loggingTransports.push(new transports.Console());

    this.log = winston.createLogger({
      level: 'debug',
      format: format.combine(
        format(message => _.extend(message, {
          client_version: Config.get('client_version'),
          client_identifier: Config.get('identifier'),
        }))(),
        format.timestamp(),
        format.json(),
      ),
      transports: loggingTransports,
    });
  }
  getLogger() {
    return this.log;
  }
}

module.exports = (new Logger()).getLogger();
