export const BASE_URL = 'https://github.com/silvermine/service-web/schemas/';

import * as ServiceWebSchema from './service-web.json';
import * as SystemSchema from './system.json';
import * as ServiceSchema from './service.json';
import * as NamedDeploymentTargetsSchema from './named-deployment-targets.json';
import * as DeploymentTargetSchema from './deployment-target.json';
import * as ServiceTypeSchema from './service-type.json';
import * as UnitNameSchema from './unit-name.json';
import * as CommandsObjectSchema from './commands-object.json';

/* eslint-disable global-require */
export interface Schemas {
   ServiceWeb: any;
   System: any;
   Service: any;
   NamedDeploymentTargets: any;
   DeploymentTarget: any;
   ServiceType: any;
   UnitName: any;
   CommandsObject: any;
}

export const SCHEMAS: Schemas = {
   ServiceWeb: ServiceWebSchema,
   System: SystemSchema,
   Service: ServiceSchema,
   NamedDeploymentTargets: NamedDeploymentTargetsSchema,
   DeploymentTarget: DeploymentTargetSchema,
   ServiceType: ServiceTypeSchema,
   UnitName: UnitNameSchema,
   CommandsObject: CommandsObjectSchema,
};
