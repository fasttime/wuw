/* eslint-env node */

'use strict';

module.exports =
config =>
config.set
(
    {
        browsers: ['ChromeHeadless'],
        files: ['lib/wuw.js', 'test/helpers.js', 'test/**/*.spec.js'],
        frameworks: ['chai', 'mocha'],
        preprocessors: { 'lib/wuw.js': ['coverage'] },
        reporters: ['coverage', 'progress'],
    },
);
