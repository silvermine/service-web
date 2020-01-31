import * as AJV from 'ajv';
import { Schemas } from '../config/schemas/Schemas';

export default class ConfigValidationError extends Error {

   public readonly details?: AJV.ErrorObject[] | null;

   public constructor(schemaName: keyof Schemas, configPath: string, msg: string) {
      super(`Config file at ${configPath} failed validation for ${schemaName}: ${msg}`);

      // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
      Object.setPrototypeOf(this, ConfigValidationError.prototype);
   }
}
