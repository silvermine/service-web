import { loadServiceWeb } from '../../src/index';
import { expect } from 'chai';
import Web from '../../src/model/Web';
import MermaidServiceDeploymentGraph from '../../src/addons/MermaidServiceDeploymentGraph';
import path from 'path';
import { readFile } from 'fs/promises';
import { isNotNullOrUndefined } from '@silvermine/toolbox';

describe('MermaidServiceDeploymentGraph', () => {

   let web: Web;

   beforeEach(async () => {
      web = await loadServiceWeb(path.join(__dirname, '..', '..', '..', 'tests', 'samples', 'web-1', 'service-web.yml'));
   });

   it('generates a graph for a full deploy', async () => {
      const graphGenerator = new MermaidServiceDeploymentGraph(web, 'dev', web.services),
            graph = await graphGenerator.generate();

      expect(graph).to.eql(await readFile(
         path.join(__dirname, '..', '..', '..', 'tests', 'samples', 'web-1', 'deployment-graph.mmd'),
         'utf-8'
      ));
   });

   it('generates a graph for a partial deploy', async () => {
      const servicesToDeploy = [
         'cms:downloads-api', // has cross-system dep of core:content-storage
         'core:config-storage', // no explicit deps
         'core:content-storage', // no explicit deps
         'core:root-resources', // a root dep
         'core:versioned-config', // depends on core:config-storage
         'edge:cdn', // depends on edge:load-balancer which isn't to be visited
      ];

      const svcs = servicesToDeploy.map((name) => { return web.getServiceByName(name); }).filter(isNotNullOrUndefined),
            graphGenerator = new MermaidServiceDeploymentGraph(web, 'dev', svcs),
            graph = await graphGenerator.generate();

      expect(graph).to.eql(await readFile(
         path.join(__dirname, '..', '..', '..', 'tests', 'samples', 'web-1', 'partial-deployment-graph.mmd'),
         'utf-8'
      ));
   });

});
