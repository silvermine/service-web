/* eslint-disable no-console */
import { loadServiceWeb } from '../../service-web-core/src/index';
import ConfigSchemaValidationError from '../../service-web-core/src/errors/ConfigSchemaValidationError';

if (process.argv.length < 3) {
   throw new Error('Must supply a path to a service web config file');
}

(async () => {
   try {
      const web = await loadServiceWeb(process.argv[2]);

      console.log('------ DEPENDENCY ORDER: ------');
      web.dependencyOrder().forEach((svc) => {
         const dependencies = svc.dependsOn();

         console.log(`Service ${svc.ID} depends on:${dependencies.length === 0 ? ' nothing' : ''}`);
         dependencies.forEach((dep) => {
            console.log(`\t${dep.ID}`);
         });
      });
   } catch(err) {
      console.log(`ERROR: ${err}:\n${err.stack}`);
      if (err instanceof ConfigSchemaValidationError) {
         console.log(JSON.stringify(err.details, null, 3));
      }
      process.exit(1); // eslint-disable-line no-process-exit
   }
})();
