/* eslint-disable no-process-env */
import { spawn } from 'child_process';
import { isNumber, isString, StringMap } from '@silvermine/toolbox';
import ShellCommandOutputProcessor from './ShellCommandOutputProcessor';

interface ShellCommandOptions {
   copyEnv?: boolean;
   env?: StringMap;
   outputPrefix?: string;
}

export interface LogLocations {
   stdout: string;
   stderr: string;
}

export class ShellCommandError extends Error {
   public readonly parent?: Error;
   public readonly exitCode: number;

   public constructor(msg: string, err?: Error, exitCode?: number) {
      super(msg);
      if (err) {
         this.parent = err;
         this.stack = err.stack;
         this.name = err.name;
      }
      this.exitCode = isNumber(exitCode) ? exitCode : 1;
      Object.setPrototypeOf(this, ShellCommandError.prototype);
   }
}

export default async function runShellCommands(wd: string, cmds: string[], opts: ShellCommandOptions): Promise<void> {
   const env = Object.assign({}, Object.keys(process.env).reduce((memo, key) => {
      const val = process.env[key];

      if (isString(val)) {
         memo[key] = val;
      }
      return memo;
   }, {} as StringMap), opts.env || {});

   // TODO: interoperability (Windows compatibility):
   const concatenatedCommand = cmds.map((c) => { return c.trim(); }).join(' \\\n&& '),
         envDebug = Object.keys(opts.env || {}).map((k) => { return `${k}="${opts.env?.[k]}"`; }).join('; ');

   console.debug(`Running commands for ${envDebug}\n${concatenatedCommand}`); // eslint-disable-line no-console

   const child = spawn(
      concatenatedCommand,
      {
         cwd: wd,
         stdio: opts.outputPrefix ? 'pipe' : 'inherit',
         // TODO: consider security implications:
         shell: true,
         env: env,
      }
   );

   if (opts.outputPrefix && child.stdout && child.stderr) {
      child.stdout.pipe(new ShellCommandOutputProcessor(opts.outputPrefix)).pipe(process.stdout);
      child.stderr.pipe(new ShellCommandOutputProcessor(opts.outputPrefix)).pipe(process.stderr);
   }

   return new Promise((resolve, reject) => {
      child.on('error', (err) => {
         throw new ShellCommandError(err.message, err);
      });
      child.on('exit', (code) => {
         if (code === 0) {
            return resolve();
         }
         reject(new ShellCommandError(`Process exited with code ${code}\n${concatenatedCommand}`));
      });
   });
}
