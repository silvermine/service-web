import * as AJV from 'ajv';
import { Schemas, SCHEMAS } from './Schemas';

// TODO: figure out the correct way to get this to work:
const Validator = require('ajv');

export default class SchemaValidator {

   public static INSTANCE: SchemaValidator;
   private readonly _ajv: AJV.Ajv;

   public constructor() {
      this._ajv = new Validator({
         async: false,
         jsonPointers: true,
         allErrors: true,
         format: 'full',
      });

      Object.entries(SCHEMAS).forEach(([ name, schema ]) => {
         this._ajv.addSchema(schema, name);
      });
   }

   public validate(schema: keyof Schemas, o: any): { isValid: boolean; errors?: Array<AJV.ErrorObject> | null } {
      const result = this._ajv.validate(schema, o);

      return {
         isValid: !!result,
         errors: this._ajv.errors,
      };
   }
}

SchemaValidator.INSTANCE = new SchemaValidator();
