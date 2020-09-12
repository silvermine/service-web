import { writeFile as writeFileCB } from 'fs';
import { promisify } from 'util';
import Web from '../../../service-web-core/src/model/Web';
import MermaidServiceDependencyGraph from '../../../service-web-core/src/addons/MermaidServiceDependencyGraph';

const writeFile = promisify(writeFileCB);

export default async function generateMermaidChart(web: Web, format: string, svcName?: string, destPath?: string): Promise<void> {
   let svc = web.getServiceFromDirectory(process.cwd());

   if (svcName) {
      svc = web.getServiceByName(svcName);
   }

   const output = destPath || 'stdout',
         name = svc ? svc.ID : 'all services';

   console.debug(`Will generate dependency graph for ${name} to ${output}`);

   const graph = new MermaidServiceDependencyGraph(format, web, svc),
         text = graph.generate();

   if (destPath) {
      await writeFile(destPath, text);
   } else {
      console.info(text.trimRight());
   }
}
