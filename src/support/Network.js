import _ from 'lodash';
import fs from 'fs-jetpack';
import axios from 'axios';
import canConnect from 'internet-available';
import { Config, Logger } from '.';

class Network {
  register() {
    return this.sendRequest('register');
  }
  healthCheck() {
    return this.sendRequest('health-check')
      .catch((error) => {
        if (_.has(error, 'response.status') && _.get(error, 'response.status') === 404) {
          this.register().then(this.healthCheck.bind(this));
        }
      });
  }
  downloadFile(url, destination) {
    return this.hasConnection()
      .then(() => {
        axios.request({
          responseType: 'arraybuffer',
          url,
          method: 'get',
        }).then((result) => {
          fs.write(destination, result.data);
        }).catch((error) => {
          Logger.error(`failed to download file from ${url} due to error: ${error}`);
        });
      });
  }
  sendRequest(type, data = {}) {
    const uri = `${Config.get('package_server_api')}kiosk/${type}`;

    let requestData = _.extend({
      identifier: Config.get('identifier'),
      client: {
        version: Config.get('client_version'),
      },
      running_package: {
        name: Config.get('current_package_name'),
        version: Config.get('current_package_version'),
        is_override: Config.get('package_overridden'),
      },
    }, data);

    if (type === 'health-check') {
      const logs = Logger.getLogs('info');
      if (logs) {
        requestData = _.extend(requestData, {
          logs,
        });
      }
    }

    Logger.debug(`sending request to ${uri} with body ${JSON.stringify(requestData)}`);

    return new Promise(((resolve, reject) => {
      this.hasConnection()
        .then(() => {
          axios.post(`${uri}`, requestData)
            .then((response) => {
              if (type === 'health-check') {
                Logger.trimLogs('info');
              }
              Logger.debug(`request to ${uri} succeeded with response ${JSON.stringify(response.data)}`);
              resolve(response);
            }).catch((error) => {
              Logger.debug(`request to ${uri} failed with error ${JSON.stringify(error.code)}`);
              reject(error);
            });
        })
        .catch(() => {
          reject();
        });
    }));
  }
  hasConnection() {
    return new Promise((resolve, reject) => {
      canConnect({
        timeout: 5000,
        retries: 5,
      }).then(() => {
        resolve();
      }).catch((error) => {
        Logger.error('Kiosk does not have an internet connection');
        reject();
      });
    });
  }
}

module.exports.Network = Network;
