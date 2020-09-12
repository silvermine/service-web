import System from './System';
import BaseUnit from './BaseUnit';
import { ServiceConfig } from '../config/schemas/ServiceWebConfig';
import { DeploymentTargetConfig } from '../config/schemas/auto-generated-types';
import ConfigValidationError from '../errors/ConfigValidationError';

export default class Service extends BaseUnit<ServiceConfig> {

   public readonly system: System;

   public constructor(system: System, configPath: string, config: ServiceConfig) {
      super(configPath, config);
      this.system = system;
      system.serviceAdded(this);
   }

   public get ID(): string {
      return `${this.system.name}:${this.name}`;
   }

   public dependsOn(reverse = false): ReadonlyArray<Service> {
      return this.system.web.dependenciesOf(this, reverse);
   }

   public deploymentTargetsFor(envGroup: string): ReadonlyArray<DeploymentTargetConfig> {
      if (!this.config.deployment || !this.config.deployment.target) {
         throw new ConfigValidationError('Service', this.configPath, `${this.name} did not declare a deployment target`);
      }

      const deploymentType = this.system.web.config.deploymentTargets.find((dt) => {
         return dt.name === this.config.deployment?.target;
      });

      const targets = deploymentType?.targets.filter((target) => {
         return target.environmentGroup === envGroup;
      });

      return targets || [];
   }

}
