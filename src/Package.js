import fs from 'fs-jetpack';
import tar from 'tar';

import Config from './support/Config';
import Logger from './support/Logger';
import Network from './support/Network';

class Package {
  constructor(name, version) {
    this.name = name;
    this.version = parseInt(version, 10);
  }

  static loadFromFolder(folder) {
    const manifestPath = `${folder}/manifest.json`;

    if (fs.exists(manifestPath)) {
      const manifest = JSON.parse(fs.read(manifestPath));
      return new Package(manifest.name, parseInt(manifest.version, 10));
    }

    return false;
  }

  getPackageFolderPath() {
    return `${Config.get('package_storage_directory')}${this.getPackageFullName()}/`;
  }

  getPackageManifestPath() {
    return `${this.getPackageFolderPath()}/manifest.json`;
  }

  getPackageArchivePath() {
    return `${Config.get('package_storage_directory')}${this.getPackageFullName()}.package`;
  }

  getPackageFullName() {
    return `${this.name}_${this.version}`;
  }

  getManifest() {
    return JSON.parse(fs.read(this.getPackageManifestPath()));
  }

  getMainFilePath() {
    return `${this.getPackageFolderPath()}${this.getManifest().main}`;
  }

  extract() {
    if (!fs.exists(this.getPackageFolderPath())) {
      fs.dir(this.getPackageFolderPath(), { empty: true });
    }

    Logger.info(`Extracting package from ${this.getPackageArchivePath()} to ${this.getPackageFolderPath()}`);

    tar.x({
      file: this.getPackageArchivePath(),
      cwd: this.getPackageFolderPath(),
      sync: true,
    });
  }

  download(url) {
    Logger.info(`Downloading package from ${url} to ${this.getPackageArchivePath()}`);

    return new Promise((resolve, reject) => {
      Network.downloadFile(url, this.getPackageArchivePath())
        .then(() => {
          this.extract();
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  isTheSameAs(secondPackage) {
    return this.name === secondPackage.name && this.version === secondPackage.version;
  }
}

export default Package;
