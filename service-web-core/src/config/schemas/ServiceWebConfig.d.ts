import * as BASE from './auto-generated-types';
import { RequireOptional } from '@silvermine/toolbox';

export type UnitName = BASE.UnitName; // eslint-disable-line @typescript-eslint/no-type-alias

export interface ServiceWebConfig extends BASE.ServiceWebConfig {}

export interface SystemConfig extends RequireOptional<BASE.SystemConfig, 'name' | 'services'> {}

export interface ServiceConfig extends RequireOptional<BASE.ServiceConfig, 'name' | 'type'> {
   deployment: {
      namedTargets?: string[];
      customTargets?: BASE.DeploymentTargetConfig[];
   };
}
