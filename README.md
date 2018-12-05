# Kiosk Client Application

## Package Format

A package is a gziped tar file that contains a `maniest.json` file in it's root
directory. The filename is also significant and should always be in the format
`<package_name>_<package_version>.package`. For this reason, package names should
not contain and `_` characters.

### Directory Structure

An example directory structure for an imaginary package called "Medical Instruments 
through history", this is the 3rd version of the package.

```bash
medicalinstruments_3.package
├── assets
│   ├── css
│   │   └── style.css
│   └── images
│       └── test-01.jpeg
├── index.html
└── manifest.json
```

The only important file from the kiosk client's point of view is the `manifest.json`
which at a minimum should have the following content:

```json
{
  "name": "medicalinstruments", // <string> The internal name of the package no _ (used to delim version from name)
  "version": 3,                 // <integer> The internal version of the package
  "main": "index.html"          // <string> The html file that should be loaded
}
```

### Retrieving and setting configuration

You can retrieve configuration settings and set them via a single ipc event channel "config".

```javascript
const ipc = require('electron').ipcRenderer;
```

#### Get config

To get the current application configuration you would send the following message:

```javascript
ipc.send('config', 'get');

ipc.on('config', (event, type, payload) => {
  if (type === 'update') {
    // make any updates to interface configuration here
    // payload contains the entire configuration object
  }
});
```

#### Set config

You can set configuration variables by sending a set message on the config channel. No response will be sent to confirm 
changes have been made. You can set and retreive configuration variables that are not specified in the Available
configuration section.

```javascript
ipc.send('config', 'set', {screen_unattended: true});
```

#### Available configuration

```json
{
    "client_version": "0.4.0",
    "package_storage_directory": "~/Library/Application Support/Electron/packages/",
    "logs_debug": "~/Library/Application Support/Electron/debug.log",
    "environment": "development",
    "identifier": "hard-wasp-4",
    "current_package_name": "default",
    "current_package_version": "1",
    "health_check_timeout": 10000,
    "package_server_api": "http://kiosk-manager.test/api/",
    "screen_unattended": true,
    "package_overridden": 1544020414
}
```
