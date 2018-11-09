import _ from 'lodash';
import { ipcMain } from 'electron';
import { Config, Logger, Network, Package, Window } from './support';
import { PackageManager } from './PackageManager';

class Kiosk {
  constructor() {
    this.window = new Window('main');
    this.packageManager = new PackageManager();

    this.window_debug = null;
    this.currently_displayed_package = this.packageManager.getCurrentPackage();

    Logger.info(`Kiosk started. API Endpoint: ${Config.get('package_server_api')}, Time between checks: ${(Config.get('health_check_timeout') / 60000)} minutes`);
  }
  start() {
    this.healthCheck();

    setInterval(this.healthCheck.bind(this), Config.get('health_check_timeout'));

    this.displayDefault();
  }
  displayDefault() {
    this.currently_displayed_package = this.packageManager.getCurrentPackage();

    if (this.currently_displayed_package) {
      this.displayPackage(this.currently_displayed_package);
    } else {
      this.displayDefaultScreen();
    }
  }
  displayPackage(newPackage) {
    Logger.info(`Displaying package: ${newPackage.getPackageFullName()}`);
    this.window.update(newPackage.getMainFilePath());
  }
  displayDefaultScreen() {
    Logger.info('Displaying default screen');
    this.window.update('./src/views/default.html');
  }
  displayDebugScreen() {
    if (this.window_debug) {
      this.window_debug.show();
      return;
    }

    this.window_debug = new Window('debug', false);
    this.window_debug.update('./src/views/debug.html');

    this.window_debug.on('close', () => {
      this.window_debug = null;
      Logger.info('Debug screen closed');
    });

    // on package chosen
    ipcMain.on('refresh-main-window', () => {
      // Config.set('')
      this.displayDefault();
    });

    Logger.info('Debug screen opened');
  }
  healthCheck() {
    Logger.info('Kiosk Health Check Starting');
    Network.healthCheck()
      .then((response) => {
        const packageData = _.get(response, 'data.data.package');
        Config.set('package_overridden', _.get(response, 'data.data.manually_set'));

        if (
          packageData !== null &&
          _.has(packageData, 'name') &&
          _.has(packageData, 'version') &&
          _.has(packageData, 'path')
        ) {
          const newPackage = new Package(
            _.get(packageData, 'name'),
            _.get(packageData, 'version'),
          );

          const foundPackage = this.packageManager.getPackageByNameAndVersion(
            newPackage.name,
            newPackage.version,
          );

          if (foundPackage) {
            this.updateDisplayedPackage(foundPackage);
          } else {
            newPackage.download(_.get(packageData, 'path'))
              .then(() => {
                this.updateDisplayedPackage(newPackage);
              });
          }
        }
      });
  }
  updateDisplayedPackage(newPackage) {
    this.packageManager.rebuildPackageCache();
    const currentPackage = this.packageManager.getCurrentPackage();
    let canUpdate = true;

    if (currentPackage && currentPackage.isTheSameAs(newPackage)) {
      Logger.info('Display not updated: current package is up to date');
      canUpdate = false;
    }

    if (canUpdate && !Config.get('screen_unattended')) {
      Logger.info('Display not updated: kiosk in use');
      canUpdate = false;
    }

    if (canUpdate && Config.get('package_overridden')) {
      Logger.info(`Display not updated: kiosk has manually loaded package since ${Config.get('package_overridden')}`);
      canUpdate = false;
    }

    if (canUpdate && this.packageManager.setNewPackage(newPackage.name, newPackage.version)) {
      this.displayDefault();
      Logger.info(`Display updated: loaded package ${newPackage.name} version ${newPackage.version}`);
    }
  }
}

module.exports.Kiosk = Kiosk;
