import { isArray, isString } from 'util';
import Web from '../../model/Web';
import System from '../../model/System';
import { SystemConfig } from '../schemas/ServiceWebConfig';
import findFilesRelativeTo from '../findFilesRelativeTo';
import loadAndValidateConfig from './loadAndValidateConfig';
import loadService from './loadService';
import ConfigValidationError from '../../errors/ConfigValidationError';

export default async function loadSystem(web: Web, configPath: string): Promise<System> {
   const config = await loadAndValidateConfig(configPath, 'System') as SystemConfig;

   // TODO: better extension of defaults:
   Object.assign(config, web.config.systemDefaults); // TODO test no additional properties

   if (!isString(config.name)) {
      throw new ConfigValidationError('Service', configPath, 'Services must specify a name for themselves');
   }

   if (!isArray(config.services)) {
      throw new ConfigValidationError('System', configPath, 'A system must specify where its service definitions are found');
   }

   const sys = new System(web, configPath, config),
         serviceConfigPaths = await findFilesRelativeTo(configPath, config.services);

   await Promise.all(serviceConfigPaths.map((svcConfigPath) => {
      return loadService(sys, svcConfigPath);
   }));

   return sys;
}
