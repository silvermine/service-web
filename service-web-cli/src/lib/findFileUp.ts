const find = require('find-file-up');

export default function findFileUp(filename: string, cwd?: string, limit?: number): Promise<string | undefined> {
   return find(filename, cwd, limit);
}
