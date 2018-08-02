import 'core-js/es6/array';
import 'core-js/es6/string';

import { default as Parser } from './parser';
import { default as Lexer } from './lexer';
import * as elements from './elements';
import { Polyfills } from './polyfills';

function init() {
    Polyfills.init();
}

init();

export { Parser, Lexer, elements }