import { dirname } from 'path';

export default class ServiceWeb {

   private readonly _configPath: string;

   /**
    * Creates a service web, using the config found at `configPath`.
    *
    * @param configPath Path to a service web config file
    */
   public constructor(configPath: string) {
      this._configPath = configPath;
   }

   public get configPath(): string {
      return this._configPath;
   }

   public get rootDir(): string {
      return dirname(this._configPath);
   }

}
