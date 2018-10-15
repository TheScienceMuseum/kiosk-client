import ElectronConfig from 'electron-config';
import { app } from 'electron';
import { hri } from 'human-readable-ids';

class Config {
  constructor() {
    this.config = new ElectronConfig();

    this.config.set('client_version', app.getVersion());
    this.config.set('package_storage_directory', `${app.getPath('userData')}/packages/`);
    this.config.set('environment', process.env.APPLICATION_ENV ? process.env.APPLICATION_ENV : 'production');

    if (!this.config.get('identifier')) this.config.set('identifier', hri.random());
    if (!this.config.get('current_package_name')) this.config.set('current_package_name', null);
    if (!this.config.get('current_package_version')) this.config.set('current_package_version', null);

    switch (this.config.get('environment')) {
      case 'dev':
        // this.config.set('identifier', 'test-kiosk-one');
        this.config.set('package_server_api', 'http://kiosk-manager.test/api/');
        break;
      case 'staging':
        this.config.set('package_server_api', 'http://kiosk-manager.test/api/');
        break;
      default:
        this.config.set('package_server_api', 'http://kiosk-manager.test/api/');
        break;
    }
  }
  getConfig() {
    return this.config;
  }
}

module.exports.Config = (new Config()).getConfig();
