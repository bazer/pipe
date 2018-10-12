declare global {
    interface Window {
        NodeList: any;
    }

    interface Array<T> {
        last(): T;
        flatMap<E>(callback: (t: T) => Array<E>): Array<E>
    }

    interface HTMLElement {
        attachEvent: any; //IE8
    }
}

import 'core-js/es6/array';
import 'core-js/es6/string';
import { Polyfills } from './polyfills';
import { default as Parser } from './reader/parser';
import { default as Lexer } from './reader/lexer';
import { default as elements } from './elements/elements';
//import * as elements from './elements/elements';

function init() {
    Polyfills.init();
}

init();

export { Parser, Lexer, elements }