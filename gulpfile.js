/* eslint-env node */

'use strict';

const { dest, parallel, series, src, task } = require('gulp');

task
(
    'clean',
    async () =>
    {
        const del = require('del');

        await del(['coverage', 'lib/**/*.min.js']);
    },
);

task
(
    'lint',
    async () =>
    {
        const { lint } = require('@fasttime/lint');

        await lint
        (
            {
                src: 'lib/wuw.js',
                envs: 'browser',
                globals: { setImmediate: false },
                parserOptions: { ecmaVersion: 7 },
            },
            {
                src: 'lib/wuw.d.ts',
                parserOptions: { ecmaVersion: 7, project: 'tsconfig.json' },
            },
            {
                src: ['*.js', 'test/**/*.js'],
                parserOptions: { ecmaVersion: 8 },
                rules: { 'spaced-comment': ['error', 'always', { markers: ['/'] }] },
            },
        );
    },
);

task
(
    'test',
    async () =>
    {
        const { config: { parseConfig }, Server }   = require('karma');
        const path                                  = require('path');

        const config =
        await parseConfig
        (
            path.join(__dirname, '/karma.conf.js'),
            { singleRun: true },
            { promiseConfig: true, throwErrors: true },
        );
        await new Server(config).start();
    },
);

task
(
    'minify',
    () =>
    {
        const rename = require('gulp-rename');
        const terser = require('gulp-terser');

        const minifyOpts =
        {
            compress: { hoist_funs: true, passes: 3 },
            output: { comments: (node, comment) => comment.pos === 0 },
        };
        const stream =
        src('lib/wuw.js')
        .pipe(terser(minifyOpts))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest('lib'));
        return stream;
    },
);

task('default', series(parallel('clean', 'lint'), 'test', 'minify'));
