"use strict";

var ready = require("elements/domready");
var bezier = require("./lib/cubic-bezier");

var Transition = require("transition");
var equations = require("transition/equations");

var width, height;
var boxLeft, boxTop;
var boxWidth, boxHeight;

var calcSize = function() {
    width = window.innerWidth;
    height = window.innerHeight;

    boxLeft = width / 4;
    boxTop = height / 4;

    boxWidth = width / 2;
    boxHeight = height / 2;
};

calcSize();

var vectorToEuclidean = function(v) {
    return { x: (v.x - boxLeft) / boxWidth, y: -((v.y - boxTop) / boxHeight) + 1 };
};

var vectorToPixels = function(v) {
    return { x: boxLeft + (v.x * boxWidth), y: boxTop + ((-v.y + 1) * boxHeight) };
};

var vectorsToPixels = function(vectors) {
    return vectors.map(vectorToPixels);
};

var vectorsToEuclidean = function(vectors) {
    return vectors.map(vectorToEuclidean);
};

var clamp = function(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
};

var clampPixelVectors = function(vectors) {

    var x0 = boxLeft;
    var x1 = x0 + boxWidth;


    for (var i = 0; i < vectors.length - 1; i += 3) {

        var c0 = vectors[i],
            c1 = vectors[i + 1],
            c2 = vectors[i + 2],
            c3 = vectors[i + 3];

        if (i === 0) c0.x = x0; // clamp the first 0 to x 0
        else c0.x = clamp(c0.x, x0, x1);

        if (i === vectors.length - 4) c3.x = x1;
        else c3.x = clamp(c3.x, c0.x, x1);

        // clamp the rest
        c1.x = clamp(c1.x, c0.x, c3.x);
        c2.x = clamp(c2.x, c0.x, c3.x);
    }
};

var lerp = function(from, to, delta) {
  return (to - from) * delta + from;
};

var simplify = function(n, places) {
    return Number(n).toFixed(places).replace(/\.?0+$/, '');
};

var renderCanvas = function(ctx, pixelVectors, activeVectorIndex, pennerEquation) {

    var vectors = vectorsToEuclidean(pixelVectors);
    var equation = bezier(vectors, 0.0001);

    var i, c0, c1, c2, c3;

    // clear canvas
    ctx.clearRect(0, 0, width, height);

    // draw main box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(boxLeft, boxTop, boxWidth, boxHeight);
    ctx.closePath();
    ctx.stroke();


    // draw bezier curves
    ctx.strokeStyle = "red";
    c0 = pixelVectors[0];

    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    for (i = 1; i < pixelVectors.length - 1; i += 3) {
        c1 = pixelVectors[i];
        c2 = pixelVectors[i + 1];
        c3 = pixelVectors[i + 2];
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, c3.x, c3.y);
    }
    ctx.stroke();

    // draw control lines
    ctx.strokeStyle = "green";

    for (i = 0; i < pixelVectors.length - 1; i += 3) {
        c0 = pixelVectors[i];
        c1 = pixelVectors[i + 1];
        c2 = pixelVectors[i + 2];
        c3 = pixelVectors[i + 3];

        ctx.beginPath();
        ctx.moveTo(c0.x, c0.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c3.x, c3.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.closePath();
        ctx.stroke();
    }

    // draw control handles

    for (i = 0; i < pixelVectors.length; i++) {
        ctx.fillStyle = activeVectorIndex === i ? "cyan" : "green";
        var p = pixelVectors[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 , 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    document.querySelector("#curve").value = "cubicBezier([" + vectors.map(function(p) {
        return "{ x: " + simplify(p.x, 2) + ", y: " + simplify(p.y, 2) + "}";
    }).join(", ") + "], 0.0001)";

    var res = 120;

    var points = [];
    var pointsPenner = [];

    for (i = 0; i < res; i++) {
        var pct = i / (res - 1);
        var x = boxLeft + (pct * boxWidth);

        var line = [{ x: x, y: boxTop + boxHeight }, { x: x, y: boxTop }];

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        ctx.lineTo(line[1].x, line[1].y);
        ctx.closePath();
        ctx.stroke();

        var y = boxTop + ((-equation(pct) + 1) * boxHeight);

        if (pennerEquation) {
            var pennerY = boxTop + ((-pennerEquation(pct) + 1) * boxHeight);
            pointsPenner.push({ x: x, y: pennerY });
        }

        points.push({ x: x, y: y });

    }

    // draw computed points

    ctx.fillStyle = "magenta";
    pointsPenner.forEach(function(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    });

    ctx.fillStyle = "blue";
    points.forEach(function(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    });
};

var contained = function(p, box) {
    return p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
};

var findPixelVector = function(v, vectors) {
    var found;

    for (var i = 0; i < vectors.length; i++) {
        var cp = vectors[i];

        var box = { left: cp.x - 10, right: cp.x + 10, top: cp.y - 10, bottom: cp.y + 10 };
        if (contained(v, box)) {
            found = i;
            break;
        }
    }

    return found;
};

var copy = function(v) {
    return { x: v.x, y: v.y };
};

var cloneVectors = function(vectors) {
    return vectors.map(copy);
};

var add = function(v, b) {
    v.x += b.x;
    v.y += b.y;
    return v;
};

var subtract = function(v, b) {
    v.x -= b.x;
    v.y -= b.y;
    return v;
};

var rotate = function(v, angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var newX = v.x * cos - v.y * sin;
  var newY = v.y * cos + v.x * sin;
  v.x = newX;
  v.y = newY;
  return v;
};

var rotateAroundPoint = function(v, axisPoint, angle) {
    subtract(v, axisPoint);
    rotate(v, angle);
    add(v, axisPoint);
    return v;
};

var angle = function(v1, v2) {
    return Math.atan2(v2.y - v1.y, v2.x - v1.x);
};


var random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

var getRandomSprite = function() {
    var sprite = document.createElement("div");
    sprite.className = "sprite";

    var size = random(100, 200);
    sprite.style.width = sprite.style.height = size + "px";
    sprite.style.borderRadius = (size / 2) + "px";
    sprite.style.left = random(0, window.innerWidth - size) + "px";
    sprite.style.top = random(0, window.innerHeight - size) + "px";
    sprite.style.backgroundColor = "rgb(" + [random(0, 255), random(0, 255), random(0, 255)].join(", ") + ")";
    document.body.appendChild(sprite);

    return sprite;
};

var presets = {
    bounceIn: [{ x: 0, y: 0}, { x: 0.04, y: 0.03}, { x: 0.07, y: 0.03}, { x: 0.1, y: -0.01}, { x: 0.16, y: 0.09}, { x: 0.21, y: 0.09}, { x: 0.27, y: -0.01}, { x: 0.38, y: 0.28}, { x: 0.48, y: 0.38}, { x: 0.64, y: 0.01}, { x: 0.73, y: 0.54}, { x: 0.85, y: 0.98}, { x: 1, y: 1}],
    backOut: [{ x: 0, y: 0}, { x: 0.3, y: 1.3}, { x: 0.49, y: 1.16}, { x: 1, y: 0.98}]
};

ready(function() {

    var pixelVectors = vectorsToPixels([
        { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 0.5, y: 0 },
        { x: 0.5, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }
    ]);

    var canvas = document.querySelector("#curves");

    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");

    var mouseStartVector, mouseNowVector, activeVectorIndex, offsetVector;
    var startVectors;
    var shiftDown, mouseDown;

    // events

    document.addEventListener("mousedown", function(event) {
        mouseDown = true;
        mouseStartVector = mouseNowVector = { x: event.pageX, y: event.pageY };
        activeVectorIndex = findPixelVector(mouseStartVector, pixelVectors);

        if (activeVectorIndex != null) {
            startVectors = cloneVectors(pixelVectors);

            var currentVector = pixelVectors[activeVectorIndex];

            offsetVector = {
                x: mouseNowVector.x - currentVector.x,
                y: mouseNowVector.y - currentVector.y
            };
        }

    }, false);

    document.addEventListener("mouseup", function() {
        mouseDown = false;
        activeVectorIndex = null;
    }, false);

    document.addEventListener("keyup", function() {
        shiftDown = false;
    }, false);

    document.addEventListener("keydown", function(event) {
        if (event.keyIdentifier === "Shift") shiftDown = true;
    }, false);

    document.addEventListener("mousemove", function(event) {
        mouseNowVector = { x: event.pageX, y: event.pageY };
        event.preventDefault();
    }, false);

    // add / remove

    var removeNode = document.querySelector("#remove");
    var addNode = document.querySelector("#add");

    addNode.addEventListener("click", function() {
        removeNode.disabled = false;

        var vectors = vectorsToEuclidean(pixelVectors);

        var segments = (vectors.length - 1) / 3 + 1;
        var ratio = 1 - (1 / segments);

        for (var i = 0; i < vectors.length; i++) {
            var c = vectors[i];
            c.x *= ratio;
        }

        vectors.push({ x: ratio, y: 1 }, { x: 1, y: 1 }, {x: 1, y: 0 });
        pixelVectors = vectorsToPixels(vectors);
    }, false);

    removeNode.addEventListener("click", function() {
        if (pixelVectors.length === 4) return;

        var vectors = vectorsToEuclidean(pixelVectors);

        var segments = (vectors.length - 1) / 3;
        var ratio = 1 - (1 / segments);

        console.log(segments, ratio);

        for (var i = 0; i < vectors.length; i++) {
            var c = vectors[i];
            c.x *= 1/ratio;
        }

        vectors.splice(vectors.length - 3, 3);
        pixelVectors = vectorsToPixels(vectors);

        if (pixelVectors.length === 4) this.disabled = true;

    }, false);

    // mirror

    document.querySelector("#h-mirror").addEventListener("click", function() {
        var vectors = vectorsToEuclidean(pixelVectors);

        for (var i = 0; i < vectors.length; i++) {
            var c = vectors[i];
            c.x = - c.x + 1;
        }
        pixelVectors = vectorsToPixels(vectors.reverse());
    }, false);

    document.querySelector("#v-mirror").addEventListener("click", function() {
        var vectors = vectorsToEuclidean(pixelVectors);

        for (var i = 0; i < vectors.length; i++) {
            var c = vectors[i];
            c.y = - c.y + 1;
        }
        pixelVectors = vectorsToPixels(vectors);
    }, false);

    // animations

    document.querySelector("#fade").addEventListener("click", function() {
        var equation = bezier(vectorsToEuclidean(pixelVectors), 0.0001);

        var start = 0, end = 1;

        var sprite = getRandomSprite();

        var transition = new Transition(3000, equation, function(delta) {
            sprite.style.opacity = lerp(start, end, delta);

            if (!this.active) document.body.removeChild(sprite);
        });

        transition.start();
    }, false);

    document.querySelector("#fall").addEventListener("click", function() {
        var equation = bezier(vectorsToEuclidean(pixelVectors), 0.0001);

        var sprite = getRandomSprite();

        var start = 0, end = window.innerHeight - parseInt(sprite.style.height);

        var transition = new Transition(3000, equation, function(delta) {
            sprite.style.top = lerp(start, end, delta) + "px";

            if (!this.active) document.body.removeChild(sprite);
        });

        transition.start();
    }, false);


    var key, option;

    // penner stuffs

    var pennerEquation;

    var pennerSelectNode = document.querySelector("#penner-select");

    for (key in equations) {
        option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        pennerSelectNode.appendChild(option);
    }

    document.querySelector("#penner-overlay").addEventListener("click", function() {
        var selectedEquation = pennerSelectNode.options[pennerSelectNode.selectedIndex].value;
        pennerEquation = equations[selectedEquation];
    }, false);

    // preset stuffs

    var presetSelectNode = document.querySelector("#preset-select");

    for (key in presets) {
        option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        presetSelectNode.appendChild(option);
    }

    document.querySelector("#preset-load").addEventListener("click", function() {
        var selectedEquation = presetSelectNode.options[presetSelectNode.selectedIndex].value;
        pixelVectors = vectorsToPixels(presets[selectedEquation]);
    }, false);


    // renderer

    var renderScene = function() {

        if (activeVectorIndex != null) {

            var currentVector = pixelVectors[activeVectorIndex];

            var positionVector = { x: mouseNowVector.x - offsetVector.x, y: mouseNowVector.y - offsetVector.y };

            if (shiftDown) for (var i = 0; i < pixelVectors.length - 1; i += 3) {
                var cm1 = pixelVectors[i - 1],
                    c0  = pixelVectors[i],
                    c1  = pixelVectors[i + 1],
                    c2  = pixelVectors[i + 2],
                    c3  = pixelVectors[i + 3],
                    c4  = pixelVectors[i + 4];

                var angle1, angle2;

                if (currentVector === c2 && c4) { // moving c2
                    angle1 = angle(c2, c3);
                    angle2 = angle(c3, c4);
                    rotateAroundPoint(c4, c3, angle1 - angle2);
                } else if (currentVector === c1 && cm1) { // moving c1
                    angle1 = angle(c1, c0);
                    angle2 = angle(c0, cm1);
                    rotateAroundPoint(cm1, c0, angle1 - angle2);
                } else if (currentVector === c0) { // moving c0

                    var s0 = startVectors[i];
                    var off = { x: positionVector.x - s0.x, y: positionVector.y - s0.y };

                    if (c1) {
                        var s1 = startVectors[i + 1];
                        c1.x = off.x + s1.x;
                        c1.y = off.y + s1.y;
                    }

                    if (cm1) {
                        var sm1 = startVectors[i - 1];
                        cm1.x = off.x + sm1.x;
                        cm1.y = off.y + sm1.y;
                    }
                }

            }

            currentVector.x = positionVector.x;
            currentVector.y = positionVector.y;

            clampPixelVectors(pixelVectors);

        }

        renderCanvas(ctx, pixelVectors, activeVectorIndex, pennerEquation);
        requestAnimationFrame(renderScene);
    };

    requestAnimationFrame(renderScene);

});
