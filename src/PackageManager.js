import _ from 'lodash';
import fs from 'fs-jetpack';
import path from 'path';
import { Config, Logger, Package } from './support';

class PackageManager {
  constructor() {
    this.rebuildPackageCache();
  }
  rebuildPackageCache() {
    if (!fs.exists(Config.get('package_storage_directory'))) {
      fs.dir(Config.get('package_storage_directory'));
    }

    this.packages = [];

    fs.find(Config.get('package_storage_directory'), {
      directories: true,
      files: false,
      matching: '*',
      recursive: false,
    }).forEach((folder) => {
      const foundPackage = Package.loadFromFolder(folder);

      if (foundPackage) this.packages.push(foundPackage);
    });
  }
  getCurrentPackage() {
    this.rebuildPackageCache();

    const configuredName = Config.get('current_package_name');
    const configuredVersion = Config.get('current_package_version');

    if (configuredName && configuredVersion) {
      return this.getPackageByNameAndVersion(configuredName, configuredVersion);
    }

    return null;
  }
  getPackageByNameAndVersion(name, version) {
    const parsedVersion = parseInt(version, 10);

    return _.find(
      this.packages,
      packageObject => packageObject.name === name && packageObject.version === parsedVersion,
    );
  }
  deletePackageByNameAndVersion(name, version) {
    const parsedVersion = parseInt(version, 10);

    const index = _.findIndex(
      this.packages,
      packageObject => packageObject.name === name && packageObject.version === parsedVersion,
    );

    if (index) {
      const removed = this.packages.splice(index, 1);

      if (removed) {
        removed.forEach((removingPackage) => {
          fs.remove(removingPackage.getPackageFolderPath());
          fs.remove(removingPackage.getPackageArchivePath());
        });
      }
    }
  }
  getNewPackage(name, version) {
    const newPackage = new Package(name, version);

    return newPackage.download()
      .then(() => {
        this.packages.push(newPackage);
        Config.set('current_package_name', name);
        Config.set('current_package_version', version);
      });
  }
  getNewPackageFromFilepath(filepath) {
    Logger.info(`Copying a new package from local path: ${filepath}`);

    return new Promise((resolve, reject) => {
      const filename = path.parse(filepath);
      const destFile = `${Config.get('package_storage_directory')}/${filename.base}`;

      if (fs.exists(destFile)) fs.remove(destFile);

      fs.copy(filepath, destFile);
      const packageData = filename.name.split('_');
      const newPackage = new Package(packageData[0], packageData[1]);
      newPackage.extract();

      if (!this.getPackageByNameAndVersion(packageData[0], packageData[1])) {
        this.packages.push(newPackage);
      }

      if (!this.getPackageByNameAndVersion(packageData[0], packageData[1])) {
        if (fs.exists(newPackage.getPackageArchivePath())) {
          fs.remove(newPackage.getPackageArchivePath());
        }
        if (fs.exists(newPackage.getPackageFolderPath())) {
          fs.remove(newPackage.getPackageFolderPath());
        }
        const errorMessage = `Could not load ${packageData[0]}@${packageData[1]} when manually loading from ${filepath}`;
        Logger.error(errorMessage);
        reject(errorMessage);
      }
      resolve();
    });
  }
  setNewPackage(name, version) {
    if (this.getPackageByNameAndVersion(name, version)) {
      Logger.info(`Setting package ${name} at version ${version}`);

      Config.set('current_package_name', name);
      Config.set('current_package_version', version);

      return true;
    }
    Logger.error(`Failed setting package ${name} at version ${version}`);
    return false;
  }
}

module.exports.PackageManager = PackageManager;
