import loadYAML from '../loadYAML';
import SchemaValidator from '../schemas/SchemaValidator';
import { Schemas } from '../schemas/Schemas';
import ConfigSchemaValidationError from '../../errors/ConfigSchemaValidationError';

// TODO: figure out how to make this method use generics so that the type returned by the
// function is what is expected (avoid casts in callers)

export default async function loadAndValidateConfig(configPath: string, schemaName: keyof Schemas): Promise<any> {
   const config = await loadYAML(configPath),
         validation = SchemaValidator.INSTANCE.validate(schemaName, config);

   if (!validation.isValid) {
      throw new ConfigSchemaValidationError(schemaName, configPath, validation.errors);
   }

   return config;
}
