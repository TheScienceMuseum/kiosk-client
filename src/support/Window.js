import _ from 'lodash';
import {BrowserWindow, ipcMain} from 'electron';

import Config from './Config';
import Logger from './Logger';

class Window {
    constructor(name, fullscreen) {
        this.name = name;
        this.fullscreen = typeof fullscreen === 'boolean' ? fullscreen : true;
        this.create();
    }

    create() {
        this.browserWindow = this.createWindow();
    }

    update(view, base64 = false) {
        if (base64) {
            Logger.debug(`Window ${this.name} is loading a view from a base64 string`);
            this.browserWindow.loadURL(`data:text/html,${view}`);
        } else {
            Logger.debug(`Window ${this.name} is loading from file ${view}`);
            this.browserWindow.loadFile(view);
        }
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
            webPreferences: {
                webSecurity: false
            }
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

        ipcMain.on('config', (event, type, payload) => {
            if (type === 'set') {
                _.each(payload, (value, param) => {
                    Config.set(param, value);
                });
            }

            if (type === 'get') {
                event.sender.send('config', 'update', Config.store);
            }
        });

        return mainWindow;
    }
}

export default Window;
