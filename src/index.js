import { app, BrowserWindow } from 'electron';
import updateIsRunning from 'electron-squirrel-startup';

if (updateIsRunning) {
  app.quit();
}

let mainWindow;
const applicationDevMode = process.env.APPLICATION_ENV && process.env.APPLICATION_ENV === 'dev';

const onApplicationStart = () => {
  const windowOptions = {
    resizable: false,
    movable: false,
    minimizable: false,
    closable: false,
    alwaysOnTop: true,
    fullscreen: true,
  };

  if (applicationDevMode) {
    windowOptions.width = 1920 / 2;
    windowOptions.height = 1200 / 2;
    windowOptions.resizable = true;
    windowOptions.movable = true;
    windowOptions.minimizable = true;
    windowOptions.closable = true;
    windowOptions.alwaysOnTop = false;
    windowOptions.fullscreen = false;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // mainWindow.loadURL(
  //   (applicationDevMode) ?
  //     'http://localhost:3000' :
  //     `file://${__dirname}/index.html`,
  // );

  mainWindow.loadURL('http://localhost:3000');

  if (applicationDevMode) {
    mainWindow.webContents.openDevTools({
      detach: true,
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', onApplicationStart);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    onApplicationStart();
  }
});

