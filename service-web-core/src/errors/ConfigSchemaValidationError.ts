import * as AJV from 'ajv';
import { Schemas } from '../config/schemas/Schemas';

export default class ConfigSchemaValidationError extends Error {

   public readonly details?: AJV.ErrorObject[] | null;

   public constructor(schemaName: keyof Schemas, configPath: string, errors?: AJV.ErrorObject[] | null) {
      super(`Config file at ${configPath} does not match schema ${schemaName}`);
      this.details = errors;

      // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
      Object.setPrototypeOf(this, ConfigSchemaValidationError.prototype);
   }
}
