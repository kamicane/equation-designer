/* compiled with quickstart@1.1.1 */(function (main, modules) {
  'use strict';
  var cache = require.cache = {};
  function require(id) {
    var module = cache[id];
    if (!module) {
      var moduleFn = modules[id];
      if (!moduleFn)
        throw new Error('module ' + id + ' not found');
      module = cache[id] = {};
      var exports = module.exports = {};
      moduleFn.call(exports, require, module, exports, window);
    }
    return module.exports;
  }
  require.resolve = function (resolved) {
    return resolved;
  };
  require.node = function () {
    return {};
  };
  require(main);
}('./index.js', {
  './index.js': function (require, module, exports, global) {
    'use strict';
    var ready = require('./node_modules/elements/domready.js');
    var bezier = require('./lib/cubic-bezier.js');
    var Transition = require('./node_modules/transition/index.js');
    var equations = require('./node_modules/transition/equations.js');
    var width, height;
    var boxLeft, boxTop;
    var boxWidth, boxHeight;
    var calcSize = function () {
      width = window.innerWidth;
      height = window.innerHeight;
      boxLeft = width / 4;
      boxTop = height / 4;
      boxWidth = width / 2;
      boxHeight = height / 2;
    };
    calcSize();
    var vectorToEuclidean = function (v) {
      return {
        x: (v.x - boxLeft) / boxWidth,
        y: -((v.y - boxTop) / boxHeight) + 1
      };
    };
    var vectorToPixels = function (v) {
      return {
        x: boxLeft + v.x * boxWidth,
        y: boxTop + (-v.y + 1) * boxHeight
      };
    };
    var vectorsToPixels = function (vectors) {
      return vectors.map(vectorToPixels);
    };
    var vectorsToEuclidean = function (vectors) {
      return vectors.map(vectorToEuclidean);
    };
    var clamp = function (n, min, max) {
      if (n < min)
        return min;
      if (n > max)
        return max;
      return n;
    };
    var clampPixelVectors = function (vectors) {
      var x0 = boxLeft;
      var x1 = x0 + boxWidth;
      for (var i = 0; i < vectors.length - 1; i += 3) {
        var c0 = vectors[i], c1 = vectors[i + 1], c2 = vectors[i + 2], c3 = vectors[i + 3];
        if (i === 0)
          c0.x = x0;
        else
          c0.x = clamp(c0.x, x0, x1);
        if (i === vectors.length - 4)
          c3.x = x1;
        else
          c3.x = clamp(c3.x, c0.x, x1);
        c1.x = clamp(c1.x, c0.x, c3.x);
        c2.x = clamp(c2.x, c0.x, c3.x);
      }
    };
    var lerp = function (from, to, delta) {
      return (to - from) * delta + from;
    };
    var simplify = function (n, places) {
      return Number(n).toFixed(places).replace(/\.?0+$/, '');
    };
    var renderCanvas = function (ctx, pixelVectors, activeVectorIndex, pennerEquation) {
      var vectors = vectorsToEuclidean(pixelVectors);
      var equation = bezier(vectors, 0.0001);
      var i, c0, c1, c2, c3;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(boxLeft, boxTop, boxWidth, boxHeight);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = 'red';
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
      ctx.strokeStyle = 'green';
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
      for (i = 0; i < pixelVectors.length; i++) {
        ctx.fillStyle = activeVectorIndex === i ? 'cyan' : 'green';
        var p = pixelVectors[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      document.querySelector('#curve').value = 'cubicBezier([' + vectors.map(function (p) {
        return '{ x: ' + simplify(p.x, 2) + ', y: ' + simplify(p.y, 2) + '}';
      }).join(', ') + '], 0.0001)';
      var res = 120;
      var points = [];
      var pointsPenner = [];
      for (i = 0; i < res; i++) {
        var pct = i / (res - 1);
        var x = boxLeft + pct * boxWidth;
        var line = [
          {
            x: x,
            y: boxTop + boxHeight
          },
          {
            x: x,
            y: boxTop
          }
        ];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        ctx.lineTo(line[1].x, line[1].y);
        ctx.closePath();
        ctx.stroke();
        var y = boxTop + (-equation(pct) + 1) * boxHeight;
        if (pennerEquation) {
          var pennerY = boxTop + (-pennerEquation(pct) + 1) * boxHeight;
          pointsPenner.push({
            x: x,
            y: pennerY
          });
        }
        points.push({
          x: x,
          y: y
        });
      }
      ctx.fillStyle = 'magenta';
      pointsPenner.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = 'blue';
      points.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });
    };
    var contained = function (p, box) {
      return p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
    };
    var findPixelVector = function (v, vectors) {
      var found;
      for (var i = 0; i < vectors.length; i++) {
        var cp = vectors[i];
        var box = {
          left: cp.x - 10,
          right: cp.x + 10,
          top: cp.y - 10,
          bottom: cp.y + 10
        };
        if (contained(v, box)) {
          found = i;
          break;
        }
      }
      return found;
    };
    var copy = function (v) {
      return {
        x: v.x,
        y: v.y
      };
    };
    var cloneVectors = function (vectors) {
      return vectors.map(copy);
    };
    var add = function (v, b) {
      v.x += b.x;
      v.y += b.y;
      return v;
    };
    var subtract = function (v, b) {
      v.x -= b.x;
      v.y -= b.y;
      return v;
    };
    var rotate = function (v, angle) {
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var newX = v.x * cos - v.y * sin;
      var newY = v.y * cos + v.x * sin;
      v.x = newX;
      v.y = newY;
      return v;
    };
    var rotateAroundPoint = function (v, axisPoint, angle) {
      subtract(v, axisPoint);
      rotate(v, angle);
      add(v, axisPoint);
      return v;
    };
    var angle = function (v1, v2) {
      return Math.atan2(v2.y - v1.y, v2.x - v1.x);
    };
    var random = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };
    var getRandomSprite = function () {
      var sprite = document.createElement('div');
      sprite.className = 'sprite';
      var size = random(100, 200);
      sprite.style.width = sprite.style.height = size + 'px';
      sprite.style.borderRadius = size / 2 + 'px';
      sprite.style.left = random(0, window.innerWidth - size) + 'px';
      sprite.style.top = random(0, window.innerHeight - size) + 'px';
      sprite.style.backgroundColor = 'rgb(' + [
        random(0, 255),
        random(0, 255),
        random(0, 255)
      ].join(', ') + ')';
      document.body.appendChild(sprite);
      return sprite;
    };
    var presets = {
      bounceIn: [
        {
          x: 0,
          y: 0
        },
        {
          x: 0.04,
          y: 0.03
        },
        {
          x: 0.07,
          y: 0.03
        },
        {
          x: 0.1,
          y: -0.01
        },
        {
          x: 0.16,
          y: 0.09
        },
        {
          x: 0.21,
          y: 0.09
        },
        {
          x: 0.27,
          y: -0.01
        },
        {
          x: 0.38,
          y: 0.28
        },
        {
          x: 0.48,
          y: 0.38
        },
        {
          x: 0.64,
          y: 0.01
        },
        {
          x: 0.73,
          y: 0.54
        },
        {
          x: 0.85,
          y: 0.98
        },
        {
          x: 1,
          y: 1
        }
      ],
      backOut: [
        {
          x: 0,
          y: 0
        },
        {
          x: 0.3,
          y: 1.3
        },
        {
          x: 0.49,
          y: 1.16
        },
        {
          x: 1,
          y: 0.98
        }
      ]
    };
    ready(function () {
      var pixelVectors = vectorsToPixels([
        {
          x: 0,
          y: 0
        },
        {
          x: 0,
          y: 1
        },
        {
          x: 0.5,
          y: 1
        },
        {
          x: 0.5,
          y: 0
        },
        {
          x: 0.5,
          y: 1
        },
        {
          x: 1,
          y: 1
        },
        {
          x: 1,
          y: 0
        }
      ]);
      var canvas = document.querySelector('#curves');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      var mouseStartVector, mouseNowVector, activeVectorIndex, offsetVector;
      var startVectors;
      var shiftDown, mouseDown;
      document.addEventListener('mousedown', function (event) {
        mouseDown = true;
        mouseStartVector = mouseNowVector = {
          x: event.pageX,
          y: event.pageY
        };
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
      document.addEventListener('mouseup', function () {
        mouseDown = false;
        activeVectorIndex = null;
      }, false);
      document.addEventListener('keyup', function () {
        shiftDown = false;
      }, false);
      document.addEventListener('keydown', function (event) {
        if (event.keyIdentifier === 'Shift')
          shiftDown = true;
      }, false);
      document.addEventListener('mousemove', function (event) {
        mouseNowVector = {
          x: event.pageX,
          y: event.pageY
        };
        event.preventDefault();
      }, false);
      var removeNode = document.querySelector('#remove');
      var addNode = document.querySelector('#add');
      addNode.addEventListener('click', function () {
        removeNode.disabled = false;
        var vectors = vectorsToEuclidean(pixelVectors);
        var segments = (vectors.length - 1) / 3 + 1;
        var ratio = 1 - 1 / segments;
        for (var i = 0; i < vectors.length; i++) {
          var c = vectors[i];
          c.x *= ratio;
        }
        vectors.push({
          x: ratio,
          y: 1
        }, {
          x: 1,
          y: 1
        }, {
          x: 1,
          y: 0
        });
        pixelVectors = vectorsToPixels(vectors);
      }, false);
      removeNode.addEventListener('click', function () {
        if (pixelVectors.length === 4)
          return;
        var vectors = vectorsToEuclidean(pixelVectors);
        var segments = (vectors.length - 1) / 3;
        var ratio = 1 - 1 / segments;
        console.log(segments, ratio);
        for (var i = 0; i < vectors.length; i++) {
          var c = vectors[i];
          c.x *= 1 / ratio;
        }
        vectors.splice(vectors.length - 3, 3);
        pixelVectors = vectorsToPixels(vectors);
        if (pixelVectors.length === 4)
          this.disabled = true;
      }, false);
      document.querySelector('#h-mirror').addEventListener('click', function () {
        var vectors = vectorsToEuclidean(pixelVectors);
        for (var i = 0; i < vectors.length; i++) {
          var c = vectors[i];
          c.x = -c.x + 1;
        }
        pixelVectors = vectorsToPixels(vectors.reverse());
      }, false);
      document.querySelector('#v-mirror').addEventListener('click', function () {
        var vectors = vectorsToEuclidean(pixelVectors);
        for (var i = 0; i < vectors.length; i++) {
          var c = vectors[i];
          c.y = -c.y + 1;
        }
        pixelVectors = vectorsToPixels(vectors);
      }, false);
      document.querySelector('#fade').addEventListener('click', function () {
        var equation = bezier(vectorsToEuclidean(pixelVectors), 0.0001);
        var start = 0, end = 1;
        var sprite = getRandomSprite();
        var transition = new Transition(3000, equation, function (delta) {
          sprite.style.opacity = lerp(start, end, delta);
          if (!this.active)
            document.body.removeChild(sprite);
        });
        transition.start();
      }, false);
      document.querySelector('#fall').addEventListener('click', function () {
        var equation = bezier(vectorsToEuclidean(pixelVectors), 0.0001);
        var sprite = getRandomSprite();
        var start = 0, end = window.innerHeight - parseInt(sprite.style.height);
        var transition = new Transition(3000, equation, function (delta) {
          sprite.style.top = lerp(start, end, delta) + 'px';
          if (!this.active)
            document.body.removeChild(sprite);
        });
        transition.start();
      }, false);
      var key, option;
      var pennerEquation;
      var pennerSelectNode = document.querySelector('#penner-select');
      for (key in equations) {
        option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        pennerSelectNode.appendChild(option);
      }
      document.querySelector('#penner-overlay').addEventListener('click', function () {
        var selectedEquation = pennerSelectNode.options[pennerSelectNode.selectedIndex].value;
        pennerEquation = equations[selectedEquation];
      }, false);
      var presetSelectNode = document.querySelector('#preset-select');
      for (key in presets) {
        option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        presetSelectNode.appendChild(option);
      }
      document.querySelector('#preset-load').addEventListener('click', function () {
        var selectedEquation = presetSelectNode.options[presetSelectNode.selectedIndex].value;
        pixelVectors = vectorsToPixels(presets[selectedEquation]);
      }, false);
      var renderScene = function () {
        if (activeVectorIndex != null) {
          var currentVector = pixelVectors[activeVectorIndex];
          var positionVector = {
            x: mouseNowVector.x - offsetVector.x,
            y: mouseNowVector.y - offsetVector.y
          };
          if (shiftDown)
            for (var i = 0; i < pixelVectors.length - 1; i += 3) {
              var cm1 = pixelVectors[i - 1], c0 = pixelVectors[i], c1 = pixelVectors[i + 1], c2 = pixelVectors[i + 2], c3 = pixelVectors[i + 3], c4 = pixelVectors[i + 4];
              var angle1, angle2;
              if (currentVector === c2 && c4) {
                angle1 = angle(c2, c3);
                angle2 = angle(c3, c4);
                rotateAroundPoint(c4, c3, angle1 - angle2);
              } else if (currentVector === c1 && cm1) {
                angle1 = angle(c1, c0);
                angle2 = angle(c0, cm1);
                rotateAroundPoint(cm1, c0, angle1 - angle2);
              } else if (currentVector === c0) {
                var s0 = startVectors[i];
                var off = {
                  x: positionVector.x - s0.x,
                  y: positionVector.y - s0.y
                };
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
  },
  './lib/cubic-bezier.js': function (require, module, exports, global) {
    'use strict';
    var get = function (one, two, three, four, t) {
      var v = 1 - t, b1 = t * t * t, b2 = 3 * t * t * v, b3 = 3 * t * v * v, b4 = v * v * v;
      return four * b1 + three * b2 + two * b3 + one * b4;
    };
    module.exports = function (vectors, epsilon) {
      if (vectors.length % 3 !== 1)
        throw new Error('invalid input');
      return function (x) {
        var c0, c1, c2, c3;
        for (var i = 0; i < vectors.length - 1; i += 3) {
          c0 = vectors[i];
          c1 = vectors[i + 1];
          c2 = vectors[i + 2];
          c3 = vectors[i + 3];
          if (x >= c0.x && x <= c3.x)
            break;
        }
        var lower = 0, upper = 1, t = x, xt;
        if (x < lower)
          return get(c0.y, c1.y, c2.y, c3.y, lower);
        if (x > upper)
          return get(c0.y, c1.y, c2.y, c3.y, upper);
        while (lower < upper) {
          xt = get(c0.x, c1.x, c2.x, c3.x, t);
          if (Math.abs(xt - x) < epsilon)
            return get(c0.y, c1.y, c2.y, c3.y, t);
          if (x > xt)
            lower = t;
          else
            upper = t;
          t = (upper - lower) * 0.5 + lower;
        }
        return get(c0.y, c1.y, c2.y, c3.y, t);
      };
    };
  },
  './node_modules/elements/domready.js': function (require, module, exports, global) {
    'use strict';
    var $ = require('./node_modules/elements/events.js');
    var readystatechange = 'onreadystatechange' in document, shouldPoll = false, loaded = false, readys = [], checks = [], ready = null, timer = null, test = document.createElement('div'), doc = $(document), win = $(window);
    var domready = function () {
      if (timer)
        timer = clearTimeout(timer);
      if (!loaded) {
        if (readystatechange)
          doc.off('readystatechange', check);
        doc.off('DOMContentLoaded', domready);
        win.off('load', domready);
        loaded = true;
        for (var i = 0; ready = readys[i++];)
          ready();
      }
      return loaded;
    };
    var check = function () {
      for (var i = checks.length; i--;)
        if (checks[i]())
          return domready();
      return false;
    };
    var poll = function () {
      clearTimeout(timer);
      if (!check())
        timer = setTimeout(poll, 1000 / 60);
    };
    if (document.readyState) {
      var complete = function () {
        return !!/loaded|complete/.test(document.readyState);
      };
      checks.push(complete);
      if (!complete()) {
        if (readystatechange)
          doc.on('readystatechange', check);
        else
          shouldPoll = true;
      } else {
        domready();
      }
    }
    if (test.doScroll) {
      var scrolls = function () {
        try {
          test.doScroll();
          return true;
        } catch (e) {
        }
        return false;
      };
      if (!scrolls()) {
        checks.push(scrolls);
        shouldPoll = true;
      }
    }
    if (shouldPoll)
      poll();
    doc.on('DOMContentLoaded', domready);
    win.on('load', domready);
    module.exports = function (ready) {
      loaded ? ready() : readys.push(ready);
      return null;
    };
  },
  './node_modules/transition/equations.js': function (require, module, exports, global) {
    'use strict';
    var forIn = require('./node_modules/mout/object/forIn.js');
    var slice_ = Array.prototype.slice;
    var equations = {
      quad: function (p) {
        return Math.pow(p, 2);
      },
      cubic: function (p) {
        return Math.pow(p, 3);
      },
      quart: function (p) {
        return Math.pow(p, 4);
      },
      quint: function (p) {
        return Math.pow(p, 5);
      },
      expo: function (p) {
        return Math.pow(2, 8 * (p - 1));
      },
      circ: function (p) {
        return 1 - Math.sin(Math.acos(p));
      },
      sine: function (p) {
        return 1 - Math.cos(p * Math.PI / 2);
      },
      bounce: function (p) {
        var value;
        for (var a = 0, b = 1; 1; a += b, b /= 2) {
          if (p >= (7 - 4 * a) / 11) {
            value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
            break;
          }
        }
        return value;
      },
      pow: function (p, x) {
        if (x == null)
          x = 6;
        return Math.pow(p, x);
      },
      back: function (p, x) {
        if (x == null)
          x = 1.618;
        return Math.pow(p, 2) * ((x + 1) * p - x);
      },
      elastic: function (p, x) {
        if (x == null)
          x = 1;
        return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * x / 3);
      }
    };
    forIn(equations, function (equation, key) {
      exports[key] = exports[key + 'In'] = equation;
      exports[key + 'Out'] = function (delta) {
        return 1 - equation(1 - delta);
      };
      exports[key + 'InOut'] = function (delta) {
        var result = delta <= 0.5 ? equation(2 * delta) : 2 - equation(2 * (1 - delta));
        return result / 2;
      };
    });
  },
  './node_modules/transition/index.js': function (require, module, exports, global) {
    'use strict';
    module.exports = require('./node_modules/transition/lib/transition.js');
  },
  './node_modules/elements/events.js': function (require, module, exports, global) {
    'use strict';
    var Emitter = require('./node_modules/prime/emitter.js');
    var $ = require('./node_modules/elements/base.js');
    var html = document.documentElement;
    var addEventListener = html.addEventListener ? function (node, event, handle, useCapture) {
      node.addEventListener(event, handle, useCapture || false);
      return handle;
    } : function (node, event, handle) {
      node.attachEvent('on' + event, handle);
      return handle;
    };
    var removeEventListener = html.removeEventListener ? function (node, event, handle, useCapture) {
      node.removeEventListener(event, handle, useCapture || false);
    } : function (node, event, handle) {
      node.detachEvent('on' + event, handle);
    };
    $.implement({
      on: function (event, handle, useCapture) {
        return this.forEach(function (node) {
          var self = $(node);
          var internalEvent = event + (useCapture ? ':capture' : '');
          Emitter.prototype.on.call(self, internalEvent, handle);
          var domListeners = self._domListeners || (self._domListeners = {});
          if (!domListeners[internalEvent])
            domListeners[internalEvent] = addEventListener(node, event, function (e) {
              Emitter.prototype.emit.call(self, internalEvent, e || window.event, Emitter.EMIT_SYNC);
            }, useCapture);
        });
      },
      off: function (event, handle, useCapture) {
        return this.forEach(function (node) {
          var self = $(node);
          var internalEvent = event + (useCapture ? ':capture' : '');
          var domListeners = self._domListeners, domEvent, listeners = self._listeners, events;
          if (domListeners && (domEvent = domListeners[internalEvent]) && listeners && (events = listeners[internalEvent])) {
            Emitter.prototype.off.call(self, internalEvent, handle);
            if (!self._listeners || !self._listeners[event]) {
              removeEventListener(node, event, domEvent);
              delete domListeners[event];
              for (var l in domListeners)
                return;
              delete self._domListeners;
            }
          }
        });
      },
      emit: function () {
        var args = arguments;
        return this.forEach(function (node) {
          Emitter.prototype.emit.apply($(node), args);
        });
      }
    });
    module.exports = $;
  },
  './node_modules/transition/lib/transition.js': function (require, module, exports, global) {
    'use strict';
    var prime = require('./node_modules/prime/index.js'), defer = require('./node_modules/prime/defer.js');
    var Transition = prime({
      constructor: function Transition(duration, equation, callback) {
        if (!duration)
          throw new Error('no duration given');
        if (!equation)
          throw new Error('no equation given');
        if (!callback)
          throw new Error('no callback given');
        this.duration = duration;
        this.equation = equation;
        this.callback = callback;
      },
      get paused() {
        return this.cancel == null && this.elapsed != null;
      },
      get active() {
        return this.cancel != null;
      },
      get idle() {
        return this.cancel == null && this.elapsed == null;
      },
      start: function () {
        if (this.idle) {
          this.elapsed = 0;
          this.cancel = defer.frame(this.step, this);
        }
        return this;
      },
      step: function (time) {
        this.elapsed += time - (this.time || time);
        var factor = this.elapsed / this.duration;
        if (factor > 1)
          factor = 1;
        if (factor !== 1) {
          this.time = time;
          this.cancel = defer.frame(this.step, this);
        } else {
          this.cancel = this.time = this.elapsed = null;
        }
        var delta = this.equation(factor);
        this.callback(delta);
      },
      stop: function () {
        if (this.active) {
          this.cancel();
          this.elapsed = this.cancel = this.time = null;
        }
        return this;
      },
      pause: function () {
        if (this.active) {
          this.cancel();
          this.cancel = this.time = null;
        }
        return this;
      },
      resume: function () {
        if (this.paused) {
          this.cancel = defer.frame(this.step, this);
        }
        return this;
      }
    });
    module.exports = Transition;
  },
  './node_modules/elements/base.js': function (require, module, exports, global) {
    'use strict';
    var prime = require('./node_modules/prime/index.js');
    var forEach = require('./node_modules/mout/array/forEach.js'), map = require('./node_modules/mout/array/map.js'), filter = require('./node_modules/mout/array/filter.js'), every = require('./node_modules/mout/array/every.js'), some = require('./node_modules/mout/array/some.js');
    var index = 0, __dc = document.__counter, counter = document.__counter = (__dc ? parseInt(__dc, 36) + 1 : 0).toString(36), key = 'uid:' + counter;
    var uniqueID = function (n) {
      if (n === window)
        return 'window';
      if (n === document)
        return 'document';
      if (n === document.documentElement)
        return 'html';
      return n[key] || (n[key] = (index++).toString(36));
    };
    var instances = {};
    var $ = prime({
      constructor: function $(n, context) {
        if (n == null)
          return this && this.constructor === $ ? new Elements() : null;
        var self, uid;
        if (n.constructor !== Elements) {
          self = new Elements();
          if (typeof n === 'string') {
            if (!self.search)
              return null;
            self[self.length++] = context || document;
            return self.search(n);
          }
          if (n.nodeType || n === window) {
            self[self.length++] = n;
          } else if (n.length) {
            var uniques = {};
            for (var i = 0, l = n.length; i < l; i++) {
              var nodes = $(n[i], context);
              if (nodes && nodes.length)
                for (var j = 0, k = nodes.length; j < k; j++) {
                  var node = nodes[j];
                  uid = uniqueID(node);
                  if (!uniques[uid]) {
                    self[self.length++] = node;
                    uniques[uid] = true;
                  }
                }
            }
          }
        } else {
          self = n;
        }
        if (!self.length)
          return null;
        if (self.length === 1) {
          uid = uniqueID(self[0]);
          return instances[uid] || (instances[uid] = self);
        }
        return self;
      }
    });
    var Elements = prime({
      inherits: $,
      constructor: function Elements() {
        this.length = 0;
      },
      unlink: function () {
        return this.map(function (node) {
          delete instances[uniqueID(node)];
          return node;
        });
      },
      forEach: function (method, context) {
        forEach(this, method, context);
        return this;
      },
      map: function (method, context) {
        return map(this, method, context);
      },
      filter: function (method, context) {
        return filter(this, method, context);
      },
      every: function (method, context) {
        return every(this, method, context);
      },
      some: function (method, context) {
        return some(this, method, context);
      }
    });
    module.exports = $;
  },
  './node_modules/mout/object/forIn.js': function (require, module, exports, global) {
    var hasOwn = require('./node_modules/mout/object/hasOwn.js');
    var _hasDontEnumBug, _dontEnums;
    function checkDontEnum() {
      _dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ];
      _hasDontEnumBug = true;
      for (var key in { 'toString': null }) {
        _hasDontEnumBug = false;
      }
    }
    function forIn(obj, fn, thisObj) {
      var key, i = 0;
      if (_hasDontEnumBug == null)
        checkDontEnum();
      for (key in obj) {
        if (exec(fn, obj, key, thisObj) === false) {
          break;
        }
      }
      if (_hasDontEnumBug) {
        var ctor = obj.constructor, isProto = !!ctor && obj === ctor.prototype;
        while (key = _dontEnums[i++]) {
          if ((key !== 'constructor' || !isProto && hasOwn(obj, key)) && obj[key] !== Object.prototype[key]) {
            if (exec(fn, obj, key, thisObj) === false) {
              break;
            }
          }
        }
      }
    }
    function exec(fn, obj, key, thisObj) {
      return fn.call(thisObj, obj[key], key, obj);
    }
    module.exports = forIn;
  },
  './node_modules/prime/emitter.js': function (require, module, exports, global) {
    'use strict';
    var indexOf = require('./node_modules/mout/array/indexOf.js'), forEach = require('./node_modules/mout/array/forEach.js');
    var prime = require('./node_modules/prime/index.js'), defer = require('./node_modules/prime/defer.js');
    var slice = Array.prototype.slice;
    var Emitter = prime({
      on: function (event, fn) {
        var listeners = this._listeners || (this._listeners = {}), events = listeners[event] || (listeners[event] = []);
        if (indexOf(events, fn) === -1)
          events.push(fn);
        return this;
      },
      off: function (event, fn) {
        var listeners = this._listeners, events, key, length = 0;
        if (listeners && (events = listeners[event])) {
          var io = indexOf(events, fn);
          if (io > -1)
            events.splice(io, 1);
          if (!events.length)
            delete listeners[event];
          for (var l in listeners)
            return this;
          delete this._listeners;
        }
        return this;
      },
      emit: function (event) {
        var self = this, args = slice.call(arguments, 1);
        var emit = function () {
          var listeners = self._listeners, events;
          if (listeners && (events = listeners[event])) {
            forEach(events.slice(0), function (event) {
              return event.apply(self, args);
            });
          }
        };
        if (args[args.length - 1] === Emitter.EMIT_SYNC) {
          args.pop();
          emit();
        } else {
          defer(emit);
        }
        return this;
      }
    });
    Emitter.EMIT_SYNC = {};
    module.exports = Emitter;
  },
  './node_modules/prime/defer.js': function (require, module, exports, global) {
    'use strict';
    var kindOf = require('./node_modules/mout/lang/kindOf.js'), now = require('./node_modules/mout/time/now.js'), forEach = require('./node_modules/mout/array/forEach.js'), indexOf = require('./node_modules/mout/array/indexOf.js');
    var callbacks = {
      timeout: {},
      frame: [],
      immediate: []
    };
    var push = function (collection, callback, context, defer) {
      var iterator = function () {
        iterate(collection);
      };
      if (!collection.length)
        defer(iterator);
      var entry = {
        callback: callback,
        context: context
      };
      collection.push(entry);
      return function () {
        var io = indexOf(collection, entry);
        if (io > -1)
          collection.splice(io, 1);
      };
    };
    var iterate = function (collection) {
      var time = now();
      forEach(collection.splice(0), function (entry) {
        entry.callback.call(entry.context, time);
      });
    };
    var defer = function (callback, argument, context) {
      return kindOf(argument) === 'Number' ? defer.timeout(callback, argument, context) : defer.immediate(callback, argument);
    };
    if (global.process && process.nextTick) {
      defer.immediate = function (callback, context) {
        return push(callbacks.immediate, callback, context, process.nextTick);
      };
    } else if (global.setImmediate) {
      defer.immediate = function (callback, context) {
        return push(callbacks.immediate, callback, context, setImmediate);
      };
    } else if (global.postMessage && global.addEventListener) {
      addEventListener('message', function (event) {
        if (event.source === global && event.data === '@deferred') {
          event.stopPropagation();
          iterate(callbacks.immediate);
        }
      }, true);
      defer.immediate = function (callback, context) {
        return push(callbacks.immediate, callback, context, function () {
          postMessage('@deferred', '*');
        });
      };
    } else {
      defer.immediate = function (callback, context) {
        return push(callbacks.immediate, callback, context, function (iterator) {
          setTimeout(iterator, 0);
        });
      };
    }
    var requestAnimationFrame = global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.mozRequestAnimationFrame || global.oRequestAnimationFrame || global.msRequestAnimationFrame || function (callback) {
      setTimeout(callback, 1000 / 60);
    };
    defer.frame = function (callback, context) {
      return push(callbacks.frame, callback, context, requestAnimationFrame);
    };
    var clear;
    defer.timeout = function (callback, ms, context) {
      var ct = callbacks.timeout;
      if (!clear)
        clear = defer.immediate(function () {
          clear = null;
          callbacks.timeout = {};
        });
      return push(ct[ms] || (ct[ms] = []), callback, context, function (iterator) {
        setTimeout(iterator, ms);
      });
    };
    module.exports = defer;
  },
  './node_modules/prime/index.js': function (require, module, exports, global) {
    'use strict';
    var hasOwn = require('./node_modules/mout/object/hasOwn.js'), mixIn = require('./node_modules/mout/object/mixIn.js'), create = require('./node_modules/mout/lang/createObject.js'), kindOf = require('./node_modules/mout/lang/kindOf.js');
    var hasDescriptors = true;
    try {
      Object.defineProperty({}, '~', {});
      Object.getOwnPropertyDescriptor({}, '~');
    } catch (e) {
      hasDescriptors = false;
    }
    var hasEnumBug = !{ valueOf: 0 }.propertyIsEnumerable('valueOf'), buggy = [
        'toString',
        'valueOf'
      ];
    var verbs = /^constructor|inherits|mixin$/;
    var implement = function (proto) {
      var prototype = this.prototype;
      for (var key in proto) {
        if (key.match(verbs))
          continue;
        if (hasDescriptors) {
          var descriptor = Object.getOwnPropertyDescriptor(proto, key);
          if (descriptor) {
            Object.defineProperty(prototype, key, descriptor);
            continue;
          }
        }
        prototype[key] = proto[key];
      }
      if (hasEnumBug)
        for (var i = 0; key = buggy[i]; i++) {
          var value = proto[key];
          if (value !== Object.prototype[key])
            prototype[key] = value;
        }
      return this;
    };
    var prime = function (proto) {
      if (kindOf(proto) === 'Function')
        proto = { constructor: proto };
      var superprime = proto.inherits;
      var constructor = hasOwn(proto, 'constructor') ? proto.constructor : superprime ? function () {
        return superprime.apply(this, arguments);
      } : function () {
      };
      if (superprime) {
        mixIn(constructor, superprime);
        var superproto = superprime.prototype;
        var cproto = constructor.prototype = create(superproto);
        constructor.parent = superproto;
        cproto.constructor = constructor;
      }
      if (!constructor.implement)
        constructor.implement = implement;
      var mixins = proto.mixin;
      if (mixins) {
        if (kindOf(mixins) !== 'Array')
          mixins = [mixins];
        for (var i = 0; i < mixins.length; i++)
          constructor.implement(create(mixins[i].prototype));
      }
      return constructor.implement(proto);
    };
    module.exports = prime;
  },
  './node_modules/mout/array/forEach.js': function (require, module, exports, global) {
    function forEach(arr, callback, thisObj) {
      if (arr == null) {
        return;
      }
      var i = -1, len = arr.length;
      while (++i < len) {
        if (callback.call(thisObj, arr[i], i, arr) === false) {
          break;
        }
      }
    }
    module.exports = forEach;
  },
  './node_modules/mout/array/every.js': function (require, module, exports, global) {
    var makeIterator = require('./node_modules/mout/function/makeIterator_.js');
    function every(arr, callback, thisObj) {
      callback = makeIterator(callback, thisObj);
      var result = true;
      if (arr == null) {
        return result;
      }
      var i = -1, len = arr.length;
      while (++i < len) {
        if (!callback(arr[i], i, arr)) {
          result = false;
          break;
        }
      }
      return result;
    }
    module.exports = every;
  },
  './node_modules/mout/array/map.js': function (require, module, exports, global) {
    var makeIterator = require('./node_modules/mout/function/makeIterator_.js');
    function map(arr, callback, thisObj) {
      callback = makeIterator(callback, thisObj);
      var results = [];
      if (arr == null) {
        return results;
      }
      var i = -1, len = arr.length;
      while (++i < len) {
        results[i] = callback(arr[i], i, arr);
      }
      return results;
    }
    module.exports = map;
  },
  './node_modules/mout/array/filter.js': function (require, module, exports, global) {
    var makeIterator = require('./node_modules/mout/function/makeIterator_.js');
    function filter(arr, callback, thisObj) {
      callback = makeIterator(callback, thisObj);
      var results = [];
      if (arr == null) {
        return results;
      }
      var i = -1, len = arr.length, value;
      while (++i < len) {
        value = arr[i];
        if (callback(value, i, arr)) {
          results.push(value);
        }
      }
      return results;
    }
    module.exports = filter;
  },
  './node_modules/mout/array/some.js': function (require, module, exports, global) {
    var makeIterator = require('./node_modules/mout/function/makeIterator_.js');
    function some(arr, callback, thisObj) {
      callback = makeIterator(callback, thisObj);
      var result = false;
      if (arr == null) {
        return result;
      }
      var i = -1, len = arr.length;
      while (++i < len) {
        if (callback(arr[i], i, arr)) {
          result = true;
          break;
        }
      }
      return result;
    }
    module.exports = some;
  },
  './node_modules/mout/object/hasOwn.js': function (require, module, exports, global) {
    function hasOwn(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    module.exports = hasOwn;
  },
  './node_modules/mout/array/indexOf.js': function (require, module, exports, global) {
    function indexOf(arr, item, fromIndex) {
      fromIndex = fromIndex || 0;
      if (arr == null) {
        return -1;
      }
      var len = arr.length, i = fromIndex < 0 ? len + fromIndex : fromIndex;
      while (i < len) {
        if (arr[i] === item) {
          return i;
        }
        i++;
      }
      return -1;
    }
    module.exports = indexOf;
  },
  './node_modules/mout/object/mixIn.js': function (require, module, exports, global) {
    var forOwn = require('./node_modules/mout/object/forOwn.js');
    function mixIn(target, objects) {
      var i = 0, n = arguments.length, obj;
      while (++i < n) {
        obj = arguments[i];
        if (obj != null) {
          forOwn(obj, copyProp, target);
        }
      }
      return target;
    }
    function copyProp(val, key) {
      this[key] = val;
    }
    module.exports = mixIn;
  },
  './node_modules/mout/function/makeIterator_.js': function (require, module, exports, global) {
    var identity = require('./node_modules/mout/function/identity.js');
    var prop = require('./node_modules/mout/function/prop.js');
    var deepMatches = require('./node_modules/mout/object/deepMatches.js');
    function makeIterator(src, thisObj) {
      if (src == null) {
        return identity;
      }
      switch (typeof src) {
      case 'function':
        return typeof thisObj !== 'undefined' ? function (val, i, arr) {
          return src.call(thisObj, val, i, arr);
        } : src;
      case 'object':
        return function (val) {
          return deepMatches(val, src);
        };
      case 'string':
      case 'number':
        return prop(src);
      }
    }
    module.exports = makeIterator;
  },
  './node_modules/mout/lang/kindOf.js': function (require, module, exports, global) {
    var _rKind = /^\[object (.*)\]$/, _toString = Object.prototype.toString, UNDEF;
    function kindOf(val) {
      if (val === null) {
        return 'Null';
      } else if (val === UNDEF) {
        return 'Undefined';
      } else {
        return _rKind.exec(_toString.call(val))[1];
      }
    }
    module.exports = kindOf;
  },
  './node_modules/mout/lang/createObject.js': function (require, module, exports, global) {
    var mixIn = require('./node_modules/mout/object/mixIn.js');
    function createObject(parent, props) {
      function F() {
      }
      F.prototype = parent;
      return mixIn(new F(), props);
    }
    module.exports = createObject;
  },
  './node_modules/mout/time/now.js': function (require, module, exports, global) {
    function now() {
      return now.get();
    }
    now.get = typeof Date.now === 'function' ? Date.now : function () {
      return +new Date();
    };
    module.exports = now;
  },
  './node_modules/mout/object/forOwn.js': function (require, module, exports, global) {
    var hasOwn = require('./node_modules/mout/object/hasOwn.js');
    var forIn = require('./node_modules/mout/object/forIn.js');
    function forOwn(obj, fn, thisObj) {
      forIn(obj, function (val, key) {
        if (hasOwn(obj, key)) {
          return fn.call(thisObj, obj[key], key, obj);
        }
      });
    }
    module.exports = forOwn;
  },
  './node_modules/mout/function/identity.js': function (require, module, exports, global) {
    function identity(val) {
      return val;
    }
    module.exports = identity;
  },
  './node_modules/mout/function/prop.js': function (require, module, exports, global) {
    function prop(name) {
      return function (obj) {
        return obj[name];
      };
    }
    module.exports = prop;
  },
  './node_modules/mout/object/deepMatches.js': function (require, module, exports, global) {
    var forOwn = require('./node_modules/mout/object/forOwn.js');
    var isArray = require('./node_modules/mout/lang/isArray.js');
    function containsMatch(array, pattern) {
      var i = -1, length = array.length;
      while (++i < length) {
        if (deepMatches(array[i], pattern)) {
          return true;
        }
      }
      return false;
    }
    function matchArray(target, pattern) {
      var i = -1, patternLength = pattern.length;
      while (++i < patternLength) {
        if (!containsMatch(target, pattern[i])) {
          return false;
        }
      }
      return true;
    }
    function matchObject(target, pattern) {
      var result = true;
      forOwn(pattern, function (val, key) {
        if (!deepMatches(target[key], val)) {
          return result = false;
        }
      });
      return result;
    }
    function deepMatches(target, pattern) {
      if (target && typeof target === 'object') {
        if (isArray(target) && isArray(pattern)) {
          return matchArray(target, pattern);
        } else {
          return matchObject(target, pattern);
        }
      } else {
        return target === pattern;
      }
    }
    module.exports = deepMatches;
  },
  './node_modules/mout/lang/isArray.js': function (require, module, exports, global) {
    var isKind = require('./node_modules/mout/lang/isKind.js');
    var isArray = Array.isArray || function (val) {
      return isKind(val, 'Array');
    };
    module.exports = isArray;
  },
  './node_modules/mout/lang/isKind.js': function (require, module, exports, global) {
    var kindOf = require('./node_modules/mout/lang/kindOf.js');
    function isKind(val, kind) {
      return kindOf(val) === kind;
    }
    module.exports = isKind;
  }
}));
