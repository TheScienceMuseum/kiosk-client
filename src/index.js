import { app, BrowserWindow } from 'electron';
import updateIsRunning from 'electron-squirrel-startup';

if (updateIsRunning) {
  app.quit();
}

let mainWindow;

const onApplicationStart = () => {
  mainWindow = new BrowserWindow({
    resizable: false,
    movable: false,
    minimizable: false,
    closable: false,
    alwaysOnTop: true,
    // fullscreen: true,
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.openDevTools({
    detach: true,
  });

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

