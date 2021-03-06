'use strict';

const compileFromFile = require('json-schema-to-typescript').compileFromFile;

// eslint-disable-next-line max-len
const BANNER_COMMENT = `/* eslint-disable lines-around-comment, @typescript-eslint/no-type-alias, @typescript-eslint/member-ordering */ // eslint-disable-line max-len
/**
 * This file was automatically generated by json-schema-to-typescript. DO NOT MODIFY IT BY
 * HAND. Instead, modify the source schema file(s), and run grunt
 * build-types-from-json-schemas to regenerate this file.
 *
 * Also, CODE SHOULD NOT USE THE TYPES FROM THIS FILE DIRECTLY. Instead, the types from
 * ServiceWebConfig.d.ts should be used. Because of the difficulty of mapping between
 * schemas and types, not all necessary features can easily be baked into the schemas, so
 * we manually make some tweaks to the auto-generated types and export those mutated types
 * from ServiceWebConfig.d.ts.
 */
`;

module.exports = function(grunt) {
   grunt.registerMultiTask('build-types-from-json-schemas', 'Builds types from JSON schemas', function() {
      const opts = {
         cwd: this.data.cwd,
         bannerComment: BANNER_COMMENT,
         style: {
            bracketSpacing: true,
            trailingComma: 'all',
            useTabs: false,
            tabWidth: 3,
         },
      };

      this.files.forEach((files) => {
         const src = files.src[0],
               dest = files.dest,
               done = this.async();

         if (files.src.length !== 1) {
            grunt.fatal(`Can only process one source file, but received ${files.src.length}`);
         }

         grunt.log.debug(`Compiling ${src} to ${dest}`);
         compileFromFile(src, opts).then((output) => {
            grunt.file.write(dest, output);
            done();
         });
      });
   });
};
