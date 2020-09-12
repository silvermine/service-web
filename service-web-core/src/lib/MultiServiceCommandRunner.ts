import Web from '../model/Web';
import Service from '../model/Service';
import { relative } from 'path';
import { isEmpty } from '@silvermine/toolbox';

export interface CommandRunnerOptions {
   addDependencies: boolean;
   reverse: boolean;
   skipSort: boolean;
}

export default class MultiServiceCommandRunner {

   public readonly web: Web;
   public readonly services: Service[];
   public readonly command: string;

   public constructor(web: Web, cmd: string, services: ReadonlyArray<Service>, opts: Partial<CommandRunnerOptions>) {
      this.web = web;
      this.command = cmd;

      const allServices = web.dependencyOrder(opts.reverse),
            ourServices = [ ...services ];

      if (opts.addDependencies) {
         services.forEach((s) => {
            s.dependsOn().forEach((dep) => {
               if (!ourServices.includes(dep)) {
                  ourServices.push(dep);
               }
            });
         });
      }

      if (!opts.skipSort) {
         ourServices.sort((a, b) => {
            return allServices.indexOf(a) - allServices.indexOf(b);
         });
      }

      this.services = ourServices;
   }

   public async run(): Promise<boolean> {
      this.services.forEach((svc) => {
         const relDir = relative(process.cwd(), svc.rootDir);

         console.info(`Running "${this.command}" on ${svc.ID} (${isEmpty(relDir) ? '.' : relDir})`); // eslint-disable-line no-console
      });
      return true;
   }
}
