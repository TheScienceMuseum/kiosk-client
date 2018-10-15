import axios from 'axios';
import fs from 'fs';
import tar from 'tar';

import { Config } from '../utils/config';
import Logger from '../utils/logger';

class Package {
  constructor(name, version) {
    this.config = Config;
    this.log = Logger;
    this.name = name;
    this.version = version;

    this.packagePath = `${this.config.get('package_storage_directory')}${this.name}_${this.version}`;
    this.archivePath = `${this.packagePath}.package`;

    this.manifest =
      this.packageExists() ?
        JSON.parse(fs.readFileSync(`${this.packagePath}/manifest.json`, 'utf8')) : {
          name: null,
          version: null,
        };
  }
  packageExists() {
    this.log.debug(`checking if package ${this.packagePath}/manifest.json exists`);
    return fs.existsSync(`${this.packagePath}/manifest.json`);
  }
  getPathToEntrypoint() {
    return this.packageExists() ? `${this.packagePath}/${this.manifest.main}` : null;
  }
  downloadNewPackageVersion(newPackage) {
    const packageDirectory = `${this.config.get('package_storage_directory')}${newPackage.name}_${newPackage.current_version.version}`;
    const packagePath = `${packageDirectory}.package`;

    if (!fs.existsSync(this.config.get('package_storage_directory'))) {
      this.log.debug(`creating package storage directory at ${this.config.get('package_storage_directory')}`);
      fs.mkdirSync(this.config.get('package_storage_directory'));
    }
    if (!fs.existsSync(packagePath)) {
      this.log.debug(`starting download of new package ${newPackage.name}`);

      axios.request({
        responseType: 'arraybuffer',
        url: newPackage.current_version.package_path,
        method: 'get',
      }).then((result) => {
        fs.mkdirSync(packageDirectory);
        fs.writeFileSync(packagePath, result.data);
        this.log.debug(`successfully downloaded package to ${packagePath}`);
        tar.x({
          file: packagePath,
          cwd: packageDirectory,
          sync: true,
        });
        this.log.debug(`successfully extracted the new package to ${packageDirectory}`);
        this.config.set('current_package_name', newPackage.name);
        this.config.set('current_package_version', newPackage.current_version.version);
      }).catch((error) => {
        console.log(error);
        this.log.debug(`failed to downloaded package to ${packagePath}`);
      });
    } else {
      this.log.info(`the new server package ${newPackage.name} has already been downloaded, updating the configured package`);
      this.config.set('current_package_name', newPackage.name);
      this.config.set('current_package_version', newPackage.current_version.version);
    }
  }
}

module.exports.Package = Package;
