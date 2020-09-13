import Web from '../model/Web';
import Service from '../model/Service';
import { DeploymentTargetConfig } from '../config/schemas/auto-generated-types';
import makeServiceList, { ServiceListOptions } from './makeServiceList';

interface ChainLink {
   service: Service;
   targets: ReadonlyArray<DeploymentTargetConfig>;
}

export default function makeDeploymentChain(web: Web, envGroup: string, userServices: Service[], opts: Partial<ServiceListOptions>): ChainLink[] { // eslint-disable-line max-len
   const services = makeServiceList(web, userServices, opts);

   return services.map((service) => {
      return { service, targets: service.deploymentTargetsFor(envGroup) };
   });
}
