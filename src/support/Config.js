import fs from 'fs-jetpack';
import ElectronConfig from 'electron-config';
import { app } from 'electron';
import { hri } from 'human-readable-ids';

class Config {
  constructor() {
    this.config = new ElectronConfig();

    this.config.set('client_version', app.getVersion());
    this.config.set('package_storage_directory', `${app.getPath('userData')}/packages/`);
    this.config.set('logs_debug', `${app.getPath('userData')}/debug.log`);
    this.config.set('environment', 'production');

    if (!this.config.get('identifier')) this.config.set('identifier', hri.random());
    if (!this.config.get('current_package_name')) this.config.set('current_package_name', null);
    if (!this.config.get('current_package_version')) this.config.set('current_package_version', null);

    switch (this.config.get('environment')) {
      case 'development':
        this.config.set('health_check_timeout', 10000); // <minutes> * <milliseconds multiplier>
        this.config.set('package_server_api', 'http://kiosk-manager.test/api/');
        break;
      case 'staging':
        this.config.set('health_check_timeout', 10 * 60000); // <minutes> * <milliseconds multiplier>
        this.config.set('package_server_api', 'https://kms.scimus.clients.joipolloi.com/api/');
        break;
      default:
        this.config.set('health_check_timeout', (15000)); // <minutes> * <milliseconds multiplier>
        //this.config.set('package_server_api', 'http://ec2-18-191-78-6.us-east-2.compute.amazonaws.com/api/');
        this.config.set('package_server_api', 'https://kms.scimus.clients.joipolloi.com/api/');
        break;
    }
  }

  getConfig() {
    return this.config;
  }
}

export default (new Config()).getConfig();
