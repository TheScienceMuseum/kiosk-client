import './App.scss';

import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/pro-light-svg-icons';

import axios from 'axios'

const electron = window.require('electron');

const Config = electron.remote.require('electron-config');
const config = new Config({
  package_server: 'http://ec2-3-8-24-232.eu-west-2.compute.amazonaws.com',
  access_key: 'f55478b173255c3ad5871944c3f44105',
  debug_mode: false,
});

axios.get(config.get('package_server') + '/kiosk-access/health-check?access_key=' + config.get('access_key'))
  .then(response => {
    config.set('access_token', response.data.access_token);
    axios.get(config.get('package_server') + '/kiosk-access/get-package?access_key=' + config.get('access_key') + '&access_token=' + config.get('access_token'))
      .then(response => {
        config.set('package_url', decodeURIComponent(response.data.signed_url));
        axios.get(config.get('package_url'))
          .then(response => {

          });
      });
  });


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <FontAwesomeIcon icon={faExclamationTriangle} size={'5x'}/>
          <small className={'text-muted mt-3'}>
            CONF 0001
          </small>
        </header>
      </div>
    );
  }
}

export default App;
