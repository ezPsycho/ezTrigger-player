import fs from 'fs';
import path from 'path';
import util from 'util';
import process from 'process';
import { app, BrowserWindow, ipcMain, protocol } from 'electron';

import config from './config';
import Client from './modules/Client';
import Records from './modules/Records';

let mainWindow, packageInfo, packagePath, argvStartPosition;

const client = new Client({ ip: config.ip, port: config.port });
const records = new Records();

app.on('activate', () => mainWindow === null && createWindow());
app.on('window-all-closed', () => {
  client.stop();
  process.platform !== 'darwin' && app.quit();
  process.exit(0);
});

ipcMain.on('add-record', (event, arg) => records.add(arg.data));
ipcMain.on('get-record', (event, arg) => event.sender.send('get-records', records.data)); // prettier-ignore
ipcMain.on('export-record', async (event, arg) => {
  const filePath = await records.export(config.exportPath, arg.filename);
  event.sender.send('exported-record', filePath);
});

ipcMain.on('send-data', (event, arg) => client.send(arg.data));

ipcMain.on('register-command', (event, arg) => {
  client.commands.register(arg.command, options => {
    event.sender.send('call-command', {command: arg.command, options});
  });
}); // prettier-ignore
ipcMain.on('deregister-command', (event, arg) => client.commands.deregister(arg.command)); // prettier-ignore

ipcMain.on('get-argv', (event, arg) => event.sender.send('got-argv', programArgv)); // prettier-ignore

client.commands.register('WHO', ({ options, client }) => {
  console.log('i Trying to verify experiment program.');
  client.send(`TP ${client.props.type}`);
});

client.commands.register('VERIFIED', (options, client) => {
  console.log('i Verified successfuly.');
});

packageInfo = {};

for (let i = 2; i < process.argv.length; i++) {
  if (!process.argv[i].startsWith('--')) {
    packagePath = process.argv[i];
    argvStartPosition = i + 1;
    break;
  }
}

const programArgv = process.argv.slice(argvStartPosition);

if (packagePath) {
  const packageManifestPath = path.normalize(
    path.join(packagePath, 'package.json')
  );
  if (!fs.existsSync(packageManifestPath)) throw TypeError('Path not exist!');

  const packageInfoStr = fs.readFileSync(packageManifestPath, 'utf8');
  packageInfo = JSON.parse(packageInfoStr);

  if (!packageInfo.main)
    throw TypeError('Not a standard ezTrigger system package!');
}

const packageMainfile = packagePath
  ? path.normalize(path.join(packagePath, packageInfo.main))
  : './index.html';

if (packageInfo.typeName) {
  client.setProps({ type: packageInfo.typeName });
}

const initProgram = async () => {
  console.log('i Initializing ezTrigger system.');

  protocol.registerFileProtocol(
    'ez',
    (request, callback) => {
      const url = request.url.match('^ez://(.*)$')[1];
      callback({
        path: path.normalize(`${__dirname}/prog_modules/${url}`)
      });
    },
    err => {
      if (err) throw err.message;
    }
  );

  protocol.registerFileProtocol(
    'prog',
    (request, callback) => {
      const url = request.url.match('^prog://(.*)$')[1];
      callback({
        path: path.normalize(`${packagePath}/${url}`)
      });
    },
    err => {
      if (err) throw err.message;
    }
  );

  await client.start();

  const windowConfig =
    packageInfo && packageInfo.fullscreen
      ? { fullscreenable: true }
      : {
          width: packageInfo.width ? packageInfo.width : 800,
          height: packageInfo.height ? packageInfo.height : 600
        };

  mainWindow = new BrowserWindow(windowConfig);
  mainWindow.webContents.session.webRequest.onHeadersReceived((_, callback) => {
    callback({ responseHeaders: `default-src 'none'` });
  });

  //mainWindow.setMenu(null);
  mainWindow.loadFile(packageMainfile);
  mainWindow.on('closed', () => (mainWindow = null));
};

app.on('ready', initProgram);
