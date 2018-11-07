import fs from 'fs-jetpack';
import tar from 'tar';
import { Config, Network } from '.';

class Package {
  constructor(name, version) {
    this.name = name;
    this.version = version;
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
    return `${Config.get('package_storage_directory')}/${this.getPackageFullName()}/`;
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
  getPackageUrl() {
    return `${Config.get('package_server_api')}/kiosk/download/${this.getPackageFullName()}`;
  }
  getManifest() {
    return JSON.parse(fs.read(this.getPackageManifestPath()));
  }
  getMainFilePath() {
    return `${this.getPackageFolderPath()}/${this.getManifest().main}`;
  }
  extract() {
    if (!fs.exists(this.getPackageFolderPath())) {
      fs.dir(this.getPackageFolderPath(), { empty: true });
    }

    tar.x({
      file: this.getPackageArchivePath(),
      cwd: this.getPackageFolderPath(),
    });
  }
  download() {
    return Network.downloadFile(this.getPackageUrl(), this.getPackageArchivePath())
      .then(() => {
        this.extract();
      });
  }
}

module.exports.Package = Package;
