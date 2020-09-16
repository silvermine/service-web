import Service from '../../../service-web-core/src/model/Service';
import Web from '../../../service-web-core/src/model/Web';

interface ListOptions {
   reverse: boolean;
   listDependencies: boolean;
   environmentGroup: string;
   environment: string;
   region: string;
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
   web.dependencyOrder(opts.reverse).forEach((svc) => {
      if (!shouldList(svc, opts)) {
         return;
      }
      console.info(svc.ID);
      if (opts.listDependencies) {
         svc.dependsOn(opts.reverse).forEach((dep) => {
            console.info(`\t${dep.ID}`);
         });
      }
   });
}
