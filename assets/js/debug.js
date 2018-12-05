require('../scss/debug.scss');

(function () {
  const electron = require('electron');
  const $ = require('jquery');
  const _ = require('lodash');
  require('popper.js');
  require('bootstrap');

  const ipc = electron.ipcRenderer;

  const templates = {
    package_list_row_template: _.template($('#package_list_row_template').html()),
    log_tail_row_template: _.template($('#log_tail_row_template').html()),
  };

  ipc.on('log-entry', (event, entry) => {
    if (typeof entry === 'string') {
      entry = JSON.parse(entry);
    }

    const logs_table = $('#logs-table');

    logs_table.append(templates.log_tail_row_template(entry));
    logs_table.parent().parent().parent().scrollTop(logs_table.height());
  });

  ipc.on('application-error', (event, error) => {
    electron.remote.dialog.showErrorBox(
      'Application Error',
      error,
    )
  });

  ipc.on('packages-update', (event, packages, current_package) => {
    const packages_table = $('#packages-table');

    packages_table.children().remove();

    packages_table.append(_.map(packages, (packageData) => templates.package_list_row_template({
      entry: {
        name: packageData.name,
        version: packageData.version,
      },
      is_current: current_package &&
        current_package.name === packageData.name &&
        current_package.version === packageData.version,
    })));

    const make_package_current_buttons = $('.makePackageCurrent');
    make_package_current_buttons.off('click');
    make_package_current_buttons.on('click', (ev) => {
      const packageData = $(ev.currentTarget).closest('tr').data('package').split('@');
      ipc.send('change-package', { name: packageData[0], version: packageData[1] });
    });

    const delete_package_buttons = $('.deletePackage');
    delete_package_buttons.off('click');
    delete_package_buttons.on('click', (ev) => {
      const packageData = $(ev.currentTarget).closest('tr').data('package').split('@');
      ipc.send('delete-package', { name: packageData[0], version: packageData[1] });
    });
  });

  $('#onOpenPackageFile').click(() => {
    const packageFile = electron.remote.dialog.showOpenDialog(
      electron.remote.getCurrentWindow(),
      {
        properties: ['openFile'],
        filters: [
          { name: 'Kiosk Package Files', extensions: ['package'] },
        ],
      }
    );

    if (packageFile) {
      ipc.send('file-package', packageFile[0]);
    }
  });

  // Finally tell the main process that the debug menu is now showing
  ipc.send('debug-window-loaded', {});
})();
