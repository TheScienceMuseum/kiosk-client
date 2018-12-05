'use strict';

import { app, globalShortcut } from 'electron';
import AutoLaunch from 'auto-launch';
import Kiosk from '../Kiosk';

const onApplicationStart = () => {
  const kiosk = new Kiosk();
  kiosk.start();

  globalShortcut.register('CommandOrControl+D', () => {
    kiosk.displayDebugScreen();
  });

  const kioskAppLauncher = new AutoLaunch({
    name: 'Kiosk Client',
    path: app.getPath('exe'),
  });

  kioskAppLauncher.isEnabled()
    .then((isEnabled) => {
      if (isEnabled) {
        return;
      }
      kioskAppLauncher.enable();
    })
    .catch((error) => {
      // handle error
    });
};

app.on('ready', onApplicationStart);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
