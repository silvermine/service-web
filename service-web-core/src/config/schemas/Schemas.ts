export const BASE_URL = 'https://github.com/silvermine/service-web/schemas/';

/* eslint-disable global-require */
export interface Schemas {
   ServiceWeb: any;
   System: any;
   Service: any;
   NamedDeploymentTargets: any;
   DeploymentTarget: any;
   ServiceType: any;
   UnitName: any;
}

export const SCHEMAS: Schemas = {
   ServiceWeb: require('./service-web.json'),
   System: require('./system.json'),
   Service: require('./service.json'),
   NamedDeploymentTargets: require('./named-deployment-targets.json'),
   DeploymentTarget: require('./deployment-target.json'),
   ServiceType: require('./service-type.json'),
   UnitName: require('./unit-name.json'),
};
