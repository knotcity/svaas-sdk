export * from './lib.js';
export * from './station.js';
export * from './vehicle.js';
export * from './KnotCode.js';

import * as lib from './lib.js';
import * as station from './station.js';
import * as vehicle from './vehicle.js';
import * as knotCode from './KnotCode.js';

export default {
    ...lib,
    ...station,
    ...vehicle,
    ...knotCode
};
