import { isEmpty } from '@silvermine/toolbox';
import Web from '../../../service-web-core/src/model/Web';
import Service from '../../../service-web-core/src/model/Service';
import makeDeploymentChain from '../../../service-web-core/src/lib/makeDeploymentChain';
import { ServiceListOptions } from '../../../service-web-core/src/lib/makeServiceList';
import { StandardOptions } from '../cli';
import { DeploymentTargetConfig } from '../../../service-web-core/src/config/schemas/auto-generated-types';
import InputError from '../InputError';

export interface Runner {
   (svc: Service, target: DeploymentTargetConfig): Promise<void>;
}

type RunCommandOptions = ServiceListOptions & StandardOptions;

function filterTargets(opts: StandardOptions, tc: DeploymentTargetConfig): boolean {
   // console.info(opts.region, tc.region, opts.environment, tc.environment);
   return (!opts.region || (opts.region === tc.region))
      && (!opts.environment || (opts.environment === tc.environment));
}

export default async function runForEachDeploymentTarget(web: Web, serviceNames: string[], opts: RunCommandOptions, runner: Runner): Promise<void> { // eslint-disable-line max-len
   let services: Service[] = [];

   if (serviceNames.find((n) => { return n === '*'; })) {
      // Run this command for all services
      services = web.dependencyOrder().concat();
   } else if (isEmpty(serviceNames)) {
      // Run this command for the service in which we are running the command
      const svc = web.getServiceFromDirectory(process.cwd());

      if (svc) {
         services.push(svc);
      } else {
         throw new InputError('Must run from a service directory, or use options or arguments to specify services.');
      }
   } else {
      // Run this command for a list of services
      serviceNames.forEach((name) => {
         const svc = web.getServiceByName(name);

         if (svc) {
            services.push(svc);
         } else {
            throw new InputError(`No service with name "${name}" found in ${web.name} (${web.configPath})`);
         }
      });
   }

   const flatChain = makeDeploymentChain(web, opts.environmentGroup || '', services, opts)
      .reduce((memo, link) => {
         link.targets.filter(filterTargets.bind(null, opts)).forEach((t) => {
            memo.push([ link.service, t ]);
         });
         return memo;
      }, [] as [ Service, DeploymentTargetConfig ][]);

   for (let link of flatChain) {
      await runner(link[0], link[1]);
   }
}
