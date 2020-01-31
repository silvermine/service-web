import BaseUnit from './BaseUnit';
import Web from './Web';
import Service from './Service';
import { SystemConfig } from '../config/schemas/ServiceWebConfig';

export default class System extends BaseUnit<SystemConfig> {

   public readonly web: Web;
   private readonly _services: Service[] = [];

   public constructor(web: Web, configPath: string, config: SystemConfig) {
      super(configPath, config);
      this.web = web;
      web.systemAdded(this);
   }

   public get services(): ReadonlyArray<Service> {
      return this._services;
   }

   public serviceAdded(svc: Service): void {
      this._services.push(svc);
      this.web.serviceAdded(svc);
   }

}
