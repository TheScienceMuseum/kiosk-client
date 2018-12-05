import _ from 'lodash';
import fs from 'fs-jetpack';
import tar from 'tar';
import path from 'path';
import {app} from 'electron';

import Config from './support/Config';
import Logger from './support/Logger';

import Package from './Package';

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

        console.log('deleting package:', index);

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
        Logger.info(`Loading a new package from local path: ${filepath}`);

        return new Promise((resolve, reject) => {

            // move the file to a temporary folder
            const filename = path.parse(filepath);
            const temp_folder = app.getPath('temp') + 'kiosk-client/';

            if (fs.exists(temp_folder)) {
                fs.remove(temp_folder);
            }
            fs.copy(filepath, `${temp_folder}new.package`);
            fs.dir(`${temp_folder}package`);

            // extract the contents to another temp folder
            try {
                tar.x({
                    file: `${temp_folder}new.package`,
                    cwd: `${temp_folder}package`,
                    sync: true,
                });
            } catch (e) {
                return reject('malformed package archive');
            }

            // check the manifest.json file to get the name and version
            if (!fs.exists(`${temp_folder}package/manifest.json`)) {
                return reject('malformed package');
            }

            try {
                const manifest = JSON.parse(fs.read(`${temp_folder}package/manifest.json`));
                const package_name = manifest.name;
                const package_version = manifest.version;

                // create a new folder in the format name_version
                const new_package_folder = `${Config.get('package_storage_directory')}/${package_name}_${package_version}`;
                fs.dir(new_package_folder);

                // copy the contents of the package there
                fs.move(`${temp_folder}package`, new_package_folder);
            } catch (e) {
                return reject('malformed package manifest');
            }

            // resolve promise
            this.rebuildPackageCache();
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

export default PackageManager;
