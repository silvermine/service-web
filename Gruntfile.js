'use strict';

module.exports = (grunt) => {
   let config;

   config = {
      entryFile: './src/index.ts',
      js: {
         gruntFile: 'Gruntfile.js',
         all: [
            './*.js',
            './*/*.js',
            './*/src/**/*.js',
            './*/tests/**/*.js',
         ],
      },
      ts: {
         src: './*/src/**/*.ts',
         all: [
            './*.ts',
            './*/*.ts',
            './*/src/**/*.ts',
            './*/tests/**/*.ts',
         ],
         configs: {
            standards: 'tsconfig.json',
            commonjs: 'tsconfig.commonjs.json',
            esm: 'tsconfig.esm.json',
            types: 'tsconfig.types.json',
         },
      },
      schemas: {
         config: './service-web-core/src/config/schemas',
      },
      commands: {
         tsc: './node_modules/.bin/tsc',
      },
      out: {
         dist: './dist',
         test: [ './.nyc_output', 'coverage' ],
      },
   };

   grunt.initConfig({

      pkg: grunt.file.readJSON('package.json'),

      exec: {
         options: {
            failOnError: true,
         },
         standards: {
            cmd: `${config.commands.tsc} -p ${config.ts.configs.standards} --pretty`,
         },
         types: {
            cmd: `${config.commands.tsc} -p ${config.ts.configs.types} --pretty`,
         },
         esm: {
            cmd: `${config.commands.tsc} -p ${config.ts.configs.esm} --pretty`,
         },
         commonjs: {
            cmd: `${config.commands.tsc} -p ${config.ts.configs.commonjs} --pretty`,
         },
      },

      clean: {
         dist: config.out.dist,
         testOutput: config.out.test,
      },

      concurrent: {
         'build-ts-outputs': [ 'build-types', 'build-esm', 'build-commonjs' ],
      },

      'build-types-from-json-schemas': {
         config: {
            cwd: config.schemas.config,
            files: {
               [`${config.schemas.config}/auto-generated-types.d.ts`]: `${config.schemas.config}/service-web.json`,
            },
         },
      },

      watch: {
         ts: {
            files: [ config.ts.src ],
            tasks: [ 'build-ts-outputs' ],
         },
         gruntFile: {
            files: [ config.js.gruntFile ],
            options: {
               reload: true,
            },
         },
      },
   });

   grunt.loadNpmTasks('grunt-exec');
   grunt.loadNpmTasks('grunt-contrib-clean');
   grunt.loadNpmTasks('grunt-concurrent');
   grunt.loadNpmTasks('grunt-contrib-watch');

   // our custom tasks
   grunt.loadTasks('grunt-tasks');

   grunt.registerTask('build-types', [ 'exec:types' ]);
   grunt.registerTask('build-esm', [ 'exec:esm' ]);
   grunt.registerTask('build-commonjs', [ 'exec:commonjs' ]);
   grunt.registerTask('build-ts-outputs', [ 'concurrent:build-ts-outputs' ]);
   grunt.registerTask('build', [ 'concurrent:build-ts-outputs' ]);

   grunt.registerTask('develop', [ 'clean:dist', 'build', 'watch' ]);
};
