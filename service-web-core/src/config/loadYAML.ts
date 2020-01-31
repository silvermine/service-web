import fs from 'fs';
import yaml from 'js-yaml';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export default async function loadYAML(filePath: string): Promise<any> {
   const buffer = await readFile(filePath);

   return yaml.safeLoad(buffer.toString());
}
