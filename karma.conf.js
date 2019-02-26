/* eslint-env node */

'use strict';

module.exports =
config =>
config.set
(
    {
        browsers: ['ChromeHeadless'],
        files: ['lib/**/*.js', 'test/helpers.js', 'test/**/*.spec.js'],
        frameworks: ['chai', 'mocha'],
        preprocessors: { 'lib/**/*.js': ['coverage'] },
        reporters: ['coverage', 'progress'],
    },
);
