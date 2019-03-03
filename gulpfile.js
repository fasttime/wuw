/* eslint-env node */

'use strict';

const { dest, parallel, series, src, task } = require('gulp');

task
(
    'clean',
    () =>
    {
        const del = require('del');

        const stream = del(['coverage', 'lib/**/*.min.js']);
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
                src: 'lib/wuw.js',
                envs: 'browser',
                globals: ['global', 'require', 'setImmediate'],
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

task
(
    'uglify',
    () =>
    {
        const composer = require('gulp-uglify/composer');
        const rename = require('gulp-rename');
        const uglifyjs = require('uglify-es');

        const minify = composer(uglifyjs, console);
        const minifyOpts =
        {
            compress: { hoist_funs: true, passes: 3 },
            output: { comments: (node, comment) => comment.pos === 0 },
        };
        const stream =
        src('lib/wuw.js')
        .pipe(minify(minifyOpts))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest('lib'));
        return stream;
    },
);

task('default', series(parallel('clean', 'lint'), 'test', 'uglify'));
