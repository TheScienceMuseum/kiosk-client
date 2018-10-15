import _ from 'lodash';
import axios from 'axios';
import canConnect from 'internet-available';
import { Config } from './config';
import Logger from './logger';

class HttpClient {
  constructor() {
    this.config = Config;
    this.log = Logger;
  }
  hasConnection(requestType) {
    return canConnect({
      timeout: 5000,
      retries: 5,
    })
      .catch(() => {
        this.log.debug(`cannot connect for request ${requestType}`);
      });
  }
  sendRequest(requestType, data) {
    const requestData = _.extend({
      identifier: this.config.get('identifier'),
      client: {
        version: this.config.get('client_version'),
      },
    }, data);

    this.log.debug(`sending request to ${this.config.get('package_server_api')}kiosk/${requestType} with body ${JSON.stringify(requestData)}`);

    return new Promise(((resolve, reject) => {
      this.hasConnection(requestType)
        .then(() => {
          axios.post(`${this.config.get('package_server_api')}kiosk/${requestType}`, requestData)
            .then((response) => {
              this.log.debug(`request to ${this.config.get('package_server_api')}kiosk/${requestType} succeeded with response ${JSON.stringify(response.data)}`);
              resolve(response);
            }).catch((error) => {
              this.log.debug(`request to ${this.config.get('package_server_api')}kiosk/${requestType} failed with error ${JSON.stringify(error.response.data)}`);
              reject(error.response);
            });
        })
        .catch(() => {
          reject();
        });
    }));
  }
}

module.exports.HttpClient = new HttpClient();
