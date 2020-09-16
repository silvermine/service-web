import System from '../../model/System';
import Service from '../../model/Service';
import { ServiceConfig } from '../schemas/ServiceWebConfig';
import loadAndValidateConfig from './loadAndValidateConfig';
import { isString } from '@silvermine/toolbox';
import ConfigValidationError from '../../errors/ConfigValidationError';

export default async function loadService(sys: System, configPath: string): Promise<Service> {
   const config = Object.assign(
      {},
      sys.web.config.systemDefaults?.serviceDefaults || {},
      sys.config.serviceDefaults || {},
      await loadAndValidateConfig(configPath, 'Service') as ServiceConfig
   );

   if (!isString(config.name)) {
      throw new ConfigValidationError('Service', configPath, 'Services must specify a name for themselves');
   }
   if (!isString(config.type)) {
      throw new ConfigValidationError('Service', configPath, 'Services must specify a type, or have a default type defined on the web.');
   }

   const supportedTypes = sys.web.config.serviceTypes?.map((st) => { return st.name; }) || [];

   if (!supportedTypes.includes(config.type)) {
      throw new ConfigValidationError('Service', configPath, `Type "${config.type}" is not in the known types [${supportedTypes.join(', ')}]`); // eslint-disable-line max-len
   }

   return new Service(sys, configPath, config);
}
