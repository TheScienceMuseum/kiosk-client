import fs from 'fs';
import { app, globalShortcut } from 'electron';
import { addBypassChecker } from 'electron-compile';
import updateIsRunning from 'electron-squirrel-startup';
import { Kiosk } from './libs/kiosk';
import { Window } from './utils/window';
import Logger from './utils/logger';

if (updateIsRunning) {
  app.quit();
}

// bypass checking if files that are being loaded are allow to be loaded (pre-compile)
addBypassChecker(() => true);

const onApplicationStart = () => {
  let debugOpen = false;
  const kiosk = new Kiosk();

  if (fs.existsSync(`${app.getPath('userData')}/debug.log`)) {
    fs.unlinkSync(`${app.getPath('userData')}/debug.log`);
    fs.writeFileSync(`${app.getPath('userData')}/debug.log`, '');
  }

  kiosk.start();

  globalShortcut.register('CommandOrControl+D', () => {
    if (!debugOpen) {
      Logger.debug('loading debug screen');
      const window = new Window(false);
      window.changeCurrentDisplayPackage(`${__dirname}/debug.html`);
      debugOpen = true;
      window.mainWindow.on('close', () => {
        debugOpen = false;
      });
    }
  });
};

app.on('ready', onApplicationStart);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
//
// app.on('activate', () => {
//   if (mainWindow === null) {
//     onApplicationStart();
//   }
// });
