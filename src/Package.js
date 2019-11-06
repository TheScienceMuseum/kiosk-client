import fs from 'fs-jetpack';
import tar from 'tar';

import Config from './support/Config';
import Logger from './support/Logger';
import Network from './support/Network';

class Package {
  constructor(slug, version, kiosk) {
    this.slug = slug;
    this.version = parseInt(version, 10);
    this.kiosk = kiosk;
  }

  static loadFromFolder(folder) {
    const manifestPath = `${folder}/manifest.json`;

    if (fs.exists(manifestPath)) {
      const manifest = JSON.parse(fs.read(manifestPath));
      return new Package(manifest.name, parseInt(manifest.version, 10),this.window);
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
    return `${this.slug}_${this.version}`;
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

  extractPackage() {
    this.extract();
    this.kiosk.updateDisplayedPackage();
  }

  download(url) {
    Logger.info(`Downloading package from ${url} to ${this.getPackageArchivePath()}`);

    Network.downloadFile(url, this.getPackageArchivePath(), this);
  }

  isTheSameAs(secondPackage) {
    return this.slug === secondPackage.slug && this.version === secondPackage.version;
  }
}

export default Package;
