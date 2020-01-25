import ServiceWeb from '../../service-web-core/src/index';

if (process.argv.length < 3) {
   throw new Error('Must supply a path to a service web config file');
}

const web = new ServiceWeb(process.argv[2]);

console.log(web.configPath); // eslint-disable-line no-console
