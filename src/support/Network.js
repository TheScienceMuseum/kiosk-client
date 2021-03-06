import dns from 'dns';
import _ from 'lodash';
import fs from 'fs-jetpack';
import axios from 'axios';
import canConnect from 'internet-available';

import Config from './Config';
import Logger from './Logger';


class Network {
  register() {
    return this.sendRequest('register');
  }

  healthCheck() {
    return this.sendRequest('health-check')
      .catch((error) => {
        if (_.has(error, 'response.status')) {
          if (_.get(error, 'response.status') === 404) {
            this.register()
              .then(this.healthCheck.bind(this));
          }
        }
      });
  }

  static buildRequestData(type, data = {}) {
    let requestData = _.extend({
      identifier: Config.get('identifier'),
      running_package: {
        name: Config.get('current_package_name'),
        version: Config.get('current_package_version'),
        manually_set: Config.get('package_overridden', null),
      },
      client: {
        version: Config.get('client_version'),
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
    return requestData;
  }

  downloadFile(url, destination, packageObj) {
    this.hasConnection().then(() => {
      axios.request({
        responseType: 'stream',
        url,
        method: 'post',
        data: Network.buildRequestData(),
      }).then((result) => {
        const stream = fs.createWriteStream(destination);
        stream.on('finish', function() {
          //fire event
          packageObj.extractPackage();
        });

        result.data.pipe(stream);
      })
    })
  }

  sendRequest(type, data = {}) {
    const uri = `${Config.get('package_server_api')}kiosk/${type}`;
    const requestData = Network.buildRequestData(type, data);

    Logger.debug(`sending request to ${uri}}`, {request: requestData});

    return new Promise(((resolve, reject) => {
      this.hasConnection()
        .then(() => {
          axios.post(`${uri}`, requestData)
            .then((response) => {
              if (type === 'health-check') {
                Logger.trimLogs('info');
              }
              Logger.debug(`request to ${uri} succeeded`, {response: response.data});
              resolve(response);
            })
            .catch((error) => {
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
      const apiDomain = Config.get('package_server_api')
        .split('/')[2];
      const dnsServers = dns.getServers();

      canConnect({
        timeout: 5000,
        retries: 5,
        domainName: apiDomain,
        host: dnsServers[0],
      })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          Logger.error('Kiosk does not have an internet connection');
          reject();
        });
    });
  }
}

export default (new Network);
