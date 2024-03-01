import { isEmpty } from '@silvermine/toolbox';
import Web from '../../../service-web-core/src/model/Web';
import Service from '../../../service-web-core/src/model/Service';
import makeDeploymentChain from '../../../service-web-core/src/lib/makeDeploymentChain';
import { ServiceListOptions } from '../../../service-web-core/src/lib/makeServiceList';
import { StandardOptions } from '../cli';
import { DeploymentTargetConfig } from '../../../service-web-core/src/config/schemas/auto-generated-types';
import InputError from '../InputError';
import { DeploymentGraph } from '../../../service-web-core/src/lib/DeploymentGraph';

interface Progress {
   totalServices: number;
   currentService: number;
   totalTargets: number;
   currentTarget: number;
   queuedProcesses?: number;
   unqueuedProcesses?: number;
}

export interface Runner {
   (svc: Service, target: DeploymentTargetConfig, progress: Progress): Promise<void>;
}

export interface RunForEachDeploymentTargetOptions extends ServiceListOptions, StandardOptions {
   startAtService?: string;
   parallel?: number;
}

function filterTargets(opts: StandardOptions, tc: DeploymentTargetConfig): boolean {
   // console.info(opts.region, tc.region, opts.environment, tc.environment);
   return (!opts.region || (opts.region === tc.region))
      && (!opts.environment || (opts.environment === tc.environment));
}

export default async function runForEachDeploymentTarget(web: Web, serviceNames: string[], opts: RunForEachDeploymentTargetOptions, runner: Runner): Promise<void> { // eslint-disable-line max-len
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

   if (opts.parallel && opts.parallel > 1) {
      const deploymentGraph = new DeploymentGraph(web, services, opts.environmentGroup || '');

      if (opts.startAtService) {
         deploymentGraph.pruneDependenciesOf(opts.startAtService).forEach((svcID) => {
            console.info(`Skipping ${svcID} - will not start until ${opts.startAtService}`);
         });
      }

      const servicesToDeploy = deploymentGraph.services(),
            totalServices = servicesToDeploy.length;

      const totalTargets = servicesToDeploy.reduce((memo, svc) => {
         return memo + svc.deploymentTargetsFor(opts.environmentGroup || '').filter(filterTargets.bind(null, opts)).length;
      }, 0);

      let currentService = 0,
          currentTarget = 0;

      await deploymentGraph.walk(async (svc, targets) => {
         targets = targets.filter(filterTargets.bind(null, opts));

         currentService = currentService + 1;
         for (const target of targets) {
            currentTarget = currentTarget + 1;
            await runner(svc, target, {
               currentService,
               totalServices,
               currentTarget,
               totalTargets,
               queuedProcesses: deploymentGraph.stats().pending,
               unqueuedProcesses: deploymentGraph.stats().unstarted,
            });
         }
      }, { concurrency: opts.parallel });
   } else {
      let skipping = !!opts.startAtService,
          totalServices = 0,
          currentService = 0,
          currentTarget = 0,
          lastService: Service | undefined;

      const flatChain = makeDeploymentChain(web, opts.environmentGroup || '', services, opts)
         .reduce((memo, link) => {
            link.targets.filter(filterTargets.bind(null, opts)).forEach((t) => {
               memo.push([ link.service, t ]);
            });
            return memo;
         }, [] as [ Service, DeploymentTargetConfig ][])
         .filter(([ svc ]) => {
            if (skipping) {
               if (svc.ID === opts.startAtService || svc.name === opts.startAtService) {
                  skipping = false;
                  totalServices = totalServices + 1;
                  lastService = svc;
                  return true;
               }
               if (lastService !== svc) {
                  console.info(`Skipping ${svc.ID} - will not start until ${opts.startAtService}`);
               }
               lastService = svc;
               return false;
            }
            if (lastService !== svc) {
               totalServices = totalServices + 1;
            }
            lastService = svc;
            return true;
         });

      lastService = undefined;

      for (let link of flatChain) {
         if (lastService !== link[0]) {
            currentService = currentService + 1;
         }
         currentTarget = currentTarget + 1;
         lastService = link[0];
         await runner(link[0], link[1], {
            currentService,
            totalServices,
            currentTarget,
            totalTargets: flatChain.length,
         });
      }
   }
}
