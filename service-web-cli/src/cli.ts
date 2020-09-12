import { isEmpty } from '@silvermine/toolbox';
import { loadServiceWeb } from '../../service-web-core/src';
import { createCommand, CommanderError } from 'commander';
import { relative } from 'path';
import ConfigSchemaValidationError from '../../service-web-core/src/errors/ConfigSchemaValidationError';
import InputError from './InputError';
import findFileUp from './lib/findFileUp';
import runServiceCommand from './commands/runServiceCommand';
import { CommandRunnerOptions } from '../../service-web-core/src/run/MultiServiceCommandRunner';
import listServices from './commands/listServices';
import generateMermaidChart from './commands/generateMermaidChart';

const program = createCommand(),
      pkgDescriptor: { version: string } = require('../../package.json');

program
   .name('web')
   .version(pkgDescriptor.version, '--version', 'output the service-web version in use');

function catchHandler(err: any): never {
   if (err instanceof CommanderError) {
      program.outputHelp();
   } else if (err instanceof InputError) {
      console.error(`ERROR: ${err.message}`);
      program.outputHelp();
   } else {
      console.error(`ERROR: ${err}:\n${err.stack}`);
      if (err instanceof ConfigSchemaValidationError) {
         console.error(JSON.stringify(err.details, null, 3));
      }
   }

   process.exit(1);
}

(async () => {
   const defaultWebConfig = await findFileUp('service-web.yml'),
         relativeWebConfigPath = defaultWebConfig ? relative(process.cwd(), defaultWebConfig) : undefined;

   program.requiredOption('-w, --web <path>', 'Path to service web config file', relativeWebConfigPath);
   program.option('-g, --env-group <environmentGroup>', 'Environment group', 'dev');
   program.option('-e, --env <environment>', 'Environment (also known as "stage")', 'dev');
   program.option('-v, --verbose', 'Print debug-level log messages');
   program.option('-r, --reverse', 'When running commands that rely on dependency order, reverse the order');

   const origDebug = console.debug;

   console.debug = () => {}; // eslint-disable-line no-empty-function

   program.on('option:verbose', () => {
      console.debug = origDebug;
   });

   // Some of our commands are registered based on the definition found in the service web
   // configuration, so we need to know where to find that file before we can build our
   // full program. You can not run `parse` or `parseAsync` here or else it will introduce
   // problems with options on subcommands registered later. However, it seems like we can
   // run `parseOptions` safely so that we have access to `program.web` for now, before
   // running the full parse/run cycle below.
   program.parseOptions(process.argv);

   if (isEmpty(program.web)) {
      console.error('You must be in a service web directory, or supply the --web option.');
      program.outputHelp();
      process.exit(1);
   }

   const web = await loadServiceWeb(program.web).catch(catchHandler);

   if (!web) {
      return program.outputHelp();
   }

   program
      .command('list')
      .description('List services in the web, in dependency order')
      .option('-d, --dependencies', 'list dependencies for each service')
      .action((cmd) => {
         const opts = cmd.opts();

         listServices(web, Boolean(program.reverse), Boolean(opts.dependencies));
      });

   program
      .command('graph')
      .description('Generates a dependency graph. From a service directory, or with the --service flag, graphs the dependencies for a single service. From anywhere else, graphs all services.') // eslint-disable-line max-len
      .option('--service <svc>', 'If you want to generate a graph for a single service, provide that service name here')
      .option('--output <filePath>', 'If you prefer the output is written to a file instead of stdout, supply a file path')
      .option('--format <format>', 'Mermaid directional format (TB, BT, LR, RL)', 'BT')
      .description('Generate a dependency graph for one or all services')
      .action(async (opts) => {
         return generateMermaidChart(web, opts.format, opts.service, opts.output);
      });

   const commands = web.config.serviceTypes?.reduce((memo, st) => {
      Object.keys(st.commands).forEach((cmd) => {
         if (!memo.includes(cmd) && !/^(before|after):/.test(cmd)) {
            memo.push(cmd);
         }
      });
      return memo;
   }, [] as string[]) || [];

   commands.forEach((cmdName) => {
      const desc = `Run the "${cmdName}" commands for the current service.\n` +
         'Or, specify a list of sys:svc names after -- to deploy a list of services, e.g.\n' +
         'web deploy -- core:access-control core:database edge:load-balancer';

      program
         .command(cmdName)
         .description(desc)
         .option('--all', 'Run this command for all services in the web')
         .option('--with-deps', 'Add services that are dependencies of those you\'re running the command on')
         .option('--exact-order', 'Do not do any sorting. Deploy services in the order specified. Only used when service names are specified as arguments.') // eslint-disable-line max-len
         .action(async (cmd) => {
            const opts = Object.assign({}, program.opts(), cmd.opts());

            const commandOpts: CommandRunnerOptions = {
               addDependencies: Boolean(opts.withDeps),
               reverse: Boolean(opts.reverse),
               skipSort: Boolean(opts.exactOrder),
            };

            if (commandOpts.skipSort && (opts.all || isEmpty(cmd.args) || commandOpts.addDependencies)) {
               throw new InputError(
                  '--exact-order only allowed when specifying service names, and not allowed with --with-deps or --all'
               );
            }

            return runServiceCommand(web, cmdName, opts.all ? [ '*' ] : cmd.args, commandOpts);
         });
   });

   program.action(() => { program.outputHelp(); });
   program.exitOverride();

   try {
      await program.parseAsync();
   } catch(err) {
      catchHandler(err);
   }
})();
