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
      const targets: DeploymentTargetConfig[] = [];

      function addApplicableTargets(available: DeploymentTargetConfig[]): void {
         available.forEach((t) => {
            if (t.environmentGroup === envGroup) {
               targets.push(t);
            }
         });
      }

      if (this.config.deployment.namedTargets) {
         this.config.deployment.namedTargets.forEach((name) => {
            const dt = this.system.web.config.deploymentTargets.find((t) => {
               return t.name === name;
            });

            if (!dt) {
               throw new ConfigValidationError('Service', this.configPath, `${this.name} defines non-existent deployment target "${name}"`);
            }

            addApplicableTargets(dt.targets);
         });
      }

      addApplicableTargets(this.config.deployment.customTargets || []);

      return targets;
   }

   public async runNamedCommand(cmd: string, target: DeploymentTargetConfig): Promise<void> {
      console.info(`Running ${cmd} for ${this.ID} in ${target.region}:${target.environmentGroup}:${target.environment}`); // eslint-disable-line no-console, max-len
      return Promise.resolve();
   }
}
