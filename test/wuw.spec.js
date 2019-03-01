/* eslint-env mocha */
/* global assert, wuw */

'use strict';

describe
(
    'wuw',
    () =>
    {
        it
        (
            'has expected properties',
            () =>
            {
                assert.hasConsistentOwnProperties(wuw);
            },
        );
    },
);
