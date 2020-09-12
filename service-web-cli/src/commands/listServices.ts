import Web from '../../../service-web-core/src/model/Web';

export default function listServices(web: Web, reverse = false, listDeps = false): void {
   web.dependencyOrder(reverse).forEach((svc) => {
      console.info(svc.ID);
      if (listDeps) {
         svc.dependsOn(reverse).forEach((dep) => {
            console.info(`\t${dep.ID}`);
         });
      }
   });
}
