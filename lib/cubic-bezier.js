"use strict";

var get = function(one, two, three, four, t) {

    var v = 1 - t,
        b1 = t * t * t,
        b2 = 3 * t * t * v,
        b3 = 3 * t * v * v,
        b4 = v * v * v;

    return four * b1 + three * b2 + two * b3 + one * b4;
};

module.exports = function(vectors, epsilon) {

    if (vectors.length % 3 !== 1) throw new Error("invalid input");

    return function(x) {

        var c0, c1, c2, c3;

        for (var i = 0; i < vectors.length - 1; i += 3) {
            c0 = vectors[i];
            c1 = vectors[i + 1];
            c2 = vectors[i + 2];
            c3 = vectors[i + 3];
            if (x >= c0.x && x <= c3.x) break;
        }

        var lower = 0, upper = 1, t = x, xt;

        if (x < lower) return get(c0.y, c1.y, c2.y, c3.y, lower);
        if (x > upper) return get(c0.y, c1.y, c2.y, c3.y, upper);

        while (lower < upper) {
            xt = get(c0.x, c1.x, c2.x, c3.x, t);
            if (Math.abs(xt - x) < epsilon) return get(c0.y, c1.y, c2.y, c3.y, t);
            if (x > xt) lower = t;
            else upper = t;
            t = (upper - lower) * 0.5 + lower;
        }

        // Failure
        return get(c0.y, c1.y, c2.y, c3.y, t);

    };

};
