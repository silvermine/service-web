import fg from 'fast-glob';
import { dirname } from 'path';

/**
 * Finds files based on file paths or patterns that are contained in a parent file.
 * Assumes that the paths in the parent file are relative to the parent file itself.
 *
 * Returns the absolute path of all found files so that there is no ambiguity about where
 * the files live.
 *
 * @param parentFile the file that contains the references or patterns
 * @param patterns the file references (paths) or patterns to find files
 */
export default async function findFilesRelativeTo(parentFile: string, patterns: string[]): Promise<any[]> {
   return await fg(patterns, {
      cwd: dirname(parentFile),
      absolute: true,
      onlyFiles: true,
   });
}
