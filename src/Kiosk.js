import _ from 'lodash';
import { app, ipcMain } from 'electron';
import path from 'path';

import Config from './support/Config';
import Logger from './support/Logger';
import Network from './support/Network';
import Window from './support/Window';

import PackageManager from './PackageManager';
import Package from './Package';

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

  closeApplication()
  {
    app.exit(0);
  }

  displayPackage(newPackage) {
    Logger.info(`Displaying package: ${newPackage.getPackageFullName()}`);
    this.window.update(newPackage.getMainFilePath());
  }

  displayDefaultScreen() {
    Logger.info('Displaying default screen');
    this.window.update(`${__static}/default.html`);
  }

  displayDebugScreen() {
    if (this.window_debug) {
        this.window_debug.destroy();
      return;
    }

    this.window_debug = new Window('debug', false);
    this.window_debug.update(`${__static}/debug.html`);

    this.window_debug.on('close', () => {
      Logger.stopTail();
      this.window_debug = null;
      Logger.info('Debug screen closed');
    });

    // on package chosen
    ipcMain.on('refresh-main-window', () => {
      this.displayDefault();
    });

    ipcMain.on('delete-package', (event, packageData) => {
      console.log('deleting package: ', packageData);
      this.packageManager.deletePackageByNameAndVersion(packageData.slug, packageData.version);
      event.sender.send('packages-update', this.packageManager.packages, this.packageManager.getCurrentPackage());
    });

    ipcMain.on('change-package', (event, packageData) => {
      this.packageManager.setNewPackage(packageData.slug, packageData.version);
      Config.set('package_overridden', (Date.now() / 1000).toFixed(0));
      this.displayDefault();
      event.sender.send('packages-update', this.packageManager.packages, this.packageManager.getCurrentPackage());
    });

    ipcMain.on('file-package', (event, filepath) => {
      this.packageManager.getNewPackageFromFilepath(filepath)
        .then(() => {
          event.sender.send('packages-update', this.packageManager.packages, this.packageManager.getCurrentPackage());
        })
        .catch((error) => {
          event.sender.send('application-error', 'Error loading from file' + error);
        });
    });

    ipcMain.once('debug-window-loaded', (event, args) => {
      // Start sending logging information to the debug window
      Logger.tail((line) => {
        event.sender.send('log-entry', line);
      });

      event.sender.send('packages-update', this.packageManager.packages, this.packageManager.getCurrentPackage());
    });

    Logger.info('Debug screen opened');
  }

  healthCheck() {
    Logger.debug('Kiosk Health Check Starting');
    Network.healthCheck()
      .then((response) => {
        const packageData = _.get(response, 'data.data.assigned_package_version');
        Config.set('package_overridden', _.get(response, 'data.data.manually_set'));

        if (
          packageData !== null &&
          _.has(packageData, 'name') &&
          _.has(packageData, 'version') &&
          _.has(packageData, 'path')
        ) {
          const newPackage = new Package(
            _.get(packageData, 'slug'),
            _.get(packageData, 'version'),
          );

          const foundPackage = this.packageManager.getPackageByNameAndVersion(
            newPackage.slug,
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

    if (canUpdate && this.packageManager.setNewPackage(newPackage.slug, newPackage.version)) {
      this.displayDefault();
      Logger.info(`Display updated: loaded package ${newPackage.slug} version ${newPackage.version}`);
    }
  }
}

export default Kiosk;
