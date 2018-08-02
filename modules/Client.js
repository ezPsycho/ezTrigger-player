import net from 'net';
import process from 'process';
import { parseCmd, Commands } from '@ez-trigger/core';

class Client {
  constructor({ip, port}) {
    this.client = new net.Socket();
    this.ip = ip;
    this.port = port;
    this.commands = new Commands();
    this.props = {
      type: 'EXP'
    };

    this.client.on('data', data => {
      const parseResult = parseCmd(data.toString());

      return Promise.all(
        parseResult.map(async ({ command, options }) =>
          this.commands.callCmd(command, { options: options, client: this })
        )
      );
    });

    this.client.on('close', () => {
      console.log('w Server disconnected!');
    });

    this.client.on('error', err => {
      switch (err.code) {
        case 'ECONNREFUSED':
          console.log('e Unable to connect to remote server, check if the experiment server is runing and the firewall is configured correctly.'); // prettier-ignore
          process.exit(1);
          break;
        case 'ECONNRESET':
          console.log('w Server disconnected, The program may may continue running correctly.'); // prettier-ignore
          break;
        default:
          throw err;
      }
    });
  }

  setProps(object) {
    this.props = Object.assign(this.props, object);
  }

  async start() {
    try {
      this.session = await new Promise((resolve, reject) => {
        this.client.connect(
          this.port,
          this.ip,
          () => resolve()
        );
      });

      // prettier-ignore
      console.log(`i Connected to server ${this.ip}:${this.port}.`);
    } catch (err) {
      throw err;
    }
  }

  async stop() {
    this.client.end('DC');
    this.client.destroy();
  }

  send(data) {
    try {
      this.client.write(`${data}\r\n`);
    } catch (err) {
      if (err === 'write after end') {
        console.log('w Write after server disconnected.');
      } else {
        throw err;
      }
    }

    return true;
  }
}

export default Client;
