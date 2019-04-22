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
    () =>
    {
        const lint = require('gulp-fasttime-lint');

        const stream =
        lint
        (
            {
                src: 'lib/wuw.js',
                envs: 'browser',
                globals: ['setImmediate'],
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
