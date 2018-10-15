import { BrowserWindow } from 'electron';
import { Config } from './config';
import Logger from './logger';

class Window {
  constructor() {
    this.config = Config;
    this.log = Logger;
    this.mainWindow = this.createWindow();
  }
  changeCurrentDisplayPackage(entrypoint) {
    this.log.debug(`rendering ${entrypoint}`);
    this.mainWindow.loadFile(entrypoint);
  }
  createWindow() {
    const windowOptions = {
      resizable: false,
      movable: false,
      minimizable: false,
      closable: false,
      alwaysOnTop: true,
      fullscreen: true,
    };

    if (this.config.get('environment') === 'dev') {
      windowOptions.width = 1920 / 2;
      windowOptions.height = 1200 / 2;
      windowOptions.movable = true;
      windowOptions.minimizable = true;
      windowOptions.closable = true;
      windowOptions.fullscreen = false;
    }

    const mainWindow = new BrowserWindow(windowOptions);

    if (this.config.get('environment') === 'dev') {
      mainWindow.webContents.openDevTools({
        detach: true,
      });
    }

    return mainWindow;
  }
}

module.exports.Window = Window;
