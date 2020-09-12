import { isEmpty } from '@silvermine/toolbox';
import Web from '../../../service-web-core/src/model/Web';
import Service from '../../../service-web-core/src/model/Service';
import MultiServiceCommandRunner, { CommandRunnerOptions } from '../../../service-web-core/src/run/MultiServiceCommandRunner';

export default async function runServiceCommand(web: Web, cmd: string, serviceNames: string[], opts: CommandRunnerOptions): Promise<void> {
   let isValid = true,
       services: Service[] = [];

   if (serviceNames.find((n) => { return n === '*'; })) {
      // Run this command for all services
      services = web.dependencyOrder().concat();
   } else if (isEmpty(serviceNames)) {
      // Run this command for the service in which we are running the command
      const svc = web.getServiceFromDirectory(process.cwd());

      if (svc) {
         services.push(svc);
      } else {
         console.error(`${cmd} must be run in a service directory, or with the names of services to ${cmd}`);
         isValid = false;
      }
   } else {
      // Run this command for a list of services
      serviceNames.forEach((name) => {
         const svc = web.getServiceByName(name);

         if (svc) {
            services.push(svc);
         } else {
            console.error(`No service with name "${name}" found in ${web.name} (${web.configPath}})`);
            isValid = false;
         }
      });
   }

   if (isValid) {
      const runner = new MultiServiceCommandRunner(web, cmd, services, opts);

      await runner.run();
   } else {
      process.exit(1);
   }
}
