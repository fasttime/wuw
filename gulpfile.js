/* eslint-env node */

'use strict';

const { parallel, series, task } = require('gulp');

task
(
    'clean',
    () =>
    {
        const del = require('del');

        const stream = del('coverage');
        return stream;
    },
);

task
(
    'lint',
    () =>
    {
        const lint = require('gulp-fasttime-lint');

        const stream =
        lint
        (
            {
                src: 'lib/**/*.js',
                globals:
                [
                    'CSS2Properties',
                    'CSSStyleDeclaration',
                    'MessageChannel',
                    'console',
                    'performance',
                    'require',
                    'setImmediate',
                ],
                parserOptions: { ecmaVersion: 7 },
            },
            {
                src: ['*.js', 'test/**/*.js'],
                parserOptions: { ecmaVersion: 8 },
            },
        );
        return stream;
    },
);

task
(
    'test',
    done =>
    {
        const { Server } = require('karma');
        const path = require('path');

        new Server({ configFile: path.join(__dirname, '/karma.conf.js'), singleRun: true }, done)
        .start();
    },
);

task('default', series(parallel('clean', 'lint'), 'test'));
