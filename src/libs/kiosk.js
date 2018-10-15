import fs from 'fs';
import { Package } from './package';
import { Config } from '../utils/config';
import { HttpClient } from '../utils/httpClient';
import { Window } from '../utils/window';
import Logger from '../utils/logger';


class Kiosk {
  constructor() {
    this.config = Config;
    this.log = Logger;
    this.http = HttpClient;
    this.showing_default_screen = true;
  }
  start() {
    this.log.debug('starting kiosk window');
    this.window = new Window();

    this.log.debug('loading default screen');
    this.showing_default_screen = true;
    this.window.changeCurrentDisplayPackage(`${__dirname}/../index.html`);

    this.package = new Package(
      this.config.get('current_package_name'),
      this.config.get('current_package_version'),
    );

    this.healthCheck();
    this.updateDisplayedPackage();

    setInterval(
      () => {
        this.healthCheck();
        this.updateDisplayedPackage();
      },
      10000,
      // this.config.get('environment') === 'dev' ? 10000 : (5 * 60000),
      // <minutes> * <milliseconds multiplier>
    );
  }
  healthCheck() {
    this.http.sendRequest('health-check', {
      package: {
        name: this.package.manifest.name,
        version: this.package.manifest.version,
      },
    }).then((response) => {

      if (response.data.data.package === null) {
        this.log.debug('no package listed against this kiosk on the server');
      } else {
        const currentClientPackage = `${this.package.manifest.name}_${this.package.manifest.version}`;
        const currentServerPackage = `${response.data.data.package.name}_${response.data.data.package.current_version.version}`;

        this.log.debug(`client has: "${currentClientPackage}" server has: "${currentServerPackage}" should we update? ${currentClientPackage === currentServerPackage ? 'no' : 'yes'}`);
        if (currentServerPackage !== currentClientPackage) {
          this.package.downloadNewPackageVersion(response.data.data.package);
        }
      }
    }).catch((response) => {
      if (response && response.status === 404) {
        this.log.info(`registering kiosk as ${this.config.get('identifier')}`);
        this.http.sendRequest('register')
          .then(this.healthCheck.bind(this))
          .catch((error) => {
            this.log.debug(error);
            this.log.error('could not register the kiosk');
          });
      }

      console.log(response);
    });
  }
  updateDisplayedPackage() {
    if (this.shouldUpdateScreen() && this.canUpdateScreen()) {
      this.log.debug(`checking if the current package ${this.config.get('current_package_name')}_${this.config.get('current_package_version')} exists`);
      if (fs.existsSync(`${this.config.get('package_storage_directory')}/${this.config.get('current_package_name')}_${this.config.get('current_package_version')}`)) {
        this.log.debug(`package ${this.config.get('current_package_name')}_${this.config.get('current_package_version')} exists`);
        this.window.changeCurrentDisplayPackage(`${__dirname}/../loading_package.html`);
        this.package = null;
        this.package = new Package(
          this.config.get('current_package_name'),
          this.config.get('current_package_version'),
        );
      }

      if (this.package.manifest.main) {
        this.log.debug(`loading package to the screen ${this.package.manifest.name}_${this.package.manifest.version}`);
        this.showing_default_screen = false;
        this.window.changeCurrentDisplayPackage(`${this.package.getPathToEntrypoint()}`);
      } else {
        this.log.debug('loading default screen');
        this.showing_default_screen = true;
        this.window.changeCurrentDisplayPackage(`${__dirname}/../index.html`);
      }
    }
  }
  shouldUpdateScreen() {
    this.log.debug('checking if the screen package should be updated');

    if (`${this.package.manifest.name}_${this.package.manifest.version}` !== `${this.config.get('current_package_name')}_${this.config.get('current_package_version')}`) {
      this.log.debug(`currently displayed package ${this.package.manifest.name}_${this.package.manifest.version} does not match the configured current package ${this.config.get('current_package_name')} we should update`);
      return true;
    }

    if (this.showing_default_screen) {
      this.log.debug('currently displaying the default screen, we should update if a package is available');
      return true;
    }

    this.log.debug('screen package should not be updated');
    return false;
  }
  canUpdateScreen() {
    this.log.debug('checking if the screen package can be updated');

    if (this.config.get('screen_unattended')) {
      this.log.debug('the screen is currently unattended, we can update');
      return true;
    }

    this.log.debug('screen package cannot be updated');
    return false;
  }
}

module.exports.Kiosk = Kiosk;
