import Web from '../model/Web';
import Service from '../model/Service';

export interface ServiceListOptions {
   addDependencies: boolean;
   reverse: boolean;
   skipSort: boolean;
}

export default function makeServiceList(web: Web, userServices: ReadonlyArray<Service>, opts: Partial<ServiceListOptions>): Service[] {
   const allServices = web.dependencyOrder(opts.reverse),
         services = [ ...userServices ];

   if (opts.addDependencies) {
      userServices.forEach((s) => {
         s.dependsOn().forEach((dep) => {
            if (!services.includes(dep)) {
               services.push(dep);
            }
         });
      });
   }

   if (!opts.skipSort) {
      services.sort((a, b) => {
         return allServices.indexOf(a) - allServices.indexOf(b);
      });
   }

   return services;
}
