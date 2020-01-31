import System from './System';
import BaseUnit from './BaseUnit';
import { ServiceConfig } from '../config/schemas/ServiceWebConfig';

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

   public dependsOn(): ReadonlyArray<Service> {
      return this.system.web.dependenciesOf(this);
   }

}
