import { dirname } from 'path';
import { UnitName } from '../config/schemas/ServiceWebConfig';

export default class BaseUnit<T extends { name: UnitName }> {

   public readonly configPath: string;
   public readonly rootDir: string;
   public readonly name: string;
   public readonly config: T;

   public constructor(configPath: string, config: T) {
      this.configPath = configPath;
      this.rootDir = dirname(configPath);
      this.config = config;
      this.name = config.name;
   }

}
