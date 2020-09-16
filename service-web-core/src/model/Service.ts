import System from './System';
import BaseUnit from './BaseUnit';
import { ServiceConfig } from '../config/schemas/ServiceWebConfig';
import { DeploymentTargetConfig, ServiceTypeConfig } from '../config/schemas/auto-generated-types';
import ConfigValidationError from '../errors/ConfigValidationError';
import runShellCommands from '../lib/runShellCommands';
import { flatten } from '@silvermine/toolbox';

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
      return this._getAllDeploymentTargets().filter((dt) => {
         return dt.environmentGroup === envGroup;
      });
   }

   public get serviceType(): ServiceTypeConfig {
      const st = this.system.web.config.serviceTypes?.find((t) => {
         return t.name === this.config.type;
      });

      if (!st) {
         throw new ConfigValidationError('Service', this.configPath, `Invalid service type ${this.config.type}`);
      }

      return st;
   }

   public getAllEnvironmentGroups(env?: string, region?: string): string[] {
      return this._getAllDeploymentTargets()
         .filter((dt) => {
            return (env ? dt.environment === env : true)
               && (region ? dt.region === region : true);
         })
         .map((dt) => { return dt.environmentGroup; });
   }

   public async runNamedCommand(cmd: string, target: DeploymentTargetConfig): Promise<void> {
      return runShellCommands(this.rootDir, this._getCommands(cmd), {
         copyEnv: true,
         env: {
            SVC_WEB_SYSTEM_NAME: this.system.name,
            SVC_WEB_SERVICE_NAME: this.name,
            SVC_WEB_ENV_GROUP: target.environmentGroup,
            SVC_WEB_ENV: target.environment,
            SVC_WEB_REGION: target.region,
         },
      });
   }

   private _getAllDeploymentTargets(): DeploymentTargetConfig[] {
      const targets = flatten(...(this.config.deployment?.namedTargets || []).map((name) => {
         const dt = this.system.web.config.deploymentTargets.find((t) => {
            return t.name === name;
         });

         if (!dt) {
            throw new ConfigValidationError('Service', this.configPath, `${this.name} defines non-existent deployment target "${name}"`);
         }

         return dt.targets;
      }));

      return targets.concat(this.config.deployment.customTargets || []);
   }

   private _getCommands(name: string): string[] {
      const commands = flatten(
         this._getCommand(`before:${name}`),
         this._getCommand(name),
         this._getCommand(`after:${name}`)
      );

      if (commands.length === 0) {
         throw new ConfigValidationError('Service', this.configPath, `No commands found for the "${name}" named command`);
      }

      return commands;
   }

   private _getCommand(name: string): string[] {
      return this.config.commands?.[name] || this.serviceType.commands[name] || [];
   }
}
