require('../scss/default.scss');

(function () {
  const electron = require('electron');
  const ipc = electron.ipcRenderer;
  let Config = {};

  ipc.send('config', 'set', {screen_unattended: true});
  ipc.send('config', 'get');

  ipc.on('config', (event, type, payload) => {
    if (type === 'update') {
      Config = payload;
    }

    document.getElementById('kiosk-identifier').innerText = Config.identifier;
  });
})();
