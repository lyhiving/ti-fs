module.exports=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
var $F = Ti.Filesystem,
	fs = exports,
	util = require('util');

var MODE_MAP = {};
MODE_MAP['r'] = MODE_MAP['r+'] = MODE_MAP['rs'] = MODE_MAP['rs+'] = $F.MODE_READ;
MODE_MAP['w'] = MODE_MAP['w+'] = MODE_MAP['wx'] = MODE_MAP['wx+'] = $F.MODE_WRITE;
MODE_MAP['a'] = MODE_MAP['a+'] = MODE_MAP['ax'] = MODE_MAP['ax+'] = $F.MODE_APPEND;

fs.Stats = function Stats() {
	throw new Error('Stats not yet implemented');
};

fs.exists = function exists(path, callback) {
	setTimeout(function() {
		return callback(fs.existsSync(path));
	}, 0);
};

fs.existsSync = function existsSync(path) {
	return $F.getFile(path).exists();
};

fs.readFile = function readFile(path, options, callback_) {
	throw new Error('readFile not yet implemented');
};

fs.readFileSync = function readFileSync(path, options) {
 throw new Error('readFileSync not yet implemented');
};

fs.close = function close(fd, callback) {
	setTimeout(function() {
		var err = null;
		try {
			fd.close();
		} catch (e) {
			err = e;
		}
		return callback(err);
	}, 0);
};

fs.closeSync = function closeSync(fd) {
	fd.close();
};

fs.open = function open(path, flags, mode, callback) {
	callback = maybeCallback(arguments[arguments.length-1]);
	if (!mode || util.isFunction(mode)) {
		mode = null;
	}

	setTimeout(function() {
		var fd = null,
			err = null;
		try {
			fd = fs.openSync(path, flags, mode);
		} catch (e) {
			err = e;
		}
		return callback(err, fd);
	}, 0);
};

fs.openSync = function openSync(path, flags, mode) {
	var tiMode = MODE_MAP[flags];
	if (!tiMode) {
		throw new Error('Unknown file open flag: ' + flags);
	}
	return $F.getFile(path).open(tiMode);
};

fs.read = function read(fd, buffer, offset, length, position, callback) {
	throw new Error('read not yet implemented');
};

fs.readSync = function readSync(fd, buffer, offset, length, position) {
	throw new Error('readSync not yet implemented');
};

fs.write = function write(fd, buffer, offset, length, position, callback) {
	throw new Error('write not yet implemented');
};

fs.writeSync = function writeSync(fd, buffer, offset, length, position) {
	throw new Error('writeSync not yet implemented');
};

fs.rename = function rename(oldPath, newPath, callback) {
	throw new Error('rename not yet implemented');
};

fs.renameSync = function renameSync(oldPath, newPath) {
	throw new Error('renameSync not yet implemented');
};

fs.truncate = function truncate(path, len, callback) {
	throw new Error('truncate not yet implemented');
};

fs.truncateSync = function truncateSync(path, len) {
	throw new Error('truncateSync not yet implemented');
};

fs.ftruncate = function ftruncate(fd, len, callback) {
	throw new Error('ftruncate not yet implemented');
};

fs.ftruncateSync = function ftruncateSync(fd, len) {
	throw new Error('ftruncateSync not yet implemented');
};

fs.rmdir = function rmdir(path, callback) {
	throw new Error('rmdir not yet implemented');
};

fs.rmdirSync = function rmdirSync(path) {
	throw new Error('rmdirSync not yet implemented');
};

fs.fdatasync = function fdatasync(fd, callback) {
	throw new Error('fdatasync not yet implemented');
};

fs.fdatasyncSync = function fdatasyncSync(fd) {
	throw new Error('fdatasyncSync not yet implemented');
};

fs.fsync = function fsync(fd, callback) {
	throw new Error('fsync not yet implemented');
};

fs.fsyncSync = function fsyncSync(fd) {
	throw new Error('fsyncSync not yet implemented');
};

fs.mkdir = function mkdir(path, mode, callback) {
	throw new Error('mkdir not yet implemented');
};

fs.mkdirSync = function mkdirSync(path, mode) {
	throw new Error('mkdirSync not yet implemented');
};

fs.readdir = function readdir(path, callback) {
	throw new Error('readdir not yet implemented');
};

fs.readdirSync = function readdirSync(path) {
	throw new Error('readdirSync not yet implemented');
};

fs.fstat = function fstat(fd, callback) {
	throw new Error('fstat not yet implemented');
};

fs.lstat = function lstat(path, callback) {
	throw new Error('lstat not yet implemented');
};

fs.stat = function stat(path, callback) {
	throw new Error('stat not yet implemented');
};

fs.fstatSync = function fstatSync(fd) {
	throw new Error('fstatSync not yet implemented');
};

fs.lstatSync = function lstatSync(path) {
	throw new Error('lstatSync not yet implemented');
};

fs.statSync = function statSync(path) {
	throw new Error('statSync not yet implemented');
};

fs.readlink = function readlink(path, callback) {
	throw new Error('readlink not yet implemented');
};

fs.readlinkSync = function readlinkSync(path) {
	throw new Error('readlinkSync not yet implemented');
};

fs.symlink = function symlink(destination, path, type_, callback) {
	throw new Error('symlink not yet implemented');
};

fs.symlinkSync = function symlinkSync(destination, path, type) {
	throw new Error('symlinkSync not yet implemented');
};

fs.link = function link(srcpath, dstpath, callback) {
	throw new Error('link not yet implemented');
};

fs.linkSync = function linkSync(srcpath, dstpath) {
	throw new Error('linkSync not yet implemented');
};

fs.unlink = function unlink(path, callback) {
	throw new Error('unlink not yet implemented');
};

fs.unlinkSync = function unlinkSync(path) {
	throw new Error('unlinkSync not yet implemented');
};

fs.fchmod = function fchmod(fd, mode, callback) {
	throw new Error('fchmod not yet implemented');
};

fs.fchmodSync = function fchmodSync(fd, mode) {
	throw new Error('fchmodSync not yet implemented');
};

fs.lchmod = function lchmod(path, mode, callback) {
	throw new Error('lchmod not yet implemented');
};

fs.lchmodSync = function lchmodSync(path, mode) {
	throw new Error('lchmodSync not yet implemented');
};

fs.chmod = function chmod(path, mode, callback) {
	throw new Error('chmod not yet implemented');
};

fs.chmodSync = function chmodSync(path, mode) {
	throw new Error('chmodSync not yet implemented');
};

fs.lchown = function lchown(path, uid, gid, callback) {
	throw new Error('lchown not yet implemented');
};

fs.lchownSync = function lchownSync(path, uid, gid) {
	throw new Error('lchownSync not yet implemented');
};

fs.fchown = function fchown(fd, uid, gid, callback) {
	throw new Error('fchown not yet implemented');
};

fs.fchownSync = function fchownSync(fd, uid, gid) {
	throw new Error('fchownSync not yet implemented');
};

fs.chown = function chown(path, uid, gid, callback) {
	throw new Error('chown not yet implemented');
};

fs.chownSync = function chownSync(path, uid, gid) {
	throw new Error('chownSync not yet implemented');
};

fs._toUnixTimestamp = function _toUnixTimestamp(time) {
	throw new Error('_toUnixTimestamp not yet implemented');
};

fs.utimes = function utimes(path, atime, mtime, callback) {
	throw new Error('utimes not yet implemented');
};

fs.utimesSync = function utimesSync(path, atime, mtime) {
	throw new Error('utimesSync not yet implemented');
};

fs.futimes = function futimes(fd, atime, mtime, callback) {
	throw new Error('futimes not yet implemented');
};

fs.futimesSync = function futimesSync(fd, atime, mtime) {
	throw new Error('futimesSync not yet implemented');
};

fs.writeFile = function writeFile(path, data, options, callback) {
	throw new Error('writeFile not yet implemented');
};

fs.writeFileSync = function writeFileSync(path, data, options) {
	throw new Error('writeFileSync not yet implemented');
};

fs.appendFile = function appendFile(path, data, options, callback_) {
	throw new Error('appendFile not yet implemented');
};

fs.appendFileSync = function appendFileSync(path, data, options) {
	throw new Error('appendFileSync not yet implemented');
};

fs.watch = function watch(filename) {
	throw new Error('watch not yet implemented');
};

fs.watchFile = function watchFile(filename) {
	throw new Error('watchFile not yet implemented');
};

fs.unwatchFile = function unwatchFile(filename, listener) {
	throw new Error('unwatchFile not yet implemented');
};

fs.realpathSync = function realpathSync(p, cache) {
	throw new Error('realpathSync not yet implemented');
};

fs.realpath = function realpath(p, cache, cb) {
	throw new Error('realpath not yet implemented');
};

fs.createReadStream = function createReadStream(path, options) {
	throw new Error('createReadStream not yet implemented');
};

fs.ReadStream = function ReadStream(path, options) {
	throw new Error('ReadStream not yet implemented');
};

fs.FileReadStream = function FileReadStream(path, options) {
	throw new Error('FileReadStream not yet implemented');
};

fs.createWriteStream = function createWriteStream(path, options) {
	throw new Error('createWriteStream not yet implemented');
};

fs.WriteStream = function WriteStream(path, options) {
	throw new Error('WriteStream not yet implemented');
};

fs.FileWriteStream = function FileWriteStream(path, options) {
	throw new Error('FileWriteStream not yet implemented');
};

fs.SyncWriteStream = function SyncWriteStream(fd, options) {
	throw new Error('SyncWriteStream not yet implemented');
};

function maybeCallback(o) {
	return o && Object.prototype.toString.call(o) === '[object Function]' ? o : function(err) {
		if (err) { throw err; }
	};
}

},{"util":4}]},{},[5])(5);