import { loadServiceWeb } from '../../src/index';
import { expect } from 'chai';
import Web from '../../src/model/Web';
import { DeploymentGraph } from '../../src/lib/DeploymentGraph';
import path from 'path';
import { delay, isNotNullOrUndefined } from '@silvermine/toolbox';
import { createHash } from 'crypto';

const MAX_DEPLOY_DELAY = 10;

describe('DeploymentGraph', () => {

   let web: Web;

   beforeEach(async () => {
      web = await loadServiceWeb(path.join(__dirname, '..', '..', '..', 'tests', 'samples', 'web-1', 'service-web.yml'));
   });

   function expectAfter(visited: string[], serviceA: string, serviceB: string): void {
      const indexA = visited.indexOf(serviceA),
            indexB = visited.indexOf(serviceB);

      if (indexA === -1) {
         return;
      }

      expect(indexB).to.not.eql(-1, `Service ${serviceA} was found, but ${serviceB} was not`);
      expect(indexB).to.be.lessThan(indexA, `Service ${serviceA} not deployed after ${serviceB}`);
   }

   function delayAlgorithmA(svcID: string): Promise<void> {
      return delay(MAX_DEPLOY_DELAY % parseInt(createHash('md5').update(svcID).digest('hex').slice(0, 5), 16));
   }

   function delayAlgorithmB(svcID: string): Promise<void> {
      return delay(MAX_DEPLOY_DELAY % parseInt(createHash('md5').update(svcID).digest('hex').slice(-5), 16));
   }

   const scenarios = [
      { name: 'serial, consistent deploy time', concurrency: 1, delayFn: () => { return delay(1); } },
      { name: 'parallel, consistent deploy time', concurrency: 5, delayFn: () => { return delay(1); } },
      { name: 'serial, variable deploy time (delay algo. A)', concurrency: 1, delayFn: delayAlgorithmA },
      { name: 'serial, variable deploy time (delay algo. B)', concurrency: 1, delayFn: delayAlgorithmB },
      { name: 'parallel, variable deploy time (delay algo. A)', concurrency: 5, delayFn: delayAlgorithmA },
      { name: 'parallel, variable deploy time (delay algo. B)', concurrency: 5, delayFn: delayAlgorithmB },
   ];

   scenarios.forEach((scenario) => {

      describe(scenario.name, () => {

         it('traverses the full graph', async () => {
            const deploymentGraph = new DeploymentGraph(web, web.services, 'dev'),
                  servicesVisited: string[] = [];

            await deploymentGraph.walk(async (svc) => {
               servicesVisited.push(svc.ID);

               expectAfter(servicesVisited, 'core:envgroup-resources ', 'core:root-resources');

               expectAfter(servicesVisited, 'core:content-storage', 'core:root-resources');
               expectAfter(servicesVisited, 'core:content-storage', 'core:envgroup-resources');

               expectAfter(servicesVisited, 'core:content-storage-backup', 'core:root-resources');
               expectAfter(servicesVisited, 'core:content-storage-backup', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'core:content-storage-backup', 'core:content-storage');

               expectAfter(servicesVisited, 'core:primary-domain-routing', 'core:root-resources');
               expectAfter(servicesVisited, 'core:primary-domain-routing', 'core:envgroup-resources');

               expectAfter(servicesVisited, 'core:config-storage', 'core:root-resources');
               expectAfter(servicesVisited, 'core:config-storage', 'core:envgroup-resources');

               expectAfter(servicesVisited, 'core:versioned-config', 'core:root-resources');
               expectAfter(servicesVisited, 'core:versioned-config', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'core:versioned-config', 'core:config-storage');

               expectAfter(servicesVisited, 'cms:discovery-api', 'core:root-resources');
               expectAfter(servicesVisited, 'cms:discovery-api', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'cms:discovery-api', 'core:content-storage');

               expectAfter(servicesVisited, 'cms:downloads-api', 'core:root-resources');
               expectAfter(servicesVisited, 'cms:downloads-api', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'cms:downloads-api', 'core:content-storage');

               expectAfter(servicesVisited, 'cms:management-api', 'core:root-resources');
               expectAfter(servicesVisited, 'cms:management-api', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'cms:management-api', 'core:content-storage');

               expectAfter(servicesVisited, 'search:search-cluster', 'core:root-resources');
               expectAfter(servicesVisited, 'search:search-cluster', 'core:envgroup-resources');

               expectAfter(servicesVisited, 'search:search-api', 'core:root-resources');
               expectAfter(servicesVisited, 'search:search-api', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'search:search-api', 'search:search-cluster');

               expectAfter(servicesVisited, 'edge:alb-vpc', 'core:root-resources');
               expectAfter(servicesVisited, 'edge:alb-vpc', 'core:envgroup-resources');

               expectAfter(servicesVisited, 'edge:load-balancer', 'core:root-resources');
               expectAfter(servicesVisited, 'edge:load-balancer', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'edge:load-balancer', 'core:content-storage');
               expectAfter(servicesVisited, 'edge:load-balancer', 'cms:discovery-api');
               expectAfter(servicesVisited, 'edge:load-balancer', 'cms:downloads-api');
               expectAfter(servicesVisited, 'edge:load-balancer', 'cms:management-api');
               expectAfter(servicesVisited, 'edge:load-balancer', 'search:search-cluster');
               expectAfter(servicesVisited, 'edge:load-balancer', 'search:search-api');
               expectAfter(servicesVisited, 'edge:load-balancer', 'edge:alb-vpc');

               expectAfter(servicesVisited, 'edge:cdn', 'core:root-resources');
               expectAfter(servicesVisited, 'edge:cdn', 'core:envgroup-resources');
               expectAfter(servicesVisited, 'edge:cdn', 'core:content-storage');
               expectAfter(servicesVisited, 'edge:cdn', 'cms:discovery-api');
               expectAfter(servicesVisited, 'edge:cdn', 'cms:downloads-api');
               expectAfter(servicesVisited, 'edge:cdn', 'cms:management-api');
               expectAfter(servicesVisited, 'edge:cdn', 'search:search-cluster');
               expectAfter(servicesVisited, 'edge:cdn', 'search:search-api');
               expectAfter(servicesVisited, 'edge:cdn', 'edge:alb-vpc');
               expectAfter(servicesVisited, 'edge:cdn', 'edge:load-balancer');

               expectAfter(servicesVisited, 'search:search-doc-storage', 'core:root-resources');
               expectAfter(servicesVisited, 'search:search-doc-storage', 'core:envgroup-resources');

               await scenario.delayFn(svc.ID);
            }, { concurrency: scenario.concurrency });

            expect(servicesVisited.sort()).to.eql(web.services.map((svc) => { return svc.ID; }).sort());
         });

         it('traverses parts of the service graph', async () => {
            const servicesToVisit = [
               'cms:downloads-api', // has cross-system dep of core:content-storage
               'core:config-storage', // no explicit deps
               'core:content-storage', // no explicit deps
               'core:root-resources', // a root dep
               'core:versioned-config', // depends on core:config-storage
               'edge:cdn', // depends on edge:load-balancer which isn't to be visited
            ];

            const svcs = servicesToVisit.map((name) => { return web.getServiceByName(name); }).filter(isNotNullOrUndefined),
                  deploymentGraph = new DeploymentGraph(web, svcs, 'dev'),
                  servicesVisited: string[] = [];

            await deploymentGraph.walk(async (svc) => {
               servicesVisited.push(svc.ID);

               expectAfter(servicesVisited, 'cms:downloads-api', 'core:root-resources');
               expectAfter(servicesVisited, 'cms:downloads-api', 'core:content-storage');

               expectAfter(servicesVisited, 'core:config-storage', 'core:root-resources');

               expectAfter(servicesVisited, 'core:content-storage', 'core:root-resources');

               expectAfter(servicesVisited, 'core:versioned-config', 'core:root-resources');
               expectAfter(servicesVisited, 'core:versioned-config', 'core:config-storage');

               expectAfter(servicesVisited, 'edge:cdn', 'core:root-resources');

               await scenario.delayFn(svc.ID);
            }, { concurrency: scenario.concurrency });

            expect(servicesVisited.sort()).to.eql(servicesToVisit.sort());
         });

      });

   });

});
