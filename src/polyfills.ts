export class Polyfills {
    public static init() {
        if (!Array.prototype.last) {
            Array.prototype.last = function () {
                return this[this.length - 1];
            };
        };

        if (!Array.prototype.flatMap) {
            Object.defineProperty(Array.prototype, 'flatMap', {
                value: function (f: Function) {
                    return this.reduce((ys: any, x: any) => {
                        return ys.concat(f.call(this, x))
                    }, [])
                },
                enumerable: false,
            })
        }

        // if (window.NodeList && !NodeList.prototype.forEach) {
        //     NodeList.prototype.forEach = function (callback, thisArg) {
        //         thisArg = thisArg || window;
        //         for (var i = 0; i < this.length; i++) {
        //             callback.call(thisArg, this[i], i, this);
        //         }
        //     };
        // }
    }
}