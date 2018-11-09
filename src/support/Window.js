import { BrowserWindow } from 'electron';
import { Config, Logger } from './index';

class Window {
  constructor(name, fullscreen) {
    this.name = name;
    this.fullscreen = typeof fullscreen === 'boolean' ? fullscreen : true;
    this.create();
  }
  create() {
    this.browserWindow = this.createWindow();
  }
  update(viewFile) {
    this.browserWindow.loadFile(viewFile);
  }
  show() {
    this.browserWindow.show();
  }
  refresh() {
    this.browserWindow.refresh();
  }
  destroy() {
    this.browserWindow.close();
    this.browserWindow = null;
  }
  on(event, callback) {
    this.browserWindow.on(event, callback);
  }
  createWindow() {
    const isDevelopmentEnvironment = Config.get('environment') === 'development';
    const windowOptions = {
      resizable: false,
      movable: false,
      minimizable: false,
      closable: false,
      alwaysOnTop: true,
      fullscreen: true,
    };

    if (isDevelopmentEnvironment || !this.fullscreen) {
      windowOptions.width = 1920 / 2;
      windowOptions.height = 1200 / 2;
      windowOptions.movable = true;
      windowOptions.minimizable = true;
      windowOptions.closable = true;
      windowOptions.alwaysOnTop = true;
      windowOptions.fullscreen = false;
    }

    const mainWindow = new BrowserWindow(windowOptions);

    Logger.debug(`Created a new window with settings: ${JSON.stringify(windowOptions)}`);

    if (isDevelopmentEnvironment) {
      mainWindow.webContents.openDevTools({
        detach: true,
      });
      Logger.debug(`Loaded devtools for the window ${this.name}`);
    }

    return mainWindow;
  }
}

module.exports.Window = Window;
