import { app, globalShortcut } from 'electron';
import { addBypassChecker } from 'electron-compile';
import updateIsRunning from 'electron-squirrel-startup';
import { Kiosk } from './libs/kiosk';

if (updateIsRunning) {
  app.quit();
}

// bypass checking if files that are being loaded are allow to be loaded (pre-compile)
addBypassChecker(() => true);

const onApplicationStart = () => {
  // fs.dir(config.get('package_storage_directory'), {
  //   empty: false,
  // });

  const kiosk = new Kiosk();

  kiosk.start();

  globalShortcut.register('CommandOrControl+D', () => {
    // console.log('showing application debug menu');
  });
};

app.on('ready', onApplicationStart);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });
//
// app.on('activate', () => {
//   if (mainWindow === null) {
//     onApplicationStart();
//   }
// });
