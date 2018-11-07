import _ from 'lodash';
import { ipcMain } from 'electron';
import { Config, Logger, Network, Window } from './support';
import { PackageManager } from './PackageManager';

class Kiosk {
  constructor() {
    this.window = new Window('main');
    this.packageManager = new PackageManager();

    this.showing_debug_screen = false;
    this.running_healthcheck = false;

    Logger.info(`Kiosk started. API Endpoint: ${Config.get('package_server_api')}, Time between checks: ${(Config.get('health_check_timeout') / 60000)} minutes`);
  }
  start() {
    this.healthCheck();

    setInterval(this.healthCheck.bind(this), Config.get('health_check_timeout'));

    this.displayDefault();
  }
  displayDefault() {
    const currentPackage = this.packageManager.getCurrentPackage();

    if (currentPackage) {
      this.displayPackage(currentPackage);
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
    if (!this.showing_debug_screen) {
      this.showing_debug_screen = true;

      const debugWindow = new Window('debug', false);
      debugWindow.update('./src/views/debug.html');

      debugWindow.on('close', () => {
        this.showing_debug_screen = false;
        Logger.info('Debug screen closed');
      });

      // on package chosen
      ipcMain.on('refresh-main-window', this.displayDefault.bind(this));

      Logger.info('Debug screen opened');
    }
  }
  healthCheck() {
    Network.healthCheck()
      .then((response) => {
        this.running_healthcheck = true;

        if (!_.has(response, 'data.data.package')) {
          this.running_healthcheck = false;
          return;
        }

        const currentPackage = this.packageManager.getCurrentPackage();

        const assignedPackageData = _.get(response, 'data.data.package');

        if (assignedPackageData === null) {
          return;
        }

        const assignedPackage = this.packageManager.getPackageByNameAndVersion(
          assignedPackageData.name,
          assignedPackageData.version,
        );

        if (!currentPackage && assignedPackage !== null) {
          this.displayPackage(assignedPackage);
          return;
        }

        // if (configuredName !== newPackage.name || configuredVersion !== newPackage.version) {
        //   if (newPackageFound) {
        //     this.displayPackage(newPackageFound);
        //   } else {
        //     this.packageManager.getNewPackage(newPackage.name, newPackage.version);
        //   }
        // }
      });
  }
}

module.exports.Kiosk = Kiosk;
