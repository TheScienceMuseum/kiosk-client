import { app, globalShortcut } from 'electron';
import { addBypassChecker } from 'electron-compile';
import updateIsRunning from 'electron-squirrel-startup';
import AutoLaunch from 'auto-launch';
import { Config } from './support';
import { Kiosk } from './Kiosk';

if (updateIsRunning) {
  app.quit();
}

// bypass checking if files that are being loaded are allow to be loaded (pre-compile)
addBypassChecker(() => true);

const forceApplicationLaunchOnBoot = () => {
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

const onApplicationStart = () => {
  const kiosk = new Kiosk();
  kiosk.start();

  globalShortcut.register('CommandOrControl+D', () => {
    kiosk.displayDebugScreen();
  });

  if (Config.get('environment') === 'production') {
    forceApplicationLaunchOnBoot();
  }
};

app.on('ready', onApplicationStart);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
