import Web from '../../model/Web';
import findFilesRelativeTo from '../findFilesRelativeTo';
import loadSystem from './loadSystem';
import loadAndValidateConfig from './loadAndValidateConfig';
import { ServiceWebConfig } from '../schemas/ServiceWebConfig';

export default async function loadServiceWeb(configPath: string): Promise<Web> {
   const config = await loadAndValidateConfig(configPath, 'ServiceWeb') as ServiceWebConfig,
         web = new Web(configPath, config),
         systemConfigPaths = await findFilesRelativeTo(configPath, config.systems);

   await Promise.all(systemConfigPaths.map((sysConfigPath) => {
      return loadSystem(web, sysConfigPath);
   }));

   return web;
}
