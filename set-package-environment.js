#!/usr/bin/env node
const replace = require('replace-in-file');

try {
  const environment = process.env.APP_BUILD_ENV;

  if (! environment) {
    console.error('No environment set! (APP_BUILD_ENV)');
  }

  const changes = replace.sync({
    files: 'dist/main/main.js',
    from: 'this.config.set(\'environment\', \'development\')',
    to: `this.config.set(\'environment\', \'${environment}\')`,
  });

  console.log('Modified files:', changes.join(', '));
}
catch (error) {
  console.error('Error occurred:', error);
}
