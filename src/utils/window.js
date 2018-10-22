import { BrowserWindow } from 'electron';
import { Config } from './config';
import Logger from './logger';

class Window {
  constructor(fullscreen) {
    this.config = Config;
    this.log = Logger;
    this.fullscreen = typeof fullscreen === 'boolean' ? fullscreen : true;
    this.mainWindow = this.createWindow();
    this.current_entrypoint = '';
  }
  changeCurrentDisplayPackage(entrypoint) {
    if (this.current_entrypoint !== entrypoint) {
      this.log.debug(`rendering ${entrypoint}`);
      this.current_entrypoint = entrypoint;
      this.mainWindow.loadFile(entrypoint);
    } else {
      this.log.debug(`not rendering ${entrypoint} as we are already showing it`);
    }
  }
  destroyWindow() {
    this.mainWindow.close();
  }
  createWindow() {
    const isDevelopmentEnvironment = this.config.get('environment') === 'development';
    const windowOptions = {
      resizable: false,
      movable: false,
      minimizable: false,
      closable: false,
      alwaysOnTop: true,
      fullscreen: true,
    };

    if (isDevelopmentEnvironment) {
      windowOptions.width = 1920 / 2;
      windowOptions.height = 1200 / 2;
      windowOptions.movable = true;
      windowOptions.minimizable = true;
      windowOptions.closable = true;
      windowOptions.fullscreen = false;
    }

    if (!this.fullscreen) {
      windowOptions.width = 1920 / 2;
      windowOptions.height = 1200 / 2;
      windowOptions.movable = true;
      windowOptions.minimizable = true;
      windowOptions.closable = true;
      windowOptions.fullscreen = false;
    }

    const mainWindow = new BrowserWindow(windowOptions);

    if (isDevelopmentEnvironment) {
      mainWindow.webContents.openDevTools({
        detach: true,
      });
    }

    return mainWindow;
  }
}

module.exports.Window = Window;
