import System from '../../model/System';
import Service from '../../model/Service';
import { ServiceConfig } from '../schemas/ServiceWebConfig';
import loadAndValidateConfig from './loadAndValidateConfig';
import { isString } from 'util';
import ConfigValidationError from '../../errors/ConfigValidationError';

export default async function loadService(sys: System, configPath: string): Promise<Service> {
   const config = await loadAndValidateConfig(configPath, 'Service') as ServiceConfig;

   if (sys.web.config.systemDefaults) {
      Object.assign(config, sys.web.config.systemDefaults.serviceDefaults);
   }
   Object.assign(config, sys.config.serviceDefaults);

   if (!isString(config.name)) {
      throw new ConfigValidationError('Service', configPath, 'Services must specify a name for themselves');
   }

   return new Service(sys, configPath, config);
}
