import process from 'process';
import getTimestamp from '@ez-trigger/core';

(() => {
  const { ipcRenderer, webFrame } = require('electron');
  const commandList = {};

  webFrame.registerURLSchemeAsPrivileged('prog');

  const lp = x => x.toString().padStart(2, 0);

  window.ezTrigger = {};

  window.ezTrigger.addRecord = data => {
    const time = getTimestamp();
    const recordToAdd = Object.assign({ time }, data);
    ipcRenderer.send('add-record', { data: recordToAdd });
  };

  window.ezTrigger.exportRecord = filename => {
    ipcRenderer.send('export-record', { filename });
  };

  window.ezTrigger.getRecord = () => {
    ipcRenderer.send('get-record', {});
  };

  window.ezTrigger.sendData = data => {
    ipcRenderer.send('send-data', { data });
  };

  window.ezTrigger.registerCommand = (command, fn) => {
    commandList[command] = fn;
    ipcRenderer.send('register-command', { command });
  };

  window.ezTrigger.deregisterCommand = command => {
    ipcRenderer.send('deregister-command', { command });
  };

  window.ezTrigger.getDateTime = () => {
    const date = new Date();

    return `${date.getFullYear()}${lp(date.getMonth())}${lp(date.getDate())}-${lp(date.getHours())}${lp(date.getMinutes())}` // prettier-ignore
  };

  window.eval = function() {
    throw new Error(`Sorry, this app does not support window.eval().`);
  };

  ipcRenderer.on('call-command', (_, data) => {
    if (commandList[data.command]) commandList[data.command](data.options);
  });

  ipcRenderer.on('got-record', (_, data) => {
    if (window.onGotRecord) window.onClientData(data);
  });

  ipcRenderer.on('exported-record', (_, path) => {
    if (window.onExportedRecord) window.onClientWrote(path);
  });

  window.ezTrigger.argv = new Promise(resolve => {
    ipcRenderer.on('got-argv', (_, argv) => {
      if (argv && argv.length) console.log(`i Got argvs: ${argv.join(', ')}.`);

      window.ezTrigger.argv = argv;
      resolve(argv);
    });
  });

  ipcRenderer.send('get-argv');
  console.log('i Program initialized.');
})();
