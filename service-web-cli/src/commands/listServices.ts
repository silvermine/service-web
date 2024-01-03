import { isEmpty } from '@silvermine/toolbox';
import Service from '../../../service-web-core/src/model/Service';
import Web from '../../../service-web-core/src/model/Web';

export enum ListFormat {
   Text = 'text',
   JSON = 'json',
}

interface ListOptions {
   reverse: boolean;
   listDependencies: boolean;
   environmentGroup: string;
   environment: string;
   region: string;
   format?: ListFormat;
}

function shouldList(svc: Service, opts: Partial<ListOptions>): boolean {
   if (!opts.environmentGroup) {
      return true;
   }

   let targets = svc.deploymentTargetsFor(opts.environmentGroup);

   if (opts.environment || opts.region) {
      targets = targets.filter((t) => {
         return (opts.environment ? t.environment === opts.environment : true)
            && (opts.region ? t.region === opts.region : true);
      });
   }

   return targets.length > 0;
}

export default function listServices(web: Web, opts: Partial<ListOptions>): void {
   const services = web.dependencyOrder(opts.reverse).reduce((memo, svc) => {
      if (shouldList(svc, opts)) {
         memo.push({
            id: svc.ID,
            dependencies: svc.dependsOn(opts.reverse)
               .filter((dep) => {
                  if (!opts.environmentGroup || !dep.config.isRootDependency) {
                     return true;
                  }

                  // Only return root dependencies that are deployed to the same env-group
                  return !isEmpty(dep.deploymentTargetsFor(opts.environmentGroup));
               })
               .map((dep) => {
                  return dep.ID;
               }),
         });
      }

      return memo;
   }, [] as { id: string; dependencies: string[] }[]);

   if (opts.format === ListFormat.JSON) {
      console.info(JSON.stringify(services));
   } else {
      services.forEach((svc) => {
         console.info(svc.id);
         if (opts.listDependencies) {
            svc.dependencies.forEach((depID) => {
               console.info(`\t${depID}`);
            });
         }
      });
   }
}
