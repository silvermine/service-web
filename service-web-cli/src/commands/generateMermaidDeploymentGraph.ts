import { writeFile as writeFileCB } from 'fs';
import { promisify } from 'util';
import Web from '../../../service-web-core/src/model/Web';
import MermaidServiceDeploymentGraph from '../../../service-web-core/src/addons/MermaidServiceDeploymentGraph';
import Service from '../../../service-web-core/src/model/Service';

const writeFile = promisify(writeFileCB);

interface GenerateDeploymentGraphOpts {
   destPath?: string;
}

export default async function generateMermaidDeploymentGraph(web: Web, envGroup: string, services: readonly Service[], opts: GenerateDeploymentGraphOpts = {}): Promise<void> { // eslint-disable-line max-len
   const graph = new MermaidServiceDeploymentGraph(web, envGroup, services),
         text = await graph.generate();

   if (opts.destPath) {
      await writeFile(opts.destPath, text);
   } else {
      console.info(text.trimRight());
   }
}
