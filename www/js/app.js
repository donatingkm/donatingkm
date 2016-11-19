(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],2:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],3:[function(require,module,exports){
(function (process){
'use strict';
var escapeStringRegexp = require('escape-string-regexp');
var ansiStyles = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasAnsi = require('has-ansi');
var supportsColor = require('supports-color');
var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(ansiStyles).forEach(function (key) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		ansiStyles.dim.open = '';
	}

	while (i--) {
		var code = ansiStyles[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	ansiStyles.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

module.exports = new Chalk();
module.exports.styles = ansiStyles;
module.exports.hasColor = hasAnsi;
module.exports.stripColor = stripAnsi;
module.exports.supportsColor = supportsColor;

}).call(this,require('_process'))

},{"_process":8,"ansi-styles":2,"escape-string-regexp":4,"has-ansi":5,"strip-ansi":11,"supports-color":12}],4:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],5:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex');
var re = new RegExp(ansiRegex().source); // remove the `g` flag
module.exports = re.test.bind(re);

},{"ansi-regex":1}],6:[function(require,module,exports){
//! moment.js
//! version : 2.15.2
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        var k;
        for (k in obj) {
            // even if its not own property I'd still call it non-empty
            return false;
        }
        return true;
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (utils_hooks__hooks.deprecationHandler != null) {
                utils_hooks__hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (utils_hooks__hooks.deprecationHandler != null) {
            utils_hooks__hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return this._months;
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return this._monthsShort;
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = create_utc__createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return units_month__handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        if (!m) {
            return this._weekdays;
        }
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = create_utc__createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = create_utc__createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        ordinalParse: defaultOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, parentConfig = baseConfig;
            // MERGE
            if (locales[name] != null) {
                parentConfig = locales[name]._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (isDate(input)) {
            config._d = input;
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);

            if (tZone === 0) {
                this.utcOffset(0, true);
            } else {
                this.utcOffset(offsetFromString(matchOffset, this._i));
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = lists__get(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = locale_locales__getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return lists__get(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = lists__get(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.15.2';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],7:[function(require,module,exports){
(function (process){
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":8}],8:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

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

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

// EXPOSE
var _sizzle = window.Sizzle;

Sizzle.noConflict = function() {
	if ( window.Sizzle === Sizzle ) {
		window.Sizzle = _sizzle;
	}

	return Sizzle;
};

if ( typeof define === "function" && define.amd ) {
	define(function() { return Sizzle; });
// Sizzle requires that there be a global window in Common-JS like environments
} else if ( typeof module !== "undefined" && module.exports ) {
	module.exports = Sizzle;
} else {
	window.Sizzle = Sizzle;
}
// EXPOSE

})( window );

},{}],10:[function(require,module,exports){
'use strict';

function extend() {
  var obj = {};
  var srcList = Array.prototype.slice.call(arguments, 0);
  for (var i = 0, len = srcList.length; i < len; ++i) {
    var src = srcList[i];
    for (var q in src) {
      if (src.hasOwnProperty(q)) {
        obj[q] = src[q];
      }
    }
  }
  return obj;
}

function addEvent(name, handler) {
  if (window.addEventListener) {
    window.addEventListener(name, handler, false);
  } else if (window.attachEvent) {
    window.attachEvent('on' + name, handler);
  } else {
    window['on' + name] = handler;
  }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 * RNode
 * @constructor
 * @param {String} value 必须
 *
 * value:     区分同级节点的唯一标识
 * params:    value包含的参数，使用{参数名:参数规则}键值对表示
 * before:    路由匹配时，url改变之前执行的回调函数或队列
 * callbacks: 路由匹配时执行的回调函数或队列
 * after:     路由匹配时，url改变之后，callbacks执行完再执行的回调函数或队列
 *
 * _children: 子节点引用列表
 * _parent:   父节点引用
 */

var RNode = function () {
  function RNode(value) {
    classCallCheck(this, RNode);

    var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    if (valueType !== 'string') {
      throw new TypeError('Expected a string in the first argument, got ' + valueType);
    }
    this.value = value;
    this.params = {};
    this.callbacks = null;
    this.before = null;
    this.after = null;
    this._children = [];
    this._parent = null;
  }

  /**
   * set/get children
   * @param {RNode|[RNode]} children **optional**
   * @return {[RNode]|RNode} return children node list or this
   */


  createClass(RNode, [{
    key: 'children',
    value: function children(_children) {
      if (undefined === _children) {
        return this._children;
      }
      if (_children instanceof RNode) {
        this._children.push(_children);
      } else if (isArray(_children)) {
        this._children = this._children.concat(_children);
      } else {
        throw new TypeError('Expected RNode or Array in the first argument, got ' + Object.prototype.toString.call(_children));
      }
      return this;
    }

    /**
     * set/get parent
     * @param {RNode} parent **optional**
     * @return {RNode} return parent node or this
     */

  }, {
    key: 'parent',
    value: function parent(_parent) {
      if (undefined === _parent) {
        return this._parent;
      }
      if (_parent instanceof RNode) {
        this._parent = _parent;
      } else {
        throw new TypeError('Expected RNode in the first argument, got ' + Object.prototype.toString.call(_parent));
      }
      return this;
    }
  }]);
  return RNode;
}();

var historySupport = typeof window.history['pushState'] !== "undefined";

/// Listener
var Listener = {
  listeners: null,

  history: false,

  setUrlOnly: false,

  init: function init(mode) {
    this.history = mode === 'history';
    if (this.history && historySupport) {
      // IE 10+
      addEvent('popstate', onchange);
    } else {
      addEvent('hashchange', onchange);
    }
    return this;
  },

  add: function add(fn) {
    if (!this.listeners) {
      this.listeners = [];
    }
    this.listeners.push(fn);
    return this;
  },

  setHashHistory: function setHashHistory(path) {
    if (this.history) {
      history.pushState({}, document.title, path);
    } else {
      if (path[0] === '/') {
        location.hash = '!' + path;
      } else {
        var currentURL = location.hash.slice(2); // 去掉前面的#!
        var idf = currentURL.indexOf('?');
        if (idf !== -1) {
          currentURL = currentURL.slice(0, idf);
        }
        if (/.*\/$/.test(currentURL)) {
          location.hash = '!' + currentURL + path;
        } else {
          var hash = currentURL.replace(/([^\/]+|)$/, function ($1) {
            return $1 === '' ? '/' + path : path;
          });
          location.hash = '!' + hash;
        }
      }
    }
    return this;
  }
};

function onchange(onChangeEvent) {
  if (Listener.setUrlOnly) {
    Listener.setUrlOnly = false;
    return false;
  }
  var listeners = Listener.listeners;
  for (var i = 0, l = listeners.length; i < l; i++) {
    listeners[i](onChangeEvent);
  }
}

var querystring = {
  /**
   * querystring.stringify
   * @param { Object } obj
   * @param { Boolean } traditional [default:false]
   * @return { String }
   *
   * traditional is true:  {x: [1, 2]} => 'x=1&x=2'
   * traditional is false: {x: [1, 2]} => 'x[]=1&x[]=2'
   */
  stringify: function stringify(obj, traditional) {
    if (!obj) {
      return '';
    }
    var appendString = traditional ? '' : '[]';
    var names = Object.keys(obj).sort();

    var parts = [];
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
      var value = obj[name];

      if (Array.isArray(value)) {
        value.sort();
        var _parts = [];
        for (var j = 0; j < value.length; ++j) {
          _parts.push('' + encodeURIComponent(name).replace(/%20/g, '+') + appendString + '=' + encodeURIComponent(value[j]).replace(/%20/g, '+'));
        }
        parts.push(_parts.join('&'));
        continue;
      }
      parts.push(encodeURIComponent(name).replace(/%20/g, '+') + '=' + encodeURIComponent(value).replace(/%20/g, '+'));
    }
    return parts.join('&');
  },

  /**
   * querystring.parse
   * @param { String } queryString
   * @return { Object }
   * 
   * 'x=1&y=2' => {x: 1, y: 2}
   * 'x=1&x=2' => {x: 2}
   */
  parse: function parse(queryString) {
    if (typeof queryString !== 'string') {
      return {};
    }

    queryString = queryString.trim().replace(/^(\?|#)/, '');

    if (queryString === '') {
      return {};
    }

    var queryParts = queryString.split('&');

    var query = {};

    for (var i = 0; i < queryParts.length; ++i) {
      var parts = queryParts[i].replace(/\+/g, '%20').split('='); // 特殊字符`+`转换为空格
      var name = parts[0],
          value = parts[1];

      name = decodeURIComponent(name);

      value = value === undefined ? null : decodeURIComponent(value);

      if (!query.hasOwnProperty(name)) {
        query[name] = value;
      } else if (Array.isArray(query[name])) {
        query[name].push(value);
      } else {
        query[name] = [query[name], value];
      }
    }
    return query;
  }
};

// TODO: root怎么处理？
function handler(onChangeEvent) {
  var mode = this.options.mode;
  var url = void 0;
  switch (mode) {
    case 'history':
      url = location.pathname + location.search + location.hash;
      if (url.substr(0, 1) !== '/') {
        url = '/' + url;
      }
      break;
    case 'hashbang':
    default:
      var hash = location.hash.slice(1);
      if (hash === '' || hash === '!') {
        return this.redirect(this.options.root);
      }
      var newURL = onChangeEvent && onChangeEvent.newURL || location.hash;
      url = newURL.replace(/.*#!/, '');
  }
  this.dispatch(url.charAt(0) === '/' ? url : '/' + url);
}

/**
 * 根据给定的path，查找路由树，返回path对应的节点。如果节点不存在就创建新的节点
 * 匹配参数（参数名由字母、数字、下划线组成，不能以数字开头。后面带括号的是特定参数的匹配规则。）
 * @param {RNode} tree
 * @param {String} path
 * @param {Boolean} onlyFind 只找节点，当节点不存在时不要创建新节点
 * @return {RNode}
 * */
function findNode(tree, path, onlyFind) {
  onlyFind = !!onlyFind;
  var parts = path.split('/');
  var target = null,
      found = false;
  var parent = tree;
  var params;
  for (var i = 0, len = parts.length; i < len; ++i) {
    params = false;
    var realCurrentValue = parts[i];

    var matcher = /:([a-zA-Z_][a-zA-Z0-9_]*)(\([^\)]+\))?/g;

    var k = 0;

    /* jshint ignore:start */
    realCurrentValue = realCurrentValue.replace(matcher, function ($1, $2, $3) {
      params = params || [];
      params[k++] = $2;
      if (typeof $3 === 'undefined') {
        return '([a-zA-Z0-9_]+)';
      } else {
        return $3;
      }
    });
    /* jshint ignore:end */

    for (var j = 0; j < parent._children.length; ++j) {
      if (parent._children[j].value === realCurrentValue) {
        target = parent._children[j];
        found = true;
        break;
      }
    }
    if (!found) {
      // 不存在，创建新节点
      if (onlyFind) return false;
      var extendNode = new RNode(realCurrentValue);
      parent.children(extendNode);
      extendNode.parent(parent);
      extendNode.params = params;
      target = extendNode;
    }
    parent = target;
    found = false;
  }
  return target;
}

/**
 * 构造路由树/子树
 * @param {RNode} root 当前根节点
 * @param {Object} routes 当前节点的路由表
 * @return {RNode} 返回根节点
 * */
function createRouteTree(root, routes) {

  if (typeof routes === 'function') {
    root.callbacks = [routes];
    return root;
  } else if (Array.isArray(routes)) {
    root.callbacks = routes;
    return root;
  }

  for (var path in routes) {
    if (routes.hasOwnProperty(path)) {

      var fns = routes[path];

      if (path === '/') {
        createRouteTree(root, fns);
      } else {
        if (path !== '' && path[0] === '/') {
          path = path.slice(1);
        }
        createRouteTree(findNode(root, path), fns);
      }
    }
  }

  return root;
}

/**
 * @param {RNode} root 当前节点
 * @param {Array} parts 路径分段数组
 * @param {Integer} ci 当前路径分段索引
 * @param {Integer} ri 当前节点所在兄弟节点列表的位置
 * @params {Object} params 记录参数的对象
 * @return {[RNode, Object]} 同时返回节点和参数
 */
function dfs(root, parts, ci, ri, params) {

  var value = parts[ci];

  var newParams = {};
  for (var p in params) {
    // copy: params => newParams
    if (params.hasOwnProperty(p)) {
      newParams[p] = params[p];
    }
  }

  var parent = root.parent();

  if (parent === null && ri > 0) {
    // finally not matched
    return [false, newParams];
  }

  if (parent !== null && ri > parent._children.length - 1) {
    // not matched, go back
    return [false, newParams];
  }

  if (ci > parts.length - 1 || ci < 0) return [false, newParams];

  var matcher = new RegExp('^' + root.value + '$');
  var matches = value.match(matcher);

  if (matches === null) return [false, newParams]; // not matched, go back

  if (!!root.params) {
    matches = [].slice.apply(matches, [1]);
    for (var k = 0; k < matches.length; ++k) {
      newParams[root.params[k]] = matches[k];
    }
  }

  if (ci === parts.length - 1 && root.callbacks !== null) {
    // finally matched
    return [root, newParams];
  }

  for (var i = 0; i < root._children.length; ++i) {
    var found = dfs(root._children[i], parts, ci + 1, i, newParams); // matched, go ahead
    if (!found[0]) continue;
    return found;
  }

  return dfs(root, parts, ci, ri + 1, params); // not matched, go back
}

/**
 * 搜索路由树，看是否存在匹配的路径，如果存在，返回相应的回调函数
 * @todo 只返回第一个匹配到的路由（如果存在多个匹配？）
 * @param {RNode} tree 树根
 * @param {String} path 要匹配的路径
 * 返回值包含两个，用数组表示[callbacks, params]
 * @return {Function|Array|null} 如果存在就返回相应的回调，否则返回null
 * @return {[Array, Object]} 同时返回回调和参数
 *
 * */
function searchRouteTree(tree, path) {

  var found = dfs(tree, path.split('/'), 0, 0, {});

  if (!found[0]) {
    return [null, {}];
  }

  return [found[0].callbacks, found[1]];
}

var optionDefaults = {
  // mode可以是history|hashbang
  // mode:history     使用HTML5 History API
  // mode:hashbang    使用hash（hashbang模式）
  root: '/', // TODO
  mode: 'hashbang',
  notFound: false,
  recurse: false // TODO
};

/**
 * Router (routes)
 * @constructor
 * @param {Object} routes **Optional**
 */

function Router(routes) {
  routes = routes || {};
  var root = new RNode('');
  root.params = false;
  this.routeTree = createRouteTree(root, routes);
  this.options = {};
  this._hooks = {};
  this.configure(optionDefaults);
}

var proto = Router.prototype;

/**
 * .configure()
 * @method
 * @param {Object} options **Optional**
 * @return this
 */
proto.configure = function (options) {
  options = options || {};
  this.options = extend(this.options, options);
  return this;
};

/**
 * .start()
 * @method
 * @param {Object} options
 * @return this
 */
proto.start = function (options) {
  var _this = this;

  options = options || {};
  this._hooks['beforeEach'] = options.beforeEach ? [options.beforeEach] : [];
  this._hooks['afterEach'] = options.afterEach ? [options.afterEach] : [];
  // 初始化配置
  this.configure(options);
  Listener.init(this.options.mode).add(function () {
    return handler.call(_this);
  });
  // 首次触发
  handler.call(this);
  return this;
};

// 停止路由监听
proto.stop = function () {
  Listener.stop();
  return this;
};

/**
 * .mount() 将路由挂载到某个节点上
 * @method
 * @param {String} path
 * @param {Object} routes
 * @return this
 */
proto.mount = function (path, routes) {
  if (path !== '' && path[0] === '/') {
    path = path.slice(1);
  }
  createRouteTree(findNode(this.routeTree, path), routes);
  return this;
};

/**
 * .on()
 * @method
 * @param {String|RegExp} path
 * @param {Function|Array} handlers
 * @return this
 */
proto.on = function (path, handlers) {
  if (path !== '' && path[0] === '/') {
    path = path.slice(1);
  }
  var n = findNode(this.routeTree, path);
  n.callbacks = n.callbacks || [];
  if (Array.isArray(handlers)) {
    n.callbacks = n.callbacks.concat(handlers);
  } else if (typeof handlers === 'function') {
    n.callbacks.push(handlers);
  }
  return this;
};

/**
 * .dispatch() 根据给定的路径，遍历路由树，只要找到一个匹配的就把路由返回
 * @method
 * @param {String} path
 * @return this
 */
proto.dispatch = function (path) {
  var routeTree = this.routeTree;
  // 保存原始请求uri
  var uri = path;
  // 取出query部分
  var queryIndex = path.indexOf('?');
  var hashIndex = path.indexOf('#');
  hashIndex = hashIndex === -1 ? path.length : hashIndex;
  var queryString = queryIndex === -1 ? '' : path.slice(queryIndex + 1, hashIndex);
  path = queryIndex === -1 ? path : path.slice(0, queryIndex);
  var req = { uri: uri, path: path, query: querystring.parse(queryString), $router: this };

  if (path === '/') {
    path = '';
  }
  var result = searchRouteTree(routeTree, path);
  var callbacks = result[0];
  req.params = result[1];
  this._callHooks('beforeEach', req);
  if (callbacks !== null) {
    if (Array.isArray(callbacks)) {
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        // 不考虑异步操作
        var pre = callbacks[i].call(this, req); // @TODO 可以中断 callback 的调用
        if (typeof pre === 'boolean' && !pre) {
          // 如果前一个 callback 返回了 false ，就不执行后面的 callback
          break;
        }
      }
    } else {
      throw new TypeError('Expected Array, got ' + (typeof callbacks === 'undefined' ? 'undefined' : _typeof(callbacks)));
    }
  } else if (this.options.notFound) {
    this.options.notFound(req);
  }
  this._callHooks('afterEach', req);
  return this;
};

/**
 * 这个方法会改变当前的`url`，从而触发路由（和dispatch类似，但是dispatch不会改动`url`）
 * 这个方法对于hash/hashbang模式没有多大用处，用户可以通过点击<a>标签实现`url`改变而不跳转页面，但是在history模式下，用户无法通过标签改变`url`而不跳转页面
 * 改方法相当于调用一次history.pushState()然后再调用.dispatch()
 * 如果url没有改变，则不"刷新"
 *
 * @param {String} path
 * @return this
 */
proto.setRoute = function (path) {
  var loc = window.location;
  var oldURI = loc.pathname + loc.search;
  Listener.setHashHistory(path);
  var newURI = loc.pathname + loc.search;
  if (this.options.mode === 'history' && oldURI !== newURI) {
    this.dispatch(newURI);
  }
  return this;
};

/**
 * 这个方法会改变当前的 `url` 但是不触发路由
 */
proto.setUrl = function (path) {
  Listener.setUrlOnly = true;
  Listener.setHashHistory(path);
  return this;
};

/**
 * alias: `setRoute`
 */
proto.redirect = function (path) {
  return this.setRoute(path);
};

/**
 * TODO: once
 * 和.on()方法类似，但只会触发一次
 * @param {String|RegExp} path
 * @param {Function|Array} handlers
 * @return this
 */
proto.once = function (path, handlers) {
  return this;
};

/**
 * .off()方法表示不再侦听某个路由，直接将该路由节点的所有callbacks移除
 * @return this
 */
proto.off = function (path) {
  if (path !== '' && path[0] === '/') {
    path = path.slice(1);
  }
  var n = findNode(this.routeTree, path);
  if (n !== null && n.callbacks !== null) {
    n.callbacks.splice(0, n.callbacks.length);
  }
  return this;
};

/**
 * .reload()
 * reload page: redispatch current path
 * @method
 * @return this
 */
proto.reload = function () {
  if (this.options.mode === 'history') {
    this.dispatch(location.pathname + location.search + location.hash);
  } else if (this.options.mode === 'hashbang') {
    this.dispatch(location.hash.slice(2));
  } else {
    this.dispatch(location.hash.slice(1));
  }
  return this;
};

proto._callHooks = function (hookName, req) {
  var callbacks = this._hooks[hookName] || [];
  for (var i = 0; i < callbacks.length; ++i) {
    callbacks[i].call(this, req);
  }
};

module.exports = Router;


},{}],11:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":1}],12:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))

},{"_process":8}],13:[function(require,module,exports){
/**
 * Template7 1.1.0
 * Mobile-first JavaScript template engine
 * 
 * http://www.idangero.us/template7/
 * 
 * Copyright 2015, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 * 
 * Licensed under MIT
 * 
 * Released on: October 3, 2015
 */
window.Template7=function(){"use strict";function e(e){return"[object Array]"===Object.prototype.toString.apply(e)}function t(e){return"function"==typeof e}function r(e){var t,r,n,i=e.replace(/[{}#}]/g,"").split(" "),a=[];for(r=0;r<i.length;r++){var l=i[r];if(0===r)a.push(l);else if(0===l.indexOf('"'))if(2===l.match(/"/g).length)a.push(l);else{for(t=0,n=r+1;n<i.length;n++)if(l+=" "+i[n],i[n].indexOf('"')>=0){t=n,a.push(l);break}t&&(r=t)}else if(l.indexOf("=")>0){var o=l.split("="),p=o[0],s=o[1];if(2!==s.match(/"/g).length){for(t=0,n=r+1;n<i.length;n++)if(s+=" "+i[n],i[n].indexOf('"')>=0){t=n;break}t&&(r=t)}var f=[p,s.replace(/"/g,"")];a.push(f)}else a.push(l)}return a}function n(t){var n,i,a=[];if(!t)return[];var l=t.split(/({{[^{^}]*}})/);for(n=0;n<l.length;n++){var o=l[n];if(""!==o)if(o.indexOf("{{")<0)a.push({type:"plain",content:o});else{if(o.indexOf("{/")>=0)continue;if(o.indexOf("{#")<0&&o.indexOf(" ")<0&&o.indexOf("else")<0){a.push({type:"variable",contextName:o.replace(/[{}]/g,"")});continue}var p=r(o),s=p[0],f=">"===s,c=[],u={};for(i=1;i<p.length;i++){var h=p[i];e(h)?u[h[0]]="false"===h[1]?!1:h[1]:c.push(h)}if(o.indexOf("{#")>=0){var d,v="",g="",m=0,x=!1,y=!1,O=0;for(i=n+1;i<l.length;i++)if(l[i].indexOf("{{#")>=0&&O++,l[i].indexOf("{{/")>=0&&O--,l[i].indexOf("{{#"+s)>=0)v+=l[i],y&&(g+=l[i]),m++;else if(l[i].indexOf("{{/"+s)>=0){if(!(m>0)){d=i,x=!0;break}m--,v+=l[i],y&&(g+=l[i])}else l[i].indexOf("else")>=0&&0===O?y=!0:(y||(v+=l[i]),y&&(g+=l[i]));x&&(d&&(n=d),a.push({type:"helper",helperName:s,contextName:c,content:v,inverseContent:g,hash:u}))}else o.indexOf(" ")>0&&(f&&(s="_partial",c[0]&&(c[0]='"'+c[0].replace(/"|'/g,"")+'"')),a.push({type:"helper",helperName:s,contextName:c,hash:u}))}}return a}var i=function(e){function t(e,t){return e.content?l(e.content,t):function(){return""}}function r(e,t){return e.inverseContent?l(e.inverseContent,t):function(){return""}}function i(e,t){var r,n,i=0;if(0===e.indexOf("../")){i=e.split("../").length-1;var a=t.split("_")[1]-i;t="ctx_"+(a>=1?a:1),n=e.split("../")[i].split(".")}else 0===e.indexOf("@global")?(t="Template7.global",n=e.split("@global.")[1].split(".")):0===e.indexOf("@root")?(t="root",n=e.split("@root.")[1].split(".")):n=e.split(".");r=t;for(var l=0;l<n.length;l++){var o=n[l];0===o.indexOf("@")?l>0?r+="[(data && data."+o.replace("@","")+")]":r="(data && data."+e.replace("@","")+")":isFinite(o)?r+="["+o+"]":0===o.indexOf("this")?r=o.replace("this",t):r+="."+o}return r}function a(e,t){for(var r=[],n=0;n<e.length;n++)0===e[n].indexOf('"')?r.push(e[n]):r.push(i(e[n],t));return r.join(", ")}function l(e,l){if(l=l||1,e=e||o.template,"string"!=typeof e)throw new Error("Template7: Template must be a string");var p=n(e);if(0===p.length)return function(){return""};var s="ctx_"+l,f="";f+=1===l?"(function ("+s+", data, root) {\n":"(function ("+s+", data) {\n",1===l&&(f+="function isArray(arr){return Object.prototype.toString.apply(arr) === '[object Array]';}\n",f+="function isFunction(func){return (typeof func === 'function');}\n",f+='function c(val, ctx) {if (typeof val !== "undefined" && val !== null) {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n',f+="root = root || ctx_1 || {};\n"),f+="var r = '';\n";var c;for(c=0;c<p.length;c++){var u=p[c];if("plain"!==u.type){var h,d;if("variable"===u.type&&(h=i(u.contextName,s),f+="r += c("+h+", "+s+");"),"helper"===u.type)if(u.helperName in o.helpers)d=a(u.contextName,s),f+="r += (Template7.helpers."+u.helperName+").call("+s+", "+(d&&d+", ")+"{hash:"+JSON.stringify(u.hash)+", data: data || {}, fn: "+t(u,l+1)+", inverse: "+r(u,l+1)+", root: root});";else{if(u.contextName.length>0)throw new Error('Template7: Missing helper: "'+u.helperName+'"');h=i(u.helperName,s),f+="if ("+h+") {",f+="if (isArray("+h+")) {",f+="r += (Template7.helpers.each).call("+s+", "+h+", {hash:"+JSON.stringify(u.hash)+", data: data || {}, fn: "+t(u,l+1)+", inverse: "+r(u,l+1)+", root: root});",f+="}else {",f+="r += (Template7.helpers.with).call("+s+", "+h+", {hash:"+JSON.stringify(u.hash)+", data: data || {}, fn: "+t(u,l+1)+", inverse: "+r(u,l+1)+", root: root});",f+="}}"}}else f+="r +='"+u.content.replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/'/g,"\\'")+"';"}return f+="\nreturn r;})",eval.call(window,f)}var o=this;o.template=e,o.compile=function(e){return o.compiled||(o.compiled=l(e)),o.compiled}};i.prototype={options:{},partials:{},helpers:{_partial:function(e,t){var r=i.prototype.partials[e];if(!r||r&&!r.template)return"";r.compiled||(r.compiled=a.compile(r.template));var n=this;for(var l in t.hash)n[l]=t.hash[l];return r.compiled(n,t.data,t.root)},escape:function(e,t){if("string"!=typeof e)throw new Error('Template7: Passed context to "escape" helper should be a string');return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")},"if":function(e,r){return t(e)&&(e=e.call(this)),e?r.fn(this,r.data):r.inverse(this,r.data)},unless:function(e,r){return t(e)&&(e=e.call(this)),e?r.inverse(this,r.data):r.fn(this,r.data)},each:function(r,n){var i="",a=0;if(t(r)&&(r=r.call(this)),e(r)){for(n.hash.reverse&&(r=r.reverse()),a=0;a<r.length;a++)i+=n.fn(r[a],{first:0===a,last:a===r.length-1,index:a});n.hash.reverse&&(r=r.reverse())}else for(var l in r)a++,i+=n.fn(r[l],{key:l});return a>0?i:n.inverse(this)},"with":function(e,r){return t(e)&&(e=e.call(this)),r.fn(e)},join:function(e,r){return t(e)&&(e=e.call(this)),e.join(r.hash.delimiter||r.hash.delimeter)},js:function(e,t){var r;return r=e.indexOf("return")>=0?"(function(){"+e+"})":"(function(){return ("+e+")})",eval.call(this,r).call(this)},js_compare:function(e,t){var r;r=e.indexOf("return")>=0?"(function(){"+e+"})":"(function(){return ("+e+")})";var n=eval.call(this,r).call(this);return n?t.fn(this,t.data):t.inverse(this,t.data)}}};var a=function(e,t){if(2===arguments.length){var r=new i(e),n=r.compile()(t);return r=null,n}return new i(e)};return a.registerHelper=function(e,t){i.prototype.helpers[e]=t},a.unregisterHelper=function(e){i.prototype.helpers[e]=void 0,delete i.prototype.helpers[e]},a.registerPartial=function(e,t){i.prototype.partials[e]={template:t}},a.unregisterPartial=function(e,t){i.prototype.partials[e]&&(i.prototype.partials[e]=void 0,delete i.prototype.partials[e])},a.compile=function(e,t){var r=new i(e,t);return r.compile()},a.options=i.prototype.options,a.helpers=i.prototype.helpers,a.partials=i.prototype.partials,a}();


},{}],14:[function(require,module,exports){
'use strict';

var ListComponent = require('./list');
var ItemComponent = require('./item');

module.exports = {
  ListComponent: ListComponent,
  ItemComponent: ItemComponent
};

},{"./item":15,"./list":17}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('../../core'),
    Component = _require.Component;

var Template = require('./template');

var ItemComponent = function (_Component) {
  _inherits(ItemComponent, _Component);

  function ItemComponent() {
    _classCallCheck(this, ItemComponent);

    return _possibleConstructorReturn(this, (ItemComponent.__proto__ || Object.getPrototypeOf(ItemComponent)).call(this, {
      name: 'Item',
      tagName: 'item',
      type: 'component',
      componentTemplate: Template
    }));
  }

  _createClass(ItemComponent, [{
    key: 'start',
    value: function start() {
      _get(ItemComponent.prototype.__proto__ || Object.getPrototypeOf(ItemComponent.prototype), 'start', this).call(this);
      this.render({
        classCss: 'css-item'
      });
    }
  }]);

  return ItemComponent;
}(Component);

module.exports = ItemComponent;

},{"../../core":20,"./template":16}],16:[function(require,module,exports){
'use strict';

module.exports = function (classCss, options) {
    var className = '' + classCss;
    return '<a href="" class="' + className + '">Test</a>';
};

},{}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('../../core'),
    Component = _require.Component;

var _require2 = require('../../mocks'),
    Posts = _require2.Posts;

var Template = require('./template');

var ListComponent = function (_Component) {
  _inherits(ListComponent, _Component);

  function ListComponent() {
    _classCallCheck(this, ListComponent);

    return _possibleConstructorReturn(this, (ListComponent.__proto__ || Object.getPrototypeOf(ListComponent)).call(this, {
      id: 'list',
      name: 'List',
      tagName: 'list',
      type: 'component',
      classCss: 'list-items',
      target: 'list',
      componentTemplate: Template
    }));
  }

  _createClass(ListComponent, [{
    key: 'start',
    value: function start() {
      _get(ListComponent.prototype.__proto__ || Object.getPrototypeOf(ListComponent.prototype), 'start', this).call(this);
      this.render({
        classCss: 'css-list',
        Posts: Posts
      });
    }
  }]);

  return ListComponent;
}(Component);

module.exports = ListComponent;

},{"../../core":20,"../../mocks":24,"./template":18}],18:[function(require,module,exports){
'use strict';

module.exports = function (classCss, options) {
    var className = '' + classCss;
    var posts = options.root.Posts;
    var length = posts.length;
    var items = '';
    for (var i = 0; length > i; i++) {
        var itemId = 'item-' + posts[i].id;
        items += '<li><item id="' + itemId + '"></item></li>';
        this.dependencies.push(itemId + ':item');
    }
    return '<ul class="' + className + '">' + items + '</ul>';
};

},{}],19:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

require('template7/dist/template7.min.js');
var Module = require('./module');

var Component = function (_Module) {
  _inherits(Component, _Module);

  function Component(args) {
    _classCallCheck(this, Component);

    var _this = _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).call(this, args));

    _this.id = args.id;
    _this.dependencies = [];
    _this.oData = {
      current: {},
      previous: {}
    };
    _this.hashData = {
      current: {},
      previous: {}
    };
    _this.tpl = args.template || null;
    _this.containerCache = null;
    _this.target = '' + args.target;
    _this.buildCache = null;
    _this.mountedCache = null;
    _this.refDomCache = null;
    _this.targetCache = null;
    _this.templateEngine = window.Template7;
    _this.componentTemplate = args.componentTemplate || null;
    _this.tagName = args.tagName || 'default';
    _this.classCss = args.classCss || 'default';
    return _this;
  }

  _createClass(Component, [{
    key: 'listenEvents',
    value: function listenEvents() {
      var _this2 = this;

      this.listenTo({
        onChangeData: function onChangeData() {
          var data = _this2.data.current;
          var template = '{{' + _this2.tagName + ' classCss}}';
          _this2.createBuild(data, template);
        },
        onBuild: function onBuild() {
          var build = _this2.build;
          var target = _this2.target;
          _this2.mount(build, target);
        },
        onMount: function onMount() {
          var mounted = _this2.mounted;
          _this2.renderDependencies(mounted);
        },
        onRenderDependencies: function onRenderDependencies() {
          var cointainer = _this2.container || document;
          var target = _this2.targetCache;
          var mounted = _this2.mounted;
          _this2.insertDom(target, mounted);
        }
      });
    }
  }, {
    key: 'mount',
    value: function mount(build, target) {
      var cointainer = this.container || document;
      this.targetCache = this.refDom || this.$('#' + this.target, cointainer)[0];
      var type = this.targetCache.nodeName;
      var mounted = document.createElement(type);
      mounted.id = target;
      mounted.innerHTML = build;
      this.mounted = mounted;
      this.emit(this.id + ':onMount', {
        data: this.data,
        template: this.template,
        build: this.build,
        mounted: this.mounted
      });
    }
  }, {
    key: 'insertDom',
    value: function insertDom(target, mounted) {
      var targetElement = target;
      targetElement.parentNode.replaceChild(mounted, targetElement);
      this.refDom = mounted;
      this.emit(this.id + ':onRender', {
        id: this.id + ':' + this.tagName
      });
    }
  }, {
    key: 'setup',
    value: function setup(options) {

      if (options.target) {
        this.target = options.target;
      }

      if (options.id) {
        this.id = options.id;
      }

      if (options.name) {
        this.name = options.name;
      }

      if (options.template) {
        this.template = options.template;
      }

      if (options.refDom) {
        this.refDom = options.refDom;
      }

      if (options.data) {
        this.setData(options.data);
      }

      if (options.container) {
        this.container = options.container;
      }
    }
  }, {
    key: 'createBuild',
    value: function createBuild(newData, newTemplate) {
      var template = newTemplate || this.template;
      var data = newData || this.data.current;
      this.build = this.compile(template, data);
      this.emit(this.id + ':onBuild', {
        data: this.data,
        template: this.template,
        build: this.build
      });
    }
  }, {
    key: 'registerTags',
    value: function registerTags() {
      var templateEngine = this.templateEngine;
      templateEngine.registerHelper('' + this.tagName, this.componentTemplate.bind(this));
    }
  }, {
    key: 'compile',
    value: function compile(template, data) {
      var templateEngine = this.templateEngine;
      this.registerTags();
      var compiledTemplate = templateEngine.compile(template);
      return compiledTemplate(data);
    }
  }, {
    key: 'hashCode',
    value: function hashCode(string) {
      var hash = 0,
          i = void 0,
          chr = void 0;
      var len = string.length;
      if (string.length === 0) return hash;
      for (i = 0; i < len; i++) {
        chr = string.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }
  }, {
    key: 'hasChangeData',
    value: function hasChangeData(newData, forceToChange) {
      var newHashData = this.hashCode(JSON.stringify(newData));
      var hasChanged = false;
      if (forceToChange || newHashData !== this.hashData.current) {
        this.hashData.previous = this.hashData.current;
        this.hashData.current = newHashData;
        hasChanged = true;
      }
      return hasChanged;
    }
  }, {
    key: 'setData',
    value: function setData(newData) {
      var forceToChange = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (this.hasChangeData(newData, forceToChange)) {
        this.data.previous = this.data.current;
        this.data.current = Object.assign(this.data.current, newData);
        this.emit(this.id + ':onChangeData', {
          data: this.data
        });
      }
    }
  }, {
    key: 'renderDependencies',
    value: function renderDependencies(mounted) {
      var _this3 = this;

      var targetDependencies = this.dependencies;
      var length = targetDependencies.length;
      var counter = 0;
      var i = 0;
      for (; length > i; i++) {
        var instanceName = targetDependencies[i].split(':')[0];
        var className = targetDependencies[i].split(':')[1];
        App.component(targetDependencies[i]).setup({ id: instanceName, target: instanceName, container: mounted });
        App.component(targetDependencies[i]).listenEvents();
        App.component(targetDependencies[i]).listenTo({
          onRender: function onRender(event) {
            var id = event.detail.id;
            if (length - 1 === counter) {
              _this3.emit(_this3.id + ':onRenderDependencies');
            } else {
              counter++;
            }
          }
        }, instanceName);

        App.component(targetDependencies[i]).render(this.data);
      }

      if (length === 0) {
        this.emit(this.id + ':onRenderDependencies');
      }
    }
  }, {
    key: 'render',
    value: function render(newData) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var data = newData || this.data;
      this.setData(data, force);
    }
  }, {
    key: 'mounted',
    set: function set(value) {
      this.mountedCache = value;
    },
    get: function get() {
      return this.mountedCache;
    }
  }, {
    key: 'build',
    set: function set(value) {
      this.buildCache = value;
    },
    get: function get() {
      return this.buildCache;
    }
  }, {
    key: 'template',
    set: function set(value) {
      this.tpl = value;
    },
    get: function get() {
      return this.tpl;
    }
  }, {
    key: 'data',
    set: function set(value) {
      this.oData = value;
    },
    get: function get() {
      return this.oData;
    }
  }, {
    key: 'refDom',
    get: function get() {
      return this.refDomCache;
    },
    set: function set(value) {
      this.refDomCache = value;
    }
  }, {
    key: 'container',
    get: function get() {
      return this.containerCache;
    },
    set: function set(value) {
      this.containerCache = value;
    }
  }]);

  return Component;
}(Module);

module.exports = Component;

},{"./module":21,"template7/dist/template7.min.js":13}],20:[function(require,module,exports){
'use strict';

var Component = require('./component');
var Module = require('./module');
var View = require('./view');

module.exports = {
  Component: Component,
  Module: Module,
  View: View
};

},{"./component":19,"./module":21,"./view":22}],21:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sizzle = require('sizzle');

var _require = require('./../sandbox'),
    debug = _require.debug,
    dispatcher = _require.dispatcher;

var Module = function () {
  function Module(args) {
    _classCallCheck(this, Module);

    this.name = args.name || 'defaultModule';
    this.type = args.type || 'module';
    this.running = false;

    this.config = {
      delay: 0,
      events: {
        onStart: function onStart() {},
        onStop: function onStop() {}
      },
      requires: []
    };
  }

  _createClass(Module, [{
    key: 'setConfig',
    value: function setConfig(config) {
      this.config = Object.assign(this.config, config);
    }
  }, {
    key: 'listenEvents',
    value: function listenEvents() {
      this.listenTo({
        'onStart': this.config.events.onStart,
        'onStop': this.config.events.onStop
      }, this.id);
    }
  }, {
    key: '$',
    value: function $() {
      return Sizzle.apply(Sizzle, arguments);
    }
  }, {
    key: 'listenTo',
    value: function listenTo() {
      var events = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.id;

      for (var event in events) {
        var handler = events[event];
        var target = window;
        var eventName = type + ':' + event;

        if (type === 'Dom') {
          target = this.$(event.split(':')[0]);
          eventName = event.split(':')[1];
        }

        this.subscribe(target, eventName, handler, false);
      }
    }
  }, {
    key: 'setup',
    value: function setup(config) {
      this.setConfig(config);
    }
  }, {
    key: 'require',
    value: function require() {
      var _this = this;

      var modules = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      modules.map(function (moduleName, index) {
        _this.reqires.push(moduleName);
        window.addEventListener('module:' + moduleName, function (event) {
          var _event$detail = event.detail,
              running = _event$detail.running,
              moduleName = _event$detail.moduleName;

          if (running) {
            var requires = _this.requires;
            var posToDelete = requires.indexOf(moduleName);
            requires.slice(posToDelete, requires.length);
            _this.requires = requires;
            _this.checkRequires();
          }
        });
      });
    }
  }, {
    key: 'fnStart',
    value: function fnStart(callback) {
      this.running = true;
      debug.log('Module(' + this.id + ') is started');
      this.emit('onStart');
    }
  }, {
    key: 'checkRequires',
    value: function checkRequires() {
      var requires = this.config.requires;
      if (requires.length === 0) {
        this.runStart();
      }
    }
  }, {
    key: 'runStart',
    value: function runStart() {
      var _this2 = this;

      if (this.config.delay === 0) {
        this.fnStart();
      } else {
        setTimeout(function () {
          _this2.fnStart();
        }, this.config.delay);
      }
    }
  }, {
    key: 'start',
    value: function start() {
      this.listenEvents();
      this.checkRequires();
    }
  }, {
    key: 'getEventName',
    value: function getEventName(eventName) {
      return eventName.indexOf(':') === -1 ? this.id + ':' + eventName : eventName;
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.running = false;
      debug.log('Module(' + this.id + ') is stoped');
      this.emit(this.id + ':onStop');
    }
  }, {
    key: 'emit',
    value: function emit(eventName) {
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      this.createEvent(eventName, args);
      var event = this.getEventName(eventName);
      dispatcher.emit(event);
    }
  }, {
    key: 'createEvent',
    value: function createEvent(eventName, details) {
      var event = this.getEventName(eventName);
      dispatcher.createEvent(event, details);
    }
  }, {
    key: 'subscribe',
    value: function subscribe() {
      var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
      var eventName = arguments[1];
      var handler = arguments[2];
      var bubbling = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var event = eventName.indexOf(':') === -1 ? this.id + ':' + eventName : eventName;
      dispatcher.subscribe(target, event, handler, bubbling);
    }
  }]);

  return Module;
}();

module.exports = Module;

},{"./../sandbox":29,"sizzle":9}],22:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Module = require('./module');

var _require = require('./../sandbox'),
    debug = _require.debug;

var Router = require('spa-router-better');

var View = function (_Module) {
  _inherits(View, _Module);

  function View(args) {
    _classCallCheck(this, View);

    var _this = _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this, args));

    _this.container = args.container || '';
    _this.$container = null;
    _this.routes = args.routes || null;
    if (_this.routes !== null) {
      for (var route in _this.routes) {
        debug.log('route', route, _this.routes[route]);
        App.router.on(route, function (req) {
          debug.log('req', req);
          _this.routes[req.path](req);
        });
      }
    }
    return _this;
  }

  _createClass(View, [{
    key: 'loadView',
    value: function loadView(pathView) {
      App.router.setRoute(pathView);
    }
  }, {
    key: 'sendRequest',
    value: function sendRequest() {}
  }, {
    key: 'readResponse',
    value: function readResponse() {}
  }, {
    key: 'setup',
    value: function setup() {}
  }, {
    key: 'onShow',
    value: function onShow() {}
  }, {
    key: 'onLoad',
    value: function onLoad() {}
  }, {
    key: 'onunLoad',
    value: function onunLoad() {}
  }, {
    key: 'start',
    value: function start(args) {
      _get(View.prototype.__proto__ || Object.getPrototypeOf(View.prototype), 'start', this).call(this, args);
      this.$container = this.$('#' + this.container)[0];
    }
  }]);

  return View;
}(Module);

module.exports = View;

},{"./../sandbox":29,"./module":21,"spa-router-better":10}],23:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Router = require('spa-router-better');

var _require = require('./core'),
    Module = _require.Module;

var _require2 = require('./sandbox'),
    debug = _require2.debug,
    utils = _require2.utils;

var Views = require('./views');
var Components = require('./components');

var Application = function (_Module) {
  _inherits(Application, _Module);

  function Application() {
    _classCallCheck(this, Application);

    var _this = _possibleConstructorReturn(this, (Application.__proto__ || Object.getPrototypeOf(Application)).call(this, {
      name: 'App',
      type: 'application'
    }));

    _this.views = {};
    _this.components = {};
    _this.routes = {
      '/donatingkm/www/test.html': _this.rootView.bind(_this)
    };
    _this.router = new Router(_this.routes);
    return _this;
  }

  _createClass(Application, [{
    key: 'rootView',
    value: function rootView(req) {
      debug.log('RootView is loaded', req);
      App.view('root').start({ test: 'Hello world' });
    }
  }, {
    key: 'listenEvents',
    value: function listenEvents() {
      _get(Application.prototype.__proto__ || Object.getPrototypeOf(Application.prototype), 'listenEvents', this).call(this);
    }
  }, {
    key: 'view',
    value: function view(name) {
      var nameView = utils.capitalize(name) + 'View';
      if (!this.views[nameView]) {
        this.views[nameView] = new Views[nameView]();
      }
      return this.views[nameView];
    }
  }, {
    key: 'component',
    value: function component(name) {
      var instanceName = name.split(':')[0];
      var className = utils.capitalize(name.split(':')[1]);
      if (!this.components[instanceName]) {
        this.components[instanceName] = new Components[className + 'Component']({ id: instanceName });
      }

      return this.components[instanceName];
    }
  }, {
    key: 'go',
    value: function go(pathView) {
      this.router.dispatch(pathView);
    }
  }, {
    key: 'start',
    value: function start() {
      if (!window.App) {
        window.App = this;
      }
      _get(Application.prototype.__proto__ || Object.getPrototypeOf(Application.prototype), 'start', this).call(this);
      this.router.start({
        root: '/donatingkm/www/test.html',
        notFound: function notFound(req) {
          return debug.log('404 not found', req);
        },
        mode: 'history'
      });
    }
  }]);

  return Application;
}(Module);

;

var App = new Application();
App.start();

},{"./components":14,"./core":20,"./sandbox":29,"./views":31,"spa-router-better":10}],24:[function(require,module,exports){
'use strict';

var Markers = require('./markers');
var Posts = require('./posts');

module.exports = {
  Posts: Posts,
  Markers: Markers
};

},{"./markers":25,"./posts":26}],25:[function(require,module,exports){
"use strict";

var Markers = [{
  "point": '1',
  "homeTeam": "Lawrence Library",
  "awayTeam": "LUGip",
  "markerImage": "images/red.png",
  "information": "Linux users group meets second Wednesday of each month.",
  "fixture": "Wednesday 7pm",
  "capacity": "",
  "previousScore": ""
}, {
  "point": '2',
  "homeTeam": "Hamilton Library",
  "awayTeam": "LUGip HW SIG",
  "markerImage": "images/white.png",
  "information": "Linux users can meet the first Tuesday of the month to work out harward and configuration issues.",
  "fixture": "Tuesday 7pm",
  "capacity": "",
  "tv": ""
}, {
  "point": '3',
  "homeTeam": "Applebees",
  "awayTeam": "After LUPip Mtg Spot",
  "markerImage": "images/newcastle.png",
  "information": "Some of us go there after the main LUGip meeting, drink brews, and talk.",
  "fixture": "Wednesday whenever",
  "capacity": "2 to 4 pints",
  "tv": ""
}];

module.exports = Markers;

},{}],26:[function(require,module,exports){
"use strict";

var Posts = [{
  "id": "X999_Y999",
  "from": {
    "name": "Tom Brady", "id": "X12"
  },
  "message": "Looking forward to 2010!",
  "actions": [{
    "name": "Comment",
    "link": "http://www.facebook.com/X999/posts/Y999"
  }, {
    "name": "Like",
    "link": "http://www.facebook.com/X999/posts/Y999"
  }],
  "type": "status",
  "created_time": "2010-08-02T21:27:44+0000",
  "updated_time": "2010-08-02T21:27:44+0000"
}, {
  "id": "X998_Y998",
  "from": {
    "name": "Peyton Manning", "id": "X18"
  },
  "message": "Where's my contract?",
  "actions": [{
    "name": "Comment",
    "link": "http://www.facebook.com/X998/posts/Y998"
  }, {
    "name": "Like",
    "link": "http://www.facebook.com/X998/posts/Y998"
  }],
  "type": "status",
  "created_time": "2010-08-02T21:27:44+0000",
  "updated_time": "2010-08-02T21:27:44+0000"
}];

module.exports = Posts;

},{}],27:[function(require,module,exports){
'use strict';

/**
 * @license Copyright (c) UserZoom 2016. All Rights Reserved. http://www.userzoom.com/
 *
 * Proprietary and confidential
 *
 * NOTICE: All information contained herein is, and remains the property
 * of UserZoom Technologies SL. The intellectual and technical concepts
 * contained herein are proprietary to UserZoom Technologies SL and
 * may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this
 * information or reproduction of this material is strictly forbidden unless
 * prior written permission is obtained from UserZoom Technologies SL.
 *
 * @company UserZoom Technologies SL
 * @file    log.js
 * @author  UserZoom R&D
 * @email   rd@userzoom.com
 * @date    2016-03-11
 * @summary Log utils
 */

/**
 * Dependencies from node_modules directory
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chalk = require('chalk');
var moment = require('moment');

/**
 * Dependencies from API node
 */
var path = require("path");

/**
 * Allow to show messages
 * @param {string} msg body of message
 * @param {string} color define the ouput color of message in console
 * @public
 *
 * @example log("Hello World!!", "white")
 */

var Debug = function () {
  function Debug() {
    _classCallCheck(this, Debug);

    this.colors = _defineProperty({
      'time': 'white',
      'log': 'white',
      'error': 'red',
      'info': 'blue',
      'warn': 'yellow'
    }, 'time', 'blue');
    return this.applyMethods();
  }

  _createClass(Debug, [{
    key: 'applyMethods',
    value: function applyMethods() {
      var self = this;
      var debug = this;
      var color = '';

      var _loop = function _loop(method) {
        debug[method] = function () {
          var args = Array.prototype.slice.call(arguments);
          var color = self.colors[method];
          var prefix = chalk.bold[color]('[' + moment().format('HH:mm:ss') + ']');
          for (var arg in args) {
            if (typeof args[arg] === 'string') {
              args[arg] = chalk.bold[color](args[arg]);
            }
          }
          var message = [prefix].concat(args);
          console[method].apply(console, message);
        };
      };

      for (var method in console) {
        _loop(method);
      }
      return debug;
    }
  }]);

  return Debug;
}();

var debug = new Debug();

module.exports = debug;

},{"chalk":3,"moment":6,"path":7}],28:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dispatcher = function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this.__events__ = {};
  }

  _createClass(Dispatcher, [{
    key: "emit",
    value: function emit(eventName) {
      window.dispatchEvent(this.__events__["" + eventName]);
    }
  }, {
    key: "createEvent",
    value: function createEvent(eventName, detail) {
      this.__events__[eventName] = new CustomEvent("" + eventName, {
        detail: detail
      });
    }
  }, {
    key: "subscribe",
    value: function subscribe() {
      var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
      var eventName = arguments[1];
      var handler = arguments[2];
      var bubling = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      target.addEventListener(eventName, handler, bubling);
    }
  }]);

  return Dispatcher;
}();

module.exports = new Dispatcher();

},{}],29:[function(require,module,exports){
'use strict';

var debug = require('./debug');
var utils = require('./utils');
var dispatcher = require('./dispatcher');

module.exports = {
  utils: utils,
  debug: debug,
  dispatcher: dispatcher
};

},{"./debug":27,"./dispatcher":28,"./utils":30}],30:[function(require,module,exports){
'use strict';

function capitalize(string) {
  return string.replace(/\b\w/g, function (l) {
    return l.toUpperCase();
  });
}
function getType(obj) {
  var type = null;

  if (obj === undefined) {
    type = 'Undefined';
  }

  if (obj === null) {
    type = 'Null';
  }

  var typeString = Object.prototype.toString.call(obj);
  type = typeString.slice(typeString.indexOf(' ') + 1, -1);
  return type;
}

module.exports = {
  getType: getType,
  capitalize: capitalize
};

},{}],31:[function(require,module,exports){
'use strict';

var RootView = require('./root');

module.exports = {
  RootView: RootView
};

},{"./root":32}],32:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    View = _require.View;

var _require2 = require('./../../sandbox'),
    debug = _require2.debug;

var RootView = function (_View) {
  _inherits(RootView, _View);

  function RootView() {
    _classCallCheck(this, RootView);

    return _possibleConstructorReturn(this, (RootView.__proto__ || Object.getPrototypeOf(RootView)).call(this, {
      name: 'indexPage',
      container: 'DKM'
    }));
  }

  _createClass(RootView, [{
    key: 'start',
    value: function start(args) {
      _get(RootView.prototype.__proto__ || Object.getPrototypeOf(RootView.prototype), 'start', this).call(this, args);
      debug.log('Index page is started');
      App.component('test:list').setup({
        container: this.$container
      });
      App.component('test:list').start();
    }
  }]);

  return RootView;
}(View);

module.exports = RootView;

},{"./../../core":20,"./../../sandbox":29}]},{},[23])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYW5zaS1yZWdleC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hbnNpLXN0eWxlcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jaGFsay9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lc2NhcGUtc3RyaW5nLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9oYXMtYW5zaS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tb21lbnQvbW9tZW50LmpzIiwibm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvc2l6emxlL2Rpc3Qvc2l6emxlLmpzIiwibm9kZV9tb2R1bGVzL3NwYS1yb3V0ZXItYmV0dGVyL2Rpc3QvY2pzL3NwYS1yb3V0ZXIuanMiLCJub2RlX21vZHVsZXMvc3RyaXAtYW5zaS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBwb3J0cy1jb2xvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90ZW1wbGF0ZTcvZGlzdC90ZW1wbGF0ZTcubWluLmpzIiwic3JjXFxjb21wb25lbnRzXFxpbmRleC5qcyIsInNyY1xcY29tcG9uZW50c1xcaXRlbVxcaW5kZXguanMiLCJzcmNcXGNvbXBvbmVudHNcXGl0ZW1cXHRlbXBsYXRlLmpzIiwic3JjXFxjb21wb25lbnRzXFxsaXN0XFxpbmRleC5qcyIsInNyY1xcY29tcG9uZW50c1xcbGlzdFxcdGVtcGxhdGUuanMiLCJzcmNcXGNvcmVcXGNvbXBvbmVudC5qcyIsInNyY1xcY29yZVxcaW5kZXguanMiLCJzcmNcXGNvcmVcXG1vZHVsZS5qcyIsInNyY1xcY29yZVxcdmlldy5qcyIsInNyY1xcaW5kZXguanMiLCJzcmNcXG1vY2tzXFxpbmRleC5qcyIsInNyY1xcbW9ja3NcXG1hcmtlcnMuanMiLCJzcmNcXG1vY2tzXFxwb3N0cy5qcyIsInNyY1xcc2FuZGJveFxcZGVidWcuanMiLCJzcmNcXHNhbmRib3hcXGRpc3BhdGNoZXIuanMiLCJzcmNcXHNhbmRib3hcXGluZGV4LmpzIiwic3JjXFxzYW5kYm94XFx1dGlscy5qcyIsInNyY1xcdmlld3NcXGluZGV4LmpzIiwic3JjXFx2aWV3c1xccm9vdFxcaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDem9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaHVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDenNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQkEsSUFBTSxnQkFBZ0IsUUFBUSxRQUFSLENBQXRCO0FBQ0EsSUFBTSxnQkFBZ0IsUUFBUSxRQUFSLENBQXRCOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNmLDhCQURlO0FBRWY7QUFGZSxDQUFqQjs7Ozs7Ozs7Ozs7Ozs7O2VDSHNCLFFBQVEsWUFBUixDO0lBQWQsUyxZQUFBLFM7O0FBQ1IsSUFBTSxXQUFXLFFBQVEsWUFBUixDQUFqQjs7SUFFTSxhOzs7QUFDSiwyQkFBYztBQUFBOztBQUFBLHlIQUNOO0FBQ0osWUFBTSxNQURGO0FBRUosZUFBUyxNQUZMO0FBR0osWUFBTSxXQUhGO0FBSUoseUJBQW1CO0FBSmYsS0FETTtBQU9iOzs7OzRCQUVPO0FBQ047QUFDQSxXQUFLLE1BQUwsQ0FBWTtBQUNWLGtCQUFVO0FBREEsT0FBWjtBQUdEOzs7O0VBZnlCLFM7O0FBa0I1QixPQUFPLE9BQVAsR0FBaUIsYUFBakI7Ozs7O0FDckJBLE9BQU8sT0FBUCxHQUFpQixVQUFTLFFBQVQsRUFBbUIsT0FBbkIsRUFBNEI7QUFDekMsUUFBTSxZQUFZLEtBQUssUUFBdkI7QUFDQSxrQ0FBNEIsU0FBNUI7QUFDSCxDQUhEOzs7Ozs7Ozs7Ozs7Ozs7ZUNBc0IsUUFBUSxZQUFSLEM7SUFBZCxTLFlBQUEsUzs7Z0JBQ1UsUUFBUSxhQUFSLEM7SUFBVixLLGFBQUEsSzs7QUFDUixJQUFNLFdBQVcsUUFBUSxZQUFSLENBQWpCOztJQUVNLGE7OztBQUNKLDJCQUFjO0FBQUE7O0FBQUEseUhBQ047QUFDSixVQUFJLE1BREE7QUFFSixZQUFNLE1BRkY7QUFHSixlQUFTLE1BSEw7QUFJSixZQUFNLFdBSkY7QUFLSixnQkFBVSxZQUxOO0FBTUosY0FBUSxNQU5KO0FBT0oseUJBQW1CO0FBUGYsS0FETTtBQVViOzs7OzRCQUVPO0FBQ047QUFDQSxXQUFLLE1BQUwsQ0FBWTtBQUNWLGtCQUFVLFVBREE7QUFFVjtBQUZVLE9BQVo7QUFJRDs7OztFQW5CeUIsUzs7QUFzQjVCLE9BQU8sT0FBUCxHQUFpQixhQUFqQjs7Ozs7QUMxQkEsT0FBTyxPQUFQLEdBQWlCLFVBQVMsUUFBVCxFQUFtQixPQUFuQixFQUE0QjtBQUN6QyxRQUFNLFlBQVksS0FBSyxRQUF2QjtBQUNBLFFBQU0sUUFBUSxRQUFRLElBQVIsQ0FBYSxLQUEzQjtBQUNBLFFBQU0sU0FBUyxNQUFNLE1BQXJCO0FBQ0EsUUFBSSxRQUFRLEVBQVo7QUFDQSxTQUFJLElBQUksSUFBRSxDQUFWLEVBQWEsU0FBUyxDQUF0QixFQUF5QixHQUF6QixFQUE4QjtBQUMxQixZQUFNLG1CQUFpQixNQUFNLENBQU4sRUFBUyxFQUFoQztBQUNBLG9DQUEwQixNQUExQjtBQUNBLGFBQUssWUFBTCxDQUFrQixJQUFsQixDQUEwQixNQUExQjtBQUNIO0FBQ0QsMkJBQXFCLFNBQXJCLFVBQW1DLEtBQW5DO0FBQ0gsQ0FYRDs7Ozs7Ozs7Ozs7OztBQ0FBLFFBQVEsaUNBQVI7QUFDQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7O0lBRU0sUzs7O0FBQ0oscUJBQVksSUFBWixFQUFrQjtBQUFBOztBQUFBLHNIQUNWLElBRFU7O0FBRWhCLFVBQUssRUFBTCxHQUFVLEtBQUssRUFBZjtBQUNBLFVBQUssWUFBTCxHQUFvQixFQUFwQjtBQUNBLFVBQUssS0FBTCxHQUFhO0FBQ1gsZUFBUyxFQURFO0FBRVgsZ0JBQVU7QUFGQyxLQUFiO0FBSUEsVUFBSyxRQUFMLEdBQWdCO0FBQ2QsZUFBUyxFQURLO0FBRWQsZ0JBQVU7QUFGSSxLQUFoQjtBQUlBLFVBQUssR0FBTCxHQUFXLEtBQUssUUFBTCxJQUFpQixJQUE1QjtBQUNBLFVBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNBLFVBQUssTUFBTCxRQUFpQixLQUFLLE1BQXRCO0FBQ0EsVUFBSyxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsVUFBSyxZQUFMLEdBQW9CLElBQXBCO0FBQ0EsVUFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsVUFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsVUFBSyxjQUFMLEdBQXNCLE9BQU8sU0FBN0I7QUFDQSxVQUFLLGlCQUFMLEdBQXlCLEtBQUssaUJBQUwsSUFBMEIsSUFBbkQ7QUFDQSxVQUFLLE9BQUwsR0FBZSxLQUFLLE9BQUwsSUFBZ0IsU0FBL0I7QUFDQSxVQUFLLFFBQUwsR0FBZSxLQUFLLFFBQUwsSUFBaUIsU0FBaEM7QUF0QmdCO0FBdUJqQjs7OzttQ0FtRGM7QUFBQTs7QUFDYixXQUFLLFFBQUwsQ0FBYztBQUNaLHNCQUFjLHdCQUFNO0FBQ2xCLGNBQU0sT0FBTyxPQUFLLElBQUwsQ0FBVSxPQUF2QjtBQUNBLGNBQU0sa0JBQWdCLE9BQUssT0FBckIsZ0JBQU47QUFDQSxpQkFBSyxXQUFMLENBQWlCLElBQWpCLEVBQXVCLFFBQXZCO0FBQ0QsU0FMVztBQU1aLGlCQUFTLG1CQUFNO0FBQ2IsY0FBTSxRQUFRLE9BQUssS0FBbkI7QUFDQSxjQUFNLFNBQVMsT0FBSyxNQUFwQjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxLQUFYLEVBQWtCLE1BQWxCO0FBQ0QsU0FWVztBQVdaLGlCQUFTLG1CQUFNO0FBQ2IsY0FBTSxVQUFVLE9BQUssT0FBckI7QUFDQSxpQkFBSyxrQkFBTCxDQUF3QixPQUF4QjtBQUNELFNBZFc7QUFlWiw4QkFBc0IsZ0NBQU07QUFDMUIsY0FBTSxhQUFhLE9BQUssU0FBTCxJQUFrQixRQUFyQztBQUNBLGNBQU0sU0FBVSxPQUFLLFdBQXJCO0FBQ0EsY0FBTSxVQUFVLE9BQUssT0FBckI7QUFDQSxpQkFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixPQUF2QjtBQUNEO0FBcEJXLE9BQWQ7QUFzQkQ7OzswQkFFSyxLLEVBQU8sTSxFQUFRO0FBQ25CLFVBQU0sYUFBYSxLQUFLLFNBQUwsSUFBa0IsUUFBckM7QUFDQSxXQUFLLFdBQUwsR0FBb0IsS0FBSyxNQUFMLElBQWUsS0FBSyxDQUFMLE9BQVcsS0FBSyxNQUFoQixFQUEwQixVQUExQixFQUFzQyxDQUF0QyxDQUFuQztBQUNBLFVBQU0sT0FBTyxLQUFLLFdBQUwsQ0FBaUIsUUFBOUI7QUFDQSxVQUFNLFVBQVUsU0FBUyxhQUFULENBQXVCLElBQXZCLENBQWhCO0FBQ0EsY0FBUSxFQUFSLEdBQWEsTUFBYjtBQUNBLGNBQVEsU0FBUixHQUFvQixLQUFwQjtBQUNBLFdBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxXQUFLLElBQUwsQ0FBYSxLQUFLLEVBQWxCLGVBQWdDO0FBQzlCLGNBQU0sS0FBSyxJQURtQjtBQUU5QixrQkFBVSxLQUFLLFFBRmU7QUFHOUIsZUFBTyxLQUFLLEtBSGtCO0FBSTlCLGlCQUFTLEtBQUs7QUFKZ0IsT0FBaEM7QUFNRDs7OzhCQUVTLE0sRUFBUSxPLEVBQVM7QUFDekIsVUFBTSxnQkFBZ0IsTUFBdEI7QUFDQSxvQkFBYyxVQUFkLENBQXlCLFlBQXpCLENBQXNDLE9BQXRDLEVBQStDLGFBQS9DO0FBQ0EsV0FBSyxNQUFMLEdBQWMsT0FBZDtBQUNBLFdBQUssSUFBTCxDQUFhLEtBQUssRUFBbEIsZ0JBQWlDO0FBQy9CLFlBQU8sS0FBSyxFQUFaLFNBQWtCLEtBQUs7QUFEUSxPQUFqQztBQUdEOzs7MEJBRUssTyxFQUFTOztBQUViLFVBQUcsUUFBUSxNQUFYLEVBQWtCO0FBQ2hCLGFBQUssTUFBTCxHQUFjLFFBQVEsTUFBdEI7QUFDRDs7QUFFRCxVQUFHLFFBQVEsRUFBWCxFQUFjO0FBQ1osYUFBSyxFQUFMLEdBQVUsUUFBUSxFQUFsQjtBQUNEOztBQUVELFVBQUcsUUFBUSxJQUFYLEVBQWdCO0FBQ2QsYUFBSyxJQUFMLEdBQVksUUFBUSxJQUFwQjtBQUNEOztBQUVELFVBQUcsUUFBUSxRQUFYLEVBQXFCO0FBQ25CLGFBQUssUUFBTCxHQUFnQixRQUFRLFFBQXhCO0FBQ0Q7O0FBRUQsVUFBRyxRQUFRLE1BQVgsRUFBbUI7QUFDakIsYUFBSyxNQUFMLEdBQWMsUUFBUSxNQUF0QjtBQUNEOztBQUVELFVBQUcsUUFBUSxJQUFYLEVBQWlCO0FBQ2YsYUFBSyxPQUFMLENBQWEsUUFBUSxJQUFyQjtBQUNEOztBQUVELFVBQUcsUUFBUSxTQUFYLEVBQXNCO0FBQ3BCLGFBQUssU0FBTCxHQUFpQixRQUFRLFNBQXpCO0FBQ0Q7QUFDRjs7O2dDQUVXLE8sRUFBUyxXLEVBQWE7QUFDaEMsVUFBTSxXQUFXLGVBQWUsS0FBSyxRQUFyQztBQUNBLFVBQU0sT0FBTyxXQUFXLEtBQUssSUFBTCxDQUFVLE9BQWxDO0FBQ0EsV0FBSyxLQUFMLEdBQWEsS0FBSyxPQUFMLENBQWEsUUFBYixFQUF1QixJQUF2QixDQUFiO0FBQ0EsV0FBSyxJQUFMLENBQWEsS0FBSyxFQUFsQixlQUFnQztBQUM5QixjQUFNLEtBQUssSUFEbUI7QUFFOUIsa0JBQVUsS0FBSyxRQUZlO0FBRzlCLGVBQU8sS0FBSztBQUhrQixPQUFoQztBQUtEOzs7bUNBRWM7QUFDYixVQUFNLGlCQUFpQixLQUFLLGNBQTVCO0FBQ0EscUJBQWUsY0FBZixNQUFpQyxLQUFLLE9BQXRDLEVBQWlELEtBQUssaUJBQUwsQ0FBdUIsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBakQ7QUFDRDs7OzRCQUVPLFEsRUFBVSxJLEVBQU07QUFDdEIsVUFBTSxpQkFBaUIsS0FBSyxjQUE1QjtBQUNBLFdBQUssWUFBTDtBQUNBLFVBQU0sbUJBQW1CLGVBQWUsT0FBZixDQUF1QixRQUF2QixDQUF6QjtBQUNBLGFBQU8saUJBQWlCLElBQWpCLENBQVA7QUFDRDs7OzZCQUVRLE0sRUFBUTtBQUNmLFVBQUksT0FBTyxDQUFYO0FBQUEsVUFBYyxVQUFkO0FBQUEsVUFBaUIsWUFBakI7QUFDQSxVQUFNLE1BQU0sT0FBTyxNQUFuQjtBQUNBLFVBQUksT0FBTyxNQUFQLEtBQWtCLENBQXRCLEVBQXlCLE9BQU8sSUFBUDtBQUN6QixXQUFLLElBQUksQ0FBVCxFQUFZLElBQUksR0FBaEIsRUFBcUIsR0FBckIsRUFBMEI7QUFDeEIsY0FBTSxPQUFPLFVBQVAsQ0FBa0IsQ0FBbEIsQ0FBTjtBQUNBLGVBQVEsQ0FBQyxRQUFRLENBQVQsSUFBYyxJQUFmLEdBQXVCLEdBQTlCO0FBQ0EsZ0JBQVEsQ0FBUixDQUh3QixDQUdiO0FBQ1o7QUFDRCxhQUFPLElBQVA7QUFDRDs7O2tDQUVhLE8sRUFBUyxhLEVBQWU7QUFDcEMsVUFBTSxjQUFjLEtBQUssUUFBTCxDQUFjLEtBQUssU0FBTCxDQUFlLE9BQWYsQ0FBZCxDQUFwQjtBQUNBLFVBQUksYUFBYSxLQUFqQjtBQUNBLFVBQUksaUJBQWlCLGdCQUFnQixLQUFLLFFBQUwsQ0FBYyxPQUFuRCxFQUE0RDtBQUMxRCxhQUFLLFFBQUwsQ0FBYyxRQUFkLEdBQXlCLEtBQUssUUFBTCxDQUFjLE9BQXZDO0FBQ0EsYUFBSyxRQUFMLENBQWMsT0FBZCxHQUF3QixXQUF4QjtBQUNBLHFCQUFhLElBQWI7QUFDRDtBQUNELGFBQU8sVUFBUDtBQUNEOzs7NEJBRU8sTyxFQUFnQztBQUFBLFVBQXZCLGFBQXVCLHVFQUFQLEtBQU87O0FBQ3RDLFVBQUcsS0FBSyxhQUFMLENBQW1CLE9BQW5CLEVBQTRCLGFBQTVCLENBQUgsRUFBOEM7QUFDNUMsYUFBSyxJQUFMLENBQVUsUUFBVixHQUFxQixLQUFLLElBQUwsQ0FBVSxPQUEvQjtBQUNBLGFBQUssSUFBTCxDQUFVLE9BQVYsR0FBb0IsT0FBTyxNQUFQLENBQWMsS0FBSyxJQUFMLENBQVUsT0FBeEIsRUFBaUMsT0FBakMsQ0FBcEI7QUFDQSxhQUFLLElBQUwsQ0FBYSxLQUFLLEVBQWxCLG9CQUFxQztBQUNuQyxnQkFBTSxLQUFLO0FBRHdCLFNBQXJDO0FBR0Q7QUFDRjs7O3VDQUVrQixPLEVBQVM7QUFBQTs7QUFDMUIsVUFBTSxxQkFBcUIsS0FBSyxZQUFoQztBQUNBLFVBQU0sU0FBUyxtQkFBbUIsTUFBbEM7QUFDQSxVQUFJLFVBQVUsQ0FBZDtBQUNBLFVBQUksSUFBSSxDQUFSO0FBQ0EsYUFBTSxTQUFTLENBQWYsRUFBa0IsR0FBbEIsRUFBc0I7QUFDcEIsWUFBTSxlQUFlLG1CQUFtQixDQUFuQixFQUFzQixLQUF0QixDQUE0QixHQUE1QixFQUFpQyxDQUFqQyxDQUFyQjtBQUNBLFlBQU0sWUFBWSxtQkFBbUIsQ0FBbkIsRUFBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsQ0FBakMsQ0FBbEI7QUFDQSxZQUFJLFNBQUosQ0FBYyxtQkFBbUIsQ0FBbkIsQ0FBZCxFQUFxQyxLQUFyQyxDQUEyQyxFQUFFLElBQUksWUFBTixFQUFvQixRQUFRLFlBQTVCLEVBQTBDLFdBQVcsT0FBckQsRUFBM0M7QUFDQSxZQUFJLFNBQUosQ0FBYyxtQkFBbUIsQ0FBbkIsQ0FBZCxFQUFxQyxZQUFyQztBQUNBLFlBQUksU0FBSixDQUFjLG1CQUFtQixDQUFuQixDQUFkLEVBQXFDLFFBQXJDLENBQThDO0FBQzVDLG9CQUFVLGtCQUFDLEtBQUQsRUFBVztBQUNuQixnQkFBTSxLQUFLLE1BQU0sTUFBTixDQUFhLEVBQXhCO0FBQ0EsZ0JBQUssU0FBUSxDQUFULEtBQWdCLE9BQXBCLEVBQTZCO0FBQzNCLHFCQUFLLElBQUwsQ0FBYSxPQUFLLEVBQWxCO0FBQ0QsYUFGRCxNQUVPO0FBQ0w7QUFDRDtBQUNGO0FBUjJDLFNBQTlDLEVBU0csWUFUSDs7QUFXQSxZQUFJLFNBQUosQ0FBYyxtQkFBbUIsQ0FBbkIsQ0FBZCxFQUFxQyxNQUFyQyxDQUE0QyxLQUFLLElBQWpEO0FBQ0Q7O0FBRUQsVUFBRyxXQUFXLENBQWQsRUFBaUI7QUFDZixhQUFLLElBQUwsQ0FBYSxLQUFLLEVBQWxCO0FBQ0Q7QUFDRjs7OzJCQUVNLE8sRUFBd0I7QUFBQSxVQUFmLEtBQWUsdUVBQVAsS0FBTzs7QUFDN0IsVUFBTSxPQUFPLFdBQVcsS0FBSyxJQUE3QjtBQUNBLFdBQUssT0FBTCxDQUFhLElBQWIsRUFBbUIsS0FBbkI7QUFDRDs7O3NCQTFOVyxLLEVBQU87QUFDakIsV0FBSyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0QsSzt3QkFFYTtBQUNaLGFBQU8sS0FBSyxZQUFaO0FBQ0Q7OztzQkFFUyxLLEVBQU87QUFDZixXQUFLLFVBQUwsR0FBa0IsS0FBbEI7QUFDRCxLO3dCQUVXO0FBQ1YsYUFBTyxLQUFLLFVBQVo7QUFDRDs7O3NCQUVZLEssRUFBTztBQUNsQixXQUFLLEdBQUwsR0FBVyxLQUFYO0FBQ0QsSzt3QkFFYztBQUNiLGFBQU8sS0FBSyxHQUFaO0FBQ0Q7OztzQkFFUSxLLEVBQU87QUFDZCxXQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0QsSzt3QkFFVTtBQUNULGFBQU8sS0FBSyxLQUFaO0FBQ0Q7Ozt3QkFFWTtBQUNYLGFBQU8sS0FBSyxXQUFaO0FBQ0QsSztzQkFFVSxLLEVBQU87QUFDaEIsV0FBSyxXQUFMLEdBQW1CLEtBQW5CO0FBQ0Q7Ozt3QkFFZTtBQUNkLGFBQU8sS0FBSyxjQUFaO0FBQ0QsSztzQkFFYSxLLEVBQU87QUFDbkIsV0FBSyxjQUFMLEdBQXNCLEtBQXRCO0FBQ0Q7Ozs7RUF4RXFCLE07O0FBdVB4QixPQUFPLE9BQVAsR0FBaUIsU0FBakI7Ozs7O0FDMVBBLElBQU0sWUFBWSxRQUFRLGFBQVIsQ0FBbEI7QUFDQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNLE9BQU8sUUFBUSxRQUFSLENBQWI7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2Ysc0JBRGU7QUFFZixnQkFGZTtBQUdmO0FBSGUsQ0FBakI7Ozs7Ozs7OztBQ0pBLElBQU0sU0FBUyxRQUFRLFFBQVIsQ0FBZjs7ZUFFOEIsUUFBUSxjQUFSLEM7SUFBdEIsSyxZQUFBLEs7SUFBTyxVLFlBQUEsVTs7SUFFVCxNO0FBQ0osa0JBQVksSUFBWixFQUFrQjtBQUFBOztBQUNoQixTQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsSUFBYSxlQUF6QjtBQUNBLFNBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxJQUFhLFFBQXpCO0FBQ0EsU0FBSyxPQUFMLEdBQWUsS0FBZjs7QUFFQSxTQUFLLE1BQUwsR0FBYztBQUNaLGFBQU8sQ0FESztBQUVaLGNBQVE7QUFDTixpQkFBUyxtQkFBTSxDQUFFLENBRFg7QUFFTixnQkFBUSxrQkFBTSxDQUFFO0FBRlYsT0FGSTtBQU1aLGdCQUFVO0FBTkUsS0FBZDtBQVFEOzs7OzhCQUVTLE0sRUFBUTtBQUNoQixXQUFLLE1BQUwsR0FBYyxPQUFPLE1BQVAsQ0FBYyxLQUFLLE1BQW5CLEVBQTJCLE1BQTNCLENBQWQ7QUFDRDs7O21DQUVhO0FBQ1osV0FBSyxRQUFMLENBQWM7QUFDWixtQkFBVyxLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQW1CLE9BRGxCO0FBRVosa0JBQVUsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQjtBQUZqQixPQUFkLEVBR0csS0FBSyxFQUhSO0FBSUQ7Ozt3QkFFRztBQUNGLGFBQU8sT0FBTyxLQUFQLENBQWEsTUFBYixFQUFxQixTQUFyQixDQUFQO0FBQ0Q7OzsrQkFFcUM7QUFBQSxVQUE3QixNQUE2Qix1RUFBcEIsRUFBb0I7QUFBQSxVQUFoQixJQUFnQix1RUFBVCxLQUFLLEVBQUk7O0FBQ3JDLFdBQUksSUFBTSxLQUFWLElBQW1CLE1BQW5CLEVBQTJCO0FBQ3pCLFlBQU0sVUFBVSxPQUFPLEtBQVAsQ0FBaEI7QUFDQSxZQUFJLFNBQVMsTUFBYjtBQUNBLFlBQUksWUFBZSxJQUFmLFNBQXVCLEtBQTNCOztBQUVBLFlBQUcsU0FBUyxLQUFaLEVBQW1CO0FBQ2pCLG1CQUFTLEtBQUssQ0FBTCxDQUFPLE1BQU0sS0FBTixDQUFZLEdBQVosRUFBaUIsQ0FBakIsQ0FBUCxDQUFUO0FBQ0Esc0JBQVksTUFBTSxLQUFOLENBQVksR0FBWixFQUFpQixDQUFqQixDQUFaO0FBQ0Q7O0FBRUQsYUFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixTQUF2QixFQUFrQyxPQUFsQyxFQUEyQyxLQUEzQztBQUNEO0FBQ0Q7OzswQkFFSyxNLEVBQVE7QUFDWixXQUFLLFNBQUwsQ0FBZSxNQUFmO0FBQ0Q7Ozs4QkFFcUI7QUFBQTs7QUFBQSxVQUFkLE9BQWMsdUVBQUosRUFBSTs7QUFDcEIsY0FBUSxHQUFSLENBQVksVUFBQyxVQUFELEVBQWEsS0FBYixFQUF1QjtBQUNqQyxjQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLFVBQWxCO0FBQ0EsZUFBTyxnQkFBUCxhQUFrQyxVQUFsQyxFQUFnRCxVQUFDLEtBQUQsRUFBVztBQUFBLDhCQUN6QixNQUFNLE1BRG1CO0FBQUEsY0FDakQsT0FEaUQsaUJBQ2pELE9BRGlEO0FBQUEsY0FDeEMsVUFEd0MsaUJBQ3hDLFVBRHdDOztBQUV6RCxjQUFHLE9BQUgsRUFBWTtBQUNWLGdCQUFJLFdBQVcsTUFBSyxRQUFwQjtBQUNBLGdCQUFNLGNBQWMsU0FBUyxPQUFULENBQWlCLFVBQWpCLENBQXBCO0FBQ0EscUJBQVMsS0FBVCxDQUFlLFdBQWYsRUFBNEIsU0FBUyxNQUFyQztBQUNBLGtCQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxrQkFBSyxhQUFMO0FBQ0Q7QUFDRixTQVREO0FBVUQsT0FaRDtBQWFEOzs7NEJBRU8sUSxFQUFVO0FBQ2hCLFdBQUssT0FBTCxHQUFlLElBQWY7QUFDQSxZQUFNLEdBQU4sYUFBb0IsS0FBSyxFQUF6QjtBQUNBLFdBQUssSUFBTCxDQUFVLFNBQVY7QUFDRDs7O29DQUVlO0FBQ2QsVUFBTSxXQUFXLEtBQUssTUFBTCxDQUFZLFFBQTdCO0FBQ0EsVUFBRyxTQUFTLE1BQVQsS0FBb0IsQ0FBdkIsRUFBMEI7QUFDeEIsYUFBSyxRQUFMO0FBQ0Q7QUFDRjs7OytCQUVVO0FBQUE7O0FBQ1QsVUFBRyxLQUFLLE1BQUwsQ0FBWSxLQUFaLEtBQXNCLENBQXpCLEVBQTJCO0FBQ3pCLGFBQUssT0FBTDtBQUNELE9BRkQsTUFFSztBQUNILG1CQUFXLFlBQU07QUFBRSxpQkFBSyxPQUFMO0FBQWlCLFNBQXBDLEVBQXNDLEtBQUssTUFBTCxDQUFZLEtBQWxEO0FBQ0Q7QUFDRjs7OzRCQUdEO0FBQ0UsV0FBSyxZQUFMO0FBQ0EsV0FBSyxhQUFMO0FBQ0Q7OztpQ0FFWSxTLEVBQVc7QUFDdEIsYUFBTyxVQUFVLE9BQVYsQ0FBa0IsR0FBbEIsTUFBMkIsQ0FBQyxDQUE1QixHQUFtQyxLQUFLLEVBQXhDLFNBQThDLFNBQTlDLEdBQTRELFNBQW5FO0FBQ0Q7OzsyQkFFTTtBQUNMLFdBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxZQUFNLEdBQU4sYUFBb0IsS0FBSyxFQUF6QjtBQUNBLFdBQUssSUFBTCxDQUFhLEtBQUssRUFBbEI7QUFDRDs7O3lCQUVJLFMsRUFBc0I7QUFBQSxVQUFYLElBQVcsdUVBQUosRUFBSTs7QUFDekIsV0FBSyxXQUFMLENBQWlCLFNBQWpCLEVBQTRCLElBQTVCO0FBQ0EsVUFBTSxRQUFRLEtBQUssWUFBTCxDQUFrQixTQUFsQixDQUFkO0FBQ0EsaUJBQVcsSUFBWCxDQUFnQixLQUFoQjtBQUNEOzs7Z0NBRVcsUyxFQUFXLE8sRUFBUztBQUM5QixVQUFNLFFBQVEsS0FBSyxZQUFMLENBQWtCLFNBQWxCLENBQWQ7QUFDQSxpQkFBVyxXQUFYLENBQXVCLEtBQXZCLEVBQThCLE9BQTlCO0FBQ0Q7OztnQ0FFZ0U7QUFBQSxVQUF2RCxNQUF1RCx1RUFBOUMsTUFBOEM7QUFBQSxVQUF0QyxTQUFzQztBQUFBLFVBQTNCLE9BQTJCO0FBQUEsVUFBbEIsUUFBa0IsdUVBQVAsS0FBTzs7QUFDL0QsVUFBTSxRQUFRLFVBQVUsT0FBVixDQUFrQixHQUFsQixNQUEyQixDQUFDLENBQTVCLEdBQW1DLEtBQUssRUFBeEMsU0FBOEMsU0FBOUMsR0FBNEQsU0FBMUU7QUFDQSxpQkFBVyxTQUFYLENBQXFCLE1BQXJCLEVBQTZCLEtBQTdCLEVBQW9DLE9BQXBDLEVBQTZDLFFBQTdDO0FBQ0Q7Ozs7OztBQUdILE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7Ozs7Ozs7Ozs7Ozs7O0FDNUhBLElBQU0sU0FBUyxRQUFRLFVBQVIsQ0FBZjs7ZUFDa0IsUUFBUSxjQUFSLEM7SUFBVixLLFlBQUEsSzs7QUFDUixJQUFNLFNBQVMsUUFBUSxtQkFBUixDQUFmOztJQUVNLEk7OztBQUNKLGdCQUFZLElBQVosRUFBa0I7QUFBQTs7QUFBQSw0R0FDVixJQURVOztBQUVoQixVQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUFMLElBQWtCLEVBQW5DO0FBQ0EsVUFBSyxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsVUFBSyxNQUFMLEdBQWMsS0FBSyxNQUFMLElBQWUsSUFBN0I7QUFDQSxRQUFHLE1BQUssTUFBTCxLQUFnQixJQUFuQixFQUF5QjtBQUN2QixXQUFJLElBQUksS0FBUixJQUFpQixNQUFLLE1BQXRCLEVBQTZCO0FBQzNCLGNBQU0sR0FBTixDQUFVLE9BQVYsRUFBbUIsS0FBbkIsRUFBMEIsTUFBSyxNQUFMLENBQVksS0FBWixDQUExQjtBQUNBLFlBQUksTUFBSixDQUFXLEVBQVgsQ0FBYyxLQUFkLEVBQXFCLFVBQUMsR0FBRCxFQUFTO0FBQzVCLGdCQUFNLEdBQU4sQ0FBVSxLQUFWLEVBQWlCLEdBQWpCO0FBQ0EsZ0JBQUssTUFBTCxDQUFZLElBQUksSUFBaEIsRUFBc0IsR0FBdEI7QUFDRCxTQUhEO0FBSUQ7QUFDRjtBQWJlO0FBY2pCOzs7OzZCQUVRLFEsRUFBVTtBQUNqQixVQUFJLE1BQUosQ0FBVyxRQUFYLENBQW9CLFFBQXBCO0FBQ0Q7OztrQ0FFYSxDQUFFOzs7bUNBRUQsQ0FBRTs7OzRCQUVULENBRVA7Ozs2QkFFUSxDQUFFOzs7NkJBRUYsQ0FFUjs7OytCQUVVLENBRVY7OzswQkFFSyxJLEVBQU07QUFDVix3R0FBWSxJQUFaO0FBQ0EsV0FBSyxVQUFMLEdBQWtCLEtBQUssQ0FBTCxPQUFXLEtBQUssU0FBaEIsRUFBNkIsQ0FBN0IsQ0FBbEI7QUFDRDs7OztFQTFDZ0IsTTs7QUE2Q25CLE9BQU8sT0FBUCxHQUFpQixJQUFqQjs7Ozs7Ozs7Ozs7Ozs7O0FDakRBLElBQU0sU0FBUyxRQUFRLG1CQUFSLENBQWY7O2VBQ21CLFFBQVEsUUFBUixDO0lBQVgsTSxZQUFBLE07O2dCQUNpQixRQUFRLFdBQVIsQztJQUFqQixLLGFBQUEsSztJQUFPLEssYUFBQSxLOztBQUNmLElBQU0sUUFBUSxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQU0sYUFBYSxRQUFRLGNBQVIsQ0FBbkI7O0lBRU0sVzs7O0FBQ0oseUJBQWM7QUFBQTs7QUFBQSwwSEFDTjtBQUNKLFlBQU0sS0FERjtBQUVKLFlBQU07QUFGRixLQURNOztBQUtaLFVBQUssS0FBTCxHQUFhLEVBQWI7QUFDQSxVQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxVQUFLLE1BQUwsR0FBYztBQUNaLG1DQUE2QixNQUFLLFFBQUwsQ0FBYyxJQUFkO0FBRGpCLEtBQWQ7QUFHQSxVQUFLLE1BQUwsR0FBYyxJQUFJLE1BQUosQ0FBVyxNQUFLLE1BQWhCLENBQWQ7QUFWWTtBQVdiOzs7OzZCQUVRLEcsRUFBSztBQUNaLFlBQU0sR0FBTixDQUFVLG9CQUFWLEVBQWdDLEdBQWhDO0FBQ0EsVUFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixLQUFqQixDQUF1QixFQUFFLE1BQU0sYUFBUixFQUF2QjtBQUNEOzs7bUNBRWE7QUFDWjtBQUVEOzs7eUJBRUksSSxFQUFNO0FBQ1QsVUFBTSxXQUFjLE1BQU0sVUFBTixDQUFpQixJQUFqQixDQUFkLFNBQU47QUFDQSxVQUFHLENBQUMsS0FBSyxLQUFMLENBQVcsUUFBWCxDQUFKLEVBQTBCO0FBQ3hCLGFBQUssS0FBTCxDQUFXLFFBQVgsSUFBdUIsSUFBSSxNQUFNLFFBQU4sQ0FBSixFQUF2QjtBQUNEO0FBQ0QsYUFBTyxLQUFLLEtBQUwsQ0FBVyxRQUFYLENBQVA7QUFDRDs7OzhCQUVTLEksRUFBTTtBQUNkLFVBQU0sZUFBZSxLQUFLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLENBQWhCLENBQXJCO0FBQ0EsVUFBTSxZQUFZLE1BQU0sVUFBTixDQUFpQixLQUFLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLENBQWhCLENBQWpCLENBQWxCO0FBQ0EsVUFBRyxDQUFDLEtBQUssVUFBTCxDQUFnQixZQUFoQixDQUFKLEVBQW1DO0FBQ2pDLGFBQUssVUFBTCxDQUFnQixZQUFoQixJQUFnQyxJQUFJLFdBQWMsU0FBZCxlQUFKLENBQXdDLEVBQUUsSUFBSSxZQUFOLEVBQXhDLENBQWhDO0FBQ0Q7O0FBRUQsYUFBTyxLQUFLLFVBQUwsQ0FBZ0IsWUFBaEIsQ0FBUDtBQUNEOzs7dUJBR0UsUSxFQUFVO0FBQ1gsV0FBSyxNQUFMLENBQVksUUFBWixDQUFxQixRQUFyQjtBQUNEOzs7NEJBRU87QUFDTixVQUFHLENBQUMsT0FBTyxHQUFYLEVBQWdCO0FBQ2QsZUFBTyxHQUFQLEdBQWEsSUFBYjtBQUNEO0FBQ0Q7QUFDQSxXQUFLLE1BQUwsQ0FBWSxLQUFaLENBQWtCO0FBQ2hCLGNBQU0sMkJBRFU7QUFFaEIsa0JBQVUsa0JBQUMsR0FBRDtBQUFBLGlCQUFTLE1BQU0sR0FBTixDQUFVLGVBQVYsRUFBMkIsR0FBM0IsQ0FBVDtBQUFBLFNBRk07QUFHaEIsY0FBTTtBQUhVLE9BQWxCO0FBS0Q7Ozs7RUF6RHdCLE07O0FBMEQxQjs7QUFFRCxJQUFNLE1BQU0sSUFBSSxXQUFKLEVBQVo7QUFDQSxJQUFJLEtBQUo7Ozs7O0FDbkVBLElBQU0sVUFBVSxRQUFRLFdBQVIsQ0FBaEI7QUFDQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsY0FEZTtBQUVmO0FBRmUsQ0FBakI7Ozs7O0FDSEEsSUFBTSxVQUFVLENBQ2Q7QUFDRSxXQUFTLEdBRFg7QUFFRSxjQUFXLGtCQUZiO0FBR0UsY0FBVyxPQUhiO0FBSUUsaUJBQWMsZ0JBSmhCO0FBS0UsaUJBQWUseURBTGpCO0FBTUUsYUFBVSxlQU5aO0FBT0UsY0FBVyxFQVBiO0FBUUUsbUJBQWdCO0FBUmxCLENBRGMsRUFXZDtBQUNFLFdBQVEsR0FEVjtBQUVFLGNBQVcsa0JBRmI7QUFHRSxjQUFXLGNBSGI7QUFJRSxpQkFBYyxrQkFKaEI7QUFLRSxpQkFBZSxtR0FMakI7QUFNRSxhQUFVLGFBTlo7QUFPRSxjQUFXLEVBUGI7QUFRRSxRQUFLO0FBUlAsQ0FYYyxFQXFCZDtBQUNFLFdBQVEsR0FEVjtBQUVFLGNBQVcsV0FGYjtBQUdFLGNBQVcsc0JBSGI7QUFJRSxpQkFBYyxzQkFKaEI7QUFLRSxpQkFBZSwwRUFMakI7QUFNRSxhQUFVLG9CQU5aO0FBT0UsY0FBVyxjQVBiO0FBUUUsUUFBSztBQVJQLENBckJjLENBQWhCOztBQWlDQSxPQUFPLE9BQVAsR0FBaUIsT0FBakI7Ozs7O0FDakNBLElBQU0sUUFBUSxDQUNaO0FBQ0UsUUFBTSxXQURSO0FBRUUsVUFBUTtBQUNOLFlBQVEsV0FERixFQUNlLE1BQU07QUFEckIsR0FGVjtBQUtFLGFBQVcsMEJBTGI7QUFNRSxhQUFXLENBQ1Q7QUFDRSxZQUFRLFNBRFY7QUFFRSxZQUFRO0FBRlYsR0FEUyxFQUtUO0FBQ0UsWUFBUSxNQURWO0FBRUUsWUFBUTtBQUZWLEdBTFMsQ0FOYjtBQWdCRSxVQUFRLFFBaEJWO0FBaUJFLGtCQUFnQiwwQkFqQmxCO0FBa0JFLGtCQUFnQjtBQWxCbEIsQ0FEWSxFQXFCWjtBQUNFLFFBQU0sV0FEUjtBQUVFLFVBQVE7QUFDTixZQUFRLGdCQURGLEVBQ29CLE1BQU07QUFEMUIsR0FGVjtBQUtFLGFBQVcsc0JBTGI7QUFNRSxhQUFXLENBQ1Q7QUFDRSxZQUFRLFNBRFY7QUFFRSxZQUFRO0FBRlYsR0FEUyxFQUtUO0FBQ0UsWUFBUSxNQURWO0FBRUUsWUFBUTtBQUZWLEdBTFMsQ0FOYjtBQWdCRSxVQUFRLFFBaEJWO0FBaUJFLGtCQUFnQiwwQkFqQmxCO0FBa0JFLGtCQUFnQjtBQWxCbEIsQ0FyQlksQ0FBZDs7QUEyQ0EsT0FBTyxPQUFQLEdBQWlCLEtBQWpCOzs7QUMzQ0E7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7Ozs7Ozs7OztBQUdBLElBQU0sUUFBUyxRQUFRLE9BQVIsQ0FBZjtBQUNBLElBQU0sU0FBUyxRQUFRLFFBQVIsQ0FBZjs7QUFFQTs7O0FBR0EsSUFBTSxPQUFPLFFBQVEsTUFBUixDQUFiOztBQUdBOzs7Ozs7Ozs7SUFTTSxLO0FBQ0osbUJBQWM7QUFBQTs7QUFDWixTQUFLLE1BQUw7QUFDRSxjQUFRLE9BRFY7QUFFRSxhQUFPLE9BRlQ7QUFHRSxlQUFTLEtBSFg7QUFJRSxjQUFRLE1BSlY7QUFLRSxjQUFRO0FBTFYsZUFNVSxNQU5WO0FBUUEsV0FBTyxLQUFLLFlBQUwsRUFBUDtBQUNEOzs7O21DQUVhO0FBQ1osVUFBTSxPQUFPLElBQWI7QUFDQSxVQUFJLFFBQVEsSUFBWjtBQUNBLFVBQUksUUFBUSxFQUFaOztBQUhZLGlDQUlILE1BSkc7QUFLVixjQUFNLE1BQU4sSUFBZ0IsWUFBVztBQUN6QixjQUFNLE9BQU8sTUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLFNBQTNCLENBQWI7QUFDQSxjQUFNLFFBQVEsS0FBSyxNQUFMLENBQVksTUFBWixDQUFkO0FBQ0EsY0FBTSxTQUFTLE1BQU0sSUFBTixDQUFXLEtBQVgsUUFBc0IsU0FBUyxNQUFULENBQWdCLFVBQWhCLENBQXRCLE9BQWY7QUFDQSxlQUFLLElBQUksR0FBVCxJQUFnQixJQUFoQixFQUFzQjtBQUNwQixnQkFBSSxPQUFPLEtBQUssR0FBTCxDQUFQLEtBQXFCLFFBQXpCLEVBQW1DO0FBQ2pDLG1CQUFLLEdBQUwsSUFBWSxNQUFNLElBQU4sQ0FBVyxLQUFYLEVBQWtCLEtBQUssR0FBTCxDQUFsQixDQUFaO0FBQ0Q7QUFDRjtBQUNELGNBQU0sVUFBVSxDQUFDLE1BQUQsRUFBUyxNQUFULENBQWdCLElBQWhCLENBQWhCO0FBQ0Esa0JBQVEsTUFBUixFQUFnQixLQUFoQixDQUFzQixPQUF0QixFQUErQixPQUEvQjtBQUNELFNBWEQ7QUFMVTs7QUFJWixXQUFLLElBQUksTUFBVCxJQUFtQixPQUFuQixFQUE0QjtBQUFBLGNBQW5CLE1BQW1CO0FBYTNCO0FBQ0QsYUFBTyxLQUFQO0FBQ0Q7Ozs7OztBQUtILElBQU0sUUFBUSxJQUFJLEtBQUosRUFBZDs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsS0FBakI7Ozs7Ozs7OztJQ25GTSxVO0FBQ0osd0JBQWM7QUFBQTs7QUFDWixTQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDRDs7Ozt5QkFFSSxTLEVBQVc7QUFDZCxhQUFPLGFBQVAsQ0FBcUIsS0FBSyxVQUFMLE1BQW1CLFNBQW5CLENBQXJCO0FBQ0Q7OztnQ0FFVyxTLEVBQVcsTSxFQUFRO0FBQzdCLFdBQUssVUFBTCxDQUFnQixTQUFoQixJQUE2QixJQUFJLFdBQUosTUFBbUIsU0FBbkIsRUFBZ0M7QUFDM0Q7QUFEMkQsT0FBaEMsQ0FBN0I7QUFHRDs7O2dDQUUrRDtBQUFBLFVBQXRELE1BQXNELHVFQUE3QyxNQUE2QztBQUFBLFVBQXJDLFNBQXFDO0FBQUEsVUFBMUIsT0FBMEI7QUFBQSxVQUFqQixPQUFpQix1RUFBUCxLQUFPOztBQUM5RCxhQUFPLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLE9BQW5DLEVBQTRDLE9BQTVDO0FBQ0Q7Ozs7OztBQUdILE9BQU8sT0FBUCxHQUFpQixJQUFJLFVBQUosRUFBakI7Ozs7O0FDcEJBLElBQU0sUUFBUSxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQU0sUUFBUSxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQU0sYUFBYSxRQUFRLGNBQVIsQ0FBbkI7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsY0FEZTtBQUVmLGNBRmU7QUFHZjtBQUhlLENBQWpCOzs7OztBQ0hBLFNBQVMsVUFBVCxDQUFvQixNQUFwQixFQUE0QjtBQUMxQixTQUFPLE9BQU8sT0FBUCxDQUFlLE9BQWYsRUFBd0IsVUFBUyxDQUFULEVBQVc7QUFBRSxXQUFPLEVBQUUsV0FBRixFQUFQO0FBQXdCLEdBQTdELENBQVA7QUFDRDtBQUNELFNBQVMsT0FBVCxDQUFpQixHQUFqQixFQUFzQjtBQUNwQixNQUFJLE9BQU8sSUFBWDs7QUFFQSxNQUFJLFFBQVEsU0FBWixFQUF1QjtBQUNyQixXQUFPLFdBQVA7QUFDRDs7QUFFRCxNQUFJLFFBQVEsSUFBWixFQUFrQjtBQUNoQixXQUFPLE1BQVA7QUFDRDs7QUFFRCxNQUFNLGFBQWEsT0FBTyxTQUFQLENBQWlCLFFBQWpCLENBQTBCLElBQTFCLENBQStCLEdBQS9CLENBQW5CO0FBQ0EsU0FBTyxXQUFXLEtBQVgsQ0FBaUIsV0FBVyxPQUFYLENBQW1CLEdBQW5CLElBQTBCLENBQTNDLEVBQThDLENBQUMsQ0FBL0MsQ0FBUDtBQUNBLFNBQU8sSUFBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLGtCQURlO0FBRWY7QUFGZSxDQUFqQjs7Ozs7QUNwQkEsSUFBTSxXQUFXLFFBQVEsUUFBUixDQUFqQjs7QUFFQSxPQUFPLE9BQVAsR0FBaUI7QUFDZjtBQURlLENBQWpCOzs7Ozs7Ozs7Ozs7Ozs7ZUNGaUIsUUFBUSxjQUFSLEM7SUFBVCxJLFlBQUEsSTs7Z0JBQ1UsUUFBUSxpQkFBUixDO0lBQVYsSyxhQUFBLEs7O0lBRUYsUTs7O0FBQ0osc0JBQWM7QUFBQTs7QUFBQSwrR0FDTjtBQUNKLFlBQU0sV0FERjtBQUVKLGlCQUFXO0FBRlAsS0FETTtBQUtiOzs7OzBCQUVLLEksRUFBTTtBQUNWLGdIQUFZLElBQVo7QUFDQSxZQUFNLEdBQU4sQ0FBVSx1QkFBVjtBQUNBLFVBQUksU0FBSixDQUFjLFdBQWQsRUFBMkIsS0FBM0IsQ0FBaUM7QUFDL0IsbUJBQVcsS0FBSztBQURlLE9BQWpDO0FBR0EsVUFBSSxTQUFKLENBQWMsV0FBZCxFQUEyQixLQUEzQjtBQUNEOzs7O0VBZm9CLEk7O0FBa0J2QixPQUFPLE9BQVAsR0FBaUIsUUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiAvW1xcdTAwMWJcXHUwMDliXVtbKCkjOz9dKig/OlswLTldezEsNH0oPzo7WzAtOV17MCw0fSkqKT9bMC05QS1PUlpjZi1ucXJ5PT48XS9nO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gYXNzZW1ibGVTdHlsZXMgKCkge1xuXHR2YXIgc3R5bGVzID0ge1xuXHRcdG1vZGlmaWVyczoge1xuXHRcdFx0cmVzZXQ6IFswLCAwXSxcblx0XHRcdGJvbGQ6IFsxLCAyMl0sIC8vIDIxIGlzbid0IHdpZGVseSBzdXBwb3J0ZWQgYW5kIDIyIGRvZXMgdGhlIHNhbWUgdGhpbmdcblx0XHRcdGRpbTogWzIsIDIyXSxcblx0XHRcdGl0YWxpYzogWzMsIDIzXSxcblx0XHRcdHVuZGVybGluZTogWzQsIDI0XSxcblx0XHRcdGludmVyc2U6IFs3LCAyN10sXG5cdFx0XHRoaWRkZW46IFs4LCAyOF0sXG5cdFx0XHRzdHJpa2V0aHJvdWdoOiBbOSwgMjldXG5cdFx0fSxcblx0XHRjb2xvcnM6IHtcblx0XHRcdGJsYWNrOiBbMzAsIDM5XSxcblx0XHRcdHJlZDogWzMxLCAzOV0sXG5cdFx0XHRncmVlbjogWzMyLCAzOV0sXG5cdFx0XHR5ZWxsb3c6IFszMywgMzldLFxuXHRcdFx0Ymx1ZTogWzM0LCAzOV0sXG5cdFx0XHRtYWdlbnRhOiBbMzUsIDM5XSxcblx0XHRcdGN5YW46IFszNiwgMzldLFxuXHRcdFx0d2hpdGU6IFszNywgMzldLFxuXHRcdFx0Z3JheTogWzkwLCAzOV1cblx0XHR9LFxuXHRcdGJnQ29sb3JzOiB7XG5cdFx0XHRiZ0JsYWNrOiBbNDAsIDQ5XSxcblx0XHRcdGJnUmVkOiBbNDEsIDQ5XSxcblx0XHRcdGJnR3JlZW46IFs0MiwgNDldLFxuXHRcdFx0YmdZZWxsb3c6IFs0MywgNDldLFxuXHRcdFx0YmdCbHVlOiBbNDQsIDQ5XSxcblx0XHRcdGJnTWFnZW50YTogWzQ1LCA0OV0sXG5cdFx0XHRiZ0N5YW46IFs0NiwgNDldLFxuXHRcdFx0YmdXaGl0ZTogWzQ3LCA0OV1cblx0XHR9XG5cdH07XG5cblx0Ly8gZml4IGh1bWFuc1xuXHRzdHlsZXMuY29sb3JzLmdyZXkgPSBzdHlsZXMuY29sb3JzLmdyYXk7XG5cblx0T2JqZWN0LmtleXMoc3R5bGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChncm91cE5hbWUpIHtcblx0XHR2YXIgZ3JvdXAgPSBzdHlsZXNbZ3JvdXBOYW1lXTtcblxuXHRcdE9iamVjdC5rZXlzKGdyb3VwKS5mb3JFYWNoKGZ1bmN0aW9uIChzdHlsZU5hbWUpIHtcblx0XHRcdHZhciBzdHlsZSA9IGdyb3VwW3N0eWxlTmFtZV07XG5cblx0XHRcdHN0eWxlc1tzdHlsZU5hbWVdID0gZ3JvdXBbc3R5bGVOYW1lXSA9IHtcblx0XHRcdFx0b3BlbjogJ1xcdTAwMWJbJyArIHN0eWxlWzBdICsgJ20nLFxuXHRcdFx0XHRjbG9zZTogJ1xcdTAwMWJbJyArIHN0eWxlWzFdICsgJ20nXG5cdFx0XHR9O1xuXHRcdH0pO1xuXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHN0eWxlcywgZ3JvdXBOYW1lLCB7XG5cdFx0XHR2YWx1ZTogZ3JvdXAsXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZVxuXHRcdH0pO1xuXHR9KTtcblxuXHRyZXR1cm4gc3R5bGVzO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlLCAnZXhwb3J0cycsIHtcblx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0Z2V0OiBhc3NlbWJsZVN0eWxlc1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZXNjYXBlU3RyaW5nUmVnZXhwID0gcmVxdWlyZSgnZXNjYXBlLXN0cmluZy1yZWdleHAnKTtcbnZhciBhbnNpU3R5bGVzID0gcmVxdWlyZSgnYW5zaS1zdHlsZXMnKTtcbnZhciBzdHJpcEFuc2kgPSByZXF1aXJlKCdzdHJpcC1hbnNpJyk7XG52YXIgaGFzQW5zaSA9IHJlcXVpcmUoJ2hhcy1hbnNpJyk7XG52YXIgc3VwcG9ydHNDb2xvciA9IHJlcXVpcmUoJ3N1cHBvcnRzLWNvbG9yJyk7XG52YXIgZGVmaW5lUHJvcHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcztcbnZhciBpc1NpbXBsZVdpbmRvd3NUZXJtID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyAmJiAhL154dGVybS9pLnRlc3QocHJvY2Vzcy5lbnYuVEVSTSk7XG5cbmZ1bmN0aW9uIENoYWxrKG9wdGlvbnMpIHtcblx0Ly8gZGV0ZWN0IG1vZGUgaWYgbm90IHNldCBtYW51YWxseVxuXHR0aGlzLmVuYWJsZWQgPSAhb3B0aW9ucyB8fCBvcHRpb25zLmVuYWJsZWQgPT09IHVuZGVmaW5lZCA/IHN1cHBvcnRzQ29sb3IgOiBvcHRpb25zLmVuYWJsZWQ7XG59XG5cbi8vIHVzZSBicmlnaHQgYmx1ZSBvbiBXaW5kb3dzIGFzIHRoZSBub3JtYWwgYmx1ZSBjb2xvciBpcyBpbGxlZ2libGVcbmlmIChpc1NpbXBsZVdpbmRvd3NUZXJtKSB7XG5cdGFuc2lTdHlsZXMuYmx1ZS5vcGVuID0gJ1xcdTAwMWJbOTRtJztcbn1cblxudmFyIHN0eWxlcyA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciByZXQgPSB7fTtcblxuXHRPYmplY3Qua2V5cyhhbnNpU3R5bGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRhbnNpU3R5bGVzW2tleV0uY2xvc2VSZSA9IG5ldyBSZWdFeHAoZXNjYXBlU3RyaW5nUmVnZXhwKGFuc2lTdHlsZXNba2V5XS5jbG9zZSksICdnJyk7XG5cblx0XHRyZXRba2V5XSA9IHtcblx0XHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRyZXR1cm4gYnVpbGQuY2FsbCh0aGlzLCB0aGlzLl9zdHlsZXMuY29uY2F0KGtleSkpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pO1xuXG5cdHJldHVybiByZXQ7XG59KSgpO1xuXG52YXIgcHJvdG8gPSBkZWZpbmVQcm9wcyhmdW5jdGlvbiBjaGFsaygpIHt9LCBzdHlsZXMpO1xuXG5mdW5jdGlvbiBidWlsZChfc3R5bGVzKSB7XG5cdHZhciBidWlsZGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBhcHBseVN0eWxlLmFwcGx5KGJ1aWxkZXIsIGFyZ3VtZW50cyk7XG5cdH07XG5cblx0YnVpbGRlci5fc3R5bGVzID0gX3N0eWxlcztcblx0YnVpbGRlci5lbmFibGVkID0gdGhpcy5lbmFibGVkO1xuXHQvLyBfX3Byb3RvX18gaXMgdXNlZCBiZWNhdXNlIHdlIG11c3QgcmV0dXJuIGEgZnVuY3Rpb24sIGJ1dCB0aGVyZSBpc1xuXHQvLyBubyB3YXkgdG8gY3JlYXRlIGEgZnVuY3Rpb24gd2l0aCBhIGRpZmZlcmVudCBwcm90b3R5cGUuXG5cdC8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cdGJ1aWxkZXIuX19wcm90b19fID0gcHJvdG87XG5cblx0cmV0dXJuIGJ1aWxkZXI7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGUoKSB7XG5cdC8vIHN1cHBvcnQgdmFyYWdzLCBidXQgc2ltcGx5IGNhc3QgdG8gc3RyaW5nIGluIGNhc2UgdGhlcmUncyBvbmx5IG9uZSBhcmdcblx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cdHZhciBhcmdzTGVuID0gYXJncy5sZW5ndGg7XG5cdHZhciBzdHIgPSBhcmdzTGVuICE9PSAwICYmIFN0cmluZyhhcmd1bWVudHNbMF0pO1xuXG5cdGlmIChhcmdzTGVuID4gMSkge1xuXHRcdC8vIGRvbid0IHNsaWNlIGBhcmd1bWVudHNgLCBpdCBwcmV2ZW50cyB2OCBvcHRpbWl6YXRpb25zXG5cdFx0Zm9yICh2YXIgYSA9IDE7IGEgPCBhcmdzTGVuOyBhKyspIHtcblx0XHRcdHN0ciArPSAnICcgKyBhcmdzW2FdO1xuXHRcdH1cblx0fVxuXG5cdGlmICghdGhpcy5lbmFibGVkIHx8ICFzdHIpIHtcblx0XHRyZXR1cm4gc3RyO1xuXHR9XG5cblx0dmFyIG5lc3RlZFN0eWxlcyA9IHRoaXMuX3N0eWxlcztcblx0dmFyIGkgPSBuZXN0ZWRTdHlsZXMubGVuZ3RoO1xuXG5cdC8vIFR1cm5zIG91dCB0aGF0IG9uIFdpbmRvd3MgZGltbWVkIGdyYXkgdGV4dCBiZWNvbWVzIGludmlzaWJsZSBpbiBjbWQuZXhlLFxuXHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2NoYWxrL2lzc3Vlcy81OFxuXHQvLyBJZiB3ZSdyZSBvbiBXaW5kb3dzIGFuZCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBncmF5IGNvbG9yLCB0ZW1wb3JhcmlseSBtYWtlICdkaW0nIGEgbm9vcC5cblx0dmFyIG9yaWdpbmFsRGltID0gYW5zaVN0eWxlcy5kaW0ub3Blbjtcblx0aWYgKGlzU2ltcGxlV2luZG93c1Rlcm0gJiYgKG5lc3RlZFN0eWxlcy5pbmRleE9mKCdncmF5JykgIT09IC0xIHx8IG5lc3RlZFN0eWxlcy5pbmRleE9mKCdncmV5JykgIT09IC0xKSkge1xuXHRcdGFuc2lTdHlsZXMuZGltLm9wZW4gPSAnJztcblx0fVxuXG5cdHdoaWxlIChpLS0pIHtcblx0XHR2YXIgY29kZSA9IGFuc2lTdHlsZXNbbmVzdGVkU3R5bGVzW2ldXTtcblxuXHRcdC8vIFJlcGxhY2UgYW55IGluc3RhbmNlcyBhbHJlYWR5IHByZXNlbnQgd2l0aCBhIHJlLW9wZW5pbmcgY29kZVxuXHRcdC8vIG90aGVyd2lzZSBvbmx5IHRoZSBwYXJ0IG9mIHRoZSBzdHJpbmcgdW50aWwgc2FpZCBjbG9zaW5nIGNvZGVcblx0XHQvLyB3aWxsIGJlIGNvbG9yZWQsIGFuZCB0aGUgcmVzdCB3aWxsIHNpbXBseSBiZSAncGxhaW4nLlxuXHRcdHN0ciA9IGNvZGUub3BlbiArIHN0ci5yZXBsYWNlKGNvZGUuY2xvc2VSZSwgY29kZS5vcGVuKSArIGNvZGUuY2xvc2U7XG5cdH1cblxuXHQvLyBSZXNldCB0aGUgb3JpZ2luYWwgJ2RpbScgaWYgd2UgY2hhbmdlZCBpdCB0byB3b3JrIGFyb3VuZCB0aGUgV2luZG93cyBkaW1tZWQgZ3JheSBpc3N1ZS5cblx0YW5zaVN0eWxlcy5kaW0ub3BlbiA9IG9yaWdpbmFsRGltO1xuXG5cdHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG5cdHZhciByZXQgPSB7fTtcblxuXHRPYmplY3Qua2V5cyhzdHlsZXMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRyZXRbbmFtZV0gPSB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmV0dXJuIGJ1aWxkLmNhbGwodGhpcywgW25hbWVdKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcblxuXHRyZXR1cm4gcmV0O1xufVxuXG5kZWZpbmVQcm9wcyhDaGFsay5wcm90b3R5cGUsIGluaXQoKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IENoYWxrKCk7XG5tb2R1bGUuZXhwb3J0cy5zdHlsZXMgPSBhbnNpU3R5bGVzO1xubW9kdWxlLmV4cG9ydHMuaGFzQ29sb3IgPSBoYXNBbnNpO1xubW9kdWxlLmV4cG9ydHMuc3RyaXBDb2xvciA9IHN0cmlwQW5zaTtcbm1vZHVsZS5leHBvcnRzLnN1cHBvcnRzQ29sb3IgPSBzdXBwb3J0c0NvbG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWF0Y2hPcGVyYXRvcnNSZSA9IC9bfFxcXFx7fSgpW1xcXV4kKyo/Ll0vZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyKSB7XG5cdGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGEgc3RyaW5nJyk7XG5cdH1cblxuXHRyZXR1cm4gc3RyLnJlcGxhY2UobWF0Y2hPcGVyYXRvcnNSZSwgJ1xcXFwkJicpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBhbnNpUmVnZXggPSByZXF1aXJlKCdhbnNpLXJlZ2V4Jyk7XG52YXIgcmUgPSBuZXcgUmVnRXhwKGFuc2lSZWdleCgpLnNvdXJjZSk7IC8vIHJlbW92ZSB0aGUgYGdgIGZsYWdcbm1vZHVsZS5leHBvcnRzID0gcmUudGVzdC5iaW5kKHJlKTtcbiIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi4xNS4yXG4vLyEgYXV0aG9ycyA6IFRpbSBXb29kLCBJc2tyZW4gQ2hlcm5ldiwgTW9tZW50LmpzIGNvbnRyaWJ1dG9yc1xuLy8hIGxpY2Vuc2UgOiBNSVRcbi8vISBtb21lbnRqcy5jb21cblxuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gICAgZ2xvYmFsLm1vbWVudCA9IGZhY3RvcnkoKVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBob29rQ2FsbGJhY2s7XG5cbiAgICBmdW5jdGlvbiB1dGlsc19ob29rc19faG9va3MgKCkge1xuICAgICAgICByZXR1cm4gaG9va0NhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBkb25lIHRvIHJlZ2lzdGVyIHRoZSBtZXRob2QgY2FsbGVkIHdpdGggbW9tZW50KClcbiAgICAvLyB3aXRob3V0IGNyZWF0aW5nIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICBmdW5jdGlvbiBzZXRIb29rQ2FsbGJhY2sgKGNhbGxiYWNrKSB7XG4gICAgICAgIGhvb2tDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgQXJyYXkgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc09iamVjdChpbnB1dCkge1xuICAgICAgICAvLyBJRTggd2lsbCB0cmVhdCB1bmRlZmluZWQgYW5kIG51bGwgYXMgb2JqZWN0IGlmIGl0IHdhc24ndCBmb3JcbiAgICAgICAgLy8gaW5wdXQgIT0gbnVsbFxuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBPYmplY3RdJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgICAgICB2YXIgaztcbiAgICAgICAgZm9yIChrIGluIG9iaikge1xuICAgICAgICAgICAgLy8gZXZlbiBpZiBpdHMgbm90IG93biBwcm9wZXJ0eSBJJ2Qgc3RpbGwgY2FsbCBpdCBub24tZW1wdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0RhdGUoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRGF0ZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFwKGFyciwgZm4pIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXMucHVzaChmbihhcnJbaV0sIGkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc093blByb3AoYSwgYikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgICAgIGZvciAodmFyIGkgaW4gYikge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AoYiwgaSkpIHtcbiAgICAgICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIHRydWUpLnV0YygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRQYXJzaW5nRmxhZ3MoKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdC5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVtcHR5ICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgdW51c2VkVG9rZW5zICAgIDogW10sXG4gICAgICAgICAgICB1bnVzZWRJbnB1dCAgICAgOiBbXSxcbiAgICAgICAgICAgIG92ZXJmbG93ICAgICAgICA6IC0yLFxuICAgICAgICAgICAgY2hhcnNMZWZ0T3ZlciAgIDogMCxcbiAgICAgICAgICAgIG51bGxJbnB1dCAgICAgICA6IGZhbHNlLFxuICAgICAgICAgICAgaW52YWxpZE1vbnRoICAgIDogbnVsbCxcbiAgICAgICAgICAgIGludmFsaWRGb3JtYXQgICA6IGZhbHNlLFxuICAgICAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXG4gICAgICAgICAgICBpc28gICAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHBhcnNlZERhdGVQYXJ0cyA6IFtdLFxuICAgICAgICAgICAgbWVyaWRpZW0gICAgICAgIDogbnVsbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFBhcnNpbmdGbGFncyhtKSB7XG4gICAgICAgIGlmIChtLl9wZiA9PSBudWxsKSB7XG4gICAgICAgICAgICBtLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS5fcGY7XG4gICAgfVxuXG4gICAgdmFyIHNvbWU7XG4gICAgaWYgKEFycmF5LnByb3RvdHlwZS5zb21lKSB7XG4gICAgICAgIHNvbWUgPSBBcnJheS5wcm90b3R5cGUuc29tZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzb21lID0gZnVuY3Rpb24gKGZ1bikge1xuICAgICAgICAgICAgdmFyIHQgPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSBpbiB0ICYmIGZ1bi5jYWxsKHRoaXMsIHRbaV0sIGksIHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbGlkX19pc1ZhbGlkKG0pIHtcbiAgICAgICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGZsYWdzID0gZ2V0UGFyc2luZ0ZsYWdzKG0pO1xuICAgICAgICAgICAgdmFyIHBhcnNlZFBhcnRzID0gc29tZS5jYWxsKGZsYWdzLnBhcnNlZERhdGVQYXJ0cywgZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaSAhPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgaXNOb3dWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgICAgICBmbGFncy5vdmVyZmxvdyA8IDAgJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MuZW1wdHkgJiZcbiAgICAgICAgICAgICAgICAhZmxhZ3MuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLmludmFsaWRXZWVrZGF5ICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgICAgICFmbGFncy5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAgICAgIWZsYWdzLnVzZXJJbnZhbGlkYXRlZCAmJlxuICAgICAgICAgICAgICAgICghZmxhZ3MubWVyaWRpZW0gfHwgKGZsYWdzLm1lcmlkaWVtICYmIHBhcnNlZFBhcnRzKSk7XG5cbiAgICAgICAgICAgIGlmIChtLl9zdHJpY3QpIHtcbiAgICAgICAgICAgICAgICBpc05vd1ZhbGlkID0gaXNOb3dWYWxpZCAmJlxuICAgICAgICAgICAgICAgICAgICBmbGFncy5jaGFyc0xlZnRPdmVyID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLnVudXNlZFRva2Vucy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuYmlnSG91ciA9PT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoT2JqZWN0LmlzRnJvemVuID09IG51bGwgfHwgIU9iamVjdC5pc0Zyb3plbihtKSkge1xuICAgICAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBpc05vd1ZhbGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm93VmFsaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0uX2lzVmFsaWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRfX2NyZWF0ZUludmFsaWQgKGZsYWdzKSB7XG4gICAgICAgIHZhciBtID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKE5hTik7XG4gICAgICAgIGlmIChmbGFncyAhPSBudWxsKSB7XG4gICAgICAgICAgICBleHRlbmQoZ2V0UGFyc2luZ0ZsYWdzKG0pLCBmbGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MobSkudXNlckludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVW5kZWZpbmVkKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCA9PT0gdm9pZCAwO1xuICAgIH1cblxuICAgIC8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcbiAgICAvLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxuICAgIHZhciBtb21lbnRQcm9wZXJ0aWVzID0gdXRpbHNfaG9va3NfX2hvb2tzLm1vbWVudFByb3BlcnRpZXMgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGNvcHlDb25maWcodG8sIGZyb20pIHtcbiAgICAgICAgdmFyIGksIHByb3AsIHZhbDtcblxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzQU1vbWVudE9iamVjdCkpIHtcbiAgICAgICAgICAgIHRvLl9pc0FNb21lbnRPYmplY3QgPSBmcm9tLl9pc0FNb21lbnRPYmplY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pKSkge1xuICAgICAgICAgICAgdG8uX2kgPSBmcm9tLl9pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fZikpIHtcbiAgICAgICAgICAgIHRvLl9mID0gZnJvbS5fZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2wpKSB7XG4gICAgICAgICAgICB0by5fbCA9IGZyb20uX2w7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9zdHJpY3QpKSB7XG4gICAgICAgICAgICB0by5fc3RyaWN0ID0gZnJvbS5fc3RyaWN0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fdHptKSkge1xuICAgICAgICAgICAgdG8uX3R6bSA9IGZyb20uX3R6bTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzVVRDKSkge1xuICAgICAgICAgICAgdG8uX2lzVVRDID0gZnJvbS5faXNVVEM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9vZmZzZXQpKSB7XG4gICAgICAgICAgICB0by5fb2Zmc2V0ID0gZnJvbS5fb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fcGYpKSB7XG4gICAgICAgICAgICB0by5fcGYgPSBnZXRQYXJzaW5nRmxhZ3MoZnJvbSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9sb2NhbGUpKSB7XG4gICAgICAgICAgICB0by5fbG9jYWxlID0gZnJvbS5fbG9jYWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vbWVudFByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChpIGluIG1vbWVudFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBwcm9wID0gbW9tZW50UHJvcGVydGllc1tpXTtcbiAgICAgICAgICAgICAgICB2YWwgPSBmcm9tW3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQodmFsKSkge1xuICAgICAgICAgICAgICAgICAgICB0b1twcm9wXSA9IHZhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG87XG4gICAgfVxuXG4gICAgdmFyIHVwZGF0ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAgIC8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTW9tZW50KGNvbmZpZykge1xuICAgICAgICBjb3B5Q29uZmlnKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIHRoaXMuX2QgPSBuZXcgRGF0ZShjb25maWcuX2QgIT0gbnVsbCA/IGNvbmZpZy5fZC5nZXRUaW1lKCkgOiBOYU4pO1xuICAgICAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3AgaW4gY2FzZSB1cGRhdGVPZmZzZXQgY3JlYXRlcyBuZXcgbW9tZW50XG4gICAgICAgIC8vIG9iamVjdHMuXG4gICAgICAgIGlmICh1cGRhdGVJblByb2dyZXNzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNNb21lbnQgKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTW9tZW50IHx8IChvYmogIT0gbnVsbCAmJiBvYmouX2lzQU1vbWVudE9iamVjdCAhPSBudWxsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhYnNGbG9vciAobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgICAgICAvLyAtMCAtPiAwXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcikgfHwgMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XG4gICAgICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXG4gICAgICAgICAgICB2YWx1ZSA9IDA7XG5cbiAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYWJzRmxvb3IoY29lcmNlZE51bWJlcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gY29tcGFyZSB0d28gYXJyYXlzLCByZXR1cm4gdGhlIG51bWJlciBvZiBkaWZmZXJlbmNlc1xuICAgIGZ1bmN0aW9uIGNvbXBhcmVBcnJheXMoYXJyYXkxLCBhcnJheTIsIGRvbnRDb252ZXJ0KSB7XG4gICAgICAgIHZhciBsZW4gPSBNYXRoLm1pbihhcnJheTEubGVuZ3RoLCBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGxlbmd0aERpZmYgPSBNYXRoLmFicyhhcnJheTEubGVuZ3RoIC0gYXJyYXkyLmxlbmd0aCksXG4gICAgICAgICAgICBkaWZmcyA9IDAsXG4gICAgICAgICAgICBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgoZG9udENvbnZlcnQgJiYgYXJyYXkxW2ldICE9PSBhcnJheTJbaV0pIHx8XG4gICAgICAgICAgICAgICAgKCFkb250Q29udmVydCAmJiB0b0ludChhcnJheTFbaV0pICE9PSB0b0ludChhcnJheTJbaV0pKSkge1xuICAgICAgICAgICAgICAgIGRpZmZzKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpZmZzICsgbGVuZ3RoRGlmZjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3YXJuKG1zZykge1xuICAgICAgICBpZiAodXRpbHNfaG9va3NfX2hvb2tzLnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9PT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgICAodHlwZW9mIGNvbnNvbGUgIT09ICAndW5kZWZpbmVkJykgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RlcHJlY2F0aW9uIHdhcm5pbmc6ICcgKyBtc2cpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVwcmVjYXRlKG1zZywgZm4pIHtcbiAgICAgICAgdmFyIGZpcnN0VGltZSA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlcihudWxsLCBtc2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZSkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGFyZztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgKz0gJ1xcblsnICsgaSArICddICc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnICs9IGtleSArICc6ICcgKyBhcmd1bWVudHNbMF1ba2V5XSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcuc2xpY2UoMCwgLTIpOyAvLyBSZW1vdmUgdHJhaWxpbmcgY29tbWEgYW5kIHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdhcm4obXNnICsgJ1xcbkFyZ3VtZW50czogJyArIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpLmpvaW4oJycpICsgJ1xcbicgKyAobmV3IEVycm9yKCkpLnN0YWNrKTtcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBmbik7XG4gICAgfVxuXG4gICAgdmFyIGRlcHJlY2F0aW9ucyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGVwcmVjYXRlU2ltcGxlKG5hbWUsIG1zZykge1xuICAgICAgICBpZiAodXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG5hbWUsIG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZXByZWNhdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHdhcm4obXNnKTtcbiAgICAgICAgICAgIGRlcHJlY2F0aW9uc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBpc0Z1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEZ1bmN0aW9uIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9jYWxlX3NldF9fc2V0IChjb25maWcpIHtcbiAgICAgICAgdmFyIHByb3AsIGk7XG4gICAgICAgIGZvciAoaSBpbiBjb25maWcpIHtcbiAgICAgICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwcm9wKSkge1xuICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzWydfJyArIGldID0gcHJvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIExlbmllbnQgb3JkaW5hbCBwYXJzaW5nIGFjY2VwdHMganVzdCBhIG51bWJlciBpbiBhZGRpdGlvbiB0b1xuICAgICAgICAvLyBudW1iZXIgKyAocG9zc2libHkpIHN0dWZmIGNvbWluZyBmcm9tIF9vcmRpbmFsUGFyc2VMZW5pZW50LlxuICAgICAgICB0aGlzLl9vcmRpbmFsUGFyc2VMZW5pZW50ID0gbmV3IFJlZ0V4cCh0aGlzLl9vcmRpbmFsUGFyc2Uuc291cmNlICsgJ3wnICsgKC9cXGR7MSwyfS8pLnNvdXJjZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY2hpbGRDb25maWcpIHtcbiAgICAgICAgdmFyIHJlcyA9IGV4dGVuZCh7fSwgcGFyZW50Q29uZmlnKSwgcHJvcDtcbiAgICAgICAgZm9yIChwcm9wIGluIGNoaWxkQ29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSAmJiBpc09iamVjdChjaGlsZENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW3Byb3BdID0ge307XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIHBhcmVudENvbmZpZ1twcm9wXSk7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIGNoaWxkQ29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkQ29uZmlnW3Byb3BdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW3Byb3BdID0gY2hpbGRDb25maWdbcHJvcF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChwcm9wIGluIHBhcmVudENvbmZpZykge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AocGFyZW50Q29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgICAgICAhaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkgJiZcbiAgICAgICAgICAgICAgICAgICAgaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBjaGFuZ2VzIHRvIHByb3BlcnRpZXMgZG9uJ3QgbW9kaWZ5IHBhcmVudCBjb25maWdcbiAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSBleHRlbmQoe30sIHJlc1twcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBMb2NhbGUoY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zZXQoY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBrZXlzO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKSB7XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cztcbiAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGksIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKG9iaiwgaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdENhbGVuZGFyID0ge1xuICAgICAgICBzYW1lRGF5IDogJ1tUb2RheSBhdF0gTFQnLFxuICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgICAgICBuZXh0V2VlayA6ICdkZGRkIFthdF0gTFQnLFxuICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXkgYXRdIExUJyxcbiAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgICAgIHNhbWVFbHNlIDogJ0wnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvY2FsZV9jYWxlbmRhcl9fY2FsZW5kYXIgKGtleSwgbW9tLCBub3cpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV0gfHwgdGhpcy5fY2FsZW5kYXJbJ3NhbWVFbHNlJ107XG4gICAgICAgIHJldHVybiBpc0Z1bmN0aW9uKG91dHB1dCkgPyBvdXRwdXQuY2FsbChtb20sIG5vdykgOiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb25nRGF0ZUZvcm1hdCA9IHtcbiAgICAgICAgTFRTICA6ICdoOm1tOnNzIEEnLFxuICAgICAgICBMVCAgIDogJ2g6bW0gQScsXG4gICAgICAgIEwgICAgOiAnTU0vREQvWVlZWScsXG4gICAgICAgIExMICAgOiAnTU1NTSBELCBZWVlZJyxcbiAgICAgICAgTExMICA6ICdNTU1NIEQsIFlZWVkgaDptbSBBJyxcbiAgICAgICAgTExMTCA6ICdkZGRkLCBNTU1NIEQsIFlZWVkgaDptbSBBJ1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBsb25nRGF0ZUZvcm1hdCAoa2V5KSB7XG4gICAgICAgIHZhciBmb3JtYXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldLFxuICAgICAgICAgICAgZm9ybWF0VXBwZXIgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXkudG9VcHBlckNhc2UoKV07XG5cbiAgICAgICAgaWYgKGZvcm1hdCB8fCAhZm9ybWF0VXBwZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldID0gZm9ybWF0VXBwZXIucmVwbGFjZSgvTU1NTXxNTXxERHxkZGRkL2csIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0SW52YWxpZERhdGUgPSAnSW52YWxpZCBkYXRlJztcblxuICAgIGZ1bmN0aW9uIGludmFsaWREYXRlICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0T3JkaW5hbCA9ICclZCc7XG4gICAgdmFyIGRlZmF1bHRPcmRpbmFsUGFyc2UgPSAvXFxkezEsMn0vO1xuXG4gICAgZnVuY3Rpb24gb3JkaW5hbCAobnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoJyVkJywgbnVtYmVyKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdFJlbGF0aXZlVGltZSA9IHtcbiAgICAgICAgZnV0dXJlIDogJ2luICVzJyxcbiAgICAgICAgcGFzdCAgIDogJyVzIGFnbycsXG4gICAgICAgIHMgIDogJ2EgZmV3IHNlY29uZHMnLFxuICAgICAgICBtICA6ICdhIG1pbnV0ZScsXG4gICAgICAgIG1tIDogJyVkIG1pbnV0ZXMnLFxuICAgICAgICBoICA6ICdhbiBob3VyJyxcbiAgICAgICAgaGggOiAnJWQgaG91cnMnLFxuICAgICAgICBkICA6ICdhIGRheScsXG4gICAgICAgIGRkIDogJyVkIGRheXMnLFxuICAgICAgICBNICA6ICdhIG1vbnRoJyxcbiAgICAgICAgTU0gOiAnJWQgbW9udGhzJyxcbiAgICAgICAgeSAgOiAnYSB5ZWFyJyxcbiAgICAgICAgeXkgOiAnJWQgeWVhcnMnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlX19yZWxhdGl2ZVRpbWUgKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW3N0cmluZ107XG4gICAgICAgIHJldHVybiAoaXNGdW5jdGlvbihvdXRwdXQpKSA/XG4gICAgICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XG4gICAgICAgICAgICBvdXRwdXQucmVwbGFjZSgvJWQvaSwgbnVtYmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXN0RnV0dXJlIChkaWZmLCBvdXRwdXQpIHtcbiAgICAgICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcbiAgICAgICAgcmV0dXJuIGlzRnVuY3Rpb24oZm9ybWF0KSA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG4gICAgfVxuXG4gICAgdmFyIGFsaWFzZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFVuaXRBbGlhcyAodW5pdCwgc2hvcnRoYW5kKSB7XG4gICAgICAgIHZhciBsb3dlckNhc2UgPSB1bml0LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGFsaWFzZXNbbG93ZXJDYXNlXSA9IGFsaWFzZXNbbG93ZXJDYXNlICsgJ3MnXSA9IGFsaWFzZXNbc2hvcnRoYW5kXSA9IHVuaXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB1bml0cyA9PT0gJ3N0cmluZycgPyBhbGlhc2VzW3VuaXRzXSB8fCBhbGlhc2VzW3VuaXRzLnRvTG93ZXJDYXNlKCldIDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICAgICAgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKGlucHV0T2JqZWN0LCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xuICAgIH1cblxuICAgIHZhciBwcmlvcml0aWVzID0ge307XG5cbiAgICBmdW5jdGlvbiBhZGRVbml0UHJpb3JpdHkodW5pdCwgcHJpb3JpdHkpIHtcbiAgICAgICAgcHJpb3JpdGllc1t1bml0XSA9IHByaW9yaXR5O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByaW9yaXRpemVkVW5pdHModW5pdHNPYmopIHtcbiAgICAgICAgdmFyIHVuaXRzID0gW107XG4gICAgICAgIGZvciAodmFyIHUgaW4gdW5pdHNPYmopIHtcbiAgICAgICAgICAgIHVuaXRzLnB1c2goe3VuaXQ6IHUsIHByaW9yaXR5OiBwcmlvcml0aWVzW3VdfSk7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVuaXRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VHZXRTZXQgKHVuaXQsIGtlZXBUaW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZ2V0X3NldF9fc2V0KHRoaXMsIHVuaXQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIGtlZXBUaW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldF9zZXRfX2dldCh0aGlzLCB1bml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfc2V0X19nZXQgKG1vbSwgdW5pdCkge1xuICAgICAgICByZXR1cm4gbW9tLmlzVmFsaWQoKSA/XG4gICAgICAgICAgICBtb20uX2RbJ2dldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0oKSA6IE5hTjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfc2V0X19zZXQgKG1vbSwgdW5pdCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBzdHJpbmdHZXQgKHVuaXRzKSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gc3RyaW5nU2V0ICh1bml0cywgdmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1bml0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplT2JqZWN0VW5pdHModW5pdHMpO1xuICAgICAgICAgICAgdmFyIHByaW9yaXRpemVkID0gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0cyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaW9yaXRpemVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcmlvcml0aXplZFtpXS51bml0XSh1bml0c1twcmlvcml0aXplZFtpXS51bml0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gemVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xuICAgICAgICB2YXIgYWJzTnVtYmVyID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICAgICAgemVyb3NUb0ZpbGwgPSB0YXJnZXRMZW5ndGggLSBhYnNOdW1iZXIubGVuZ3RoLFxuICAgICAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xuICAgICAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArXG4gICAgICAgICAgICBNYXRoLnBvdygxMCwgTWF0aC5tYXgoMCwgemVyb3NUb0ZpbGwpKS50b1N0cmluZygpLnN1YnN0cigxKSArIGFic051bWJlcjtcbiAgICB9XG5cbiAgICB2YXIgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhbSGhdbW0oc3MpP3xNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRbz98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98a2s/fG1tP3xzcz98U3sxLDl9fHh8WHx6ej98Wlo/fC4pL2c7XG5cbiAgICB2YXIgbG9jYWxGb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUU3xMVHxMTD9MP0w/fGx7MSw0fSkvZztcblxuICAgIHZhciBmb3JtYXRGdW5jdGlvbnMgPSB7fTtcblxuICAgIHZhciBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHt9O1xuXG4gICAgLy8gdG9rZW46ICAgICdNJ1xuICAgIC8vIHBhZGRlZDogICBbJ01NJywgMl1cbiAgICAvLyBvcmRpbmFsOiAgJ01vJ1xuICAgIC8vIGNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7IHRoaXMubW9udGgoKSArIDEgfVxuICAgIGZ1bmN0aW9uIGFkZEZvcm1hdFRva2VuICh0b2tlbiwgcGFkZGVkLCBvcmRpbmFsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZnVuYyA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tjYWxsYmFja10oKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0gPSBmdW5jO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkZWQpIHtcbiAgICAgICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3BhZGRlZFswXV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHplcm9GaWxsKGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgcGFkZGVkWzFdLCBwYWRkZWRbMl0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3JkaW5hbCkge1xuICAgICAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbb3JkaW5hbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm9yZGluYWwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0b2tlbik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQubWF0Y2goL1xcW1tcXHNcXFNdLykpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxbfFxcXSQvZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dKSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhhcnJheVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9ICcnLCBpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGFycmF5W2ldIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBhcnJheVtpXS5jYWxsKG1vbSwgZm9ybWF0KSA6IGFycmF5W2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBmb3JtYXQgZGF0ZSB1c2luZyBuYXRpdmUgZGF0ZSBvYmplY3RcbiAgICBmdW5jdGlvbiBmb3JtYXRNb21lbnQobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBtLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sb2NhbGVEYXRhKCkpO1xuICAgICAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdIHx8IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xuXG4gICAgICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICAgICAgdmFyIGkgPSA1O1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoMSAgICAgICAgID0gL1xcZC87ICAgICAgICAgICAgLy8gICAgICAgMCAtIDlcbiAgICB2YXIgbWF0Y2gyICAgICAgICAgPSAvXFxkXFxkLzsgICAgICAgICAgLy8gICAgICAwMCAtIDk5XG4gICAgdmFyIG1hdGNoMyAgICAgICAgID0gL1xcZHszfS87ICAgICAgICAgLy8gICAgIDAwMCAtIDk5OVxuICAgIHZhciBtYXRjaDQgICAgICAgICA9IC9cXGR7NH0vOyAgICAgICAgIC8vICAgIDAwMDAgLSA5OTk5XG4gICAgdmFyIG1hdGNoNiAgICAgICAgID0gL1srLV0/XFxkezZ9LzsgICAgLy8gLTk5OTk5OSAtIDk5OTk5OVxuICAgIHZhciBtYXRjaDF0bzIgICAgICA9IC9cXGRcXGQ/LzsgICAgICAgICAvLyAgICAgICAwIC0gOTlcbiAgICB2YXIgbWF0Y2gzdG80ICAgICAgPSAvXFxkXFxkXFxkXFxkPy87ICAgICAvLyAgICAgOTk5IC0gOTk5OVxuICAgIHZhciBtYXRjaDV0bzYgICAgICA9IC9cXGRcXGRcXGRcXGRcXGRcXGQ/LzsgLy8gICA5OTk5OSAtIDk5OTk5OVxuICAgIHZhciBtYXRjaDF0bzMgICAgICA9IC9cXGR7MSwzfS87ICAgICAgIC8vICAgICAgIDAgLSA5OTlcbiAgICB2YXIgbWF0Y2gxdG80ICAgICAgPSAvXFxkezEsNH0vOyAgICAgICAvLyAgICAgICAwIC0gOTk5OVxuICAgIHZhciBtYXRjaDF0bzYgICAgICA9IC9bKy1dP1xcZHsxLDZ9LzsgIC8vIC05OTk5OTkgLSA5OTk5OTlcblxuICAgIHZhciBtYXRjaFVuc2lnbmVkICA9IC9cXGQrLzsgICAgICAgICAgIC8vICAgICAgIDAgLSBpbmZcbiAgICB2YXIgbWF0Y2hTaWduZWQgICAgPSAvWystXT9cXGQrLzsgICAgICAvLyAgICAtaW5mIC0gaW5mXG5cbiAgICB2YXIgbWF0Y2hPZmZzZXQgICAgPSAvWnxbKy1dXFxkXFxkOj9cXGRcXGQvZ2k7IC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxuICAgIHZhciBtYXRjaFNob3J0T2Zmc2V0ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vZ2k7IC8vICswMCAtMDAgKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG5cbiAgICB2YXIgbWF0Y2hUaW1lc3RhbXAgPSAvWystXT9cXGQrKFxcLlxcZHsxLDN9KT8vOyAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xuXG4gICAgLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4gICAgLy8gaW5jbHVkZXMgc2NvdHRpc2ggZ2FlbGljIHR3byB3b3JkIGFuZCBoeXBoZW5hdGVkIG1vbnRoc1xuICAgIHZhciBtYXRjaFdvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaTtcblxuXG4gICAgdmFyIHJlZ2V4ZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFJlZ2V4VG9rZW4gKHRva2VuLCByZWdleCwgc3RyaWN0UmVnZXgpIHtcbiAgICAgICAgcmVnZXhlc1t0b2tlbl0gPSBpc0Z1bmN0aW9uKHJlZ2V4KSA/IHJlZ2V4IDogZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGlzU3RyaWN0ICYmIHN0cmljdFJlZ2V4KSA/IHN0cmljdFJlZ2V4IDogcmVnZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UGFyc2VSZWdleEZvclRva2VuICh0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcChyZWdleGVzLCB0b2tlbikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHVuZXNjYXBlRm9ybWF0KHRva2VuKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVnZXhlc1t0b2tlbl0oY29uZmlnLl9zdHJpY3QsIGNvbmZpZy5fbG9jYWxlKTtcbiAgICB9XG5cbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgICAgICByZXR1cm4gcmVnZXhFc2NhcGUocy5yZXBsYWNlKCdcXFxcJywgJycpLnJlcGxhY2UoL1xcXFwoXFxbKXxcXFxcKFxcXSl8XFxbKFteXFxdXFxbXSopXFxdfFxcXFwoLikvZywgZnVuY3Rpb24gKG1hdGNoZWQsIHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgICAgICByZXR1cm4gcDEgfHwgcDIgfHwgcDMgfHwgcDQ7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWdleEVzY2FwZShzKSB7XG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgIH1cblxuICAgIHZhciB0b2tlbnMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZFBhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgaSwgZnVuYyA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdG9rZW4gPSBbdG9rZW5dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICAgICAgICAgIGFycmF5W2NhbGxiYWNrXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRva2VuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0b2tlbnNbdG9rZW5baV1dID0gZnVuYztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZFdlZWtQYXJzZVRva2VuICh0b2tlbiwgY2FsbGJhY2spIHtcbiAgICAgICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgY2FsbGJhY2soaW5wdXQsIGNvbmZpZy5fdywgY29uZmlnLCB0b2tlbik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgICAgIGlmIChpbnB1dCAhPSBudWxsICYmIGhhc093blByb3AodG9rZW5zLCB0b2tlbikpIHtcbiAgICAgICAgICAgIHRva2Vuc1t0b2tlbl0oaW5wdXQsIGNvbmZpZy5fYSwgY29uZmlnLCB0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgWUVBUiA9IDA7XG4gICAgdmFyIE1PTlRIID0gMTtcbiAgICB2YXIgREFURSA9IDI7XG4gICAgdmFyIEhPVVIgPSAzO1xuICAgIHZhciBNSU5VVEUgPSA0O1xuICAgIHZhciBTRUNPTkQgPSA1O1xuICAgIHZhciBNSUxMSVNFQ09ORCA9IDY7XG4gICAgdmFyIFdFRUsgPSA3O1xuICAgIHZhciBXRUVLREFZID0gODtcblxuICAgIHZhciBpbmRleE9mO1xuXG4gICAgaWYgKEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgICAgIGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleE9mID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIC8vIEkga25vd1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSBvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdNJywgWydNTScsIDJdLCAnTW8nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ01NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignTU1NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRocyh0aGlzLCBmb3JtYXQpO1xuICAgIH0pO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdtb250aCcsICdNJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtb250aCcsIDgpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignTScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignTU0nLCAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdNTU0nLCAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5tb250aHNTaG9ydFJlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcbiAgICBhZGRSZWdleFRva2VuKCdNTU1NJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5tb250aHNSZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnTScsICdNTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XG4gICAgfSk7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnTU1NJywgJ01NTU0nXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgICAgICB2YXIgbW9udGggPSBjb25maWcuX2xvY2FsZS5tb250aHNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXG4gICAgICAgIGlmIChtb250aCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhcnJheVtNT05USF0gPSBtb250aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRNb250aCA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBMT0NBTEVTXG5cbiAgICB2YXIgTU9OVEhTX0lOX0ZPUk1BVCA9IC9EW29EXT8oXFxbW15cXFtcXF1dKlxcXXxcXHMpK01NTU0/LztcbiAgICB2YXIgZGVmYXVsdExvY2FsZU1vbnRocyA9ICdKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyJy5zcGxpdCgnXycpO1xuICAgIGZ1bmN0aW9uIGxvY2FsZU1vbnRocyAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRocztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHMpID8gdGhpcy5fbW9udGhzW20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzWyh0aGlzLl9tb250aHMuaXNGb3JtYXQgfHwgTU9OVEhTX0lOX0ZPUk1BVCkudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCA9ICdKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlYycuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNTaG9ydCAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV0gOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRbTU9OVEhTX0lOX0ZPUk1BVC50ZXN0KGZvcm1hdCkgPyAnZm9ybWF0JyA6ICdzdGFuZGFsb25lJ11bbS5tb250aCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bml0c19tb250aF9faGFuZGxlU3RyaWN0UGFyc2UobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gbW9udGhOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IHVzZWRcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgKytpKSB7XG4gICAgICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRocyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVNb250aHNQYXJzZSAobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuaXRzX21vbnRoX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIHNvcnRpbmdcbiAgICAgICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlclxuICAgICAgICAvLyBzZWUgc29ydGluZyBpbiBjb21wdXRlTW9udGhzUGFyc2VcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgbW9tID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnJykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdHJpY3QgJiYgIXRoaXMuX21vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NTScgJiYgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gc2V0TW9udGggKG1vbSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICAgICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAvLyBObyBvcFxuICAgICAgICAgICAgcmV0dXJuIG1vbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRvSW50KHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyAnTW9udGgnXSh2YWx1ZSwgZGF5T2ZNb250aCk7XG4gICAgICAgIHJldHVybiBtb207XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TW9udGggKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzZXRNb250aCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0X3NldF9fZ2V0KHRoaXMsICdNb250aCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGF5c0luTW9udGggKCkge1xuICAgICAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1Nob3J0UmVnZXggKGlzU3RyaWN0KSB7XG4gICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdE1vbnRoc1JlZ2V4ID0gbWF0Y2hXb3JkO1xuICAgIGZ1bmN0aW9uIG1vbnRoc1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVNb250aHNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9udGhzUmVnZXggPSBkZWZhdWx0TW9udGhzUmVnZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlTW9udGhzUGFyc2UgKCkge1xuICAgICAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgICAgIHNob3J0UGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAgICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgICAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgICAgICBtaXhlZFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICBzaG9ydFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKHNob3J0UGllY2VzW2ldKTtcbiAgICAgICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9tb250aHNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRSZWdleCA9IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgICAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdZJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpO1xuICAgICAgICByZXR1cm4geSA8PSA5OTk5ID8gJycgKyB5IDogJysnICsgeTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVknLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy55ZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVknLCAgIDRdLCAgICAgICAwLCAneWVhcicpO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVknLCAgNV0sICAgICAgIDAsICd5ZWFyJyk7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWVknLCA2LCB0cnVlXSwgMCwgJ3llYXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygneWVhcicsICd5Jyk7XG5cbiAgICAvLyBQUklPUklUSUVTXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3llYXInLCAxKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1knLCAgICAgIG1hdGNoU2lnbmVkKTtcbiAgICBhZGRSZWdleFRva2VuKCdZWScsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignWVlZWScsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1lZWVlZJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbiAgICBhZGRSZWdleFRva2VuKCdZWVlZWVknLCBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbiAgICBhZGRQYXJzZVRva2VuKFsnWVlZWVknLCAnWVlZWVlZJ10sIFlFQVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1lZWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gaW5wdXQubGVuZ3RoID09PSAyID8gdXRpbHNfaG9va3NfX2hvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KSA6IHRvSW50KGlucHV0KTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbWUVBUl0gPSB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1knLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W1lFQVJdID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgICAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xuICAgIH1cblxuICAgIC8vIEhPT0tTXG5cbiAgICB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbiAgICB9O1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldFllYXIgPSBtYWtlR2V0U2V0KCdGdWxsWWVhcicsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gZ2V0SXNMZWFwWWVhciAoKSB7XG4gICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEYXRlICh5LCBtLCBkLCBoLCBNLCBzLCBtcykge1xuICAgICAgICAvL2Nhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxuICAgICAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgxMzQ4L2luc3RhbnRpYXRpbmctYS1qYXZhc2NyaXB0LW9iamVjdC1ieS1jYWxsaW5nLXByb3RvdHlwZS1jb25zdHJ1Y3Rvci1hcHBseVxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKTtcblxuICAgICAgICAvL3RoZSBkYXRlIGNvbnN0cnVjdG9yIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgICAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRGdWxsWWVhcigpKSkge1xuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVVVENEYXRlICh5KSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG5cbiAgICAgICAgLy90aGUgRGF0ZS5VVEMgZnVuY3Rpb24gcmVtYXBzIHllYXJzIDAtOTkgdG8gMTkwMC0xOTk5XG4gICAgICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIC8vIHN0YXJ0LW9mLWZpcnN0LXdlZWsgLSBzdGFydC1vZi15ZWFyXG4gICAgZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciAvLyBmaXJzdC13ZWVrIGRheSAtLSB3aGljaCBqYW51YXJ5IGlzIGFsd2F5cyBpbiB0aGUgZmlyc3Qgd2VlayAoNCBmb3IgaXNvLCAxIGZvciBvdGhlcilcbiAgICAgICAgICAgIGZ3ZCA9IDcgKyBkb3cgLSBkb3ksXG4gICAgICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgICAgICBmd2RsdyA9ICg3ICsgY3JlYXRlVVRDRGF0ZSh5ZWFyLCAwLCBmd2QpLmdldFVUQ0RheSgpIC0gZG93KSAlIDc7XG5cbiAgICAgICAgcmV0dXJuIC1md2RsdyArIGZ3ZCAtIDE7XG4gICAgfVxuXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgICAgIHZhciBsb2NhbFdlZWtkYXkgPSAoNyArIHdlZWtkYXkgLSBkb3cpICUgNyxcbiAgICAgICAgICAgIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICAgICAgZGF5T2ZZZWFyID0gMSArIDcgKiAod2VlayAtIDEpICsgbG9jYWxXZWVrZGF5ICsgd2Vla09mZnNldCxcbiAgICAgICAgICAgIHJlc1llYXIsIHJlc0RheU9mWWVhcjtcblxuICAgICAgICBpZiAoZGF5T2ZZZWFyIDw9IDApIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyIC0gMTtcbiAgICAgICAgICAgIHJlc0RheU9mWWVhciA9IGRheXNJblllYXIocmVzWWVhcikgKyBkYXlPZlllYXI7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyKSkge1xuICAgICAgICAgICAgcmVzWWVhciA9IHllYXIgKyAxO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyIC0gZGF5c0luWWVhcih5ZWFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSB5ZWFyO1xuICAgICAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IHJlc1llYXIsXG4gICAgICAgICAgICBkYXlPZlllYXI6IHJlc0RheU9mWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBkb3csIGRveSkge1xuICAgICAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldChtb20ueWVhcigpLCBkb3csIGRveSksXG4gICAgICAgICAgICB3ZWVrID0gTWF0aC5mbG9vcigobW9tLmRheU9mWWVhcigpIC0gd2Vla09mZnNldCAtIDEpIC8gNykgKyAxLFxuICAgICAgICAgICAgcmVzV2VlaywgcmVzWWVhcjtcblxuICAgICAgICBpZiAod2VlayA8IDEpIHtcbiAgICAgICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpIC0gMTtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrICsgd2Vla3NJblllYXIocmVzWWVhciwgZG93LCBkb3kpO1xuICAgICAgICB9IGVsc2UgaWYgKHdlZWsgPiB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSkpIHtcbiAgICAgICAgICAgIHJlc1dlZWsgPSB3ZWVrIC0gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpO1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCk7XG4gICAgICAgICAgICByZXNXZWVrID0gd2VlaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWVrOiByZXNXZWVrLFxuICAgICAgICAgICAgeWVhcjogcmVzWWVhclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XG4gICAgICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgICAgIHdlZWtPZmZzZXROZXh0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIgKyAxLCBkb3csIGRveSk7XG4gICAgICAgIHJldHVybiAoZGF5c0luWWVhcih5ZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCd3JywgWyd3dycsIDJdLCAnd28nLCAnd2VlaycpO1xuICAgIGFkZEZvcm1hdFRva2VuKCdXJywgWydXVycsIDJdLCAnV28nLCAnaXNvV2VlaycpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrJywgJ3cnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWsnLCAnVycpO1xuXG4gICAgLy8gUFJJT1JJVElFU1xuXG4gICAgYWRkVW5pdFByaW9yaXR5KCd3ZWVrJywgNSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrJywgNSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCd3JywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignd3cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignVycsICBtYXRjaDF0bzIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ1dXJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWyd3JywgJ3d3JywgJ1cnLCAnV1cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDEpXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIC8vIExPQ0FMRVNcblxuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWsgKG1vbSkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2VlaztcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWsgPSB7XG4gICAgICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZXZWVrICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZZZWFyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWsuZG95O1xuICAgIH1cblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gdGhpcy5sb2NhbGVEYXRhKCkud2Vlayh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT1dlZWsgKGlucHV0KSB7XG4gICAgICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2QnLCAwLCAnZG8nLCAnZGF5Jyk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xuICAgIH0pO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2RkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdkZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdlJywgMCwgMCwgJ3dlZWtkYXknKTtcbiAgICBhZGRGb3JtYXRUb2tlbignRScsIDAsIDAsICdpc29XZWVrZGF5Jyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RheScsICdkJyk7XG4gICAgYWRkVW5pdEFsaWFzKCd3ZWVrZGF5JywgJ2UnKTtcbiAgICBhZGRVbml0QWxpYXMoJ2lzb1dlZWtkYXknLCAnRScpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2RheScsIDExKTtcbiAgICBhZGRVbml0UHJpb3JpdHkoJ3dlZWtkYXknLCAxMSk7XG4gICAgYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrZGF5JywgMTEpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignZCcsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignRScsICAgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNNaW5SZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzU2hvcnRSZWdleChpc1N0cmljdCk7XG4gICAgfSk7XG4gICAgYWRkUmVnZXhUb2tlbignZGRkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1JlZ2V4KGlzU3RyaWN0KTtcbiAgICB9KTtcblxuICAgIGFkZFdlZWtQYXJzZVRva2VuKFsnZGQnLCAnZGRkJywgJ2RkZGQnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5ID0gY29uZmlnLl9sb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXG4gICAgICAgIGlmICh3ZWVrZGF5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHdlZWsuZCA9IHdlZWtkYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkV2Vla2RheSA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhZGRXZWVrUGFyc2VUb2tlbihbJ2QnLCAnZScsICdFJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgICAgICB3ZWVrW3Rva2VuXSA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlSXNvV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpICUgNyB8fCA3O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc05hTihpbnB1dCkgPyBudWxsIDogaW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5cyA9ICdTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheScuc3BsaXQoJ18nKTtcbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5cyAobSwgZm9ybWF0KSB7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzW3RoaXMuX3dlZWtkYXlzLmlzRm9ybWF0LnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLmRheSgpXTtcbiAgICB9XG5cbiAgICB2YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuICAgIGZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzU2hvcnQgKG0pIHtcbiAgICAgICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV0gOiB0aGlzLl93ZWVrZGF5c1Nob3J0O1xuICAgIH1cblxuICAgIHZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4gPSAnU3VfTW9fVHVfV2VfVGhfRnJfU2EnLnNwbGl0KCdfJyk7XG4gICAgZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNNaW4gKG0pIHtcbiAgICAgICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNNaW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5X29mX3dlZWtfX2hhbmRsZVN0cmljdFBhcnNlKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gd2Vla2RheU5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkge1xuICAgICAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0gPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2RkZGQnKSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgICAgICBpaSA9IGluZGV4T2YuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlpID0gaW5kZXhPZi5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWkgPSBpbmRleE9mLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVXZWVrZGF5c1BhcnNlICh3ZWVrZGF5TmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheV9vZl93ZWVrX19oYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuXG4gICAgICAgICAgICBtb20gPSBjcmVhdGVfdXRjX19jcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkZGQnICYmIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGQnICYmIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXREYXlPZldlZWsgKGlucHV0KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoaW5wdXQgLSBkYXksICdkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZGF5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldElTT0RheU9mV2VlayAoaW5wdXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgICAgICAvLyBhcyBhIHNldHRlciwgc3VuZGF5IHNob3VsZCBiZWxvbmcgdG8gdGhlIHByZXZpb3VzIHdlZWsuXG5cbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB3ZWVrZGF5ID0gcGFyc2VJc29XZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXkodGhpcy5kYXkoKSAlIDcgPyB3ZWVrZGF5IDogd2Vla2RheSAtIDcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCkgfHwgNztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNSZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c1JlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IGRlZmF1bHRXZWVrZGF5c1JlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRXZWVrZGF5c1Nob3J0UmVnZXggPSBtYXRjaFdvcmQ7XG4gICAgZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzU2hvcnRSZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbiAgICBmdW5jdGlvbiB3ZWVrZGF5c01pblJlZ2V4IChpc1N0cmljdCkge1xuICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5SZWdleCA9IGRlZmF1bHRXZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBjb21wdXRlV2Vla2RheXNQYXJzZSAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNtcExlblJldihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtaW5QaWVjZXMgPSBbXSwgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgIG1vbSA9IGNyZWF0ZV91dGNfX2NyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgIG1pbnAgPSB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgc2hvcnRwID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICAgICAgbWluUGllY2VzLnB1c2gobWlucCk7XG4gICAgICAgICAgICBzaG9ydFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2goc2hvcnRwKTtcbiAgICAgICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgd2Vla2RheSAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlciBpdFxuICAgICAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgICAgIG1pblBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIHNob3J0UGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgICAgICAgICBtaXhlZFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKG1peGVkUGllY2VzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleCA9IHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgICAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB9XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBmdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKSB8fCAyNDtcbiAgICB9XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbiAgICBhZGRGb3JtYXRUb2tlbignaCcsIFsnaGgnLCAyXSwgMCwgaEZvcm1hdCk7XG4gICAgYWRkRm9ybWF0VG9rZW4oJ2snLCBbJ2trJywgMl0sIDAsIGtGb3JtYXQpO1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbignSG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJyArIHRoaXMuaG91cnMoKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXJpZGllbSAodG9rZW4sIGxvd2VyY2FzZSkge1xuICAgICAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGxvd2VyY2FzZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1lcmlkaWVtKCdhJywgdHJ1ZSk7XG4gICAgbWVyaWRpZW0oJ0EnLCBmYWxzZSk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2hvdXInLCAnaCcpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBmdW5jdGlvbiBtYXRjaE1lcmlkaWVtIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG4gICAgfVxuXG4gICAgYWRkUmVnZXhUb2tlbignYScsICBtYXRjaE1lcmlkaWVtKTtcbiAgICBhZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0gnLCAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdoJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignaGgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5cbiAgICBhZGRSZWdleFRva2VuKCdobW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2htbXNzJywgbWF0Y2g1dG82KTtcbiAgICBhZGRSZWdleFRva2VuKCdIbW0nLCBtYXRjaDN0bzQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0htbXNzJywgbWF0Y2g1dG82KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydIJywgJ0hIJ10sIEhPVVIpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5faXNQbSA9IGNvbmZpZy5fbG9jYWxlLmlzUE0oaW5wdXQpO1xuICAgICAgICBjb25maWcuX21lcmlkaWVtID0gaW5wdXQ7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbihbJ2gnLCAnaGgnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW0nLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvcykpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvcykpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBhZGRQYXJzZVRva2VuKCdobW1zcycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgICAgIHZhciBwb3MyID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zMSkpO1xuICAgICAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICAgICAgYXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MyKSk7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ0htbScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICB2YXIgcG9zID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICAgICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zKSk7XG4gICAgfSk7XG4gICAgYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBvczEgPSBpbnB1dC5sZW5ndGggLSA0O1xuICAgICAgICB2YXIgcG9zMiA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICAgICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MxLCAyKSk7XG4gICAgICAgIGFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMikpO1xuICAgIH0pO1xuXG4gICAgLy8gTE9DQUxFU1xuXG4gICAgZnVuY3Rpb24gbG9jYWxlSXNQTSAoaW5wdXQpIHtcbiAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAvLyBVc2luZyBjaGFyQXQgc2hvdWxkIGJlIG1vcmUgY29tcGF0aWJsZS5cbiAgICAgICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlID0gL1thcF1cXC4/bT9cXC4/L2k7XG4gICAgZnVuY3Rpb24gbG9jYWxlTWVyaWRpZW0gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XG4gICAgLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxuICAgIC8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuICAgIC8vIHRoaXMgcnVsZS5cbiAgICB2YXIgZ2V0U2V0SG91ciA9IG1ha2VHZXRTZXQoJ0hvdXJzJywgdHJ1ZSk7XG5cbiAgICB2YXIgYmFzZUNvbmZpZyA9IHtcbiAgICAgICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICAgICAgbG9uZ0RhdGVGb3JtYXQ6IGRlZmF1bHRMb25nRGF0ZUZvcm1hdCxcbiAgICAgICAgaW52YWxpZERhdGU6IGRlZmF1bHRJbnZhbGlkRGF0ZSxcbiAgICAgICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgICAgIG9yZGluYWxQYXJzZTogZGVmYXVsdE9yZGluYWxQYXJzZSxcbiAgICAgICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgICAgIG1vbnRoczogZGVmYXVsdExvY2FsZU1vbnRocyxcbiAgICAgICAgbW9udGhzU2hvcnQ6IGRlZmF1bHRMb2NhbGVNb250aHNTaG9ydCxcblxuICAgICAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgICAgICB3ZWVrZGF5czogZGVmYXVsdExvY2FsZVdlZWtkYXlzLFxuICAgICAgICB3ZWVrZGF5c01pbjogZGVmYXVsdExvY2FsZVdlZWtkYXlzTWluLFxuICAgICAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgICAgICBtZXJpZGllbVBhcnNlOiBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZVxuICAgIH07XG5cbiAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG4gICAgdmFyIGxvY2FsZXMgPSB7fTtcbiAgICB2YXIgZ2xvYmFsTG9jYWxlO1xuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5ID8ga2V5LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnXycsICctJykgOiBrZXk7XG4gICAgfVxuXG4gICAgLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4gICAgLy8gdHJ5IFsnZW4tYXUnLCAnZW4tZ2InXSBhcyAnZW4tYXUnLCAnZW4tZ2InLCAnZW4nLCBhcyBpbiBtb3ZlIHRocm91Z2ggdGhlIGxpc3QgdHJ5aW5nIGVhY2hcbiAgICAvLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG4gICAgZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgICAgIHZhciBpID0gMCwgaiwgbmV4dCwgbG9jYWxlLCBzcGxpdDtcblxuICAgICAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgICAgICBqID0gc3BsaXQubGVuZ3RoO1xuICAgICAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICAgICAgd2hpbGUgKGogPiAwKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZExvY2FsZShuYW1lKSB7XG4gICAgICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgICAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byByZWdpc3RlciBhbmQgbG9hZCBhbGwgdGhlIGxvY2FsZXMgaW4gTm9kZVxuICAgICAgICBpZiAoIWxvY2FsZXNbbmFtZV0gJiYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSAmJlxuICAgICAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvbGRMb2NhbGUgPSBnbG9iYWxMb2NhbGUuX2FiYnI7XG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlXG4gICAgICAgICAgICAgICAgLy8gd2FudCB0byB1bmRvIHRoYXQgZm9yIGxhenkgbG9hZGVkIGxvY2FsZXNcbiAgICAgICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsb2NhbGUgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbG9jYWxlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxvY2FsZSBrZXkuXG4gICAgZnVuY3Rpb24gbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGRhdGE7XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZXMpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIG1vbWVudC5kdXJhdGlvbi5fbG9jYWxlID0gbW9tZW50Ll9sb2NhbGUgPSBkYXRhO1xuICAgICAgICAgICAgICAgIGdsb2JhbExvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmluZUxvY2FsZSAobmFtZSwgY29uZmlnKSB7XG4gICAgICAgIGlmIChjb25maWcgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgY29uZmlnLmFiYnIgPSBuYW1lO1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZSgnZGVmaW5lTG9jYWxlT3ZlcnJpZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3VzZSBtb21lbnQudXBkYXRlTG9jYWxlKGxvY2FsZU5hbWUsIGNvbmZpZykgdG8gY2hhbmdlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FuIGV4aXN0aW5nIGxvY2FsZS4gbW9tZW50LmRlZmluZUxvY2FsZShsb2NhbGVOYW1lLCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb25maWcpIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNyZWF0aW5nIGEgbmV3IGxvY2FsZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kZWZpbmUtbG9jYWxlLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbbmFtZV0uX2NvbmZpZztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLl9jb25maWc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJlYXQgYXMgaWYgdGhlcmUgaXMgbm8gYmFzZSBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKCdwYXJlbnRMb2NhbGVVbmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzcGVjaWZpZWQgcGFyZW50TG9jYWxlIGlzIG5vdCBkZWZpbmVkIHlldC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvcGFyZW50LWxvY2FsZS8nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbmV3IExvY2FsZShtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpKTtcblxuICAgICAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgICAgICBsb2NhbGVfbG9jYWxlc19fZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHVzZWZ1bCBmb3IgdGVzdGluZ1xuICAgICAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUxvY2FsZShuYW1lLCBjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbG9jYWxlLCBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25maWcgPSBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlID0gbmV3IExvY2FsZShjb25maWcpO1xuICAgICAgICAgICAgbG9jYWxlLnBhcmVudExvY2FsZSA9IGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdID0gbG9jYWxlO1xuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgICAgIGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXNzIG51bGwgZm9yIGNvbmZpZyB0byB1bnVwZGF0ZSwgdXNlZnVsIGZvciB0ZXN0c1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBsb2NhbGUgZGF0YVxuICAgIGZ1bmN0aW9uIGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUgKGtleSkge1xuICAgICAgICB2YXIgbG9jYWxlO1xuXG4gICAgICAgIGlmIChrZXkgJiYga2V5Ll9sb2NhbGUgJiYga2V5Ll9sb2NhbGUuX2FiYnIpIHtcbiAgICAgICAgICAgIGtleSA9IGtleS5fbG9jYWxlLl9hYmJyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWxMb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgICAgLy9zaG9ydC1jaXJjdWl0IGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShrZXkpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXkgPSBba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaG9vc2VMb2NhbGUoa2V5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVfbG9jYWxlc19fbGlzdExvY2FsZXMoKSB7XG4gICAgICAgIHJldHVybiBrZXlzKGxvY2FsZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cgKG0pIHtcbiAgICAgICAgdmFyIG92ZXJmbG93O1xuICAgICAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICAgICAgaWYgKGEgJiYgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPVxuICAgICAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgICAgICBhW0RBVEVdICAgICAgICA8IDEgfHwgYVtEQVRFXSAgICAgICAgPiBkYXlzSW5Nb250aChhW1lFQVJdLCBhW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgICAgICBhW0hPVVJdICAgICAgICA8IDAgfHwgYVtIT1VSXSAgICAgICAgPiAyNCB8fCAoYVtIT1VSXSA9PT0gMjQgJiYgKGFbTUlOVVRFXSAhPT0gMCB8fCBhW1NFQ09ORF0gIT09IDAgfHwgYVtNSUxMSVNFQ09ORF0gIT09IDApKSA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICAgICAgYVtTRUNPTkRdICAgICAgPCAwIHx8IGFbU0VDT05EXSAgICAgID4gNTkgID8gU0VDT05EIDpcbiAgICAgICAgICAgICAgICBhW01JTExJU0VDT05EXSA8IDAgfHwgYVtNSUxMSVNFQ09ORF0gPiA5OTkgPyBNSUxMSVNFQ09ORCA6XG4gICAgICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gREFURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93V2Vla3MgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBXRUVLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrZGF5ICYmIG92ZXJmbG93ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFS0RBWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9XG5cbiAgICAvLyBpc28gODYwMSByZWdleFxuICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgIHZhciBleHRlbmRlZElzb1JlZ2V4ID0gL15cXHMqKCg/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzpcXGRcXGQtXFxkXFxkfFdcXGRcXGQtXFxkfFdcXGRcXGR8XFxkXFxkXFxkfFxcZFxcZCkpKD86KFR8ICkoXFxkXFxkKD86OlxcZFxcZCg/OjpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG4gICAgdmFyIGJhc2ljSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pKD86XFxkXFxkXFxkXFxkfFdcXGRcXGRcXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzpcXGRcXGQoPzpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPy87XG5cbiAgICB2YXIgdHpSZWdleCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/LztcblxuICAgIHZhciBpc29EYXRlcyA9IFtcbiAgICAgICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkXFxkLVxcZFxcZC9dLFxuICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZFxcZC1cXGQvXSxcbiAgICAgICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgICAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXSxcbiAgICAgICAgWydZWVlZLU1NJywgL1xcZHs0fS1cXGRcXGQvLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgICAgICBbJ1lZWVlNTUREJywgL1xcZHs4fS9dLFxuICAgICAgICAvLyBZWVlZTU0gaXMgTk9UIGFsbG93ZWQgYnkgdGhlIHN0YW5kYXJkXG4gICAgICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgICAgIFsnR0dHR1tXXVdXJywgL1xcZHs0fVdcXGR7Mn0vLCBmYWxzZV0sXG4gICAgICAgIFsnWVlZWURERCcsIC9cXGR7N30vXVxuICAgIF07XG5cbiAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgdmFyIGlzb1RpbWVzID0gW1xuICAgICAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MsU1NTUycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEg6bW06c3MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgIFsnSEhtbXNzLlNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkXFwuXFxkKy9dLFxuICAgICAgICBbJ0hIbW1zcyxTU1NTJywgL1xcZFxcZFxcZFxcZFxcZFxcZCxcXGQrL10sXG4gICAgICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgICAgICBbJ0hIbW0nLCAvXFxkXFxkXFxkXFxkL10sXG4gICAgICAgIFsnSEgnLCAvXFxkXFxkL11cbiAgICBdO1xuXG4gICAgdmFyIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2k7XG5cbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdFxuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBsLFxuICAgICAgICAgICAgc3RyaW5nID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgICAgIGFsbG93VGltZSwgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb0RhdGVzW2ldWzFdLmV4ZWMobWF0Y2hbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dUaW1lID0gaXNvRGF0ZXNbaV1bMl0gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0ZUZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhtYXRjaFszXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAobWF0Y2hbMl0gfHwgJyAnKSArIGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYWxsb3dUaW1lICYmIHRpbWVGb3JtYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaFs0XSkge1xuICAgICAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHR6Rm9ybWF0ID0gJ1onO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlnLl9mID0gZGF0ZUZvcm1hdCArICh0aW1lRm9ybWF0IHx8ICcnKSArICh0ekZvcm1hdCB8fCAnJyk7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZyhjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhjb25maWcuX2kpO1xuXG4gICAgICAgIGlmIChtYXRjaGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWdGcm9tSVNPKGNvbmZpZyk7XG4gICAgICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgICAgICd2YWx1ZSBwcm92aWRlZCBpcyBub3QgaW4gYSByZWNvZ25pemVkIElTTyBmb3JtYXQuIG1vbWVudCBjb25zdHJ1Y3Rpb24gZmFsbHMgYmFjayB0byBqcyBEYXRlKCksICcgK1xuICAgICAgICAnd2hpY2ggaXMgbm90IHJlbGlhYmxlIGFjcm9zcyBhbGwgYnJvd3NlcnMgYW5kIHZlcnNpb25zLiBOb24gSVNPIGRhdGUgZm9ybWF0cyBhcmUgJyArXG4gICAgICAgICdkaXNjb3VyYWdlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIG1ham9yIHJlbGVhc2UuIFBsZWFzZSByZWZlciB0byAnICtcbiAgICAgICAgJ2h0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvanMtZGF0ZS8gZm9yIG1vcmUgaW5mby4nLFxuICAgICAgICBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShjb25maWcuX2kgKyAoY29uZmlnLl91c2VVVEMgPyAnIFVUQycgOiAnJykpO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBpY2sgdGhlIGZpcnN0IGRlZmluZWQgb2YgdHdvIG9yIHRocmVlIGFyZ3VtZW50cy5cbiAgICBmdW5jdGlvbiBkZWZhdWx0cyhhLCBiLCBjKSB7XG4gICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKSB7XG4gICAgICAgIC8vIGhvb2tzIGlzIGFjdHVhbGx5IHRoZSBleHBvcnRlZCBtb21lbnQgb2JqZWN0XG4gICAgICAgIHZhciBub3dWYWx1ZSA9IG5ldyBEYXRlKHV0aWxzX2hvb2tzX19ob29rcy5ub3coKSk7XG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICAgICAgcmV0dXJuIFtub3dWYWx1ZS5nZXRVVENGdWxsWWVhcigpLCBub3dWYWx1ZS5nZXRVVENNb250aCgpLCBub3dWYWx1ZS5nZXRVVENEYXRlKCldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbbm93VmFsdWUuZ2V0RnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0TW9udGgoKSwgbm93VmFsdWUuZ2V0RGF0ZSgpXTtcbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cbiAgICAvLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuICAgIC8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxuICAgIC8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21BcnJheSAoY29uZmlnKSB7XG4gICAgICAgIHZhciBpLCBkYXRlLCBpbnB1dCA9IFtdLCBjdXJyZW50RGF0ZSwgeWVhclRvVXNlO1xuXG4gICAgICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xuXG4gICAgICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICAgICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcbiAgICAgICAgICAgIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhcikge1xuICAgICAgICAgICAgeWVhclRvVXNlID0gZGVmYXVsdHMoY29uZmlnLl9hW1lFQVJdLCBjdXJyZW50RGF0ZVtZRUFSXSk7XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd0RheU9mWWVhciA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xuICAgICAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtEQVRFXSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXG4gICAgICAgIC8vICogaWYgbm8geWVhciwgbW9udGgsIGRheSBvZiBtb250aCBhcmUgZ2l2ZW4sIGRlZmF1bHQgdG8gdG9kYXlcbiAgICAgICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcbiAgICAgICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcbiAgICAgICAgLy8gKiBpZiB5ZWFyIGlzIGdpdmVuLCBkb24ndCBkZWZhdWx0IGFueXRoaW5nXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcbiAgICAgICAgZm9yICg7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gKGNvbmZpZy5fYVtpXSA9PSBudWxsKSA/IChpID09PSAyID8gMSA6IDApIDogY29uZmlnLl9hW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIDI0OjAwOjAwLjAwMFxuICAgICAgICBpZiAoY29uZmlnLl9hW0hPVVJdID09PSAyNCAmJlxuICAgICAgICAgICAgICAgIGNvbmZpZy5fYVtNSU5VVEVdID09PSAwICYmXG4gICAgICAgICAgICAgICAgY29uZmlnLl9hW1NFQ09ORF0gPT09IDAgJiZcbiAgICAgICAgICAgICAgICBjb25maWcuX2FbTUlMTElTRUNPTkRdID09PSAwKSB7XG4gICAgICAgICAgICBjb25maWcuX25leHREYXkgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IGNyZWF0ZVVUQ0RhdGUgOiBjcmVhdGVEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHV0Y09mZnNldCBjYW4gYmUgY2hhbmdlZFxuICAgICAgICAvLyB3aXRoIHBhcnNlWm9uZS5cbiAgICAgICAgaWYgKGNvbmZpZy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgLSBjb25maWcuX3R6bSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLl9uZXh0RGF5KSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAyNDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcbiAgICAgICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcCwgd2Vla2RheU92ZXJmbG93O1xuXG4gICAgICAgIHcgPSBjb25maWcuX3c7XG4gICAgICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcbiAgICAgICAgICAgIGRvdyA9IDE7XG4gICAgICAgICAgICBkb3kgPSA0O1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBXZSBuZWVkIHRvIHRha2UgdGhlIGN1cnJlbnQgaXNvV2Vla1llYXIsIGJ1dCB0aGF0IGRlcGVuZHMgb25cbiAgICAgICAgICAgIC8vIGhvdyB3ZSBpbnRlcnByZXQgbm93IChsb2NhbCwgdXRjLCBmaXhlZCBvZmZzZXQpLiBTbyBjcmVhdGVcbiAgICAgICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXG4gICAgICAgICAgICAvLyBjcmVhdGUgbm93KS5cbiAgICAgICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5HRywgY29uZmlnLl9hW1lFQVJdLCB3ZWVrT2ZZZWFyKGxvY2FsX19jcmVhdGVMb2NhbCgpLCAxLCA0KS55ZWFyKTtcbiAgICAgICAgICAgIHdlZWsgPSBkZWZhdWx0cyh3LlcsIDEpO1xuICAgICAgICAgICAgd2Vla2RheSA9IGRlZmF1bHRzKHcuRSwgMSk7XG4gICAgICAgICAgICBpZiAod2Vla2RheSA8IDEgfHwgd2Vla2RheSA+IDcpIHtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG93ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG93O1xuICAgICAgICAgICAgZG95ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG95O1xuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuZ2csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihsb2NhbF9fY3JlYXRlTG9jYWwoKSwgZG93LCBkb3kpLnllYXIpO1xuICAgICAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcudywgMSk7XG5cbiAgICAgICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIHdlZWtkYXkgLS0gbG93IGRheSBudW1iZXJzIGFyZSBjb25zaWRlcmVkIG5leHQgd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmQ7XG4gICAgICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAwIHx8IHdlZWtkYXkgPiA2KSB7XG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XG4gICAgICAgICAgICAgICAgaWYgKHcuZSA8IDAgfHwgdy5lID4gNikge1xuICAgICAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IGRvdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAod2VlayA8IDEgfHwgd2VlayA+IHdlZWtzSW5ZZWFyKHdlZWtZZWFyLCBkb3csIGRveSkpIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtzID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh3ZWVrZGF5T3ZlcmZsb3cgIT0gbnVsbCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93V2Vla2RheSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XG4gICAgICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIElTTyBzdGFuZGFyZFxuICAgIHV0aWxzX2hvb2tzX19ob29rcy5JU09fODYwMSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xuICAgIGZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKSB7XG4gICAgICAgIC8vIFRPRE86IE1vdmUgdGhpcyB0byBhbm90aGVyIHBhcnQgb2YgdGhlIGNyZWF0aW9uIGZsb3cgdG8gcHJldmVudCBjaXJjdWxhciBkZXBzXG4gICAgICAgIGlmIChjb25maWcuX2YgPT09IHV0aWxzX2hvb2tzX19ob29rcy5JU09fODYwMSkge1xuICAgICAgICAgICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLl9hID0gW107XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gdHJ1ZTtcblxuICAgICAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxuICAgICAgICB2YXIgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgICAgICBpLCBwYXJzZWRJbnB1dCwgdG9rZW5zLCB0b2tlbiwgc2tpcHBlZCxcbiAgICAgICAgICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgICAgICB0b2tlbnMgPSBleHBhbmRGb3JtYXQoY29uZmlnLl9mLCBjb25maWcuX2xvY2FsZSkubWF0Y2goZm9ybWF0dGluZ1Rva2VucykgfHwgW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICAgICAgICBwYXJzZWRJbnB1dCA9IChzdHJpbmcubWF0Y2goZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpKSB8fCBbXSlbMF07XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndG9rZW4nLCB0b2tlbiwgJ3BhcnNlZElucHV0JywgcGFyc2VkSW5wdXQsXG4gICAgICAgICAgICAvLyAgICAgICAgICdyZWdleCcsIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSk7XG4gICAgICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBza2lwcGVkID0gc3RyaW5nLnN1YnN0cigwLCBzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkpO1xuICAgICAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBwYXJzZWRJbnB1dCwgY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbmZpZy5fc3RyaWN0ICYmICFwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChzdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYXIgXzEyaCBmbGFnIGlmIGhvdXIgaXMgPD0gMTJcbiAgICAgICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA8PSAxMiAmJlxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID4gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnBhcnNlZERhdGVQYXJ0cyA9IGNvbmZpZy5fYS5zbGljZSgwKTtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykubWVyaWRpZW0gPSBjb25maWcuX21lcmlkaWVtO1xuICAgICAgICAvLyBoYW5kbGUgbWVyaWRpZW1cbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gbWVyaWRpZW1GaXhXcmFwKGNvbmZpZy5fbG9jYWxlLCBjb25maWcuX2FbSE9VUl0sIGNvbmZpZy5fbWVyaWRpZW0pO1xuXG4gICAgICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBtZXJpZGllbUZpeFdyYXAgKGxvY2FsZSwgaG91ciwgbWVyaWRpZW0pIHtcbiAgICAgICAgdmFyIGlzUG07XG5cbiAgICAgICAgaWYgKG1lcmlkaWVtID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbGUubWVyaWRpZW1Ib3VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICAgICAgfSBlbHNlIGlmIChsb2NhbGUuaXNQTSAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBGYWxsYmFja1xuICAgICAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgICAgIGlmIChpc1BtICYmIGhvdXIgPCAxMikge1xuICAgICAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzUG0gJiYgaG91ciA9PT0gMTIpIHtcbiAgICAgICAgICAgICAgICBob3VyID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgICAgICByZXR1cm4gaG91cjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXG4gICAgZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZykge1xuICAgICAgICB2YXIgdGVtcENvbmZpZyxcbiAgICAgICAgICAgIGJlc3RNb21lbnQsXG5cbiAgICAgICAgICAgIHNjb3JlVG9CZWF0LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZTtcblxuICAgICAgICBpZiAoY29uZmlnLl9mLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wQ29uZmlnLl91c2VVVEMgPSBjb25maWcuX3VzZVVUQztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KHRlbXBDb25maWcpO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkX19pc1ZhbGlkKHRlbXBDb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFueSBpbnB1dCB0aGF0IHdhcyBub3QgcGFyc2VkIGFkZCBhIHBlbmFsdHkgZm9yIHRoYXQgZm9ybWF0XG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnVudXNlZFRva2Vucy5sZW5ndGggKiAxMDtcblxuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnNjb3JlID0gY3VycmVudFNjb3JlO1xuXG4gICAgICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgICAgIHNjb3JlVG9CZWF0ID0gY3VycmVudFNjb3JlO1xuICAgICAgICAgICAgICAgIGJlc3RNb21lbnQgPSB0ZW1wQ29uZmlnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKGNvbmZpZywgYmVzdE1vbWVudCB8fCB0ZW1wQ29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maWdGcm9tT2JqZWN0KGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGNvbmZpZy5faSk7XG4gICAgICAgIGNvbmZpZy5fYSA9IG1hcChbaS55ZWFyLCBpLm1vbnRoLCBpLmRheSB8fCBpLmRhdGUsIGkuaG91ciwgaS5taW51dGUsIGkuc2Vjb25kLCBpLm1pbGxpc2Vjb25kXSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRnJvbUNvbmZpZyAoY29uZmlnKSB7XG4gICAgICAgIHZhciByZXMgPSBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3cocHJlcGFyZUNvbmZpZyhjb25maWcpKSk7XG4gICAgICAgIGlmIChyZXMuX25leHREYXkpIHtcbiAgICAgICAgICAgIC8vIEFkZGluZyBpcyBzbWFydCBlbm91Z2ggYXJvdW5kIERTVFxuICAgICAgICAgICAgcmVzLmFkZCgxLCAnZCcpO1xuICAgICAgICAgICAgcmVzLl9uZXh0RGF5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlQ29uZmlnIChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgZm9ybWF0ID0gY29uZmlnLl9mO1xuXG4gICAgICAgIGNvbmZpZy5fbG9jYWxlID0gY29uZmlnLl9sb2NhbGUgfHwgbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZShjb25maWcuX2wpO1xuXG4gICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCAoZm9ybWF0ID09PSB1bmRlZmluZWQgJiYgaW5wdXQgPT09ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkX19jcmVhdGVJbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc01vbWVudChpbnB1dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3coaW5wdXQpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IGlucHV0O1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xuICAgICAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICB9ICBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZF9faXNWYWxpZChjb25maWcpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maWdGcm9tSW5wdXQoY29uZmlnKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faTtcbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHV0aWxzX2hvb2tzX19ob29rcy5ub3coKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWdGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IG1hcChpbnB1dC5zbGljZSgwKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gZnJvbSBtaWxsaXNlY29uZHNcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlTG9jYWxPclVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGlzVVRDKSB7XG4gICAgICAgIHZhciBjID0ge307XG5cbiAgICAgICAgaWYgKHR5cGVvZihsb2NhbGUpID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHN0cmljdCA9IGxvY2FsZTtcbiAgICAgICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoaXNPYmplY3QoaW5wdXQpICYmIGlzT2JqZWN0RW1wdHkoaW5wdXQpKSB8fFxuICAgICAgICAgICAgICAgIChpc0FycmF5KGlucHV0KSAmJiBpbnB1dC5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgICBpbnB1dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5fdXNlVVRDID0gYy5faXNVVEMgPSBpc1VUQztcbiAgICAgICAgYy5fbCA9IGxvY2FsZTtcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZUZyb21Db25maWcoYyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9jYWxfX2NyZWF0ZUxvY2FsIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHZhciBwcm90b3R5cGVNaW4gPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGxvY2FsX19jcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZF9fY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIHZhciBwcm90b3R5cGVNYXggPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQoKS5tYXggaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5taW4gaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGxvY2FsX19jcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZF9fY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBpY2sgYSBtb21lbnQgbSBmcm9tIG1vbWVudHMgc28gdGhhdCBtW2ZuXShvdGhlcikgaXMgdHJ1ZSBmb3IgYWxsXG4gICAgLy8gb3RoZXIuIFRoaXMgcmVsaWVzIG9uIHRoZSBmdW5jdGlvbiBmbiB0byBiZSB0cmFuc2l0aXZlLlxuICAgIC8vXG4gICAgLy8gbW9tZW50cyBzaG91bGQgZWl0aGVyIGJlIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzIG9yIGFuIGFycmF5LCB3aG9zZVxuICAgIC8vIGZpcnN0IGVsZW1lbnQgaXMgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMuXG4gICAgZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XG4gICAgICAgIHZhciByZXMsIGk7XG4gICAgICAgIGlmIChtb21lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KG1vbWVudHNbMF0pKSB7XG4gICAgICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1vbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxfX2NyZWF0ZUxvY2FsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gbW9tZW50c1swXTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IG1vbWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghbW9tZW50c1tpXS5pc1ZhbGlkKCkgfHwgbW9tZW50c1tpXVtmbl0ocmVzKSkge1xuICAgICAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBVc2UgW10uc29ydCBpbnN0ZWFkP1xuICAgIGZ1bmN0aW9uIG1pbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgICAgIHJldHVybiBwaWNrQnkoJ2lzQmVmb3JlJywgYXJncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF4ICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xuICAgIH1cblxuICAgIHZhciBub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdyA/IERhdGUubm93KCkgOiArKG5ldyBEYXRlKCkpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBEdXJhdGlvbiAoZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGR1cmF0aW9uKSxcbiAgICAgICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcbiAgICAgICAgICAgIHF1YXJ0ZXJzID0gbm9ybWFsaXplZElucHV0LnF1YXJ0ZXIgfHwgMCxcbiAgICAgICAgICAgIG1vbnRocyA9IG5vcm1hbGl6ZWRJbnB1dC5tb250aCB8fCAwLFxuICAgICAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxuICAgICAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcbiAgICAgICAgICAgIGhvdXJzID0gbm9ybWFsaXplZElucHV0LmhvdXIgfHwgMCxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXG4gICAgICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kIHx8IDA7XG5cbiAgICAgICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcbiAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXG4gICAgICAgICAgICBzZWNvbmRzICogMWUzICsgLy8gMTAwMFxuICAgICAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgaG91cnMgKiAxMDAwICogNjAgKiA2MDsgLy91c2luZyAxMDAwICogNjAgKiA2MCBpbnN0ZWFkIG9mIDM2ZTUgdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8yOTc4XG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxuICAgICAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgICAgICB3ZWVrcyAqIDc7XG4gICAgICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgICAgIC8vIGl0IHNlcGFyYXRlbHkuXG4gICAgICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICAgICAgcXVhcnRlcnMgKiAzICtcbiAgICAgICAgICAgIHllYXJzICogMTI7XG5cbiAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgICAgIHRoaXMuX2xvY2FsZSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoKTtcblxuICAgICAgICB0aGlzLl9idWJibGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0R1cmF0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFic1JvdW5kIChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKC0xICogbnVtYmVyKSAqIC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGZ1bmN0aW9uIG9mZnNldCAodG9rZW4sIHNlcGFyYXRvcikge1xuICAgICAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgICAgICB2YXIgc2lnbiA9ICcrJztcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gLW9mZnNldDtcbiAgICAgICAgICAgICAgICBzaWduID0gJy0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyB6ZXJvRmlsbCh+fihvZmZzZXQgLyA2MCksIDIpICsgc2VwYXJhdG9yICsgemVyb0ZpbGwofn4ob2Zmc2V0KSAlIDYwLCAyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb2Zmc2V0KCdaJywgJzonKTtcbiAgICBvZmZzZXQoJ1paJywgJycpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignWicsICBtYXRjaFNob3J0T2Zmc2V0KTtcbiAgICBhZGRSZWdleFRva2VuKCdaWicsIG1hdGNoU2hvcnRPZmZzZXQpO1xuICAgIGFkZFBhcnNlVG9rZW4oWydaJywgJ1paJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICBjb25maWcuX3VzZVVUQyA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fdHptID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG4gICAgfSk7XG5cbiAgICAvLyBIRUxQRVJTXG5cbiAgICAvLyB0aW1lem9uZSBjaHVua2VyXG4gICAgLy8gJysxMDowMCcgPiBbJzEwJywgICcwMCddXG4gICAgLy8gJy0xNTMwJyAgPiBbJy0xNScsICczMCddXG4gICAgdmFyIGNodW5rT2Zmc2V0ID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpO1xuXG4gICAgZnVuY3Rpb24gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaGVyLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSAoKHN0cmluZyB8fCAnJykubWF0Y2gobWF0Y2hlcikgfHwgW10pO1xuICAgICAgICB2YXIgY2h1bmsgICA9IG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXTtcbiAgICAgICAgdmFyIHBhcnRzICAgPSAoY2h1bmsgKyAnJykubWF0Y2goY2h1bmtPZmZzZXQpIHx8IFsnLScsIDAsIDBdO1xuICAgICAgICB2YXIgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdID09PSAnKycgPyBtaW51dGVzIDogLW1pbnV0ZXM7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGEgbW9tZW50IGZyb20gaW5wdXQsIHRoYXQgaXMgbG9jYWwvdXRjL3pvbmUgZXF1aXZhbGVudCB0byBtb2RlbC5cbiAgICBmdW5jdGlvbiBjbG9uZVdpdGhPZmZzZXQoaW5wdXQsIG1vZGVsKSB7XG4gICAgICAgIHZhciByZXMsIGRpZmY7XG4gICAgICAgIGlmIChtb2RlbC5faXNVVEMpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vZGVsLmNsb25lKCk7XG4gICAgICAgICAgICBkaWZmID0gKGlzTW9tZW50KGlucHV0KSB8fCBpc0RhdGUoaW5wdXQpID8gaW5wdXQudmFsdWVPZigpIDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KS52YWx1ZU9mKCkpIC0gcmVzLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIC8vIFVzZSBsb3ctbGV2ZWwgYXBpLCBiZWNhdXNlIHRoaXMgZm4gaXMgbG93LWxldmVsIGFwaS5cbiAgICAgICAgICAgIHJlcy5fZC5zZXRUaW1lKHJlcy5fZC52YWx1ZU9mKCkgKyBkaWZmKTtcbiAgICAgICAgICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQocmVzLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsX19jcmVhdGVMb2NhbChpbnB1dCkubG9jYWwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERhdGVPZmZzZXQgKG0pIHtcbiAgICAgICAgLy8gT24gRmlyZWZveC4yNCBEYXRlI2dldFRpbWV6b25lT2Zmc2V0IHJldHVybnMgYSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvcHVsbC8xODcxXG4gICAgICAgIHJldHVybiAtTWF0aC5yb3VuZChtLl9kLmdldFRpbWV6b25lT2Zmc2V0KCkgLyAxNSkgKiAxNTtcbiAgICB9XG5cbiAgICAvLyBIT09LU1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuICAgIC8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxuICAgIHV0aWxzX2hvb2tzX19ob29rcy51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIC8vIGtlZXBMb2NhbFRpbWUgPSB0cnVlIG1lYW5zIG9ubHkgY2hhbmdlIHRoZSB0aW1lem9uZSwgd2l0aG91dFxuICAgIC8vIGFmZmVjdGluZyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt1dGNPZmZzZXQoMiwgdHJ1ZSldLS0+XG4gICAgLy8gNTozMToyNiArMDIwMCBJdCBpcyBwb3NzaWJsZSB0aGF0IDU6MzE6MjYgZG9lc24ndCBleGlzdCB3aXRoIG9mZnNldFxuICAgIC8vICswMjAwLCBzbyB3ZSBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cbiAgICAvL1xuICAgIC8vIEtlZXBpbmcgdGhlIHRpbWUgYWN0dWFsbHkgYWRkcy9zdWJ0cmFjdHMgKG9uZSBob3VyKVxuICAgIC8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxuICAgIC8vIGEgc2Vjb25kIHRpbWUuIEluIGNhc2UgaXQgd2FudHMgdXMgdG8gY2hhbmdlIHRoZSBvZmZzZXQgYWdhaW5cbiAgICAvLyBfY2hhbmdlSW5Qcm9ncmVzcyA9PSB0cnVlIGNhc2UsIHRoZW4gd2UgaGF2ZSB0byBhZGp1c3QsIGJlY2F1c2VcbiAgICAvLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxuICAgIGZ1bmN0aW9uIGdldFNldE9mZnNldCAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwLFxuICAgICAgICAgICAgbG9jYWxBZGp1c3Q7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hTaG9ydE9mZnNldCwgaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgIGxvY2FsQWRqdXN0ID0gZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX29mZnNldCA9IGlucHV0O1xuICAgICAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGxvY2FsQWRqdXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZChsb2NhbEFkanVzdCwgJ20nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IGlucHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFrZWVwTG9jYWxUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCh0aGlzLCBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uKGlucHV0IC0gb2Zmc2V0LCAnbScpLCAxLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHNfaG9va3NfX2hvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0Wm9uZSAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSAtaW5wdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KGlucHV0LCBrZWVwTG9jYWxUaW1lKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gLXRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRPZmZzZXRUb1VUQyAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICByZXR1cm4gdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0T2Zmc2V0VG9Mb2NhbCAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICBpZiAodGhpcy5faXNVVEMpIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICAgICAgdGhpcy5faXNVVEMgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnRyYWN0KGdldERhdGVPZmZzZXQodGhpcyksICdtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQgKCkge1xuICAgICAgICBpZiAodGhpcy5fdHptKSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCh0aGlzLl90em0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHRab25lID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaE9mZnNldCwgdGhpcy5faSk7XG5cbiAgICAgICAgICAgIGlmICh0Wm9uZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnV0Y09mZnNldChvZmZzZXRGcm9tU3RyaW5nKG1hdGNoT2Zmc2V0LCB0aGlzLl9pKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxpZ25lZEhvdXJPZmZzZXQgKGlucHV0KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpbnB1dCA9IGlucHV0ID8gbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KS51dGNPZmZzZXQoKSA6IDA7XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLnV0Y09mZnNldCgpIC0gaW5wdXQpICUgNjAgPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWUgKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCgwKS51dGNPZmZzZXQoKSB8fFxuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCg1KS51dGNPZmZzZXQoKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lU2hpZnRlZCAoKSB7XG4gICAgICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5faXNEU1RTaGlmdGVkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzRFNUU2hpZnRlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjID0ge307XG5cbiAgICAgICAgY29weUNvbmZpZyhjLCB0aGlzKTtcbiAgICAgICAgYyA9IHByZXBhcmVDb25maWcoYyk7XG5cbiAgICAgICAgaWYgKGMuX2EpIHtcbiAgICAgICAgICAgIHZhciBvdGhlciA9IGMuX2lzVVRDID8gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKGMuX2EpIDogbG9jYWxfX2NyZWF0ZUxvY2FsKGMuX2EpO1xuICAgICAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gdGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICAgICBjb21wYXJlQXJyYXlzKGMuX2EsIG90aGVyLnRvQXJyYXkoKSkgPiAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTG9jYWwgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyAhdGhpcy5faXNVVEMgOiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1V0Y09mZnNldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDIDogZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVdGMgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyAmJiB0aGlzLl9vZmZzZXQgPT09IDAgOiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBBU1AuTkVUIGpzb24gZGF0ZSBmb3JtYXQgcmVnZXhcbiAgICB2YXIgYXNwTmV0UmVnZXggPSAvXihcXC0pPyg/OihcXGQqKVsuIF0pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKShcXC5cXGQqKT8pPyQvO1xuXG4gICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAvLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4gICAgLy8gYW5kIGZ1cnRoZXIgbW9kaWZpZWQgdG8gYWxsb3cgZm9yIHN0cmluZ3MgY29udGFpbmluZyBib3RoIHdlZWsgYW5kIGRheVxuICAgIHZhciBpc29SZWdleCA9IC9eKC0pP1AoPzooLT9bMC05LC5dKilZKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilXKT8oPzooLT9bMC05LC5dKilEKT8oPzpUKD86KC0/WzAtOSwuXSopSCk/KD86KC0/WzAtOSwuXSopTSk/KD86KC0/WzAtOSwuXSopUyk/KT8kLztcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24gKGlucHV0LCBrZXkpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICAgICAgc2lnbixcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIGRpZmZSZXM7XG5cbiAgICAgICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtcyA6IGlucHV0Ll9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICAgICAgZCAgOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uLm1pbGxpc2Vjb25kcyA9IGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gYXNwTmV0UmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeSAgOiAwLFxuICAgICAgICAgICAgICAgIGQgIDogdG9JbnQobWF0Y2hbREFURV0pICAgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgICAgICBoICA6IHRvSW50KG1hdGNoW0hPVVJdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbSAgOiB0b0ludChtYXRjaFtNSU5VVEVdKSAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgICAgIHMgIDogdG9JbnQobWF0Y2hbU0VDT05EXSkgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgICAgICBtcyA6IHRvSW50KGFic1JvdW5kKG1hdGNoW01JTExJU0VDT05EXSAqIDEwMDApKSAqIHNpZ24gLy8gdGhlIG1pbGxpc2Vjb25kIGRlY2ltYWwgcG9pbnQgaXMgaW5jbHVkZWQgaW4gdGhlIG1hdGNoXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvUmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeSA6IHBhcnNlSXNvKG1hdGNoWzJdLCBzaWduKSxcbiAgICAgICAgICAgICAgICBNIDogcGFyc2VJc28obWF0Y2hbM10sIHNpZ24pLFxuICAgICAgICAgICAgICAgIHcgOiBwYXJzZUlzbyhtYXRjaFs0XSwgc2lnbiksXG4gICAgICAgICAgICAgICAgZCA6IHBhcnNlSXNvKG1hdGNoWzVdLCBzaWduKSxcbiAgICAgICAgICAgICAgICBoIDogcGFyc2VJc28obWF0Y2hbNl0sIHNpZ24pLFxuICAgICAgICAgICAgICAgIG0gOiBwYXJzZUlzbyhtYXRjaFs3XSwgc2lnbiksXG4gICAgICAgICAgICAgICAgcyA6IHBhcnNlSXNvKG1hdGNoWzhdLCBzaWduKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7Ly8gY2hlY2tzIGZvciBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmICgnZnJvbScgaW4gZHVyYXRpb24gfHwgJ3RvJyBpbiBkdXJhdGlvbikpIHtcbiAgICAgICAgICAgIGRpZmZSZXMgPSBtb21lbnRzRGlmZmVyZW5jZShsb2NhbF9fY3JlYXRlTG9jYWwoZHVyYXRpb24uZnJvbSksIGxvY2FsX19jcmVhdGVMb2NhbChkdXJhdGlvbi50bykpO1xuXG4gICAgICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICAgICAgZHVyYXRpb24ubXMgPSBkaWZmUmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIGR1cmF0aW9uLk0gPSBkaWZmUmVzLm1vbnRocztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldCA9IG5ldyBEdXJhdGlvbihkdXJhdGlvbik7XG5cbiAgICAgICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgY3JlYXRlX19jcmVhdGVEdXJhdGlvbi5mbiA9IER1cmF0aW9uLnByb3RvdHlwZTtcblxuICAgIGZ1bmN0aW9uIHBhcnNlSXNvIChpbnAsIHNpZ24pIHtcbiAgICAgICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cbiAgICAgICAgLy8gY29udmVydHMgZmxvYXRzIHRvIGludHMuXG4gICAgICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICAgICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgICAgIC8vIGFwcGx5IHNpZ24gd2hpbGUgd2UncmUgYXQgaXRcbiAgICAgICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICAgICAgdmFyIHJlcyA9IHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG5cbiAgICAgICAgcmVzLm1vbnRocyA9IG90aGVyLm1vbnRoKCkgLSBiYXNlLm1vbnRoKCkgK1xuICAgICAgICAgICAgKG90aGVyLnllYXIoKSAtIGJhc2UueWVhcigpKSAqIDEyO1xuICAgICAgICBpZiAoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpLmlzQWZ0ZXIob3RoZXIpKSB7XG4gICAgICAgICAgICAtLXJlcy5tb250aHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXMubWlsbGlzZWNvbmRzID0gK290aGVyIC0gKyhiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykpO1xuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICAgICAgdmFyIHJlcztcbiAgICAgICAgaWYgKCEoYmFzZS5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlciA9IGNsb25lV2l0aE9mZnNldChvdGhlciwgYmFzZSk7XG4gICAgICAgIGlmIChiYXNlLmlzQmVmb3JlKG90aGVyKSkge1xuICAgICAgICAgICAgcmVzID0gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShiYXNlLCBvdGhlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKG90aGVyLCBiYXNlKTtcbiAgICAgICAgICAgIHJlcy5taWxsaXNlY29uZHMgPSAtcmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHJlcy5tb250aHMgPSAtcmVzLm1vbnRocztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogcmVtb3ZlICduYW1lJyBhcmcgYWZ0ZXIgZGVwcmVjYXRpb24gaXMgcmVtb3ZlZFxuICAgIGZ1bmN0aW9uIGNyZWF0ZUFkZGVyKGRpcmVjdGlvbiwgbmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCwgcGVyaW9kKSB7XG4gICAgICAgICAgICB2YXIgZHVyLCB0bXA7XG4gICAgICAgICAgICAvL2ludmVydCB0aGUgYXJndW1lbnRzLCBidXQgY29tcGxhaW4gYWJvdXQgaXRcbiAgICAgICAgICAgIGlmIChwZXJpb2QgIT09IG51bGwgJiYgIWlzTmFOKCtwZXJpb2QpKSB7XG4gICAgICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKG5hbWUsICdtb21lbnQoKS4nICsgbmFtZSAgKyAnKHBlcmlvZCwgbnVtYmVyKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIG1vbWVudCgpLicgKyBuYW1lICsgJyhudW1iZXIsIHBlcmlvZCkuICcgK1xuICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9hZGQtaW52ZXJ0ZWQtcGFyYW0vIGZvciBtb3JlIGluZm8uJyk7XG4gICAgICAgICAgICAgICAgdG1wID0gdmFsOyB2YWwgPSBwZXJpb2Q7IHBlcmlvZCA9IHRtcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgPyArdmFsIDogdmFsO1xuICAgICAgICAgICAgZHVyID0gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih2YWwsIHBlcmlvZCk7XG4gICAgICAgICAgICBhZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0KHRoaXMsIGR1ciwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QgKG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICBkYXlzID0gYWJzUm91bmQoZHVyYXRpb24uX2RheXMpLFxuICAgICAgICAgICAgbW9udGhzID0gYWJzUm91bmQoZHVyYXRpb24uX21vbnRocyk7XG5cbiAgICAgICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAvLyBObyBvcFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xuXG4gICAgICAgIGlmIChtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIG1vbS5fZC5zZXRUaW1lKG1vbS5fZC52YWx1ZU9mKCkgKyBtaWxsaXNlY29uZHMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRheXMpIHtcbiAgICAgICAgICAgIGdldF9zZXRfX3NldChtb20sICdEYXRlJywgZ2V0X3NldF9fZ2V0KG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vbnRocykge1xuICAgICAgICAgICAgc2V0TW9udGgobW9tLCBnZXRfc2V0X19nZXQobW9tLCAnTW9udGgnKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgICAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlT2Zmc2V0KG1vbSwgZGF5cyB8fCBtb250aHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGFkZF9zdWJ0cmFjdF9fYWRkICAgICAgPSBjcmVhdGVBZGRlcigxLCAnYWRkJyk7XG4gICAgdmFyIGFkZF9zdWJ0cmFjdF9fc3VidHJhY3QgPSBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0Jyk7XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxlbmRhckZvcm1hdChteU1vbWVudCwgbm93KSB7XG4gICAgICAgIHZhciBkaWZmID0gbXlNb21lbnQuZGlmZihub3csICdkYXlzJywgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgLTEgPyAnbGFzdFdlZWsnIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgICAgIGRpZmYgPCAyID8gJ25leHREYXknIDpcbiAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudF9jYWxlbmRhcl9fY2FsZW5kYXIgKHRpbWUsIGZvcm1hdHMpIHtcbiAgICAgICAgLy8gV2Ugd2FudCB0byBjb21wYXJlIHRoZSBzdGFydCBvZiB0b2RheSwgdnMgdGhpcy5cbiAgICAgICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYWwvdXRjL29mZnNldCBvciBub3QuXG4gICAgICAgIHZhciBub3cgPSB0aW1lIHx8IGxvY2FsX19jcmVhdGVMb2NhbCgpLFxuICAgICAgICAgICAgc29kID0gY2xvbmVXaXRoT2Zmc2V0KG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgICAgICBmb3JtYXQgPSB1dGlsc19ob29rc19faG9va3MuY2FsZW5kYXJGb3JtYXQodGhpcywgc29kKSB8fCAnc2FtZUVsc2UnO1xuXG4gICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRzICYmIChpc0Z1bmN0aW9uKGZvcm1hdHNbZm9ybWF0XSkgPyBmb3JtYXRzW2Zvcm1hdF0uY2FsbCh0aGlzLCBub3cpIDogZm9ybWF0c1tmb3JtYXRdKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXQob3V0cHV0IHx8IHRoaXMubG9jYWxlRGF0YSgpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcywgbG9jYWxfX2NyZWF0ZUxvY2FsKG5vdykpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9uZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KHRoaXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgICAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbG9jYWxfX2NyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICAgICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPiBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbElucHV0LnZhbHVlT2YoKSA8IHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0JlZm9yZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpO1xuICAgICAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgICAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKSA8IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0JldHdlZW4gKGZyb20sIHRvLCB1bml0cywgaW5jbHVzaXZpdHkpIHtcbiAgICAgICAgaW5jbHVzaXZpdHkgPSBpbmNsdXNpdml0eSB8fCAnKCknO1xuICAgICAgICByZXR1cm4gKGluY2x1c2l2aXR5WzBdID09PSAnKCcgPyB0aGlzLmlzQWZ0ZXIoZnJvbSwgdW5pdHMpIDogIXRoaXMuaXNCZWZvcmUoZnJvbSwgdW5pdHMpKSAmJlxuICAgICAgICAgICAgKGluY2x1c2l2aXR5WzFdID09PSAnKScgPyB0aGlzLmlzQmVmb3JlKHRvLCB1bml0cykgOiAhdGhpcy5pc0FmdGVyKHRvLCB1bml0cykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzU2FtZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQpLFxuICAgICAgICAgICAgaW5wdXRNcztcbiAgICAgICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPT09IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5wdXRNcyA9IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCkgPD0gaW5wdXRNcyAmJiBpbnB1dE1zIDw9IHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTYW1lT3JBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNBZnRlcihpbnB1dCx1bml0cyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTYW1lT3JCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQmVmb3JlKGlucHV0LHVuaXRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaWZmIChpbnB1dCwgdW5pdHMsIGFzRmxvYXQpIHtcbiAgICAgICAgdmFyIHRoYXQsXG4gICAgICAgICAgICB6b25lRGVsdGEsXG4gICAgICAgICAgICBkZWx0YSwgb3V0cHV0O1xuXG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0ID0gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCB0aGlzKTtcblxuICAgICAgICBpZiAoIXRoYXQuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICB9XG5cbiAgICAgICAgem9uZURlbHRhID0gKHRoYXQudXRjT2Zmc2V0KCkgLSB0aGlzLnV0Y09mZnNldCgpKSAqIDZlNDtcblxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBtb250aERpZmYodGhpcywgdGhhdCk7XG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbHRhID0gdGhpcyAtIHRoYXQ7XG4gICAgICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkZWx0YSAvIDFlMyA6IC8vIDEwMDBcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkZWx0YSAvIDZlNCA6IC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkZWx0YSAvIDM2ZTUgOiAvLyAxMDAwICogNjAgKiA2MFxuICAgICAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ3dlZWsnID8gKGRlbHRhIC0gem9uZURlbHRhKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzRmxvYXQgPyBvdXRwdXQgOiBhYnNGbG9vcihvdXRwdXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbnRoRGlmZiAoYSwgYikge1xuICAgICAgICAvLyBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICAgICAgICB2YXIgd2hvbGVNb250aERpZmYgPSAoKGIueWVhcigpIC0gYS55ZWFyKCkpICogMTIpICsgKGIubW9udGgoKSAtIGEubW9udGgoKSksXG4gICAgICAgICAgICAvLyBiIGlzIGluIChhbmNob3IgLSAxIG1vbnRoLCBhbmNob3IgKyAxIG1vbnRoKVxuICAgICAgICAgICAgYW5jaG9yID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiwgJ21vbnRocycpLFxuICAgICAgICAgICAgYW5jaG9yMiwgYWRqdXN0O1xuXG4gICAgICAgIGlmIChiIC0gYW5jaG9yIDwgMCkge1xuICAgICAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgLSAxLCAnbW9udGhzJyk7XG4gICAgICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvciAtIGFuY2hvcjIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgKyAxLCAnbW9udGhzJyk7XG4gICAgICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvcjIgLSBhbmNob3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayBmb3IgbmVnYXRpdmUgemVybywgcmV0dXJuIHplcm8gaWYgbmVnYXRpdmUgemVyb1xuICAgICAgICByZXR1cm4gLSh3aG9sZU1vbnRoRGlmZiArIGFkanVzdCkgfHwgMDtcbiAgICB9XG5cbiAgICB1dGlsc19ob29rc19faG9va3MuZGVmYXVsdEZvcm1hdCA9ICdZWVlZLU1NLUREVEhIOm1tOnNzWic7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXRVdGMgPSAnWVlZWS1NTS1ERFRISDptbTpzc1taXSc7XG5cbiAgICBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkubG9jYWxlKCdlbicpLmZvcm1hdCgnZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlonKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfZm9ybWF0X190b0lTT1N0cmluZyAoKSB7XG4gICAgICAgIHZhciBtID0gdGhpcy5jbG9uZSgpLnV0YygpO1xuICAgICAgICBpZiAoMCA8IG0ueWVhcigpICYmIG0ueWVhcigpIDw9IDk5OTkpIHtcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBpcyB+NTB4IGZhc3RlciwgdXNlIGl0IHdoZW4gd2UgY2FuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXQgKGlucHV0U3RyaW5nKSB7XG4gICAgICAgIGlmICghaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlucHV0U3RyaW5nID0gdGhpcy5pc1V0YygpID8gdXRpbHNfaG9va3NfX2hvb2tzLmRlZmF1bHRGb3JtYXRVdGMgOiB1dGlsc19ob29rc19faG9va3MuZGVmYXVsdEZvcm1hdDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcm9tICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgICAgIGxvY2FsX19jcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih7dG86IHRoaXMsIGZyb206IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcm9tTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZyb20obG9jYWxfX2NyZWF0ZUxvY2FsKCksIHdpdGhvdXRTdWZmaXgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgICAgIGxvY2FsX19jcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlX19jcmVhdGVEdXJhdGlvbih7ZnJvbTogdGhpcywgdG86IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b05vdyAod2l0aG91dFN1ZmZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhsb2NhbF9fY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG4gICAgfVxuXG4gICAgLy8gSWYgcGFzc2VkIGEgbG9jYWxlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxvY2FsZSBmb3IgdGhpc1xuICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbiAgICAvLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAgZnVuY3Rpb24gbG9jYWxlIChrZXkpIHtcbiAgICAgICAgdmFyIG5ld0xvY2FsZURhdGE7XG5cbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9jYWxlLl9hYmJyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3TG9jYWxlRGF0YSA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIGlmIChuZXdMb2NhbGVEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2NhbGUgPSBuZXdMb2NhbGVEYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFuZyA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudCgpLmxhbmcoKSBpcyBkZXByZWNhdGVkLiBJbnN0ZWFkLCB1c2UgbW9tZW50KCkubG9jYWxlRGF0YSgpIHRvIGdldCB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvbi4gVXNlIG1vbWVudCgpLmxvY2FsZSgpIHRvIGNoYW5nZSBsYW5ndWFnZXMuJyxcbiAgICAgICAgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICBmdW5jdGlvbiBsb2NhbGVEYXRhICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydE9mICh1bml0cykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgICAgICAvLyB0byB1dGlsaXplIGZhbGxpbmcgdGhyb3VnaCB0aGUgY2FzZXMuXG4gICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5ob3VycygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1pbnV0ZXMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgICAgICAgICB0aGlzLnNlY29uZHMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcygwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlZWtzIGFyZSBhIHNwZWNpYWwgY2FzZVxuICAgICAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xuICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBxdWFydGVycyBhcmUgYWxzbyBzcGVjaWFsXG4gICAgICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgICAgICB0aGlzLm1vbnRoKE1hdGguZmxvb3IodGhpcy5tb250aCgpIC8gMykgKiAzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZE9mICh1bml0cykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgaWYgKHVuaXRzID09PSB1bmRlZmluZWQgfHwgdW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ2RhdGUnIGlzIGFuIGFsaWFzIGZvciAnZGF5Jywgc28gaXQgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgc3VjaC5cbiAgICAgICAgaWYgKHVuaXRzID09PSAnZGF0ZScpIHtcbiAgICAgICAgICAgIHVuaXRzID0gJ2RheSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zdGFydE9mKHVuaXRzKS5hZGQoMSwgKHVuaXRzID09PSAnaXNvV2VlaycgPyAnd2VlaycgOiB1bml0cykpLnN1YnRyYWN0KDEsICdtcycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvX3R5cGVfX3ZhbHVlT2YgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZC52YWx1ZU9mKCkgLSAoKHRoaXMuX29mZnNldCB8fCAwKSAqIDYwMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bml4ICgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy52YWx1ZU9mKCkgLyAxMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b0RhdGUgKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUodGhpcy52YWx1ZU9mKCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvQXJyYXkgKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXM7XG4gICAgICAgIHJldHVybiBbbS55ZWFyKCksIG0ubW9udGgoKSwgbS5kYXRlKCksIG0uaG91cigpLCBtLm1pbnV0ZSgpLCBtLnNlY29uZCgpLCBtLm1pbGxpc2Vjb25kKCldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvT2JqZWN0ICgpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeWVhcnM6IG0ueWVhcigpLFxuICAgICAgICAgICAgbW9udGhzOiBtLm1vbnRoKCksXG4gICAgICAgICAgICBkYXRlOiBtLmRhdGUoKSxcbiAgICAgICAgICAgIGhvdXJzOiBtLmhvdXJzKCksXG4gICAgICAgICAgICBtaW51dGVzOiBtLm1pbnV0ZXMoKSxcbiAgICAgICAgICAgIHNlY29uZHM6IG0uc2Vjb25kcygpLFxuICAgICAgICAgICAgbWlsbGlzZWNvbmRzOiBtLm1pbGxpc2Vjb25kcygpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgICAgICAgLy8gbmV3IERhdGUoTmFOKS50b0pTT04oKSA9PT0gbnVsbFxuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLnRvSVNPU3RyaW5nKCkgOiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudF92YWxpZF9faXNWYWxpZCAoKSB7XG4gICAgICAgIHJldHVybiB2YWxpZF9faXNWYWxpZCh0aGlzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzaW5nRmxhZ3MgKCkge1xuICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCBnZXRQYXJzaW5nRmxhZ3ModGhpcykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmFsaWRBdCAoKSB7XG4gICAgICAgIHJldHVybiBnZXRQYXJzaW5nRmxhZ3ModGhpcykub3ZlcmZsb3c7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRpb25EYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5wdXQ6IHRoaXMuX2ksXG4gICAgICAgICAgICBmb3JtYXQ6IHRoaXMuX2YsXG4gICAgICAgICAgICBsb2NhbGU6IHRoaXMuX2xvY2FsZSxcbiAgICAgICAgICAgIGlzVVRDOiB0aGlzLl9pc1VUQyxcbiAgICAgICAgICAgIHN0cmljdDogdGhpcy5fc3RyaWN0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgWydnZycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndlZWtZZWFyKCkgJSAxMDA7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ0dHJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMDtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4gKHRva2VuLCBnZXR0ZXIpIHtcbiAgICAgICAgYWRkRm9ybWF0VG9rZW4oMCwgW3Rva2VuLCB0b2tlbi5sZW5ndGhdLCAwLCBnZXR0ZXIpO1xuICAgIH1cblxuICAgIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ2dnZ2cnLCAgICAgJ3dlZWtZZWFyJyk7XG4gICAgYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZ2cnLCAgICAnd2Vla1llYXInKTtcbiAgICBhZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHJywgICdpc29XZWVrWWVhcicpO1xuICAgIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0dHJywgJ2lzb1dlZWtZZWFyJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ3dlZWtZZWFyJywgJ2dnJyk7XG4gICAgYWRkVW5pdEFsaWFzKCdpc29XZWVrWWVhcicsICdHRycpO1xuXG4gICAgLy8gUFJJT1JJVFlcblxuICAgIGFkZFVuaXRQcmlvcml0eSgnd2Vla1llYXInLCAxKTtcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWtZZWFyJywgMSk7XG5cblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ0cnLCAgICAgIG1hdGNoU2lnbmVkKTtcbiAgICBhZGRSZWdleFRva2VuKCdnJywgICAgICBtYXRjaFNpZ25lZCk7XG4gICAgYWRkUmVnZXhUb2tlbignR0cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ2dnJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdHR0dHJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG4gICAgYWRkUmVnZXhUb2tlbignZ2dnZycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuICAgIGFkZFJlZ2V4VG9rZW4oJ0dHR0dHJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbiAgICBhZGRSZWdleFRva2VuKCdnZ2dnZycsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbiAgICBhZGRXZWVrUGFyc2VUb2tlbihbJ2dnZ2cnLCAnZ2dnZ2cnLCAnR0dHRycsICdHR0dHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgd2Vla1t0b2tlbi5zdWJzdHIoMCwgMildID0gdG9JbnQoaW5wdXQpO1xuICAgIH0pO1xuXG4gICAgYWRkV2Vla1BhcnNlVG9rZW4oWydnZycsICdHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgd2Vla1t0b2tlbl0gPSB1dGlsc19ob29rc19faG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xuICAgIH0pO1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgZnVuY3Rpb24gZ2V0U2V0V2Vla1llYXIgKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrKCksXG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KCksXG4gICAgICAgICAgICAgICAgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93LFxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRveSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2V0SVNPV2Vla1llYXIgKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICAgICAgaW5wdXQsIHRoaXMuaXNvV2VlaygpLCB0aGlzLmlzb1dlZWtkYXkoKSwgMSwgNCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SVNPV2Vla3NJblllYXIgKCkge1xuICAgICAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFdlZWtzSW5ZZWFyICgpIHtcbiAgICAgICAgdmFyIHdlZWtJbmZvID0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWs7XG4gICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNldFdlZWtZZWFySGVscGVyKGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgICAgICB2YXIgd2Vla3NUYXJnZXQ7XG4gICAgICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gd2Vla09mWWVhcih0aGlzLCBkb3csIGRveSkueWVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdlZWtzVGFyZ2V0ID0gd2Vla3NJblllYXIoaW5wdXQsIGRvdywgZG95KTtcbiAgICAgICAgICAgIGlmICh3ZWVrID4gd2Vla3NUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICB3ZWVrID0gd2Vla3NUYXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2V0V2Vla0FsbC5jYWxsKHRoaXMsIGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRXZWVrQWxsKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgICAgICB2YXIgZGF5T2ZZZWFyRGF0YSA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpLFxuICAgICAgICAgICAgZGF0ZSA9IGNyZWF0ZVVUQ0RhdGUoZGF5T2ZZZWFyRGF0YS55ZWFyLCAwLCBkYXlPZlllYXJEYXRhLmRheU9mWWVhcik7XG5cbiAgICAgICAgdGhpcy55ZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSk7XG4gICAgICAgIHRoaXMubW9udGgoZGF0ZS5nZXRVVENNb250aCgpKTtcbiAgICAgICAgdGhpcy5kYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ1EnLCAwLCAnUW8nLCAncXVhcnRlcicpO1xuXG4gICAgLy8gQUxJQVNFU1xuXG4gICAgYWRkVW5pdEFsaWFzKCdxdWFydGVyJywgJ1EnKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3F1YXJ0ZXInLCA3KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1EnLCBtYXRjaDEpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ1EnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9ICh0b0ludChpbnB1dCkgLSAxKSAqIDM7XG4gICAgfSk7XG5cbiAgICAvLyBNT01FTlRTXG5cbiAgICBmdW5jdGlvbiBnZXRTZXRRdWFydGVyIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XG4gICAgfVxuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ0QnLCBbJ0REJywgMl0sICdEbycsICdkYXRlJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ2RhdGUnLCAnRCcpO1xuXG4gICAgLy8gUFJJT1JPSVRZXG4gICAgYWRkVW5pdFByaW9yaXR5KCdkYXRlJywgOSk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdEJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignREQnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUmVnZXhUb2tlbignRG8nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gaXNTdHJpY3QgPyBsb2NhbGUuX29yZGluYWxQYXJzZSA6IGxvY2FsZS5fb3JkaW5hbFBhcnNlTGVuaWVudDtcbiAgICB9KTtcblxuICAgIGFkZFBhcnNlVG9rZW4oWydEJywgJ0REJ10sIERBVEUpO1xuICAgIGFkZFBhcnNlVG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgICAgICBhcnJheVtEQVRFXSA9IHRvSW50KGlucHV0Lm1hdGNoKG1hdGNoMXRvMilbMF0sIDEwKTtcbiAgICB9KTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIHZhciBnZXRTZXREYXlPZk1vbnRoID0gbWFrZUdldFNldCgnRGF0ZScsIHRydWUpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ0RERCcsIFsnRERERCcsIDNdLCAnREREbycsICdkYXlPZlllYXInKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygnZGF5T2ZZZWFyJywgJ0RERCcpO1xuXG4gICAgLy8gUFJJT1JJVFlcbiAgICBhZGRVbml0UHJpb3JpdHkoJ2RheU9mWWVhcicsIDQpO1xuXG4gICAgLy8gUEFSU0lOR1xuXG4gICAgYWRkUmVnZXhUb2tlbignREREJywgIG1hdGNoMXRvMyk7XG4gICAgYWRkUmVnZXhUb2tlbignRERERCcsIG1hdGNoMyk7XG4gICAgYWRkUGFyc2VUb2tlbihbJ0RERCcsICdEREREJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRvSW50KGlucHV0KTtcbiAgICB9KTtcblxuICAgIC8vIEhFTFBFUlNcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFNldERheU9mWWVhciAoaW5wdXQpIHtcbiAgICAgICAgdmFyIGRheU9mWWVhciA9IE1hdGgucm91bmQoKHRoaXMuY2xvbmUoKS5zdGFydE9mKCdkYXknKSAtIHRoaXMuY2xvbmUoKS5zdGFydE9mKCd5ZWFyJykpIC8gODY0ZTUpICsgMTtcbiAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSBkYXlPZlllYXIpLCAnZCcpO1xuICAgIH1cblxuICAgIC8vIEZPUk1BVFRJTkdcblxuICAgIGFkZEZvcm1hdFRva2VuKCdtJywgWydtbScsIDJdLCAwLCAnbWludXRlJyk7XG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ21pbnV0ZScsICdtJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtaW51dGUnLCAxNCk7XG5cbiAgICAvLyBQQVJTSU5HXG5cbiAgICBhZGRSZWdleFRva2VuKCdtJywgIG1hdGNoMXRvMik7XG4gICAgYWRkUmVnZXhUb2tlbignbW0nLCBtYXRjaDF0bzIsIG1hdGNoMik7XG4gICAgYWRkUGFyc2VUb2tlbihbJ20nLCAnbW0nXSwgTUlOVVRFKTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIHZhciBnZXRTZXRNaW51dGUgPSBtYWtlR2V0U2V0KCdNaW51dGVzJywgZmFsc2UpO1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ3MnLCBbJ3NzJywgMl0sIDAsICdzZWNvbmQnKTtcblxuICAgIC8vIEFMSUFTRVNcblxuICAgIGFkZFVuaXRBbGlhcygnc2Vjb25kJywgJ3MnKTtcblxuICAgIC8vIFBSSU9SSVRZXG5cbiAgICBhZGRVbml0UHJpb3JpdHkoJ3NlY29uZCcsIDE1KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ3MnLCAgbWF0Y2gxdG8yKTtcbiAgICBhZGRSZWdleFRva2VuKCdzcycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbiAgICBhZGRQYXJzZVRva2VuKFsncycsICdzcyddLCBTRUNPTkQpO1xuXG4gICAgLy8gTU9NRU5UU1xuXG4gICAgdmFyIGdldFNldFNlY29uZCA9IG1ha2VHZXRTZXQoJ1NlY29uZHMnLCBmYWxzZSk7XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBhZGRGb3JtYXRUb2tlbignUycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwMCk7XG4gICAgfSk7XG5cbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwKTtcbiAgICB9KTtcblxuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTJywgM10sIDAsICdtaWxsaXNlY29uZCcpO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTUycsIDRdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTJywgNV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTUycsIDZdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwO1xuICAgIH0pO1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTUycsIDddLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTJywgOF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwMDtcbiAgICB9KTtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTUycsIDldLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDAwO1xuICAgIH0pO1xuXG5cbiAgICAvLyBBTElBU0VTXG5cbiAgICBhZGRVbml0QWxpYXMoJ21pbGxpc2Vjb25kJywgJ21zJyk7XG5cbiAgICAvLyBQUklPUklUWVxuXG4gICAgYWRkVW5pdFByaW9yaXR5KCdtaWxsaXNlY29uZCcsIDE2KTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ1MnLCAgICBtYXRjaDF0bzMsIG1hdGNoMSk7XG4gICAgYWRkUmVnZXhUb2tlbignU1MnLCAgIG1hdGNoMXRvMywgbWF0Y2gyKTtcbiAgICBhZGRSZWdleFRva2VuKCdTU1MnLCAgbWF0Y2gxdG8zLCBtYXRjaDMpO1xuXG4gICAgdmFyIHRva2VuO1xuICAgIGZvciAodG9rZW4gPSAnU1NTUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICAgICAgYWRkUmVnZXhUb2tlbih0b2tlbiwgbWF0Y2hVbnNpZ25lZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VNcyhpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgYXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBmb3IgKHRva2VuID0gJ1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgICAgIGFkZFBhcnNlVG9rZW4odG9rZW4sIHBhcnNlTXMpO1xuICAgIH1cbiAgICAvLyBNT01FTlRTXG5cbiAgICB2YXIgZ2V0U2V0TWlsbGlzZWNvbmQgPSBtYWtlR2V0U2V0KCdNaWxsaXNlY29uZHMnLCBmYWxzZSk7XG5cbiAgICAvLyBGT1JNQVRUSU5HXG5cbiAgICBhZGRGb3JtYXRUb2tlbigneicsICAwLCAwLCAnem9uZUFiYnInKTtcbiAgICBhZGRGb3JtYXRUb2tlbignenonLCAwLCAwLCAnem9uZU5hbWUnKTtcblxuICAgIC8vIE1PTUVOVFNcblxuICAgIGZ1bmN0aW9uIGdldFpvbmVBYmJyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ1VUQycgOiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRab25lTmFtZSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdDb29yZGluYXRlZCBVbml2ZXJzYWwgVGltZScgOiAnJztcbiAgICB9XG5cbiAgICB2YXIgbW9tZW50UHJvdG90eXBlX19wcm90byA9IE1vbWVudC5wcm90b3R5cGU7XG5cbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmFkZCAgICAgICAgICAgICAgID0gYWRkX3N1YnRyYWN0X19hZGQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5jYWxlbmRhciAgICAgICAgICA9IG1vbWVudF9jYWxlbmRhcl9fY2FsZW5kYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5jbG9uZSAgICAgICAgICAgICA9IGNsb25lO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGlmZiAgICAgICAgICAgICAgPSBkaWZmO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZW5kT2YgICAgICAgICAgICAgPSBlbmRPZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmZvcm1hdCAgICAgICAgICAgID0gZm9ybWF0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZnJvbSAgICAgICAgICAgICAgPSBmcm9tO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZnJvbU5vdyAgICAgICAgICAgPSBmcm9tTm93O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG8gICAgICAgICAgICAgICAgPSB0bztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvTm93ICAgICAgICAgICAgID0gdG9Ob3c7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5nZXQgICAgICAgICAgICAgICA9IHN0cmluZ0dldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmludmFsaWRBdCAgICAgICAgID0gaW52YWxpZEF0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNBZnRlciAgICAgICAgICAgPSBpc0FmdGVyO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNCZWZvcmUgICAgICAgICAgPSBpc0JlZm9yZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzQmV0d2VlbiAgICAgICAgID0gaXNCZXR3ZWVuO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNTYW1lICAgICAgICAgICAgPSBpc1NhbWU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1NhbWVPckFmdGVyICAgICA9IGlzU2FtZU9yQWZ0ZXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1NhbWVPckJlZm9yZSAgICA9IGlzU2FtZU9yQmVmb3JlO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNWYWxpZCAgICAgICAgICAgPSBtb21lbnRfdmFsaWRfX2lzVmFsaWQ7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sYW5nICAgICAgICAgICAgICA9IGxhbmc7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sb2NhbGUgICAgICAgICAgICA9IGxvY2FsZTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmxvY2FsZURhdGEgICAgICAgID0gbG9jYWxlRGF0YTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1heCAgICAgICAgICAgICAgID0gcHJvdG90eXBlTWF4O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWluICAgICAgICAgICAgICAgPSBwcm90b3R5cGVNaW47XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5wYXJzaW5nRmxhZ3MgICAgICA9IHBhcnNpbmdGbGFncztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnNldCAgICAgICAgICAgICAgID0gc3RyaW5nU2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uc3RhcnRPZiAgICAgICAgICAgPSBzdGFydE9mO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uc3VidHJhY3QgICAgICAgICAgPSBhZGRfc3VidHJhY3RfX3N1YnRyYWN0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9BcnJheSAgICAgICAgICAgPSB0b0FycmF5O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9PYmplY3QgICAgICAgICAgPSB0b09iamVjdDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvRGF0ZSAgICAgICAgICAgID0gdG9EYXRlO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9JU09TdHJpbmcgICAgICAgPSBtb21lbnRfZm9ybWF0X190b0lTT1N0cmluZztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnRvSlNPTiAgICAgICAgICAgID0gdG9KU09OO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8udG9TdHJpbmcgICAgICAgICAgPSB0b1N0cmluZztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnVuaXggICAgICAgICAgICAgID0gdW5peDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnZhbHVlT2YgICAgICAgICAgID0gdG9fdHlwZV9fdmFsdWVPZjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmNyZWF0aW9uRGF0YSAgICAgID0gY3JlYXRpb25EYXRhO1xuXG4gICAgLy8gWWVhclxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ueWVhciAgICAgICA9IGdldFNldFllYXI7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0xlYXBZZWFyID0gZ2V0SXNMZWFwWWVhcjtcblxuICAgIC8vIFdlZWsgWWVhclxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla1llYXIgICAgPSBnZXRTZXRXZWVrWWVhcjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWtZZWFyID0gZ2V0U2V0SVNPV2Vla1llYXI7XG5cbiAgICAvLyBRdWFydGVyXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5xdWFydGVyID0gbW9tZW50UHJvdG90eXBlX19wcm90by5xdWFydGVycyA9IGdldFNldFF1YXJ0ZXI7XG5cbiAgICAvLyBNb250aFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubW9udGggICAgICAgPSBnZXRTZXRNb250aDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRheXNJbk1vbnRoID0gZ2V0RGF5c0luTW9udGg7XG5cbiAgICAvLyBXZWVrXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by53ZWVrICAgICAgICAgICA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla3MgICAgICAgID0gZ2V0U2V0V2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWsgICAgICAgID0gbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrcyAgICAgPSBnZXRTZXRJU09XZWVrO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ud2Vla3NJblllYXIgICAgPSBnZXRXZWVrc0luWWVhcjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzb1dlZWtzSW5ZZWFyID0gZ2V0SVNPV2Vla3NJblllYXI7XG5cbiAgICAvLyBEYXlcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRhdGUgICAgICAgPSBnZXRTZXREYXlPZk1vbnRoO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5ICAgICAgICA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5cyAgICAgICAgICAgICA9IGdldFNldERheU9mV2VlaztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLndlZWtkYXkgICAgPSBnZXRTZXRMb2NhbGVEYXlPZldlZWs7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc29XZWVrZGF5ID0gZ2V0U2V0SVNPRGF5T2ZXZWVrO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uZGF5T2ZZZWFyICA9IGdldFNldERheU9mWWVhcjtcblxuICAgIC8vIEhvdXJcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmhvdXIgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmhvdXJzID0gZ2V0U2V0SG91cjtcblxuICAgIC8vIE1pbnV0ZVxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWludXRlID0gbW9tZW50UHJvdG90eXBlX19wcm90by5taW51dGVzID0gZ2V0U2V0TWludXRlO1xuXG4gICAgLy8gU2Vjb25kXG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5zZWNvbmQgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnNlY29uZHMgPSBnZXRTZXRTZWNvbmQ7XG5cbiAgICAvLyBNaWxsaXNlY29uZFxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ubWlsbGlzZWNvbmQgPSBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1pbGxpc2Vjb25kcyA9IGdldFNldE1pbGxpc2Vjb25kO1xuXG4gICAgLy8gT2Zmc2V0XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by51dGNPZmZzZXQgICAgICAgICAgICA9IGdldFNldE9mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnV0YyAgICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9VVEM7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5sb2NhbCAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvTG9jYWw7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5wYXJzZVpvbmUgICAgICAgICAgICA9IHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaGFzQWxpZ25lZEhvdXJPZmZzZXQgPSBoYXNBbGlnbmVkSG91ck9mZnNldDtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzRFNUICAgICAgICAgICAgICAgID0gaXNEYXlsaWdodFNhdmluZ1RpbWU7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0xvY2FsICAgICAgICAgICAgICA9IGlzTG9jYWw7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc1V0Y09mZnNldCAgICAgICAgICA9IGlzVXRjT2Zmc2V0O1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uaXNVdGMgICAgICAgICAgICAgICAgPSBpc1V0YztcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmlzVVRDICAgICAgICAgICAgICAgID0gaXNVdGM7XG5cbiAgICAvLyBUaW1lem9uZVxuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8uem9uZUFiYnIgPSBnZXRab25lQWJicjtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLnpvbmVOYW1lID0gZ2V0Wm9uZU5hbWU7XG5cbiAgICAvLyBEZXByZWNhdGlvbnNcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLmRhdGVzICA9IGRlcHJlY2F0ZSgnZGF0ZXMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIGRhdGUgaW5zdGVhZC4nLCBnZXRTZXREYXlPZk1vbnRoKTtcbiAgICBtb21lbnRQcm90b3R5cGVfX3Byb3RvLm1vbnRocyA9IGRlcHJlY2F0ZSgnbW9udGhzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb250aCBpbnN0ZWFkJywgZ2V0U2V0TW9udGgpO1xuICAgIG1vbWVudFByb3RvdHlwZV9fcHJvdG8ueWVhcnMgID0gZGVwcmVjYXRlKCd5ZWFycyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgeWVhciBpbnN0ZWFkJywgZ2V0U2V0WWVhcik7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by56b25lICAgPSBkZXByZWNhdGUoJ21vbWVudCgpLnpvbmUgaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudCgpLnV0Y09mZnNldCBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL3pvbmUvJywgZ2V0U2V0Wm9uZSk7XG4gICAgbW9tZW50UHJvdG90eXBlX19wcm90by5pc0RTVFNoaWZ0ZWQgPSBkZXByZWNhdGUoJ2lzRFNUU2hpZnRlZCBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kc3Qtc2hpZnRlZC8gZm9yIG1vcmUgaW5mb3JtYXRpb24nLCBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQpO1xuXG4gICAgdmFyIG1vbWVudFByb3RvdHlwZSA9IG1vbWVudFByb3RvdHlwZV9fcHJvdG87XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfX2NyZWF0ZVVuaXggKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBsb2NhbF9fY3JlYXRlTG9jYWwoaW5wdXQgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb21lbnRfX2NyZWF0ZUluWm9uZSAoKSB7XG4gICAgICAgIHJldHVybiBsb2NhbF9fY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVQYXJzZVBvc3RGb3JtYXQgKHN0cmluZykge1xuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIHZhciBwcm90b3R5cGVfX3Byb3RvID0gTG9jYWxlLnByb3RvdHlwZTtcblxuICAgIHByb3RvdHlwZV9fcHJvdG8uY2FsZW5kYXIgICAgICAgID0gbG9jYWxlX2NhbGVuZGFyX19jYWxlbmRhcjtcbiAgICBwcm90b3R5cGVfX3Byb3RvLmxvbmdEYXRlRm9ybWF0ICA9IGxvbmdEYXRlRm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8uaW52YWxpZERhdGUgICAgID0gaW52YWxpZERhdGU7XG4gICAgcHJvdG90eXBlX19wcm90by5vcmRpbmFsICAgICAgICAgPSBvcmRpbmFsO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucHJlcGFyc2UgICAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucG9zdGZvcm1hdCAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ucmVsYXRpdmVUaW1lICAgID0gcmVsYXRpdmVfX3JlbGF0aXZlVGltZTtcbiAgICBwcm90b3R5cGVfX3Byb3RvLnBhc3RGdXR1cmUgICAgICA9IHBhc3RGdXR1cmU7XG4gICAgcHJvdG90eXBlX19wcm90by5zZXQgICAgICAgICAgICAgPSBsb2NhbGVfc2V0X19zZXQ7XG5cbiAgICAvLyBNb250aFxuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzICAgICAgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ubW9udGhzU2hvcnQgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzU2hvcnQ7XG4gICAgcHJvdG90eXBlX19wcm90by5tb250aHNQYXJzZSAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHNQYXJzZTtcbiAgICBwcm90b3R5cGVfX3Byb3RvLm1vbnRoc1JlZ2V4ICAgICAgID0gbW9udGhzUmVnZXg7XG4gICAgcHJvdG90eXBlX19wcm90by5tb250aHNTaG9ydFJlZ2V4ICA9IG1vbnRoc1Nob3J0UmVnZXg7XG5cbiAgICAvLyBXZWVrXG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrID0gbG9jYWxlV2VlaztcbiAgICBwcm90b3R5cGVfX3Byb3RvLmZpcnN0RGF5T2ZZZWFyID0gbG9jYWxlRmlyc3REYXlPZlllYXI7XG4gICAgcHJvdG90eXBlX19wcm90by5maXJzdERheU9mV2VlayA9IGxvY2FsZUZpcnN0RGF5T2ZXZWVrO1xuXG4gICAgLy8gRGF5IG9mIFdlZWtcbiAgICBwcm90b3R5cGVfX3Byb3RvLndlZWtkYXlzICAgICAgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzO1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNNaW4gICAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNNaW47XG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrZGF5c1Nob3J0ICA9ICAgICAgICBsb2NhbGVXZWVrZGF5c1Nob3J0O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNQYXJzZSAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNQYXJzZTtcblxuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNSZWdleCAgICAgICA9ICAgICAgICB3ZWVrZGF5c1JlZ2V4O1xuICAgIHByb3RvdHlwZV9fcHJvdG8ud2Vla2RheXNTaG9ydFJlZ2V4ICA9ICAgICAgICB3ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgcHJvdG90eXBlX19wcm90by53ZWVrZGF5c01pblJlZ2V4ICAgID0gICAgICAgIHdlZWtkYXlzTWluUmVnZXg7XG5cbiAgICAvLyBIb3Vyc1xuICAgIHByb3RvdHlwZV9fcHJvdG8uaXNQTSA9IGxvY2FsZUlzUE07XG4gICAgcHJvdG90eXBlX19wcm90by5tZXJpZGllbSA9IGxvY2FsZU1lcmlkaWVtO1xuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2dldCAoZm9ybWF0LCBpbmRleCwgZmllbGQsIHNldHRlcikge1xuICAgICAgICB2YXIgbG9jYWxlID0gbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZSgpO1xuICAgICAgICB2YXIgdXRjID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDKCkuc2V0KHNldHRlciwgaW5kZXgpO1xuICAgICAgICByZXR1cm4gbG9jYWxlW2ZpZWxkXSh1dGMsIGZvcm1hdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdE1vbnRoc0ltcGwgKGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZm9ybWF0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsaXN0c19fZ2V0KGZvcm1hdCwgaW5kZXgsIGZpZWxkLCAnbW9udGgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgICAgICBvdXRbaV0gPSBsaXN0c19fZ2V0KGZvcm1hdCwgaSwgZmllbGQsICdtb250aCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgLy8gKClcbiAgICAvLyAoNSlcbiAgICAvLyAoZm10LCA1KVxuICAgIC8vIChmbXQpXG4gICAgLy8gKHRydWUpXG4gICAgLy8gKHRydWUsIDUpXG4gICAgLy8gKHRydWUsIGZtdCwgNSlcbiAgICAvLyAodHJ1ZSwgZm10KVxuICAgIGZ1bmN0aW9uIGxpc3RXZWVrZGF5c0ltcGwgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgZmllbGQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBsb2NhbGVTb3J0ZWQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBsb2NhbGVTb3J0ZWQ7XG4gICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgIGxvY2FsZVNvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2NhbGUgPSBsb2NhbGVfbG9jYWxlc19fZ2V0TG9jYWxlKCksXG4gICAgICAgICAgICBzaGlmdCA9IGxvY2FsZVNvcnRlZCA/IGxvY2FsZS5fd2Vlay5kb3cgOiAwO1xuXG4gICAgICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdHNfX2dldChmb3JtYXQsIChpbmRleCArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICBvdXRbaV0gPSBsaXN0c19fZ2V0KGZvcm1hdCwgKGkgKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RNb250aHMgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHMnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdE1vbnRoc1Nob3J0IChmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0TW9udGhzSW1wbChmb3JtYXQsIGluZGV4LCAnbW9udGhzU2hvcnQnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdFdlZWtkYXlzIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXMnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0c19fbGlzdFdlZWtkYXlzU2hvcnQgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c1Nob3J0Jyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdHNfX2xpc3RXZWVrZGF5c01pbiAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzTWluJyk7XG4gICAgfVxuXG4gICAgbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSgnZW4nLCB7XG4gICAgICAgIG9yZGluYWxQYXJzZTogL1xcZHsxLDJ9KHRofHN0fG5kfHJkKS8sXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxuICAgICAgICAgICAgICAgIG91dHB1dCA9ICh0b0ludChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxhbmcgPSBkZXByZWNhdGUoJ21vbWVudC5sYW5nIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlIGluc3RlYWQuJywgbG9jYWxlX2xvY2FsZXNfX2dldFNldEdsb2JhbExvY2FsZSk7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxhbmdEYXRhID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZ0RhdGEgaXMgZGVwcmVjYXRlZC4gVXNlIG1vbWVudC5sb2NhbGVEYXRhIGluc3RlYWQuJywgbG9jYWxlX2xvY2FsZXNfX2dldExvY2FsZSk7XG5cbiAgICB2YXIgbWF0aEFicyA9IE1hdGguYWJzO1xuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWJzX19hYnMgKCkge1xuICAgICAgICB2YXIgZGF0YSAgICAgICAgICAgPSB0aGlzLl9kYXRhO1xuXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IG1hdGhBYnModGhpcy5fbWlsbGlzZWNvbmRzKTtcbiAgICAgICAgdGhpcy5fZGF5cyAgICAgICAgID0gbWF0aEFicyh0aGlzLl9kYXlzKTtcbiAgICAgICAgdGhpcy5fbW9udGhzICAgICAgID0gbWF0aEFicyh0aGlzLl9tb250aHMpO1xuXG4gICAgICAgIGRhdGEubWlsbGlzZWNvbmRzICA9IG1hdGhBYnMoZGF0YS5taWxsaXNlY29uZHMpO1xuICAgICAgICBkYXRhLnNlY29uZHMgICAgICAgPSBtYXRoQWJzKGRhdGEuc2Vjb25kcyk7XG4gICAgICAgIGRhdGEubWludXRlcyAgICAgICA9IG1hdGhBYnMoZGF0YS5taW51dGVzKTtcbiAgICAgICAgZGF0YS5ob3VycyAgICAgICAgID0gbWF0aEFicyhkYXRhLmhvdXJzKTtcbiAgICAgICAgZGF0YS5tb250aHMgICAgICAgID0gbWF0aEFicyhkYXRhLm1vbnRocyk7XG4gICAgICAgIGRhdGEueWVhcnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS55ZWFycyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYWRkX3N1YnRyYWN0X19hZGRTdWJ0cmFjdCAoZHVyYXRpb24sIGlucHV0LCB2YWx1ZSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24oaW5wdXQsIHZhbHVlKTtcblxuICAgICAgICBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzICs9IGRpcmVjdGlvbiAqIG90aGVyLl9taWxsaXNlY29uZHM7XG4gICAgICAgIGR1cmF0aW9uLl9kYXlzICAgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX2RheXM7XG4gICAgICAgIGR1cmF0aW9uLl9tb250aHMgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX21vbnRocztcblxuICAgICAgICByZXR1cm4gZHVyYXRpb24uX2J1YmJsZSgpO1xuICAgIH1cblxuICAgIC8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIGFkZCgxLCAncycpIG9yIGFkZChkdXJhdGlvbilcbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZCAoaW5wdXQsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX2FkZFN1YnRyYWN0KHRoaXMsIGlucHV0LCB2YWx1ZSwgMSk7XG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgc3VidHJhY3QoMSwgJ3MnKSBvciBzdWJ0cmFjdChkdXJhdGlvbilcbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX3N1YnRyYWN0IChpbnB1dCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uX2FkZF9zdWJ0cmFjdF9fYWRkU3VidHJhY3QodGhpcywgaW5wdXQsIHZhbHVlLCAtMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWJzQ2VpbCAobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnViYmxlICgpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcbiAgICAgICAgdmFyIGRheXMgICAgICAgICA9IHRoaXMuX2RheXM7XG4gICAgICAgIHZhciBtb250aHMgICAgICAgPSB0aGlzLl9tb250aHM7XG4gICAgICAgIHZhciBkYXRhICAgICAgICAgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzLCBtb250aHNGcm9tRGF5cztcblxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgbWl4IG9mIHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSB2YWx1ZXMsIGJ1YmJsZSBkb3duIGZpcnN0XG4gICAgICAgIC8vIGNoZWNrOiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjE2NlxuICAgICAgICBpZiAoISgobWlsbGlzZWNvbmRzID49IDAgJiYgZGF5cyA+PSAwICYmIG1vbnRocyA+PSAwKSB8fFxuICAgICAgICAgICAgICAgIChtaWxsaXNlY29uZHMgPD0gMCAmJiBkYXlzIDw9IDAgJiYgbW9udGhzIDw9IDApKSkge1xuICAgICAgICAgICAgbWlsbGlzZWNvbmRzICs9IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRocykgKyBkYXlzKSAqIDg2NGU1O1xuICAgICAgICAgICAgZGF5cyA9IDA7XG4gICAgICAgICAgICBtb250aHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgICAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXG4gICAgICAgIGRhdGEubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzICUgMTAwMDtcblxuICAgICAgICBzZWNvbmRzICAgICAgICAgICA9IGFic0Zsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xuICAgICAgICBkYXRhLnNlY29uZHMgICAgICA9IHNlY29uZHMgJSA2MDtcblxuICAgICAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgICAgIGRhdGEubWludXRlcyAgICAgID0gbWludXRlcyAlIDYwO1xuXG4gICAgICAgIGhvdXJzICAgICAgICAgICAgID0gYWJzRmxvb3IobWludXRlcyAvIDYwKTtcbiAgICAgICAgZGF0YS5ob3VycyAgICAgICAgPSBob3VycyAlIDI0O1xuXG4gICAgICAgIGRheXMgKz0gYWJzRmxvb3IoaG91cnMgLyAyNCk7XG5cbiAgICAgICAgLy8gY29udmVydCBkYXlzIHRvIG1vbnRoc1xuICAgICAgICBtb250aHNGcm9tRGF5cyA9IGFic0Zsb29yKGRheXNUb01vbnRocyhkYXlzKSk7XG4gICAgICAgIG1vbnRocyArPSBtb250aHNGcm9tRGF5cztcbiAgICAgICAgZGF5cyAtPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHNGcm9tRGF5cykpO1xuXG4gICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgeWVhcnMgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgICAgIG1vbnRocyAlPSAxMjtcblxuICAgICAgICBkYXRhLmRheXMgICA9IGRheXM7XG4gICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgICAgICBkYXRhLnllYXJzICA9IHllYXJzO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheXNUb01vbnRocyAoZGF5cykge1xuICAgICAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxNDYwOTcgZGF5cyAodGFraW5nIGludG8gYWNjb3VudCBsZWFwIHllYXIgcnVsZXMpXG4gICAgICAgIC8vIDQwMCB5ZWFycyBoYXZlIDEyIG1vbnRocyA9PT0gNDgwMFxuICAgICAgICByZXR1cm4gZGF5cyAqIDQ4MDAgLyAxNDYwOTc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9udGhzVG9EYXlzIChtb250aHMpIHtcbiAgICAgICAgLy8gdGhlIHJldmVyc2Ugb2YgZGF5c1RvTW9udGhzXG4gICAgICAgIHJldHVybiBtb250aHMgKiAxNDYwOTcgLyA0ODAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzICh1bml0cykge1xuICAgICAgICB2YXIgZGF5cztcbiAgICAgICAgdmFyIG1vbnRocztcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcblxuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICBpZiAodW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgZGF5cyAgID0gdGhpcy5fZGF5cyAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMgKyBkYXlzVG9Nb250aHMoZGF5cyk7XG4gICAgICAgICAgICByZXR1cm4gdW5pdHMgPT09ICdtb250aCcgPyBtb250aHMgOiBtb250aHMgLyAxMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBtaWxsaXNlY29uZHMgc2VwYXJhdGVseSBiZWNhdXNlIG9mIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIChpc3N1ZSAjMTg2NylcbiAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgTWF0aC5yb3VuZChtb250aHNUb0RheXModGhpcy5fbW9udGhzKSk7XG4gICAgICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnd2VlaycgICA6IHJldHVybiBkYXlzIC8gNyAgICAgKyBtaWxsaXNlY29uZHMgLyA2MDQ4ZTU7XG4gICAgICAgICAgICAgICAgY2FzZSAnZGF5JyAgICA6IHJldHVybiBkYXlzICAgICAgICAgKyBtaWxsaXNlY29uZHMgLyA4NjRlNTtcbiAgICAgICAgICAgICAgICBjYXNlICdob3VyJyAgIDogcmV0dXJuIGRheXMgKiAyNCAgICArIG1pbGxpc2Vjb25kcyAvIDM2ZTU7XG4gICAgICAgICAgICAgICAgY2FzZSAnbWludXRlJyA6IHJldHVybiBkYXlzICogMTQ0MCAgKyBtaWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Vjb25kJyA6IHJldHVybiBkYXlzICogODY0MDAgKyBtaWxsaXNlY29uZHMgLyAxMDAwO1xuICAgICAgICAgICAgICAgIC8vIE1hdGguZmxvb3IgcHJldmVudHMgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgaGVyZVxuICAgICAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDg2NGU1KSArIG1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdW5pdCAnICsgdW5pdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVXNlIHRoaXMuYXMoJ21zJyk/XG4gICAgZnVuY3Rpb24gZHVyYXRpb25fYXNfX3ZhbHVlT2YgKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzICtcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXG4gICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgIHRvSW50KHRoaXMuX21vbnRocyAvIDEyKSAqIDMxNTM2ZTZcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQXMgKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcyhhbGlhcyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGFzTWlsbGlzZWNvbmRzID0gbWFrZUFzKCdtcycpO1xuICAgIHZhciBhc1NlY29uZHMgICAgICA9IG1ha2VBcygncycpO1xuICAgIHZhciBhc01pbnV0ZXMgICAgICA9IG1ha2VBcygnbScpO1xuICAgIHZhciBhc0hvdXJzICAgICAgICA9IG1ha2VBcygnaCcpO1xuICAgIHZhciBhc0RheXMgICAgICAgICA9IG1ha2VBcygnZCcpO1xuICAgIHZhciBhc1dlZWtzICAgICAgICA9IG1ha2VBcygndycpO1xuICAgIHZhciBhc01vbnRocyAgICAgICA9IG1ha2VBcygnTScpO1xuICAgIHZhciBhc1llYXJzICAgICAgICA9IG1ha2VBcygneScpO1xuXG4gICAgZnVuY3Rpb24gZHVyYXRpb25fZ2V0X19nZXQgKHVuaXRzKSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICByZXR1cm4gdGhpc1t1bml0cyArICdzJ10oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlR2V0dGVyKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBtaWxsaXNlY29uZHMgPSBtYWtlR2V0dGVyKCdtaWxsaXNlY29uZHMnKTtcbiAgICB2YXIgc2Vjb25kcyAgICAgID0gbWFrZUdldHRlcignc2Vjb25kcycpO1xuICAgIHZhciBtaW51dGVzICAgICAgPSBtYWtlR2V0dGVyKCdtaW51dGVzJyk7XG4gICAgdmFyIGhvdXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ2hvdXJzJyk7XG4gICAgdmFyIGRheXMgICAgICAgICA9IG1ha2VHZXR0ZXIoJ2RheXMnKTtcbiAgICB2YXIgbW9udGhzICAgICAgID0gbWFrZUdldHRlcignbW9udGhzJyk7XG4gICAgdmFyIHllYXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ3llYXJzJyk7XG5cbiAgICBmdW5jdGlvbiB3ZWVrcyAoKSB7XG4gICAgICAgIHJldHVybiBhYnNGbG9vcih0aGlzLmRheXMoKSAvIDcpO1xuICAgIH1cblxuICAgIHZhciByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgdmFyIHRocmVzaG9sZHMgPSB7XG4gICAgICAgIHM6IDQ1LCAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICAgICAgbTogNDUsICAvLyBtaW51dGVzIHRvIGhvdXJcbiAgICAgICAgaDogMjIsICAvLyBob3VycyB0byBkYXlcbiAgICAgICAgZDogMjYsICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgICAgIE06IDExICAgLy8gbW9udGhzIHRvIHllYXJcbiAgICB9O1xuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkdXJhdGlvbl9odW1hbml6ZV9fcmVsYXRpdmVUaW1lIChwb3NOZWdEdXJhdGlvbiwgd2l0aG91dFN1ZmZpeCwgbG9jYWxlKSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IGNyZWF0ZV9fY3JlYXRlRHVyYXRpb24ocG9zTmVnRHVyYXRpb24pLmFicygpO1xuICAgICAgICB2YXIgc2Vjb25kcyAgPSByb3VuZChkdXJhdGlvbi5hcygncycpKTtcbiAgICAgICAgdmFyIG1pbnV0ZXMgID0gcm91bmQoZHVyYXRpb24uYXMoJ20nKSk7XG4gICAgICAgIHZhciBob3VycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdoJykpO1xuICAgICAgICB2YXIgZGF5cyAgICAgPSByb3VuZChkdXJhdGlvbi5hcygnZCcpKTtcbiAgICAgICAgdmFyIG1vbnRocyAgID0gcm91bmQoZHVyYXRpb24uYXMoJ00nKSk7XG4gICAgICAgIHZhciB5ZWFycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCd5JykpO1xuXG4gICAgICAgIHZhciBhID0gc2Vjb25kcyA8IHRocmVzaG9sZHMucyAmJiBbJ3MnLCBzZWNvbmRzXSAgfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzIDw9IDEgICAgICAgICAgICYmIFsnbSddICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPCB0aHJlc2hvbGRzLm0gJiYgWydtbScsIG1pbnV0ZXNdIHx8XG4gICAgICAgICAgICAgICAgaG91cnMgICA8PSAxICAgICAgICAgICAmJiBbJ2gnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICBob3VycyAgIDwgdGhyZXNob2xkcy5oICYmIFsnaGgnLCBob3Vyc10gICB8fFxuICAgICAgICAgICAgICAgIGRheXMgICAgPD0gMSAgICAgICAgICAgJiYgWydkJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICAgICAgZGF5cyAgICA8IHRocmVzaG9sZHMuZCAmJiBbJ2RkJywgZGF5c10gICAgfHxcbiAgICAgICAgICAgICAgICBtb250aHMgIDw9IDEgICAgICAgICAgICYmIFsnTSddICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgIG1vbnRocyAgPCB0aHJlc2hvbGRzLk0gJiYgWydNTScsIG1vbnRoc10gIHx8XG4gICAgICAgICAgICAgICAgeWVhcnMgICA8PSAxICAgICAgICAgICAmJiBbJ3knXSAgICAgICAgICAgfHwgWyd5eScsIHllYXJzXTtcblxuICAgICAgICBhWzJdID0gd2l0aG91dFN1ZmZpeDtcbiAgICAgICAgYVszXSA9ICtwb3NOZWdEdXJhdGlvbiA+IDA7XG4gICAgICAgIGFbNF0gPSBsb2NhbGU7XG4gICAgICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseShudWxsLCBhKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IHRoZSByb3VuZGluZyBmdW5jdGlvbiBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG4gICAgZnVuY3Rpb24gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nIChyb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIGlmIChyb3VuZGluZ0Z1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByb3VuZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mKHJvdW5kaW5nRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByb3VuZCA9IHJvdW5kaW5nRnVuY3Rpb247XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG4gICAgZnVuY3Rpb24gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZCAodGhyZXNob2xkLCBsaW1pdCkge1xuICAgICAgICBpZiAodGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRocmVzaG9sZHNbdGhyZXNob2xkXTtcbiAgICAgICAgfVxuICAgICAgICB0aHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaHVtYW5pemUgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgdmFyIGxvY2FsZSA9IHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICB2YXIgb3V0cHV0ID0gZHVyYXRpb25faHVtYW5pemVfX3JlbGF0aXZlVGltZSh0aGlzLCAhd2l0aFN1ZmZpeCwgbG9jYWxlKTtcblxuICAgICAgICBpZiAod2l0aFN1ZmZpeCkge1xuICAgICAgICAgICAgb3V0cHV0ID0gbG9jYWxlLnBhc3RGdXR1cmUoK3RoaXMsIG91dHB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbG9jYWxlLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICB9XG5cbiAgICB2YXIgaXNvX3N0cmluZ19fYWJzID0gTWF0aC5hYnM7XG5cbiAgICBmdW5jdGlvbiBpc29fc3RyaW5nX190b0lTT1N0cmluZygpIHtcbiAgICAgICAgLy8gZm9yIElTTyBzdHJpbmdzIHdlIGRvIG5vdCB1c2UgdGhlIG5vcm1hbCBidWJibGluZyBydWxlczpcbiAgICAgICAgLy8gICogbWlsbGlzZWNvbmRzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSBob3Vyc1xuICAgICAgICAvLyAgKiBkYXlzIGRvIG5vdCBidWJibGUgYXQgYWxsXG4gICAgICAgIC8vICAqIG1vbnRocyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgeWVhcnNcbiAgICAgICAgLy8gVGhpcyBpcyBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvbnRleHQtZnJlZSBjb252ZXJzaW9uIGJldHdlZW4gaG91cnMgYW5kIGRheXNcbiAgICAgICAgLy8gKHRoaW5rIG9mIGNsb2NrIGNoYW5nZXMpXG4gICAgICAgIC8vIGFuZCBhbHNvIG5vdCBiZXR3ZWVuIGRheXMgYW5kIG1vbnRocyAoMjgtMzEgZGF5cyBwZXIgbW9udGgpXG4gICAgICAgIHZhciBzZWNvbmRzID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX21pbGxpc2Vjb25kcykgLyAxMDAwO1xuICAgICAgICB2YXIgZGF5cyAgICAgICAgID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX2RheXMpO1xuICAgICAgICB2YXIgbW9udGhzICAgICAgID0gaXNvX3N0cmluZ19fYWJzKHRoaXMuX21vbnRocyk7XG4gICAgICAgIHZhciBtaW51dGVzLCBob3VycywgeWVhcnM7XG5cbiAgICAgICAgLy8gMzYwMCBzZWNvbmRzIC0+IDYwIG1pbnV0ZXMgLT4gMSBob3VyXG4gICAgICAgIG1pbnV0ZXMgICAgICAgICAgID0gYWJzRmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICAgICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgICAgICBzZWNvbmRzICU9IDYwO1xuICAgICAgICBtaW51dGVzICU9IDYwO1xuXG4gICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgeWVhcnMgID0gYWJzRmxvb3IobW9udGhzIC8gMTIpO1xuICAgICAgICBtb250aHMgJT0gMTI7XG5cblxuICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICB2YXIgWSA9IHllYXJzO1xuICAgICAgICB2YXIgTSA9IG1vbnRocztcbiAgICAgICAgdmFyIEQgPSBkYXlzO1xuICAgICAgICB2YXIgaCA9IGhvdXJzO1xuICAgICAgICB2YXIgbSA9IG1pbnV0ZXM7XG4gICAgICAgIHZhciBzID0gc2Vjb25kcztcbiAgICAgICAgdmFyIHRvdGFsID0gdGhpcy5hc1NlY29uZHMoKTtcblxuICAgICAgICBpZiAoIXRvdGFsKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSBzYW1lIGFzIEMjJ3MgKE5vZGEpIGFuZCBweXRob24gKGlzb2RhdGUpLi4uXG4gICAgICAgICAgICAvLyBidXQgbm90IG90aGVyIEpTIChnb29nLmRhdGUpXG4gICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHRvdGFsIDwgMCA/ICctJyA6ICcnKSArXG4gICAgICAgICAgICAnUCcgK1xuICAgICAgICAgICAgKFkgPyBZICsgJ1knIDogJycpICtcbiAgICAgICAgICAgIChNID8gTSArICdNJyA6ICcnKSArXG4gICAgICAgICAgICAoRCA/IEQgKyAnRCcgOiAnJykgK1xuICAgICAgICAgICAgKChoIHx8IG0gfHwgcykgPyAnVCcgOiAnJykgK1xuICAgICAgICAgICAgKGggPyBoICsgJ0gnIDogJycpICtcbiAgICAgICAgICAgIChtID8gbSArICdNJyA6ICcnKSArXG4gICAgICAgICAgICAocyA/IHMgKyAnUycgOiAnJyk7XG4gICAgfVxuXG4gICAgdmFyIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8gPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFicyAgICAgICAgICAgID0gZHVyYXRpb25fYWJzX19hYnM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hZGQgICAgICAgICAgICA9IGR1cmF0aW9uX2FkZF9zdWJ0cmFjdF9fYWRkO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uc3VidHJhY3QgICAgICAgPSBkdXJhdGlvbl9hZGRfc3VidHJhY3RfX3N1YnRyYWN0O1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXMgICAgICAgICAgICAgPSBhcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzTWlsbGlzZWNvbmRzID0gYXNNaWxsaXNlY29uZHM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc1NlY29uZHMgICAgICA9IGFzU2Vjb25kcztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmFzTWludXRlcyAgICAgID0gYXNNaW51dGVzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNIb3VycyAgICAgICAgPSBhc0hvdXJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNEYXlzICAgICAgICAgPSBhc0RheXM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc1dlZWtzICAgICAgICA9IGFzV2Vla3M7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5hc01vbnRocyAgICAgICA9IGFzTW9udGhzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uYXNZZWFycyAgICAgICAgPSBhc1llYXJzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8udmFsdWVPZiAgICAgICAgPSBkdXJhdGlvbl9hc19fdmFsdWVPZjtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLl9idWJibGUgICAgICAgID0gYnViYmxlO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uZ2V0ICAgICAgICAgICAgPSBkdXJhdGlvbl9nZXRfX2dldDtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLm1pbGxpc2Vjb25kcyAgID0gbWlsbGlzZWNvbmRzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uc2Vjb25kcyAgICAgICAgPSBzZWNvbmRzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubWludXRlcyAgICAgICAgPSBtaW51dGVzO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8uaG91cnMgICAgICAgICAgPSBob3VycztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmRheXMgICAgICAgICAgID0gZGF5cztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLndlZWtzICAgICAgICAgID0gd2Vla3M7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5tb250aHMgICAgICAgICA9IG1vbnRocztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnllYXJzICAgICAgICAgID0geWVhcnM7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5odW1hbml6ZSAgICAgICA9IGh1bWFuaXplO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8udG9JU09TdHJpbmcgICAgPSBpc29fc3RyaW5nX190b0lTT1N0cmluZztcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnRvU3RyaW5nICAgICAgID0gaXNvX3N0cmluZ19fdG9JU09TdHJpbmc7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by50b0pTT04gICAgICAgICA9IGlzb19zdHJpbmdfX3RvSVNPU3RyaW5nO1xuICAgIGR1cmF0aW9uX3Byb3RvdHlwZV9fcHJvdG8ubG9jYWxlICAgICAgICAgPSBsb2NhbGU7XG4gICAgZHVyYXRpb25fcHJvdG90eXBlX19wcm90by5sb2NhbGVEYXRhICAgICA9IGxvY2FsZURhdGE7XG5cbiAgICAvLyBEZXByZWNhdGlvbnNcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLnRvSXNvU3RyaW5nID0gZGVwcmVjYXRlKCd0b0lzb1N0cmluZygpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgdG9JU09TdHJpbmcoKSBpbnN0ZWFkIChub3RpY2UgdGhlIGNhcGl0YWxzKScsIGlzb19zdHJpbmdfX3RvSVNPU3RyaW5nKTtcbiAgICBkdXJhdGlvbl9wcm90b3R5cGVfX3Byb3RvLmxhbmcgPSBsYW5nO1xuXG4gICAgLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuXG4gICAgLy8gRk9STUFUVElOR1xuXG4gICAgYWRkRm9ybWF0VG9rZW4oJ1gnLCAwLCAwLCAndW5peCcpO1xuICAgIGFkZEZvcm1hdFRva2VuKCd4JywgMCwgMCwgJ3ZhbHVlT2YnKTtcblxuICAgIC8vIFBBUlNJTkdcblxuICAgIGFkZFJlZ2V4VG9rZW4oJ3gnLCBtYXRjaFNpZ25lZCk7XG4gICAgYWRkUmVnZXhUb2tlbignWCcsIG1hdGNoVGltZXN0YW1wKTtcbiAgICBhZGRQYXJzZVRva2VuKCdYJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQsIDEwKSAqIDEwMDApO1xuICAgIH0pO1xuICAgIGFkZFBhcnNlVG9rZW4oJ3gnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbiAgICB9KTtcblxuICAgIC8vIFNpZGUgZWZmZWN0IGltcG9ydHNcblxuXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnZlcnNpb24gPSAnMi4xNS4yJztcblxuICAgIHNldEhvb2tDYWxsYmFjayhsb2NhbF9fY3JlYXRlTG9jYWwpO1xuXG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmZuICAgICAgICAgICAgICAgICAgICA9IG1vbWVudFByb3RvdHlwZTtcbiAgICB1dGlsc19ob29rc19faG9va3MubWluICAgICAgICAgICAgICAgICAgID0gbWluO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5tYXggICAgICAgICAgICAgICAgICAgPSBtYXg7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm5vdyAgICAgICAgICAgICAgICAgICA9IG5vdztcbiAgICB1dGlsc19ob29rc19faG9va3MudXRjICAgICAgICAgICAgICAgICAgID0gY3JlYXRlX3V0Y19fY3JlYXRlVVRDO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy51bml4ICAgICAgICAgICAgICAgICAgPSBtb21lbnRfX2NyZWF0ZVVuaXg7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm1vbnRocyAgICAgICAgICAgICAgICA9IGxpc3RzX19saXN0TW9udGhzO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pc0RhdGUgICAgICAgICAgICAgICAgPSBpc0RhdGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxvY2FsZSAgICAgICAgICAgICAgICA9IGxvY2FsZV9sb2NhbGVzX19nZXRTZXRHbG9iYWxMb2NhbGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmludmFsaWQgICAgICAgICAgICAgICA9IHZhbGlkX19jcmVhdGVJbnZhbGlkO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5kdXJhdGlvbiAgICAgICAgICAgICAgPSBjcmVhdGVfX2NyZWF0ZUR1cmF0aW9uO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5pc01vbWVudCAgICAgICAgICAgICAgPSBpc01vbWVudDtcbiAgICB1dGlsc19ob29rc19faG9va3Mud2Vla2RheXMgICAgICAgICAgICAgID0gbGlzdHNfX2xpc3RXZWVrZGF5cztcbiAgICB1dGlsc19ob29rc19faG9va3MucGFyc2Vab25lICAgICAgICAgICAgID0gbW9tZW50X19jcmVhdGVJblpvbmU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmxvY2FsZURhdGEgICAgICAgICAgICA9IGxvY2FsZV9sb2NhbGVzX19nZXRMb2NhbGU7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmlzRHVyYXRpb24gICAgICAgICAgICA9IGlzRHVyYXRpb247XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLm1vbnRoc1Nob3J0ICAgICAgICAgICA9IGxpc3RzX19saXN0TW9udGhzU2hvcnQ7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLndlZWtkYXlzTWluICAgICAgICAgICA9IGxpc3RzX19saXN0V2Vla2RheXNNaW47XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLmRlZmluZUxvY2FsZSAgICAgICAgICA9IGRlZmluZUxvY2FsZTtcbiAgICB1dGlsc19ob29rc19faG9va3MudXBkYXRlTG9jYWxlICAgICAgICAgID0gdXBkYXRlTG9jYWxlO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5sb2NhbGVzICAgICAgICAgICAgICAgPSBsb2NhbGVfbG9jYWxlc19fbGlzdExvY2FsZXM7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLndlZWtkYXlzU2hvcnQgICAgICAgICA9IGxpc3RzX19saXN0V2Vla2RheXNTaG9ydDtcbiAgICB1dGlsc19ob29rc19faG9va3Mubm9ybWFsaXplVW5pdHMgICAgICAgID0gbm9ybWFsaXplVW5pdHM7XG4gICAgdXRpbHNfaG9va3NfX2hvb2tzLnJlbGF0aXZlVGltZVJvdW5kaW5nID0gZHVyYXRpb25faHVtYW5pemVfX2dldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5yZWxhdGl2ZVRpbWVUaHJlc2hvbGQgPSBkdXJhdGlvbl9odW1hbml6ZV9fZ2V0U2V0UmVsYXRpdmVUaW1lVGhyZXNob2xkO1xuICAgIHV0aWxzX2hvb2tzX19ob29rcy5jYWxlbmRhckZvcm1hdCAgICAgICAgPSBnZXRDYWxlbmRhckZvcm1hdDtcbiAgICB1dGlsc19ob29rc19faG9va3MucHJvdG90eXBlICAgICAgICAgICAgID0gbW9tZW50UHJvdG90eXBlO1xuXG4gICAgdmFyIF9tb21lbnQgPSB1dGlsc19ob29rc19faG9va3M7XG5cbiAgICByZXR1cm4gX21vbWVudDtcblxufSkpOyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxuICogU2l6emxlIENTUyBTZWxlY3RvciBFbmdpbmUgdjIuMy4zXG4gKiBodHRwczovL3NpenpsZWpzLmNvbS9cbiAqXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBodHRwOi8vanF1ZXJ5Lm9yZy9saWNlbnNlXG4gKlxuICogRGF0ZTogMjAxNi0wOC0wOFxuICovXG4oZnVuY3Rpb24oIHdpbmRvdyApIHtcblxudmFyIGksXG5cdHN1cHBvcnQsXG5cdEV4cHIsXG5cdGdldFRleHQsXG5cdGlzWE1MLFxuXHR0b2tlbml6ZSxcblx0Y29tcGlsZSxcblx0c2VsZWN0LFxuXHRvdXRlcm1vc3RDb250ZXh0LFxuXHRzb3J0SW5wdXQsXG5cdGhhc0R1cGxpY2F0ZSxcblxuXHQvLyBMb2NhbCBkb2N1bWVudCB2YXJzXG5cdHNldERvY3VtZW50LFxuXHRkb2N1bWVudCxcblx0ZG9jRWxlbSxcblx0ZG9jdW1lbnRJc0hUTUwsXG5cdHJidWdneVFTQSxcblx0cmJ1Z2d5TWF0Y2hlcyxcblx0bWF0Y2hlcyxcblx0Y29udGFpbnMsXG5cblx0Ly8gSW5zdGFuY2Utc3BlY2lmaWMgZGF0YVxuXHRleHBhbmRvID0gXCJzaXp6bGVcIiArIDEgKiBuZXcgRGF0ZSgpLFxuXHRwcmVmZXJyZWREb2MgPSB3aW5kb3cuZG9jdW1lbnQsXG5cdGRpcnJ1bnMgPSAwLFxuXHRkb25lID0gMCxcblx0Y2xhc3NDYWNoZSA9IGNyZWF0ZUNhY2hlKCksXG5cdHRva2VuQ2FjaGUgPSBjcmVhdGVDYWNoZSgpLFxuXHRjb21waWxlckNhY2hlID0gY3JlYXRlQ2FjaGUoKSxcblx0c29ydE9yZGVyID0gZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0aWYgKCBhID09PSBiICkge1xuXHRcdFx0aGFzRHVwbGljYXRlID0gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIDA7XG5cdH0sXG5cblx0Ly8gSW5zdGFuY2UgbWV0aG9kc1xuXHRoYXNPd24gPSAoe30pLmhhc093blByb3BlcnR5LFxuXHRhcnIgPSBbXSxcblx0cG9wID0gYXJyLnBvcCxcblx0cHVzaF9uYXRpdmUgPSBhcnIucHVzaCxcblx0cHVzaCA9IGFyci5wdXNoLFxuXHRzbGljZSA9IGFyci5zbGljZSxcblx0Ly8gVXNlIGEgc3RyaXBwZWQtZG93biBpbmRleE9mIGFzIGl0J3MgZmFzdGVyIHRoYW4gbmF0aXZlXG5cdC8vIGh0dHBzOi8vanNwZXJmLmNvbS90aG9yLWluZGV4b2YtdnMtZm9yLzVcblx0aW5kZXhPZiA9IGZ1bmN0aW9uKCBsaXN0LCBlbGVtICkge1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGxlbiA9IGxpc3QubGVuZ3RoO1xuXHRcdGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0aWYgKCBsaXN0W2ldID09PSBlbGVtICkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXG5cdGJvb2xlYW5zID0gXCJjaGVja2VkfHNlbGVjdGVkfGFzeW5jfGF1dG9mb2N1c3xhdXRvcGxheXxjb250cm9sc3xkZWZlcnxkaXNhYmxlZHxoaWRkZW58aXNtYXB8bG9vcHxtdWx0aXBsZXxvcGVufHJlYWRvbmx5fHJlcXVpcmVkfHNjb3BlZFwiLFxuXG5cdC8vIFJlZ3VsYXIgZXhwcmVzc2lvbnNcblxuXHQvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXNlbGVjdG9ycy8jd2hpdGVzcGFjZVxuXHR3aGl0ZXNwYWNlID0gXCJbXFxcXHgyMFxcXFx0XFxcXHJcXFxcblxcXFxmXVwiLFxuXG5cdC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxuXHRpZGVudGlmaWVyID0gXCIoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXDAtXFxcXHhhMF0pK1wiLFxuXG5cdC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xuXHRhdHRyaWJ1dGVzID0gXCJcXFxcW1wiICsgd2hpdGVzcGFjZSArIFwiKihcIiArIGlkZW50aWZpZXIgKyBcIikoPzpcIiArIHdoaXRlc3BhY2UgK1xuXHRcdC8vIE9wZXJhdG9yIChjYXB0dXJlIDIpXG5cdFx0XCIqKFsqXiR8IX5dPz0pXCIgKyB3aGl0ZXNwYWNlICtcblx0XHQvLyBcIkF0dHJpYnV0ZSB2YWx1ZXMgbXVzdCBiZSBDU1MgaWRlbnRpZmllcnMgW2NhcHR1cmUgNV0gb3Igc3RyaW5ncyBbY2FwdHVyZSAzIG9yIGNhcHR1cmUgNF1cIlxuXHRcdFwiKig/OicoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcInwoXCIgKyBpZGVudGlmaWVyICsgXCIpKXwpXCIgKyB3aGl0ZXNwYWNlICtcblx0XHRcIipcXFxcXVwiLFxuXG5cdHBzZXVkb3MgPSBcIjooXCIgKyBpZGVudGlmaWVyICsgXCIpKD86XFxcXCgoXCIgK1xuXHRcdC8vIFRvIHJlZHVjZSB0aGUgbnVtYmVyIG9mIHNlbGVjdG9ycyBuZWVkaW5nIHRva2VuaXplIGluIHRoZSBwcmVGaWx0ZXIsIHByZWZlciBhcmd1bWVudHM6XG5cdFx0Ly8gMS4gcXVvdGVkIChjYXB0dXJlIDM7IGNhcHR1cmUgNCBvciBjYXB0dXJlIDUpXG5cdFx0XCIoJygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwiKXxcIiArXG5cdFx0Ly8gMi4gc2ltcGxlIChjYXB0dXJlIDYpXG5cdFx0XCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKVtcXFxcXV18XCIgKyBhdHRyaWJ1dGVzICsgXCIpKil8XCIgK1xuXHRcdC8vIDMuIGFueXRoaW5nIGVsc2UgKGNhcHR1cmUgMilcblx0XHRcIi4qXCIgK1xuXHRcdFwiKVxcXFwpfClcIixcblxuXHQvLyBMZWFkaW5nIGFuZCBub24tZXNjYXBlZCB0cmFpbGluZyB3aGl0ZXNwYWNlLCBjYXB0dXJpbmcgc29tZSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIHByZWNlZGluZyB0aGUgbGF0dGVyXG5cdHJ3aGl0ZXNwYWNlID0gbmV3IFJlZ0V4cCggd2hpdGVzcGFjZSArIFwiK1wiLCBcImdcIiApLFxuXHRydHJpbSA9IG5ldyBSZWdFeHAoIFwiXlwiICsgd2hpdGVzcGFjZSArIFwiK3woKD86XnxbXlxcXFxcXFxcXSkoPzpcXFxcXFxcXC4pKilcIiArIHdoaXRlc3BhY2UgKyBcIiskXCIsIFwiZ1wiICksXG5cblx0cmNvbW1hID0gbmV3IFJlZ0V4cCggXCJeXCIgKyB3aGl0ZXNwYWNlICsgXCIqLFwiICsgd2hpdGVzcGFjZSArIFwiKlwiICksXG5cdHJjb21iaW5hdG9ycyA9IG5ldyBSZWdFeHAoIFwiXlwiICsgd2hpdGVzcGFjZSArIFwiKihbPit+XXxcIiArIHdoaXRlc3BhY2UgKyBcIilcIiArIHdoaXRlc3BhY2UgKyBcIipcIiApLFxuXG5cdHJhdHRyaWJ1dGVRdW90ZXMgPSBuZXcgUmVnRXhwKCBcIj1cIiArIHdoaXRlc3BhY2UgKyBcIiooW15cXFxcXSdcXFwiXSo/KVwiICsgd2hpdGVzcGFjZSArIFwiKlxcXFxdXCIsIFwiZ1wiICksXG5cblx0cnBzZXVkbyA9IG5ldyBSZWdFeHAoIHBzZXVkb3MgKSxcblx0cmlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKCBcIl5cIiArIGlkZW50aWZpZXIgKyBcIiRcIiApLFxuXG5cdG1hdGNoRXhwciA9IHtcblx0XHRcIklEXCI6IG5ldyBSZWdFeHAoIFwiXiMoXCIgKyBpZGVudGlmaWVyICsgXCIpXCIgKSxcblx0XHRcIkNMQVNTXCI6IG5ldyBSZWdFeHAoIFwiXlxcXFwuKFwiICsgaWRlbnRpZmllciArIFwiKVwiICksXG5cdFx0XCJUQUdcIjogbmV3IFJlZ0V4cCggXCJeKFwiICsgaWRlbnRpZmllciArIFwifFsqXSlcIiApLFxuXHRcdFwiQVRUUlwiOiBuZXcgUmVnRXhwKCBcIl5cIiArIGF0dHJpYnV0ZXMgKSxcblx0XHRcIlBTRVVET1wiOiBuZXcgUmVnRXhwKCBcIl5cIiArIHBzZXVkb3MgKSxcblx0XHRcIkNISUxEXCI6IG5ldyBSZWdFeHAoIFwiXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXChcIiArIHdoaXRlc3BhY2UgK1xuXHRcdFx0XCIqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufClcIiArIHdoaXRlc3BhY2UgKyBcIiooPzooWystXXwpXCIgKyB3aGl0ZXNwYWNlICtcblx0XHRcdFwiKihcXFxcZCspfCkpXCIgKyB3aGl0ZXNwYWNlICsgXCIqXFxcXCl8KVwiLCBcImlcIiApLFxuXHRcdFwiYm9vbFwiOiBuZXcgUmVnRXhwKCBcIl4oPzpcIiArIGJvb2xlYW5zICsgXCIpJFwiLCBcImlcIiApLFxuXHRcdC8vIEZvciB1c2UgaW4gbGlicmFyaWVzIGltcGxlbWVudGluZyAuaXMoKVxuXHRcdC8vIFdlIHVzZSB0aGlzIGZvciBQT1MgbWF0Y2hpbmcgaW4gYHNlbGVjdGBcblx0XHRcIm5lZWRzQ29udGV4dFwiOiBuZXcgUmVnRXhwKCBcIl5cIiArIHdoaXRlc3BhY2UgKyBcIipbPit+XXw6KGV2ZW58b2RkfGVxfGd0fGx0fG50aHxmaXJzdHxsYXN0KSg/OlxcXFwoXCIgK1xuXHRcdFx0d2hpdGVzcGFjZSArIFwiKigoPzotXFxcXGQpP1xcXFxkKilcIiArIHdoaXRlc3BhY2UgKyBcIipcXFxcKXwpKD89W14tXXwkKVwiLCBcImlcIiApXG5cdH0sXG5cblx0cmlucHV0cyA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbikkL2ksXG5cdHJoZWFkZXIgPSAvXmhcXGQkL2ksXG5cblx0cm5hdGl2ZSA9IC9eW157XStcXHtcXHMqXFxbbmF0aXZlIFxcdy8sXG5cblx0Ly8gRWFzaWx5LXBhcnNlYWJsZS9yZXRyaWV2YWJsZSBJRCBvciBUQUcgb3IgQ0xBU1Mgc2VsZWN0b3JzXG5cdHJxdWlja0V4cHIgPSAvXig/OiMoW1xcdy1dKyl8KFxcdyspfFxcLihbXFx3LV0rKSkkLyxcblxuXHRyc2libGluZyA9IC9bK35dLyxcblxuXHQvLyBDU1MgZXNjYXBlc1xuXHQvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjZXNjYXBlZC1jaGFyYWN0ZXJzXG5cdHJ1bmVzY2FwZSA9IG5ldyBSZWdFeHAoIFwiXFxcXFxcXFwoW1xcXFxkYS1mXXsxLDZ9XCIgKyB3aGl0ZXNwYWNlICsgXCI/fChcIiArIHdoaXRlc3BhY2UgKyBcIil8LilcIiwgXCJpZ1wiICksXG5cdGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKCBfLCBlc2NhcGVkLCBlc2NhcGVkV2hpdGVzcGFjZSApIHtcblx0XHR2YXIgaGlnaCA9IFwiMHhcIiArIGVzY2FwZWQgLSAweDEwMDAwO1xuXHRcdC8vIE5hTiBtZWFucyBub24tY29kZXBvaW50XG5cdFx0Ly8gU3VwcG9ydDogRmlyZWZveDwyNFxuXHRcdC8vIFdvcmthcm91bmQgZXJyb25lb3VzIG51bWVyaWMgaW50ZXJwcmV0YXRpb24gb2YgK1wiMHhcIlxuXHRcdHJldHVybiBoaWdoICE9PSBoaWdoIHx8IGVzY2FwZWRXaGl0ZXNwYWNlID9cblx0XHRcdGVzY2FwZWQgOlxuXHRcdFx0aGlnaCA8IDAgP1xuXHRcdFx0XHQvLyBCTVAgY29kZXBvaW50XG5cdFx0XHRcdFN0cmluZy5mcm9tQ2hhckNvZGUoIGhpZ2ggKyAweDEwMDAwICkgOlxuXHRcdFx0XHQvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcblx0XHRcdFx0U3RyaW5nLmZyb21DaGFyQ29kZSggaGlnaCA+PiAxMCB8IDB4RDgwMCwgaGlnaCAmIDB4M0ZGIHwgMHhEQzAwICk7XG5cdH0sXG5cblx0Ly8gQ1NTIHN0cmluZy9pZGVudGlmaWVyIHNlcmlhbGl6YXRpb25cblx0Ly8gaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzc29tLyNjb21tb24tc2VyaWFsaXppbmctaWRpb21zXG5cdHJjc3Nlc2NhcGUgPSAvKFtcXDAtXFx4MWZcXHg3Zl18Xi0/XFxkKXxeLSR8W15cXDAtXFx4MWZcXHg3Zi1cXHVGRkZGXFx3LV0vZyxcblx0ZmNzc2VzY2FwZSA9IGZ1bmN0aW9uKCBjaCwgYXNDb2RlUG9pbnQgKSB7XG5cdFx0aWYgKCBhc0NvZGVQb2ludCApIHtcblxuXHRcdFx0Ly8gVSswMDAwIE5VTEwgYmVjb21lcyBVK0ZGRkQgUkVQTEFDRU1FTlQgQ0hBUkFDVEVSXG5cdFx0XHRpZiAoIGNoID09PSBcIlxcMFwiICkge1xuXHRcdFx0XHRyZXR1cm4gXCJcXHVGRkZEXCI7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbnRyb2wgY2hhcmFjdGVycyBhbmQgKGRlcGVuZGVudCB1cG9uIHBvc2l0aW9uKSBudW1iZXJzIGdldCBlc2NhcGVkIGFzIGNvZGUgcG9pbnRzXG5cdFx0XHRyZXR1cm4gY2guc2xpY2UoIDAsIC0xICkgKyBcIlxcXFxcIiArIGNoLmNoYXJDb2RlQXQoIGNoLmxlbmd0aCAtIDEgKS50b1N0cmluZyggMTYgKSArIFwiIFwiO1xuXHRcdH1cblxuXHRcdC8vIE90aGVyIHBvdGVudGlhbGx5LXNwZWNpYWwgQVNDSUkgY2hhcmFjdGVycyBnZXQgYmFja3NsYXNoLWVzY2FwZWRcblx0XHRyZXR1cm4gXCJcXFxcXCIgKyBjaDtcblx0fSxcblxuXHQvLyBVc2VkIGZvciBpZnJhbWVzXG5cdC8vIFNlZSBzZXREb2N1bWVudCgpXG5cdC8vIFJlbW92aW5nIHRoZSBmdW5jdGlvbiB3cmFwcGVyIGNhdXNlcyBhIFwiUGVybWlzc2lvbiBEZW5pZWRcIlxuXHQvLyBlcnJvciBpbiBJRVxuXHR1bmxvYWRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0c2V0RG9jdW1lbnQoKTtcblx0fSxcblxuXHRkaXNhYmxlZEFuY2VzdG9yID0gYWRkQ29tYmluYXRvcihcblx0XHRmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSB0cnVlICYmIChcImZvcm1cIiBpbiBlbGVtIHx8IFwibGFiZWxcIiBpbiBlbGVtKTtcblx0XHR9LFxuXHRcdHsgZGlyOiBcInBhcmVudE5vZGVcIiwgbmV4dDogXCJsZWdlbmRcIiB9XG5cdCk7XG5cbi8vIE9wdGltaXplIGZvciBwdXNoLmFwcGx5KCBfLCBOb2RlTGlzdCApXG50cnkge1xuXHRwdXNoLmFwcGx5KFxuXHRcdChhcnIgPSBzbGljZS5jYWxsKCBwcmVmZXJyZWREb2MuY2hpbGROb2RlcyApKSxcblx0XHRwcmVmZXJyZWREb2MuY2hpbGROb2Rlc1xuXHQpO1xuXHQvLyBTdXBwb3J0OiBBbmRyb2lkPDQuMFxuXHQvLyBEZXRlY3Qgc2lsZW50bHkgZmFpbGluZyBwdXNoLmFwcGx5XG5cdGFyclsgcHJlZmVycmVkRG9jLmNoaWxkTm9kZXMubGVuZ3RoIF0ubm9kZVR5cGU7XG59IGNhdGNoICggZSApIHtcblx0cHVzaCA9IHsgYXBwbHk6IGFyci5sZW5ndGggP1xuXG5cdFx0Ly8gTGV2ZXJhZ2Ugc2xpY2UgaWYgcG9zc2libGVcblx0XHRmdW5jdGlvbiggdGFyZ2V0LCBlbHMgKSB7XG5cdFx0XHRwdXNoX25hdGl2ZS5hcHBseSggdGFyZ2V0LCBzbGljZS5jYWxsKGVscykgKTtcblx0XHR9IDpcblxuXHRcdC8vIFN1cHBvcnQ6IElFPDlcblx0XHQvLyBPdGhlcndpc2UgYXBwZW5kIGRpcmVjdGx5XG5cdFx0ZnVuY3Rpb24oIHRhcmdldCwgZWxzICkge1xuXHRcdFx0dmFyIGogPSB0YXJnZXQubGVuZ3RoLFxuXHRcdFx0XHRpID0gMDtcblx0XHRcdC8vIENhbid0IHRydXN0IE5vZGVMaXN0Lmxlbmd0aFxuXHRcdFx0d2hpbGUgKCAodGFyZ2V0W2orK10gPSBlbHNbaSsrXSkgKSB7fVxuXHRcdFx0dGFyZ2V0Lmxlbmd0aCA9IGogLSAxO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gU2l6emxlKCBzZWxlY3RvciwgY29udGV4dCwgcmVzdWx0cywgc2VlZCApIHtcblx0dmFyIG0sIGksIGVsZW0sIG5pZCwgbWF0Y2gsIGdyb3VwcywgbmV3U2VsZWN0b3IsXG5cdFx0bmV3Q29udGV4dCA9IGNvbnRleHQgJiYgY29udGV4dC5vd25lckRvY3VtZW50LFxuXG5cdFx0Ly8gbm9kZVR5cGUgZGVmYXVsdHMgdG8gOSwgc2luY2UgY29udGV4dCBkZWZhdWx0cyB0byBkb2N1bWVudFxuXHRcdG5vZGVUeXBlID0gY29udGV4dCA/IGNvbnRleHQubm9kZVR5cGUgOiA5O1xuXG5cdHJlc3VsdHMgPSByZXN1bHRzIHx8IFtdO1xuXG5cdC8vIFJldHVybiBlYXJseSBmcm9tIGNhbGxzIHdpdGggaW52YWxpZCBzZWxlY3RvciBvciBjb250ZXh0XG5cdGlmICggdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiIHx8ICFzZWxlY3RvciB8fFxuXHRcdG5vZGVUeXBlICE9PSAxICYmIG5vZGVUeXBlICE9PSA5ICYmIG5vZGVUeXBlICE9PSAxMSApIHtcblxuXHRcdHJldHVybiByZXN1bHRzO1xuXHR9XG5cblx0Ly8gVHJ5IHRvIHNob3J0Y3V0IGZpbmQgb3BlcmF0aW9ucyAoYXMgb3Bwb3NlZCB0byBmaWx0ZXJzKSBpbiBIVE1MIGRvY3VtZW50c1xuXHRpZiAoICFzZWVkICkge1xuXG5cdFx0aWYgKCAoIGNvbnRleHQgPyBjb250ZXh0Lm93bmVyRG9jdW1lbnQgfHwgY29udGV4dCA6IHByZWZlcnJlZERvYyApICE9PSBkb2N1bWVudCApIHtcblx0XHRcdHNldERvY3VtZW50KCBjb250ZXh0ICk7XG5cdFx0fVxuXHRcdGNvbnRleHQgPSBjb250ZXh0IHx8IGRvY3VtZW50O1xuXG5cdFx0aWYgKCBkb2N1bWVudElzSFRNTCApIHtcblxuXHRcdFx0Ly8gSWYgdGhlIHNlbGVjdG9yIGlzIHN1ZmZpY2llbnRseSBzaW1wbGUsIHRyeSB1c2luZyBhIFwiZ2V0KkJ5KlwiIERPTSBtZXRob2Rcblx0XHRcdC8vIChleGNlcHRpbmcgRG9jdW1lbnRGcmFnbWVudCBjb250ZXh0LCB3aGVyZSB0aGUgbWV0aG9kcyBkb24ndCBleGlzdClcblx0XHRcdGlmICggbm9kZVR5cGUgIT09IDExICYmIChtYXRjaCA9IHJxdWlja0V4cHIuZXhlYyggc2VsZWN0b3IgKSkgKSB7XG5cblx0XHRcdFx0Ly8gSUQgc2VsZWN0b3Jcblx0XHRcdFx0aWYgKCAobSA9IG1hdGNoWzFdKSApIHtcblxuXHRcdFx0XHRcdC8vIERvY3VtZW50IGNvbnRleHRcblx0XHRcdFx0XHRpZiAoIG5vZGVUeXBlID09PSA5ICkge1xuXHRcdFx0XHRcdFx0aWYgKCAoZWxlbSA9IGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQoIG0gKSkgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUsIE9wZXJhLCBXZWJraXRcblx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogaWRlbnRpZnkgdmVyc2lvbnNcblx0XHRcdFx0XHRcdFx0Ly8gZ2V0RWxlbWVudEJ5SWQgY2FuIG1hdGNoIGVsZW1lbnRzIGJ5IG5hbWUgaW5zdGVhZCBvZiBJRFxuXHRcdFx0XHRcdFx0XHRpZiAoIGVsZW0uaWQgPT09IG0gKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0cy5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gRWxlbWVudCBjb250ZXh0XG5cdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUsIE9wZXJhLCBXZWJraXRcblx0XHRcdFx0XHRcdC8vIFRPRE86IGlkZW50aWZ5IHZlcnNpb25zXG5cdFx0XHRcdFx0XHQvLyBnZXRFbGVtZW50QnlJZCBjYW4gbWF0Y2ggZWxlbWVudHMgYnkgbmFtZSBpbnN0ZWFkIG9mIElEXG5cdFx0XHRcdFx0XHRpZiAoIG5ld0NvbnRleHQgJiYgKGVsZW0gPSBuZXdDb250ZXh0LmdldEVsZW1lbnRCeUlkKCBtICkpICYmXG5cdFx0XHRcdFx0XHRcdGNvbnRhaW5zKCBjb250ZXh0LCBlbGVtICkgJiZcblx0XHRcdFx0XHRcdFx0ZWxlbS5pZCA9PT0gbSApIHtcblxuXHRcdFx0XHRcdFx0XHRyZXN1bHRzLnB1c2goIGVsZW0gKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFR5cGUgc2VsZWN0b3Jcblx0XHRcdFx0fSBlbHNlIGlmICggbWF0Y2hbMl0gKSB7XG5cdFx0XHRcdFx0cHVzaC5hcHBseSggcmVzdWx0cywgY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggc2VsZWN0b3IgKSApO1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHRzO1xuXG5cdFx0XHRcdC8vIENsYXNzIHNlbGVjdG9yXG5cdFx0XHRcdH0gZWxzZSBpZiAoIChtID0gbWF0Y2hbM10pICYmIHN1cHBvcnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSAmJlxuXHRcdFx0XHRcdGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSApIHtcblxuXHRcdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSggbSApICk7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gVGFrZSBhZHZhbnRhZ2Ugb2YgcXVlcnlTZWxlY3RvckFsbFxuXHRcdFx0aWYgKCBzdXBwb3J0LnFzYSAmJlxuXHRcdFx0XHQhY29tcGlsZXJDYWNoZVsgc2VsZWN0b3IgKyBcIiBcIiBdICYmXG5cdFx0XHRcdCghcmJ1Z2d5UVNBIHx8ICFyYnVnZ3lRU0EudGVzdCggc2VsZWN0b3IgKSkgKSB7XG5cblx0XHRcdFx0aWYgKCBub2RlVHlwZSAhPT0gMSApIHtcblx0XHRcdFx0XHRuZXdDb250ZXh0ID0gY29udGV4dDtcblx0XHRcdFx0XHRuZXdTZWxlY3RvciA9IHNlbGVjdG9yO1xuXG5cdFx0XHRcdC8vIHFTQSBsb29rcyBvdXRzaWRlIEVsZW1lbnQgY29udGV4dCwgd2hpY2ggaXMgbm90IHdoYXQgd2Ugd2FudFxuXHRcdFx0XHQvLyBUaGFua3MgdG8gQW5kcmV3IER1cG9udCBmb3IgdGhpcyB3b3JrYXJvdW5kIHRlY2huaXF1ZVxuXHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8PThcblx0XHRcdFx0Ly8gRXhjbHVkZSBvYmplY3QgZWxlbWVudHNcblx0XHRcdFx0fSBlbHNlIGlmICggY29udGV4dC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9PSBcIm9iamVjdFwiICkge1xuXG5cdFx0XHRcdFx0Ly8gQ2FwdHVyZSB0aGUgY29udGV4dCBJRCwgc2V0dGluZyBpdCBmaXJzdCBpZiBuZWNlc3Nhcnlcblx0XHRcdFx0XHRpZiAoIChuaWQgPSBjb250ZXh0LmdldEF0dHJpYnV0ZSggXCJpZFwiICkpICkge1xuXHRcdFx0XHRcdFx0bmlkID0gbmlkLnJlcGxhY2UoIHJjc3Nlc2NhcGUsIGZjc3Nlc2NhcGUgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29udGV4dC5zZXRBdHRyaWJ1dGUoIFwiaWRcIiwgKG5pZCA9IGV4cGFuZG8pICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gUHJlZml4IGV2ZXJ5IHNlbGVjdG9yIGluIHRoZSBsaXN0XG5cdFx0XHRcdFx0Z3JvdXBzID0gdG9rZW5pemUoIHNlbGVjdG9yICk7XG5cdFx0XHRcdFx0aSA9IGdyb3Vwcy5sZW5ndGg7XG5cdFx0XHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRcdFx0XHRncm91cHNbaV0gPSBcIiNcIiArIG5pZCArIFwiIFwiICsgdG9TZWxlY3RvciggZ3JvdXBzW2ldICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG5ld1NlbGVjdG9yID0gZ3JvdXBzLmpvaW4oIFwiLFwiICk7XG5cblx0XHRcdFx0XHQvLyBFeHBhbmQgY29udGV4dCBmb3Igc2libGluZyBzZWxlY3RvcnNcblx0XHRcdFx0XHRuZXdDb250ZXh0ID0gcnNpYmxpbmcudGVzdCggc2VsZWN0b3IgKSAmJiB0ZXN0Q29udGV4dCggY29udGV4dC5wYXJlbnROb2RlICkgfHxcblx0XHRcdFx0XHRcdGNvbnRleHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIG5ld1NlbGVjdG9yICkge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRwdXNoLmFwcGx5KCByZXN1bHRzLFxuXHRcdFx0XHRcdFx0XHRuZXdDb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoIG5ld1NlbGVjdG9yIClcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHRcdFx0XHR9IGNhdGNoICggcXNhRXJyb3IgKSB7XG5cdFx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHRcdGlmICggbmlkID09PSBleHBhbmRvICkge1xuXHRcdFx0XHRcdFx0XHRjb250ZXh0LnJlbW92ZUF0dHJpYnV0ZSggXCJpZFwiICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gQWxsIG90aGVyc1xuXHRyZXR1cm4gc2VsZWN0KCBzZWxlY3Rvci5yZXBsYWNlKCBydHJpbSwgXCIkMVwiICksIGNvbnRleHQsIHJlc3VsdHMsIHNlZWQgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUga2V5LXZhbHVlIGNhY2hlcyBvZiBsaW1pdGVkIHNpemVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbihzdHJpbmcsIG9iamVjdCl9IFJldHVybnMgdGhlIE9iamVjdCBkYXRhIGFmdGVyIHN0b3JpbmcgaXQgb24gaXRzZWxmIHdpdGhcbiAqXHRwcm9wZXJ0eSBuYW1lIHRoZSAoc3BhY2Utc3VmZml4ZWQpIHN0cmluZyBhbmQgKGlmIHRoZSBjYWNoZSBpcyBsYXJnZXIgdGhhbiBFeHByLmNhY2hlTGVuZ3RoKVxuICpcdGRlbGV0aW5nIHRoZSBvbGRlc3QgZW50cnlcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ2FjaGUoKSB7XG5cdHZhciBrZXlzID0gW107XG5cblx0ZnVuY3Rpb24gY2FjaGUoIGtleSwgdmFsdWUgKSB7XG5cdFx0Ly8gVXNlIChrZXkgKyBcIiBcIikgdG8gYXZvaWQgY29sbGlzaW9uIHdpdGggbmF0aXZlIHByb3RvdHlwZSBwcm9wZXJ0aWVzIChzZWUgSXNzdWUgIzE1Nylcblx0XHRpZiAoIGtleXMucHVzaCgga2V5ICsgXCIgXCIgKSA+IEV4cHIuY2FjaGVMZW5ndGggKSB7XG5cdFx0XHQvLyBPbmx5IGtlZXAgdGhlIG1vc3QgcmVjZW50IGVudHJpZXNcblx0XHRcdGRlbGV0ZSBjYWNoZVsga2V5cy5zaGlmdCgpIF07XG5cdFx0fVxuXHRcdHJldHVybiAoY2FjaGVbIGtleSArIFwiIFwiIF0gPSB2YWx1ZSk7XG5cdH1cblx0cmV0dXJuIGNhY2hlO1xufVxuXG4vKipcbiAqIE1hcmsgYSBmdW5jdGlvbiBmb3Igc3BlY2lhbCB1c2UgYnkgU2l6emxlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gbWFya1xuICovXG5mdW5jdGlvbiBtYXJrRnVuY3Rpb24oIGZuICkge1xuXHRmblsgZXhwYW5kbyBdID0gdHJ1ZTtcblx0cmV0dXJuIGZuO1xufVxuXG4vKipcbiAqIFN1cHBvcnQgdGVzdGluZyB1c2luZyBhbiBlbGVtZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBQYXNzZWQgdGhlIGNyZWF0ZWQgZWxlbWVudCBhbmQgcmV0dXJucyBhIGJvb2xlYW4gcmVzdWx0XG4gKi9cbmZ1bmN0aW9uIGFzc2VydCggZm4gKSB7XG5cdHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmaWVsZHNldFwiKTtcblxuXHR0cnkge1xuXHRcdHJldHVybiAhIWZuKCBlbCApO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9IGZpbmFsbHkge1xuXHRcdC8vIFJlbW92ZSBmcm9tIGl0cyBwYXJlbnQgYnkgZGVmYXVsdFxuXHRcdGlmICggZWwucGFyZW50Tm9kZSApIHtcblx0XHRcdGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIGVsICk7XG5cdFx0fVxuXHRcdC8vIHJlbGVhc2UgbWVtb3J5IGluIElFXG5cdFx0ZWwgPSBudWxsO1xuXHR9XG59XG5cbi8qKlxuICogQWRkcyB0aGUgc2FtZSBoYW5kbGVyIGZvciBhbGwgb2YgdGhlIHNwZWNpZmllZCBhdHRyc1xuICogQHBhcmFtIHtTdHJpbmd9IGF0dHJzIFBpcGUtc2VwYXJhdGVkIGxpc3Qgb2YgYXR0cmlidXRlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBUaGUgbWV0aG9kIHRoYXQgd2lsbCBiZSBhcHBsaWVkXG4gKi9cbmZ1bmN0aW9uIGFkZEhhbmRsZSggYXR0cnMsIGhhbmRsZXIgKSB7XG5cdHZhciBhcnIgPSBhdHRycy5zcGxpdChcInxcIiksXG5cdFx0aSA9IGFyci5sZW5ndGg7XG5cblx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0RXhwci5hdHRySGFuZGxlWyBhcnJbaV0gXSA9IGhhbmRsZXI7XG5cdH1cbn1cblxuLyoqXG4gKiBDaGVja3MgZG9jdW1lbnQgb3JkZXIgb2YgdHdvIHNpYmxpbmdzXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGFcbiAqIEBwYXJhbSB7RWxlbWVudH0gYlxuICogQHJldHVybnMge051bWJlcn0gUmV0dXJucyBsZXNzIHRoYW4gMCBpZiBhIHByZWNlZGVzIGIsIGdyZWF0ZXIgdGhhbiAwIGlmIGEgZm9sbG93cyBiXG4gKi9cbmZ1bmN0aW9uIHNpYmxpbmdDaGVjayggYSwgYiApIHtcblx0dmFyIGN1ciA9IGIgJiYgYSxcblx0XHRkaWZmID0gY3VyICYmIGEubm9kZVR5cGUgPT09IDEgJiYgYi5ub2RlVHlwZSA9PT0gMSAmJlxuXHRcdFx0YS5zb3VyY2VJbmRleCAtIGIuc291cmNlSW5kZXg7XG5cblx0Ly8gVXNlIElFIHNvdXJjZUluZGV4IGlmIGF2YWlsYWJsZSBvbiBib3RoIG5vZGVzXG5cdGlmICggZGlmZiApIHtcblx0XHRyZXR1cm4gZGlmZjtcblx0fVxuXG5cdC8vIENoZWNrIGlmIGIgZm9sbG93cyBhXG5cdGlmICggY3VyICkge1xuXHRcdHdoaWxlICggKGN1ciA9IGN1ci5uZXh0U2libGluZykgKSB7XG5cdFx0XHRpZiAoIGN1ciA9PT0gYiApIHtcblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBhID8gMSA6IC0xO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0byB1c2UgaW4gcHNldWRvcyBmb3IgaW5wdXQgdHlwZXNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUlucHV0UHNldWRvKCB0eXBlICkge1xuXHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0dmFyIG5hbWUgPSBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0cmV0dXJuIG5hbWUgPT09IFwiaW5wdXRcIiAmJiBlbGVtLnR5cGUgPT09IHR5cGU7XG5cdH07XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIHVzZSBpbiBwc2V1ZG9zIGZvciBidXR0b25zXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICovXG5mdW5jdGlvbiBjcmVhdGVCdXR0b25Qc2V1ZG8oIHR5cGUgKSB7XG5cdHJldHVybiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHR2YXIgbmFtZSA9IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRyZXR1cm4gKG5hbWUgPT09IFwiaW5wdXRcIiB8fCBuYW1lID09PSBcImJ1dHRvblwiKSAmJiBlbGVtLnR5cGUgPT09IHR5cGU7XG5cdH07XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIHVzZSBpbiBwc2V1ZG9zIGZvciA6ZW5hYmxlZC86ZGlzYWJsZWRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzYWJsZWQgdHJ1ZSBmb3IgOmRpc2FibGVkOyBmYWxzZSBmb3IgOmVuYWJsZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlzYWJsZWRQc2V1ZG8oIGRpc2FibGVkICkge1xuXG5cdC8vIEtub3duIDpkaXNhYmxlZCBmYWxzZSBwb3NpdGl2ZXM6IGZpZWxkc2V0W2Rpc2FibGVkXSA+IGxlZ2VuZDpudGgtb2YtdHlwZShuKzIpIDpjYW4tZGlzYWJsZVxuXHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cblx0XHQvLyBPbmx5IGNlcnRhaW4gZWxlbWVudHMgY2FuIG1hdGNoIDplbmFibGVkIG9yIDpkaXNhYmxlZFxuXHRcdC8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3NjcmlwdGluZy5odG1sI3NlbGVjdG9yLWVuYWJsZWRcblx0XHQvLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zY3JpcHRpbmcuaHRtbCNzZWxlY3Rvci1kaXNhYmxlZFxuXHRcdGlmICggXCJmb3JtXCIgaW4gZWxlbSApIHtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGluaGVyaXRlZCBkaXNhYmxlZG5lc3Mgb24gcmVsZXZhbnQgbm9uLWRpc2FibGVkIGVsZW1lbnRzOlxuXHRcdFx0Ly8gKiBsaXN0ZWQgZm9ybS1hc3NvY2lhdGVkIGVsZW1lbnRzIGluIGEgZGlzYWJsZWQgZmllbGRzZXRcblx0XHRcdC8vICAgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCNjYXRlZ29yeS1saXN0ZWRcblx0XHRcdC8vICAgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCNjb25jZXB0LWZlLWRpc2FibGVkXG5cdFx0XHQvLyAqIG9wdGlvbiBlbGVtZW50cyBpbiBhIGRpc2FibGVkIG9wdGdyb3VwXG5cdFx0XHQvLyAgIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2Zvcm1zLmh0bWwjY29uY2VwdC1vcHRpb24tZGlzYWJsZWRcblx0XHRcdC8vIEFsbCBzdWNoIGVsZW1lbnRzIGhhdmUgYSBcImZvcm1cIiBwcm9wZXJ0eS5cblx0XHRcdGlmICggZWxlbS5wYXJlbnROb2RlICYmIGVsZW0uZGlzYWJsZWQgPT09IGZhbHNlICkge1xuXG5cdFx0XHRcdC8vIE9wdGlvbiBlbGVtZW50cyBkZWZlciB0byBhIHBhcmVudCBvcHRncm91cCBpZiBwcmVzZW50XG5cdFx0XHRcdGlmICggXCJsYWJlbFwiIGluIGVsZW0gKSB7XG5cdFx0XHRcdFx0aWYgKCBcImxhYmVsXCIgaW4gZWxlbS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVsZW0ucGFyZW50Tm9kZS5kaXNhYmxlZCA9PT0gZGlzYWJsZWQ7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA2IC0gMTFcblx0XHRcdFx0Ly8gVXNlIHRoZSBpc0Rpc2FibGVkIHNob3J0Y3V0IHByb3BlcnR5IHRvIGNoZWNrIGZvciBkaXNhYmxlZCBmaWVsZHNldCBhbmNlc3RvcnNcblx0XHRcdFx0cmV0dXJuIGVsZW0uaXNEaXNhYmxlZCA9PT0gZGlzYWJsZWQgfHxcblxuXHRcdFx0XHRcdC8vIFdoZXJlIHRoZXJlIGlzIG5vIGlzRGlzYWJsZWQsIGNoZWNrIG1hbnVhbGx5XG5cdFx0XHRcdFx0LyoganNoaW50IC1XMDE4ICovXG5cdFx0XHRcdFx0ZWxlbS5pc0Rpc2FibGVkICE9PSAhZGlzYWJsZWQgJiZcblx0XHRcdFx0XHRcdGRpc2FibGVkQW5jZXN0b3IoIGVsZW0gKSA9PT0gZGlzYWJsZWQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblxuXHRcdC8vIFRyeSB0byB3aW5ub3cgb3V0IGVsZW1lbnRzIHRoYXQgY2FuJ3QgYmUgZGlzYWJsZWQgYmVmb3JlIHRydXN0aW5nIHRoZSBkaXNhYmxlZCBwcm9wZXJ0eS5cblx0XHQvLyBTb21lIHZpY3RpbXMgZ2V0IGNhdWdodCBpbiBvdXIgbmV0IChsYWJlbCwgbGVnZW5kLCBtZW51LCB0cmFjayksIGJ1dCBpdCBzaG91bGRuJ3Rcblx0XHQvLyBldmVuIGV4aXN0IG9uIHRoZW0sIGxldCBhbG9uZSBoYXZlIGEgYm9vbGVhbiB2YWx1ZS5cblx0XHR9IGVsc2UgaWYgKCBcImxhYmVsXCIgaW4gZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblx0XHR9XG5cblx0XHQvLyBSZW1haW5pbmcgZWxlbWVudHMgYXJlIG5laXRoZXIgOmVuYWJsZWQgbm9yIDpkaXNhYmxlZFxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gdXNlIGluIHBzZXVkb3MgZm9yIHBvc2l0aW9uYWxzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5mdW5jdGlvbiBjcmVhdGVQb3NpdGlvbmFsUHNldWRvKCBmbiApIHtcblx0cmV0dXJuIG1hcmtGdW5jdGlvbihmdW5jdGlvbiggYXJndW1lbnQgKSB7XG5cdFx0YXJndW1lbnQgPSArYXJndW1lbnQ7XG5cdFx0cmV0dXJuIG1hcmtGdW5jdGlvbihmdW5jdGlvbiggc2VlZCwgbWF0Y2hlcyApIHtcblx0XHRcdHZhciBqLFxuXHRcdFx0XHRtYXRjaEluZGV4ZXMgPSBmbiggW10sIHNlZWQubGVuZ3RoLCBhcmd1bWVudCApLFxuXHRcdFx0XHRpID0gbWF0Y2hJbmRleGVzLmxlbmd0aDtcblxuXHRcdFx0Ly8gTWF0Y2ggZWxlbWVudHMgZm91bmQgYXQgdGhlIHNwZWNpZmllZCBpbmRleGVzXG5cdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0aWYgKCBzZWVkWyAoaiA9IG1hdGNoSW5kZXhlc1tpXSkgXSApIHtcblx0XHRcdFx0XHRzZWVkW2pdID0gIShtYXRjaGVzW2pdID0gc2VlZFtqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGEgbm9kZSBmb3IgdmFsaWRpdHkgYXMgYSBTaXp6bGUgY29udGV4dFxuICogQHBhcmFtIHtFbGVtZW50fE9iamVjdD19IGNvbnRleHRcbiAqIEByZXR1cm5zIHtFbGVtZW50fE9iamVjdHxCb29sZWFufSBUaGUgaW5wdXQgbm9kZSBpZiBhY2NlcHRhYmxlLCBvdGhlcndpc2UgYSBmYWxzeSB2YWx1ZVxuICovXG5mdW5jdGlvbiB0ZXN0Q29udGV4dCggY29udGV4dCApIHtcblx0cmV0dXJuIGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29udGV4dDtcbn1cblxuLy8gRXhwb3NlIHN1cHBvcnQgdmFycyBmb3IgY29udmVuaWVuY2VcbnN1cHBvcnQgPSBTaXp6bGUuc3VwcG9ydCA9IHt9O1xuXG4vKipcbiAqIERldGVjdHMgWE1MIG5vZGVzXG4gKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBlbGVtIEFuIGVsZW1lbnQgb3IgYSBkb2N1bWVudFxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWZmIGVsZW0gaXMgYSBub24tSFRNTCBYTUwgbm9kZVxuICovXG5pc1hNTCA9IFNpenpsZS5pc1hNTCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXHQvLyBkb2N1bWVudEVsZW1lbnQgaXMgdmVyaWZpZWQgZm9yIGNhc2VzIHdoZXJlIGl0IGRvZXNuJ3QgeWV0IGV4aXN0XG5cdC8vIChzdWNoIGFzIGxvYWRpbmcgaWZyYW1lcyBpbiBJRSAtICM0ODMzKVxuXHR2YXIgZG9jdW1lbnRFbGVtZW50ID0gZWxlbSAmJiAoZWxlbS5vd25lckRvY3VtZW50IHx8IGVsZW0pLmRvY3VtZW50RWxlbWVudDtcblx0cmV0dXJuIGRvY3VtZW50RWxlbWVudCA/IGRvY3VtZW50RWxlbWVudC5ub2RlTmFtZSAhPT0gXCJIVE1MXCIgOiBmYWxzZTtcbn07XG5cbi8qKlxuICogU2V0cyBkb2N1bWVudC1yZWxhdGVkIHZhcmlhYmxlcyBvbmNlIGJhc2VkIG9uIHRoZSBjdXJyZW50IGRvY3VtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBbZG9jXSBBbiBlbGVtZW50IG9yIGRvY3VtZW50IG9iamVjdCB0byB1c2UgdG8gc2V0IHRoZSBkb2N1bWVudFxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY3VycmVudCBkb2N1bWVudFxuICovXG5zZXREb2N1bWVudCA9IFNpenpsZS5zZXREb2N1bWVudCA9IGZ1bmN0aW9uKCBub2RlICkge1xuXHR2YXIgaGFzQ29tcGFyZSwgc3ViV2luZG93LFxuXHRcdGRvYyA9IG5vZGUgPyBub2RlLm93bmVyRG9jdW1lbnQgfHwgbm9kZSA6IHByZWZlcnJlZERvYztcblxuXHQvLyBSZXR1cm4gZWFybHkgaWYgZG9jIGlzIGludmFsaWQgb3IgYWxyZWFkeSBzZWxlY3RlZFxuXHRpZiAoIGRvYyA9PT0gZG9jdW1lbnQgfHwgZG9jLm5vZGVUeXBlICE9PSA5IHx8ICFkb2MuZG9jdW1lbnRFbGVtZW50ICkge1xuXHRcdHJldHVybiBkb2N1bWVudDtcblx0fVxuXG5cdC8vIFVwZGF0ZSBnbG9iYWwgdmFyaWFibGVzXG5cdGRvY3VtZW50ID0gZG9jO1xuXHRkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRkb2N1bWVudElzSFRNTCA9ICFpc1hNTCggZG9jdW1lbnQgKTtcblxuXHQvLyBTdXBwb3J0OiBJRSA5LTExLCBFZGdlXG5cdC8vIEFjY2Vzc2luZyBpZnJhbWUgZG9jdW1lbnRzIGFmdGVyIHVubG9hZCB0aHJvd3MgXCJwZXJtaXNzaW9uIGRlbmllZFwiIGVycm9ycyAoalF1ZXJ5ICMxMzkzNilcblx0aWYgKCBwcmVmZXJyZWREb2MgIT09IGRvY3VtZW50ICYmXG5cdFx0KHN1YldpbmRvdyA9IGRvY3VtZW50LmRlZmF1bHRWaWV3KSAmJiBzdWJXaW5kb3cudG9wICE9PSBzdWJXaW5kb3cgKSB7XG5cblx0XHQvLyBTdXBwb3J0OiBJRSAxMSwgRWRnZVxuXHRcdGlmICggc3ViV2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKSB7XG5cdFx0XHRzdWJXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggXCJ1bmxvYWRcIiwgdW5sb2FkSGFuZGxlciwgZmFsc2UgKTtcblxuXHRcdC8vIFN1cHBvcnQ6IElFIDkgLSAxMCBvbmx5XG5cdFx0fSBlbHNlIGlmICggc3ViV2luZG93LmF0dGFjaEV2ZW50ICkge1xuXHRcdFx0c3ViV2luZG93LmF0dGFjaEV2ZW50KCBcIm9udW5sb2FkXCIsIHVubG9hZEhhbmRsZXIgKTtcblx0XHR9XG5cdH1cblxuXHQvKiBBdHRyaWJ1dGVzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuXHQvLyBTdXBwb3J0OiBJRTw4XG5cdC8vIFZlcmlmeSB0aGF0IGdldEF0dHJpYnV0ZSByZWFsbHkgcmV0dXJucyBhdHRyaWJ1dGVzIGFuZCBub3QgcHJvcGVydGllc1xuXHQvLyAoZXhjZXB0aW5nIElFOCBib29sZWFucylcblx0c3VwcG9ydC5hdHRyaWJ1dGVzID0gYXNzZXJ0KGZ1bmN0aW9uKCBlbCApIHtcblx0XHRlbC5jbGFzc05hbWUgPSBcImlcIjtcblx0XHRyZXR1cm4gIWVsLmdldEF0dHJpYnV0ZShcImNsYXNzTmFtZVwiKTtcblx0fSk7XG5cblx0LyogZ2V0RWxlbWVudChzKUJ5KlxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cblx0Ly8gQ2hlY2sgaWYgZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpIHJldHVybnMgb25seSBlbGVtZW50c1xuXHRzdXBwb3J0LmdldEVsZW1lbnRzQnlUYWdOYW1lID0gYXNzZXJ0KGZ1bmN0aW9uKCBlbCApIHtcblx0XHRlbC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcIlwiKSApO1xuXHRcdHJldHVybiAhZWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpLmxlbmd0aDtcblx0fSk7XG5cblx0Ly8gU3VwcG9ydDogSUU8OVxuXHRzdXBwb3J0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgPSBybmF0aXZlLnRlc3QoIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgKTtcblxuXHQvLyBTdXBwb3J0OiBJRTwxMFxuXHQvLyBDaGVjayBpZiBnZXRFbGVtZW50QnlJZCByZXR1cm5zIGVsZW1lbnRzIGJ5IG5hbWVcblx0Ly8gVGhlIGJyb2tlbiBnZXRFbGVtZW50QnlJZCBtZXRob2RzIGRvbid0IHBpY2sgdXAgcHJvZ3JhbW1hdGljYWxseS1zZXQgbmFtZXMsXG5cdC8vIHNvIHVzZSBhIHJvdW5kYWJvdXQgZ2V0RWxlbWVudHNCeU5hbWUgdGVzdFxuXHRzdXBwb3J0LmdldEJ5SWQgPSBhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHRcdGRvY0VsZW0uYXBwZW5kQ2hpbGQoIGVsICkuaWQgPSBleHBhbmRvO1xuXHRcdHJldHVybiAhZG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUgfHwgIWRvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCBleHBhbmRvICkubGVuZ3RoO1xuXHR9KTtcblxuXHQvLyBJRCBmaWx0ZXIgYW5kIGZpbmRcblx0aWYgKCBzdXBwb3J0LmdldEJ5SWQgKSB7XG5cdFx0RXhwci5maWx0ZXJbXCJJRFwiXSA9IGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdHZhciBhdHRySWQgPSBpZC5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoXCJpZFwiKSA9PT0gYXR0cklkO1xuXHRcdFx0fTtcblx0XHR9O1xuXHRcdEV4cHIuZmluZFtcIklEXCJdID0gZnVuY3Rpb24oIGlkLCBjb250ZXh0ICkge1xuXHRcdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50QnlJZCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkb2N1bWVudElzSFRNTCApIHtcblx0XHRcdFx0dmFyIGVsZW0gPSBjb250ZXh0LmdldEVsZW1lbnRCeUlkKCBpZCApO1xuXHRcdFx0XHRyZXR1cm4gZWxlbSA/IFsgZWxlbSBdIDogW107XG5cdFx0XHR9XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRFeHByLmZpbHRlcltcIklEXCJdID0gIGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdHZhciBhdHRySWQgPSBpZC5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHR2YXIgbm9kZSA9IHR5cGVvZiBlbGVtLmdldEF0dHJpYnV0ZU5vZGUgIT09IFwidW5kZWZpbmVkXCIgJiZcblx0XHRcdFx0XHRlbGVtLmdldEF0dHJpYnV0ZU5vZGUoXCJpZFwiKTtcblx0XHRcdFx0cmV0dXJuIG5vZGUgJiYgbm9kZS52YWx1ZSA9PT0gYXR0cklkO1xuXHRcdFx0fTtcblx0XHR9O1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgNiAtIDcgb25seVxuXHRcdC8vIGdldEVsZW1lbnRCeUlkIGlzIG5vdCByZWxpYWJsZSBhcyBhIGZpbmQgc2hvcnRjdXRcblx0XHRFeHByLmZpbmRbXCJJRFwiXSA9IGZ1bmN0aW9uKCBpZCwgY29udGV4dCApIHtcblx0XHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnRJc0hUTUwgKSB7XG5cdFx0XHRcdHZhciBub2RlLCBpLCBlbGVtcyxcblx0XHRcdFx0XHRlbGVtID0gY29udGV4dC5nZXRFbGVtZW50QnlJZCggaWQgKTtcblxuXHRcdFx0XHRpZiAoIGVsZW0gKSB7XG5cblx0XHRcdFx0XHQvLyBWZXJpZnkgdGhlIGlkIGF0dHJpYnV0ZVxuXHRcdFx0XHRcdG5vZGUgPSBlbGVtLmdldEF0dHJpYnV0ZU5vZGUoXCJpZFwiKTtcblx0XHRcdFx0XHRpZiAoIG5vZGUgJiYgbm9kZS52YWx1ZSA9PT0gaWQgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gWyBlbGVtIF07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gRmFsbCBiYWNrIG9uIGdldEVsZW1lbnRzQnlOYW1lXG5cdFx0XHRcdFx0ZWxlbXMgPSBjb250ZXh0LmdldEVsZW1lbnRzQnlOYW1lKCBpZCApO1xuXHRcdFx0XHRcdGkgPSAwO1xuXHRcdFx0XHRcdHdoaWxlICggKGVsZW0gPSBlbGVtc1tpKytdKSApIHtcblx0XHRcdFx0XHRcdG5vZGUgPSBlbGVtLmdldEF0dHJpYnV0ZU5vZGUoXCJpZFwiKTtcblx0XHRcdFx0XHRcdGlmICggbm9kZSAmJiBub2RlLnZhbHVlID09PSBpZCApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIFsgZWxlbSBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0Ly8gVGFnXG5cdEV4cHIuZmluZFtcIlRBR1wiXSA9IHN1cHBvcnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgP1xuXHRcdGZ1bmN0aW9uKCB0YWcsIGNvbnRleHQgKSB7XG5cdFx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lICE9PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHRyZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggdGFnICk7XG5cblx0XHRcdC8vIERvY3VtZW50RnJhZ21lbnQgbm9kZXMgZG9uJ3QgaGF2ZSBnRUJUTlxuXHRcdFx0fSBlbHNlIGlmICggc3VwcG9ydC5xc2EgKSB7XG5cdFx0XHRcdHJldHVybiBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoIHRhZyApO1xuXHRcdFx0fVxuXHRcdH0gOlxuXG5cdFx0ZnVuY3Rpb24oIHRhZywgY29udGV4dCApIHtcblx0XHRcdHZhciBlbGVtLFxuXHRcdFx0XHR0bXAgPSBbXSxcblx0XHRcdFx0aSA9IDAsXG5cdFx0XHRcdC8vIEJ5IGhhcHB5IGNvaW5jaWRlbmNlLCBhIChicm9rZW4pIGdFQlROIGFwcGVhcnMgb24gRG9jdW1lbnRGcmFnbWVudCBub2RlcyB0b29cblx0XHRcdFx0cmVzdWx0cyA9IGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIHRhZyApO1xuXG5cdFx0XHQvLyBGaWx0ZXIgb3V0IHBvc3NpYmxlIGNvbW1lbnRzXG5cdFx0XHRpZiAoIHRhZyA9PT0gXCIqXCIgKSB7XG5cdFx0XHRcdHdoaWxlICggKGVsZW0gPSByZXN1bHRzW2krK10pICkge1xuXHRcdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdHRtcC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRtcDtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdH07XG5cblx0Ly8gQ2xhc3Ncblx0RXhwci5maW5kW1wiQ0xBU1NcIl0gPSBzdXBwb3J0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgJiYgZnVuY3Rpb24oIGNsYXNzTmFtZSwgY29udGV4dCApIHtcblx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnRJc0hUTUwgKSB7XG5cdFx0XHRyZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCBjbGFzc05hbWUgKTtcblx0XHR9XG5cdH07XG5cblx0LyogUVNBL21hdGNoZXNTZWxlY3RvclxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cblx0Ly8gUVNBIGFuZCBtYXRjaGVzU2VsZWN0b3Igc3VwcG9ydFxuXG5cdC8vIG1hdGNoZXNTZWxlY3Rvcig6YWN0aXZlKSByZXBvcnRzIGZhbHNlIHdoZW4gdHJ1ZSAoSUU5L09wZXJhIDExLjUpXG5cdHJidWdneU1hdGNoZXMgPSBbXTtcblxuXHQvLyBxU2EoOmZvY3VzKSByZXBvcnRzIGZhbHNlIHdoZW4gdHJ1ZSAoQ2hyb21lIDIxKVxuXHQvLyBXZSBhbGxvdyB0aGlzIGJlY2F1c2Ugb2YgYSBidWcgaW4gSUU4LzkgdGhhdCB0aHJvd3MgYW4gZXJyb3Jcblx0Ly8gd2hlbmV2ZXIgYGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRgIGlzIGFjY2Vzc2VkIG9uIGFuIGlmcmFtZVxuXHQvLyBTbywgd2UgYWxsb3cgOmZvY3VzIHRvIHBhc3MgdGhyb3VnaCBRU0EgYWxsIHRoZSB0aW1lIHRvIGF2b2lkIHRoZSBJRSBlcnJvclxuXHQvLyBTZWUgaHR0cHM6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzEzMzc4XG5cdHJidWdneVFTQSA9IFtdO1xuXG5cdGlmICggKHN1cHBvcnQucXNhID0gcm5hdGl2ZS50ZXN0KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsICkpICkge1xuXHRcdC8vIEJ1aWxkIFFTQSByZWdleFxuXHRcdC8vIFJlZ2V4IHN0cmF0ZWd5IGFkb3B0ZWQgZnJvbSBEaWVnbyBQZXJpbmlcblx0XHRhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0Ly8gU2VsZWN0IGlzIHNldCB0byBlbXB0eSBzdHJpbmcgb24gcHVycG9zZVxuXHRcdFx0Ly8gVGhpcyBpcyB0byB0ZXN0IElFJ3MgdHJlYXRtZW50IG9mIG5vdCBleHBsaWNpdGx5XG5cdFx0XHQvLyBzZXR0aW5nIGEgYm9vbGVhbiBjb250ZW50IGF0dHJpYnV0ZSxcblx0XHRcdC8vIHNpbmNlIGl0cyBwcmVzZW5jZSBzaG91bGQgYmUgZW5vdWdoXG5cdFx0XHQvLyBodHRwczovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvMTIzNTlcblx0XHRcdGRvY0VsZW0uYXBwZW5kQ2hpbGQoIGVsICkuaW5uZXJIVE1MID0gXCI8YSBpZD0nXCIgKyBleHBhbmRvICsgXCInPjwvYT5cIiArXG5cdFx0XHRcdFwiPHNlbGVjdCBpZD0nXCIgKyBleHBhbmRvICsgXCItXFxyXFxcXCcgbXNhbGxvd2NhcHR1cmU9Jyc+XCIgK1xuXHRcdFx0XHRcIjxvcHRpb24gc2VsZWN0ZWQ9Jyc+PC9vcHRpb24+PC9zZWxlY3Q+XCI7XG5cblx0XHRcdC8vIFN1cHBvcnQ6IElFOCwgT3BlcmEgMTEtMTIuMTZcblx0XHRcdC8vIE5vdGhpbmcgc2hvdWxkIGJlIHNlbGVjdGVkIHdoZW4gZW1wdHkgc3RyaW5ncyBmb2xsb3cgXj0gb3IgJD0gb3IgKj1cblx0XHRcdC8vIFRoZSB0ZXN0IGF0dHJpYnV0ZSBtdXN0IGJlIHVua25vd24gaW4gT3BlcmEgYnV0IFwic2FmZVwiIGZvciBXaW5SVFxuXHRcdFx0Ly8gaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9oaDQ2NTM4OC5hc3B4I2F0dHJpYnV0ZV9zZWN0aW9uXG5cdFx0XHRpZiAoIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCJbbXNhbGxvd2NhcHR1cmVePScnXVwiKS5sZW5ndGggKSB7XG5cdFx0XHRcdHJidWdneVFTQS5wdXNoKCBcIlsqXiRdPVwiICsgd2hpdGVzcGFjZSArIFwiKig/OicnfFxcXCJcXFwiKVwiICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN1cHBvcnQ6IElFOFxuXHRcdFx0Ly8gQm9vbGVhbiBhdHRyaWJ1dGVzIGFuZCBcInZhbHVlXCIgYXJlIG5vdCB0cmVhdGVkIGNvcnJlY3RseVxuXHRcdFx0aWYgKCAhZWwucXVlcnlTZWxlY3RvckFsbChcIltzZWxlY3RlZF1cIikubGVuZ3RoICkge1xuXHRcdFx0XHRyYnVnZ3lRU0EucHVzaCggXCJcXFxcW1wiICsgd2hpdGVzcGFjZSArIFwiKig/OnZhbHVlfFwiICsgYm9vbGVhbnMgKyBcIilcIiApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWU8MjksIEFuZHJvaWQ8NC40LCBTYWZhcmk8Ny4wKywgaU9TPDcuMCssIFBoYW50b21KUzwxLjkuOCtcblx0XHRcdGlmICggIWVsLnF1ZXJ5U2VsZWN0b3JBbGwoIFwiW2lkfj1cIiArIGV4cGFuZG8gKyBcIi1dXCIgKS5sZW5ndGggKSB7XG5cdFx0XHRcdHJidWdneVFTQS5wdXNoKFwifj1cIik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFdlYmtpdC9PcGVyYSAtIDpjaGVja2VkIHNob3VsZCByZXR1cm4gc2VsZWN0ZWQgb3B0aW9uIGVsZW1lbnRzXG5cdFx0XHQvLyBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDExL1JFQy1jc3MzLXNlbGVjdG9ycy0yMDExMDkyOS8jY2hlY2tlZFxuXHRcdFx0Ly8gSUU4IHRocm93cyBlcnJvciBoZXJlIGFuZCB3aWxsIG5vdCBzZWUgbGF0ZXIgdGVzdHNcblx0XHRcdGlmICggIWVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCI6Y2hlY2tlZFwiKS5sZW5ndGggKSB7XG5cdFx0XHRcdHJidWdneVFTQS5wdXNoKFwiOmNoZWNrZWRcIik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN1cHBvcnQ6IFNhZmFyaSA4KywgaU9TIDgrXG5cdFx0XHQvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTM2ODUxXG5cdFx0XHQvLyBJbi1wYWdlIGBzZWxlY3RvciNpZCBzaWJsaW5nLWNvbWJpbmF0b3Igc2VsZWN0b3JgIGZhaWxzXG5cdFx0XHRpZiAoICFlbC5xdWVyeVNlbGVjdG9yQWxsKCBcImEjXCIgKyBleHBhbmRvICsgXCIrKlwiICkubGVuZ3RoICkge1xuXHRcdFx0XHRyYnVnZ3lRU0EucHVzaChcIi4jLitbK35dXCIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0YXNzZXJ0KGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdGVsLmlubmVySFRNTCA9IFwiPGEgaHJlZj0nJyBkaXNhYmxlZD0nZGlzYWJsZWQnPjwvYT5cIiArXG5cdFx0XHRcdFwiPHNlbGVjdCBkaXNhYmxlZD0nZGlzYWJsZWQnPjxvcHRpb24vPjwvc2VsZWN0PlwiO1xuXG5cdFx0XHQvLyBTdXBwb3J0OiBXaW5kb3dzIDggTmF0aXZlIEFwcHNcblx0XHRcdC8vIFRoZSB0eXBlIGFuZCBuYW1lIGF0dHJpYnV0ZXMgYXJlIHJlc3RyaWN0ZWQgZHVyaW5nIC5pbm5lckhUTUwgYXNzaWdubWVudFxuXHRcdFx0dmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0aW5wdXQuc2V0QXR0cmlidXRlKCBcInR5cGVcIiwgXCJoaWRkZW5cIiApO1xuXHRcdFx0ZWwuYXBwZW5kQ2hpbGQoIGlucHV0ICkuc2V0QXR0cmlidXRlKCBcIm5hbWVcIiwgXCJEXCIgKTtcblxuXHRcdFx0Ly8gU3VwcG9ydDogSUU4XG5cdFx0XHQvLyBFbmZvcmNlIGNhc2Utc2Vuc2l0aXZpdHkgb2YgbmFtZSBhdHRyaWJ1dGVcblx0XHRcdGlmICggZWwucXVlcnlTZWxlY3RvckFsbChcIltuYW1lPWRdXCIpLmxlbmd0aCApIHtcblx0XHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwibmFtZVwiICsgd2hpdGVzcGFjZSArIFwiKlsqXiR8IX5dPz1cIiApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBGRiAzLjUgLSA6ZW5hYmxlZC86ZGlzYWJsZWQgYW5kIGhpZGRlbiBlbGVtZW50cyAoaGlkZGVuIGVsZW1lbnRzIGFyZSBzdGlsbCBlbmFibGVkKVxuXHRcdFx0Ly8gSUU4IHRocm93cyBlcnJvciBoZXJlIGFuZCB3aWxsIG5vdCBzZWUgbGF0ZXIgdGVzdHNcblx0XHRcdGlmICggZWwucXVlcnlTZWxlY3RvckFsbChcIjplbmFibGVkXCIpLmxlbmd0aCAhPT0gMiApIHtcblx0XHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwiOmVuYWJsZWRcIiwgXCI6ZGlzYWJsZWRcIiApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdXBwb3J0OiBJRTktMTErXG5cdFx0XHQvLyBJRSdzIDpkaXNhYmxlZCBzZWxlY3RvciBkb2VzIG5vdCBwaWNrIHVwIHRoZSBjaGlsZHJlbiBvZiBkaXNhYmxlZCBmaWVsZHNldHNcblx0XHRcdGRvY0VsZW0uYXBwZW5kQ2hpbGQoIGVsICkuZGlzYWJsZWQgPSB0cnVlO1xuXHRcdFx0aWYgKCBlbC5xdWVyeVNlbGVjdG9yQWxsKFwiOmRpc2FibGVkXCIpLmxlbmd0aCAhPT0gMiApIHtcblx0XHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwiOmVuYWJsZWRcIiwgXCI6ZGlzYWJsZWRcIiApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBPcGVyYSAxMC0xMSBkb2VzIG5vdCB0aHJvdyBvbiBwb3N0LWNvbW1hIGludmFsaWQgcHNldWRvc1xuXHRcdFx0ZWwucXVlcnlTZWxlY3RvckFsbChcIiosOnhcIik7XG5cdFx0XHRyYnVnZ3lRU0EucHVzaChcIiwuKjpcIik7XG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoIChzdXBwb3J0Lm1hdGNoZXNTZWxlY3RvciA9IHJuYXRpdmUudGVzdCggKG1hdGNoZXMgPSBkb2NFbGVtLm1hdGNoZXMgfHxcblx0XHRkb2NFbGVtLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuXHRcdGRvY0VsZW0ubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG5cdFx0ZG9jRWxlbS5vTWF0Y2hlc1NlbGVjdG9yIHx8XG5cdFx0ZG9jRWxlbS5tc01hdGNoZXNTZWxlY3RvcikgKSkgKSB7XG5cblx0XHRhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0Ly8gQ2hlY2sgdG8gc2VlIGlmIGl0J3MgcG9zc2libGUgdG8gZG8gbWF0Y2hlc1NlbGVjdG9yXG5cdFx0XHQvLyBvbiBhIGRpc2Nvbm5lY3RlZCBub2RlIChJRSA5KVxuXHRcdFx0c3VwcG9ydC5kaXNjb25uZWN0ZWRNYXRjaCA9IG1hdGNoZXMuY2FsbCggZWwsIFwiKlwiICk7XG5cblx0XHRcdC8vIFRoaXMgc2hvdWxkIGZhaWwgd2l0aCBhbiBleGNlcHRpb25cblx0XHRcdC8vIEdlY2tvIGRvZXMgbm90IGVycm9yLCByZXR1cm5zIGZhbHNlIGluc3RlYWRcblx0XHRcdG1hdGNoZXMuY2FsbCggZWwsIFwiW3MhPScnXTp4XCIgKTtcblx0XHRcdHJidWdneU1hdGNoZXMucHVzaCggXCIhPVwiLCBwc2V1ZG9zICk7XG5cdFx0fSk7XG5cdH1cblxuXHRyYnVnZ3lRU0EgPSByYnVnZ3lRU0EubGVuZ3RoICYmIG5ldyBSZWdFeHAoIHJidWdneVFTQS5qb2luKFwifFwiKSApO1xuXHRyYnVnZ3lNYXRjaGVzID0gcmJ1Z2d5TWF0Y2hlcy5sZW5ndGggJiYgbmV3IFJlZ0V4cCggcmJ1Z2d5TWF0Y2hlcy5qb2luKFwifFwiKSApO1xuXG5cdC8qIENvbnRhaW5zXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblx0aGFzQ29tcGFyZSA9IHJuYXRpdmUudGVzdCggZG9jRWxlbS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiApO1xuXG5cdC8vIEVsZW1lbnQgY29udGFpbnMgYW5vdGhlclxuXHQvLyBQdXJwb3NlZnVsbHkgc2VsZi1leGNsdXNpdmVcblx0Ly8gQXMgaW4sIGFuIGVsZW1lbnQgZG9lcyBub3QgY29udGFpbiBpdHNlbGZcblx0Y29udGFpbnMgPSBoYXNDb21wYXJlIHx8IHJuYXRpdmUudGVzdCggZG9jRWxlbS5jb250YWlucyApID9cblx0XHRmdW5jdGlvbiggYSwgYiApIHtcblx0XHRcdHZhciBhZG93biA9IGEubm9kZVR5cGUgPT09IDkgPyBhLmRvY3VtZW50RWxlbWVudCA6IGEsXG5cdFx0XHRcdGJ1cCA9IGIgJiYgYi5wYXJlbnROb2RlO1xuXHRcdFx0cmV0dXJuIGEgPT09IGJ1cCB8fCAhISggYnVwICYmIGJ1cC5ub2RlVHlwZSA9PT0gMSAmJiAoXG5cdFx0XHRcdGFkb3duLmNvbnRhaW5zID9cblx0XHRcdFx0XHRhZG93bi5jb250YWlucyggYnVwICkgOlxuXHRcdFx0XHRcdGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gJiYgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiggYnVwICkgJiAxNlxuXHRcdFx0KSk7XG5cdFx0fSA6XG5cdFx0ZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0XHRpZiAoIGIgKSB7XG5cdFx0XHRcdHdoaWxlICggKGIgPSBiLnBhcmVudE5vZGUpICkge1xuXHRcdFx0XHRcdGlmICggYiA9PT0gYSApIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0LyogU29ydGluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cblx0Ly8gRG9jdW1lbnQgb3JkZXIgc29ydGluZ1xuXHRzb3J0T3JkZXIgPSBoYXNDb21wYXJlID9cblx0ZnVuY3Rpb24oIGEsIGIgKSB7XG5cblx0XHQvLyBGbGFnIGZvciBkdXBsaWNhdGUgcmVtb3ZhbFxuXHRcdGlmICggYSA9PT0gYiApIHtcblx0XHRcdGhhc0R1cGxpY2F0ZSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHQvLyBTb3J0IG9uIG1ldGhvZCBleGlzdGVuY2UgaWYgb25seSBvbmUgaW5wdXQgaGFzIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXG5cdFx0dmFyIGNvbXBhcmUgPSAhYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiAtICFiLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xuXHRcdGlmICggY29tcGFyZSApIHtcblx0XHRcdHJldHVybiBjb21wYXJlO1xuXHRcdH1cblxuXHRcdC8vIENhbGN1bGF0ZSBwb3NpdGlvbiBpZiBib3RoIGlucHV0cyBiZWxvbmcgdG8gdGhlIHNhbWUgZG9jdW1lbnRcblx0XHRjb21wYXJlID0gKCBhLm93bmVyRG9jdW1lbnQgfHwgYSApID09PSAoIGIub3duZXJEb2N1bWVudCB8fCBiICkgP1xuXHRcdFx0YS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiggYiApIDpcblxuXHRcdFx0Ly8gT3RoZXJ3aXNlIHdlIGtub3cgdGhleSBhcmUgZGlzY29ubmVjdGVkXG5cdFx0XHQxO1xuXG5cdFx0Ly8gRGlzY29ubmVjdGVkIG5vZGVzXG5cdFx0aWYgKCBjb21wYXJlICYgMSB8fFxuXHRcdFx0KCFzdXBwb3J0LnNvcnREZXRhY2hlZCAmJiBiLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKCBhICkgPT09IGNvbXBhcmUpICkge1xuXG5cdFx0XHQvLyBDaG9vc2UgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBpcyByZWxhdGVkIHRvIG91ciBwcmVmZXJyZWQgZG9jdW1lbnRcblx0XHRcdGlmICggYSA9PT0gZG9jdW1lbnQgfHwgYS5vd25lckRvY3VtZW50ID09PSBwcmVmZXJyZWREb2MgJiYgY29udGFpbnMocHJlZmVycmVkRG9jLCBhKSApIHtcblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBiID09PSBkb2N1bWVudCB8fCBiLm93bmVyRG9jdW1lbnQgPT09IHByZWZlcnJlZERvYyAmJiBjb250YWlucyhwcmVmZXJyZWREb2MsIGIpICkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTWFpbnRhaW4gb3JpZ2luYWwgb3JkZXJcblx0XHRcdHJldHVybiBzb3J0SW5wdXQgP1xuXHRcdFx0XHQoIGluZGV4T2YoIHNvcnRJbnB1dCwgYSApIC0gaW5kZXhPZiggc29ydElucHV0LCBiICkgKSA6XG5cdFx0XHRcdDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbXBhcmUgJiA0ID8gLTEgOiAxO1xuXHR9IDpcblx0ZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0Ly8gRXhpdCBlYXJseSBpZiB0aGUgbm9kZXMgYXJlIGlkZW50aWNhbFxuXHRcdGlmICggYSA9PT0gYiApIHtcblx0XHRcdGhhc0R1cGxpY2F0ZSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHR2YXIgY3VyLFxuXHRcdFx0aSA9IDAsXG5cdFx0XHRhdXAgPSBhLnBhcmVudE5vZGUsXG5cdFx0XHRidXAgPSBiLnBhcmVudE5vZGUsXG5cdFx0XHRhcCA9IFsgYSBdLFxuXHRcdFx0YnAgPSBbIGIgXTtcblxuXHRcdC8vIFBhcmVudGxlc3Mgbm9kZXMgYXJlIGVpdGhlciBkb2N1bWVudHMgb3IgZGlzY29ubmVjdGVkXG5cdFx0aWYgKCAhYXVwIHx8ICFidXAgKSB7XG5cdFx0XHRyZXR1cm4gYSA9PT0gZG9jdW1lbnQgPyAtMSA6XG5cdFx0XHRcdGIgPT09IGRvY3VtZW50ID8gMSA6XG5cdFx0XHRcdGF1cCA/IC0xIDpcblx0XHRcdFx0YnVwID8gMSA6XG5cdFx0XHRcdHNvcnRJbnB1dCA/XG5cdFx0XHRcdCggaW5kZXhPZiggc29ydElucHV0LCBhICkgLSBpbmRleE9mKCBzb3J0SW5wdXQsIGIgKSApIDpcblx0XHRcdFx0MDtcblxuXHRcdC8vIElmIHRoZSBub2RlcyBhcmUgc2libGluZ3MsIHdlIGNhbiBkbyBhIHF1aWNrIGNoZWNrXG5cdFx0fSBlbHNlIGlmICggYXVwID09PSBidXAgKSB7XG5cdFx0XHRyZXR1cm4gc2libGluZ0NoZWNrKCBhLCBiICk7XG5cdFx0fVxuXG5cdFx0Ly8gT3RoZXJ3aXNlIHdlIG5lZWQgZnVsbCBsaXN0cyBvZiB0aGVpciBhbmNlc3RvcnMgZm9yIGNvbXBhcmlzb25cblx0XHRjdXIgPSBhO1xuXHRcdHdoaWxlICggKGN1ciA9IGN1ci5wYXJlbnROb2RlKSApIHtcblx0XHRcdGFwLnVuc2hpZnQoIGN1ciApO1xuXHRcdH1cblx0XHRjdXIgPSBiO1xuXHRcdHdoaWxlICggKGN1ciA9IGN1ci5wYXJlbnROb2RlKSApIHtcblx0XHRcdGJwLnVuc2hpZnQoIGN1ciApO1xuXHRcdH1cblxuXHRcdC8vIFdhbGsgZG93biB0aGUgdHJlZSBsb29raW5nIGZvciBhIGRpc2NyZXBhbmN5XG5cdFx0d2hpbGUgKCBhcFtpXSA9PT0gYnBbaV0gKSB7XG5cdFx0XHRpKys7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGkgP1xuXHRcdFx0Ly8gRG8gYSBzaWJsaW5nIGNoZWNrIGlmIHRoZSBub2RlcyBoYXZlIGEgY29tbW9uIGFuY2VzdG9yXG5cdFx0XHRzaWJsaW5nQ2hlY2soIGFwW2ldLCBicFtpXSApIDpcblxuXHRcdFx0Ly8gT3RoZXJ3aXNlIG5vZGVzIGluIG91ciBkb2N1bWVudCBzb3J0IGZpcnN0XG5cdFx0XHRhcFtpXSA9PT0gcHJlZmVycmVkRG9jID8gLTEgOlxuXHRcdFx0YnBbaV0gPT09IHByZWZlcnJlZERvYyA/IDEgOlxuXHRcdFx0MDtcblx0fTtcblxuXHRyZXR1cm4gZG9jdW1lbnQ7XG59O1xuXG5TaXp6bGUubWF0Y2hlcyA9IGZ1bmN0aW9uKCBleHByLCBlbGVtZW50cyApIHtcblx0cmV0dXJuIFNpenpsZSggZXhwciwgbnVsbCwgbnVsbCwgZWxlbWVudHMgKTtcbn07XG5cblNpenpsZS5tYXRjaGVzU2VsZWN0b3IgPSBmdW5jdGlvbiggZWxlbSwgZXhwciApIHtcblx0Ly8gU2V0IGRvY3VtZW50IHZhcnMgaWYgbmVlZGVkXG5cdGlmICggKCBlbGVtLm93bmVyRG9jdW1lbnQgfHwgZWxlbSApICE9PSBkb2N1bWVudCApIHtcblx0XHRzZXREb2N1bWVudCggZWxlbSApO1xuXHR9XG5cblx0Ly8gTWFrZSBzdXJlIHRoYXQgYXR0cmlidXRlIHNlbGVjdG9ycyBhcmUgcXVvdGVkXG5cdGV4cHIgPSBleHByLnJlcGxhY2UoIHJhdHRyaWJ1dGVRdW90ZXMsIFwiPSckMSddXCIgKTtcblxuXHRpZiAoIHN1cHBvcnQubWF0Y2hlc1NlbGVjdG9yICYmIGRvY3VtZW50SXNIVE1MICYmXG5cdFx0IWNvbXBpbGVyQ2FjaGVbIGV4cHIgKyBcIiBcIiBdICYmXG5cdFx0KCAhcmJ1Z2d5TWF0Y2hlcyB8fCAhcmJ1Z2d5TWF0Y2hlcy50ZXN0KCBleHByICkgKSAmJlxuXHRcdCggIXJidWdneVFTQSAgICAgfHwgIXJidWdneVFTQS50ZXN0KCBleHByICkgKSApIHtcblxuXHRcdHRyeSB7XG5cdFx0XHR2YXIgcmV0ID0gbWF0Y2hlcy5jYWxsKCBlbGVtLCBleHByICk7XG5cblx0XHRcdC8vIElFIDkncyBtYXRjaGVzU2VsZWN0b3IgcmV0dXJucyBmYWxzZSBvbiBkaXNjb25uZWN0ZWQgbm9kZXNcblx0XHRcdGlmICggcmV0IHx8IHN1cHBvcnQuZGlzY29ubmVjdGVkTWF0Y2ggfHxcblx0XHRcdFx0XHQvLyBBcyB3ZWxsLCBkaXNjb25uZWN0ZWQgbm9kZXMgYXJlIHNhaWQgdG8gYmUgaW4gYSBkb2N1bWVudFxuXHRcdFx0XHRcdC8vIGZyYWdtZW50IGluIElFIDlcblx0XHRcdFx0XHRlbGVtLmRvY3VtZW50ICYmIGVsZW0uZG9jdW1lbnQubm9kZVR5cGUgIT09IDExICkge1xuXHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHt9XG5cdH1cblxuXHRyZXR1cm4gU2l6emxlKCBleHByLCBkb2N1bWVudCwgbnVsbCwgWyBlbGVtIF0gKS5sZW5ndGggPiAwO1xufTtcblxuU2l6emxlLmNvbnRhaW5zID0gZnVuY3Rpb24oIGNvbnRleHQsIGVsZW0gKSB7XG5cdC8vIFNldCBkb2N1bWVudCB2YXJzIGlmIG5lZWRlZFxuXHRpZiAoICggY29udGV4dC5vd25lckRvY3VtZW50IHx8IGNvbnRleHQgKSAhPT0gZG9jdW1lbnQgKSB7XG5cdFx0c2V0RG9jdW1lbnQoIGNvbnRleHQgKTtcblx0fVxuXHRyZXR1cm4gY29udGFpbnMoIGNvbnRleHQsIGVsZW0gKTtcbn07XG5cblNpenpsZS5hdHRyID0gZnVuY3Rpb24oIGVsZW0sIG5hbWUgKSB7XG5cdC8vIFNldCBkb2N1bWVudCB2YXJzIGlmIG5lZWRlZFxuXHRpZiAoICggZWxlbS5vd25lckRvY3VtZW50IHx8IGVsZW0gKSAhPT0gZG9jdW1lbnQgKSB7XG5cdFx0c2V0RG9jdW1lbnQoIGVsZW0gKTtcblx0fVxuXG5cdHZhciBmbiA9IEV4cHIuYXR0ckhhbmRsZVsgbmFtZS50b0xvd2VyQ2FzZSgpIF0sXG5cdFx0Ly8gRG9uJ3QgZ2V0IGZvb2xlZCBieSBPYmplY3QucHJvdG90eXBlIHByb3BlcnRpZXMgKGpRdWVyeSAjMTM4MDcpXG5cdFx0dmFsID0gZm4gJiYgaGFzT3duLmNhbGwoIEV4cHIuYXR0ckhhbmRsZSwgbmFtZS50b0xvd2VyQ2FzZSgpICkgP1xuXHRcdFx0Zm4oIGVsZW0sIG5hbWUsICFkb2N1bWVudElzSFRNTCApIDpcblx0XHRcdHVuZGVmaW5lZDtcblxuXHRyZXR1cm4gdmFsICE9PSB1bmRlZmluZWQgP1xuXHRcdHZhbCA6XG5cdFx0c3VwcG9ydC5hdHRyaWJ1dGVzIHx8ICFkb2N1bWVudElzSFRNTCA/XG5cdFx0XHRlbGVtLmdldEF0dHJpYnV0ZSggbmFtZSApIDpcblx0XHRcdCh2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZU5vZGUobmFtZSkpICYmIHZhbC5zcGVjaWZpZWQgP1xuXHRcdFx0XHR2YWwudmFsdWUgOlxuXHRcdFx0XHRudWxsO1xufTtcblxuU2l6emxlLmVzY2FwZSA9IGZ1bmN0aW9uKCBzZWwgKSB7XG5cdHJldHVybiAoc2VsICsgXCJcIikucmVwbGFjZSggcmNzc2VzY2FwZSwgZmNzc2VzY2FwZSApO1xufTtcblxuU2l6emxlLmVycm9yID0gZnVuY3Rpb24oIG1zZyApIHtcblx0dGhyb3cgbmV3IEVycm9yKCBcIlN5bnRheCBlcnJvciwgdW5yZWNvZ25pemVkIGV4cHJlc3Npb246IFwiICsgbXNnICk7XG59O1xuXG4vKipcbiAqIERvY3VtZW50IHNvcnRpbmcgYW5kIHJlbW92aW5nIGR1cGxpY2F0ZXNcbiAqIEBwYXJhbSB7QXJyYXlMaWtlfSByZXN1bHRzXG4gKi9cblNpenpsZS51bmlxdWVTb3J0ID0gZnVuY3Rpb24oIHJlc3VsdHMgKSB7XG5cdHZhciBlbGVtLFxuXHRcdGR1cGxpY2F0ZXMgPSBbXSxcblx0XHRqID0gMCxcblx0XHRpID0gMDtcblxuXHQvLyBVbmxlc3Mgd2UgKmtub3cqIHdlIGNhbiBkZXRlY3QgZHVwbGljYXRlcywgYXNzdW1lIHRoZWlyIHByZXNlbmNlXG5cdGhhc0R1cGxpY2F0ZSA9ICFzdXBwb3J0LmRldGVjdER1cGxpY2F0ZXM7XG5cdHNvcnRJbnB1dCA9ICFzdXBwb3J0LnNvcnRTdGFibGUgJiYgcmVzdWx0cy5zbGljZSggMCApO1xuXHRyZXN1bHRzLnNvcnQoIHNvcnRPcmRlciApO1xuXG5cdGlmICggaGFzRHVwbGljYXRlICkge1xuXHRcdHdoaWxlICggKGVsZW0gPSByZXN1bHRzW2krK10pICkge1xuXHRcdFx0aWYgKCBlbGVtID09PSByZXN1bHRzWyBpIF0gKSB7XG5cdFx0XHRcdGogPSBkdXBsaWNhdGVzLnB1c2goIGkgKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0d2hpbGUgKCBqLS0gKSB7XG5cdFx0XHRyZXN1bHRzLnNwbGljZSggZHVwbGljYXRlc1sgaiBdLCAxICk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ2xlYXIgaW5wdXQgYWZ0ZXIgc29ydGluZyB0byByZWxlYXNlIG9iamVjdHNcblx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvc2l6emxlL3B1bGwvMjI1XG5cdHNvcnRJbnB1dCA9IG51bGw7XG5cblx0cmV0dXJuIHJlc3VsdHM7XG59O1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb24gZm9yIHJldHJpZXZpbmcgdGhlIHRleHQgdmFsdWUgb2YgYW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4gKiBAcGFyYW0ge0FycmF5fEVsZW1lbnR9IGVsZW1cbiAqL1xuZ2V0VGV4dCA9IFNpenpsZS5nZXRUZXh0ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdHZhciBub2RlLFxuXHRcdHJldCA9IFwiXCIsXG5cdFx0aSA9IDAsXG5cdFx0bm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xuXG5cdGlmICggIW5vZGVUeXBlICkge1xuXHRcdC8vIElmIG5vIG5vZGVUeXBlLCB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGFuIGFycmF5XG5cdFx0d2hpbGUgKCAobm9kZSA9IGVsZW1baSsrXSkgKSB7XG5cdFx0XHQvLyBEbyBub3QgdHJhdmVyc2UgY29tbWVudCBub2Rlc1xuXHRcdFx0cmV0ICs9IGdldFRleHQoIG5vZGUgKTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoIG5vZGVUeXBlID09PSAxIHx8IG5vZGVUeXBlID09PSA5IHx8IG5vZGVUeXBlID09PSAxMSApIHtcblx0XHQvLyBVc2UgdGV4dENvbnRlbnQgZm9yIGVsZW1lbnRzXG5cdFx0Ly8gaW5uZXJUZXh0IHVzYWdlIHJlbW92ZWQgZm9yIGNvbnNpc3RlbmN5IG9mIG5ldyBsaW5lcyAoalF1ZXJ5ICMxMTE1Mylcblx0XHRpZiAoIHR5cGVvZiBlbGVtLnRleHRDb250ZW50ID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0cmV0dXJuIGVsZW0udGV4dENvbnRlbnQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFRyYXZlcnNlIGl0cyBjaGlsZHJlblxuXHRcdFx0Zm9yICggZWxlbSA9IGVsZW0uZmlyc3RDaGlsZDsgZWxlbTsgZWxlbSA9IGVsZW0ubmV4dFNpYmxpbmcgKSB7XG5cdFx0XHRcdHJldCArPSBnZXRUZXh0KCBlbGVtICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYgKCBub2RlVHlwZSA9PT0gMyB8fCBub2RlVHlwZSA9PT0gNCApIHtcblx0XHRyZXR1cm4gZWxlbS5ub2RlVmFsdWU7XG5cdH1cblx0Ly8gRG8gbm90IGluY2x1ZGUgY29tbWVudCBvciBwcm9jZXNzaW5nIGluc3RydWN0aW9uIG5vZGVzXG5cblx0cmV0dXJuIHJldDtcbn07XG5cbkV4cHIgPSBTaXp6bGUuc2VsZWN0b3JzID0ge1xuXG5cdC8vIENhbiBiZSBhZGp1c3RlZCBieSB0aGUgdXNlclxuXHRjYWNoZUxlbmd0aDogNTAsXG5cblx0Y3JlYXRlUHNldWRvOiBtYXJrRnVuY3Rpb24sXG5cblx0bWF0Y2g6IG1hdGNoRXhwcixcblxuXHRhdHRySGFuZGxlOiB7fSxcblxuXHRmaW5kOiB7fSxcblxuXHRyZWxhdGl2ZToge1xuXHRcdFwiPlwiOiB7IGRpcjogXCJwYXJlbnROb2RlXCIsIGZpcnN0OiB0cnVlIH0sXG5cdFx0XCIgXCI6IHsgZGlyOiBcInBhcmVudE5vZGVcIiB9LFxuXHRcdFwiK1wiOiB7IGRpcjogXCJwcmV2aW91c1NpYmxpbmdcIiwgZmlyc3Q6IHRydWUgfSxcblx0XHRcIn5cIjogeyBkaXI6IFwicHJldmlvdXNTaWJsaW5nXCIgfVxuXHR9LFxuXG5cdHByZUZpbHRlcjoge1xuXHRcdFwiQVRUUlwiOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cdFx0XHRtYXRjaFsxXSA9IG1hdGNoWzFdLnJlcGxhY2UoIHJ1bmVzY2FwZSwgZnVuZXNjYXBlICk7XG5cblx0XHRcdC8vIE1vdmUgdGhlIGdpdmVuIHZhbHVlIHRvIG1hdGNoWzNdIHdoZXRoZXIgcXVvdGVkIG9yIHVucXVvdGVkXG5cdFx0XHRtYXRjaFszXSA9ICggbWF0Y2hbM10gfHwgbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgXCJcIiApLnJlcGxhY2UoIHJ1bmVzY2FwZSwgZnVuZXNjYXBlICk7XG5cblx0XHRcdGlmICggbWF0Y2hbMl0gPT09IFwifj1cIiApIHtcblx0XHRcdFx0bWF0Y2hbM10gPSBcIiBcIiArIG1hdGNoWzNdICsgXCIgXCI7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtYXRjaC5zbGljZSggMCwgNCApO1xuXHRcdH0sXG5cblx0XHRcIkNISUxEXCI6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHRcdC8qIG1hdGNoZXMgZnJvbSBtYXRjaEV4cHJbXCJDSElMRFwiXVxuXHRcdFx0XHQxIHR5cGUgKG9ubHl8bnRofC4uLilcblx0XHRcdFx0MiB3aGF0IChjaGlsZHxvZi10eXBlKVxuXHRcdFx0XHQzIGFyZ3VtZW50IChldmVufG9kZHxcXGQqfFxcZCpuKFsrLV1cXGQrKT98Li4uKVxuXHRcdFx0XHQ0IHhuLWNvbXBvbmVudCBvZiB4bit5IGFyZ3VtZW50IChbKy1dP1xcZCpufClcblx0XHRcdFx0NSBzaWduIG9mIHhuLWNvbXBvbmVudFxuXHRcdFx0XHQ2IHggb2YgeG4tY29tcG9uZW50XG5cdFx0XHRcdDcgc2lnbiBvZiB5LWNvbXBvbmVudFxuXHRcdFx0XHQ4IHkgb2YgeS1jb21wb25lbnRcblx0XHRcdCovXG5cdFx0XHRtYXRjaFsxXSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdGlmICggbWF0Y2hbMV0uc2xpY2UoIDAsIDMgKSA9PT0gXCJudGhcIiApIHtcblx0XHRcdFx0Ly8gbnRoLSogcmVxdWlyZXMgYXJndW1lbnRcblx0XHRcdFx0aWYgKCAhbWF0Y2hbM10gKSB7XG5cdFx0XHRcdFx0U2l6emxlLmVycm9yKCBtYXRjaFswXSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gbnVtZXJpYyB4IGFuZCB5IHBhcmFtZXRlcnMgZm9yIEV4cHIuZmlsdGVyLkNISUxEXG5cdFx0XHRcdC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcblx0XHRcdFx0bWF0Y2hbNF0gPSArKCBtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqICggbWF0Y2hbM10gPT09IFwiZXZlblwiIHx8IG1hdGNoWzNdID09PSBcIm9kZFwiICkgKTtcblx0XHRcdFx0bWF0Y2hbNV0gPSArKCAoIG1hdGNoWzddICsgbWF0Y2hbOF0gKSB8fCBtYXRjaFszXSA9PT0gXCJvZGRcIiApO1xuXG5cdFx0XHQvLyBvdGhlciB0eXBlcyBwcm9oaWJpdCBhcmd1bWVudHNcblx0XHRcdH0gZWxzZSBpZiAoIG1hdGNoWzNdICkge1xuXHRcdFx0XHRTaXp6bGUuZXJyb3IoIG1hdGNoWzBdICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtYXRjaDtcblx0XHR9LFxuXG5cdFx0XCJQU0VVRE9cIjogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdFx0dmFyIGV4Y2Vzcyxcblx0XHRcdFx0dW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XG5cblx0XHRcdGlmICggbWF0Y2hFeHByW1wiQ0hJTERcIl0udGVzdCggbWF0Y2hbMF0gKSApIHtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFjY2VwdCBxdW90ZWQgYXJndW1lbnRzIGFzLWlzXG5cdFx0XHRpZiAoIG1hdGNoWzNdICkge1xuXHRcdFx0XHRtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8IFwiXCI7XG5cblx0XHRcdC8vIFN0cmlwIGV4Y2VzcyBjaGFyYWN0ZXJzIGZyb20gdW5xdW90ZWQgYXJndW1lbnRzXG5cdFx0XHR9IGVsc2UgaWYgKCB1bnF1b3RlZCAmJiBycHNldWRvLnRlc3QoIHVucXVvdGVkICkgJiZcblx0XHRcdFx0Ly8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcblx0XHRcdFx0KGV4Y2VzcyA9IHRva2VuaXplKCB1bnF1b3RlZCwgdHJ1ZSApKSAmJlxuXHRcdFx0XHQvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcblx0XHRcdFx0KGV4Y2VzcyA9IHVucXVvdGVkLmluZGV4T2YoIFwiKVwiLCB1bnF1b3RlZC5sZW5ndGggLSBleGNlc3MgKSAtIHVucXVvdGVkLmxlbmd0aCkgKSB7XG5cblx0XHRcdFx0Ly8gZXhjZXNzIGlzIGEgbmVnYXRpdmUgaW5kZXhcblx0XHRcdFx0bWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSggMCwgZXhjZXNzICk7XG5cdFx0XHRcdG1hdGNoWzJdID0gdW5xdW90ZWQuc2xpY2UoIDAsIGV4Y2VzcyApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcblx0XHRcdHJldHVybiBtYXRjaC5zbGljZSggMCwgMyApO1xuXHRcdH1cblx0fSxcblxuXHRmaWx0ZXI6IHtcblxuXHRcdFwiVEFHXCI6IGZ1bmN0aW9uKCBub2RlTmFtZVNlbGVjdG9yICkge1xuXHRcdFx0dmFyIG5vZGVOYW1lID0gbm9kZU5hbWVTZWxlY3Rvci5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRyZXR1cm4gbm9kZU5hbWVTZWxlY3RvciA9PT0gXCIqXCIgP1xuXHRcdFx0XHRmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH0gOlxuXHRcdFx0XHRmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZSAmJiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5vZGVOYW1lO1xuXHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRcIkNMQVNTXCI6IGZ1bmN0aW9uKCBjbGFzc05hbWUgKSB7XG5cdFx0XHR2YXIgcGF0dGVybiA9IGNsYXNzQ2FjaGVbIGNsYXNzTmFtZSArIFwiIFwiIF07XG5cblx0XHRcdHJldHVybiBwYXR0ZXJuIHx8XG5cdFx0XHRcdChwYXR0ZXJuID0gbmV3IFJlZ0V4cCggXCIoXnxcIiArIHdoaXRlc3BhY2UgKyBcIilcIiArIGNsYXNzTmFtZSArIFwiKFwiICsgd2hpdGVzcGFjZSArIFwifCQpXCIgKSkgJiZcblx0XHRcdFx0Y2xhc3NDYWNoZSggY2xhc3NOYW1lLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0XHRyZXR1cm4gcGF0dGVybi50ZXN0KCB0eXBlb2YgZWxlbS5jbGFzc05hbWUgPT09IFwic3RyaW5nXCIgJiYgZWxlbS5jbGFzc05hbWUgfHwgdHlwZW9mIGVsZW0uZ2V0QXR0cmlidXRlICE9PSBcInVuZGVmaW5lZFwiICYmIGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIiApO1xuXHRcdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0XCJBVFRSXCI6IGZ1bmN0aW9uKCBuYW1lLCBvcGVyYXRvciwgY2hlY2sgKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRcdHZhciByZXN1bHQgPSBTaXp6bGUuYXR0ciggZWxlbSwgbmFtZSApO1xuXG5cdFx0XHRcdGlmICggcmVzdWx0ID09IG51bGwgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wZXJhdG9yID09PSBcIiE9XCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCAhb3BlcmF0b3IgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXN1bHQgKz0gXCJcIjtcblxuXHRcdFx0XHRyZXR1cm4gb3BlcmF0b3IgPT09IFwiPVwiID8gcmVzdWx0ID09PSBjaGVjayA6XG5cdFx0XHRcdFx0b3BlcmF0b3IgPT09IFwiIT1cIiA/IHJlc3VsdCAhPT0gY2hlY2sgOlxuXHRcdFx0XHRcdG9wZXJhdG9yID09PSBcIl49XCIgPyBjaGVjayAmJiByZXN1bHQuaW5kZXhPZiggY2hlY2sgKSA9PT0gMCA6XG5cdFx0XHRcdFx0b3BlcmF0b3IgPT09IFwiKj1cIiA/IGNoZWNrICYmIHJlc3VsdC5pbmRleE9mKCBjaGVjayApID4gLTEgOlxuXHRcdFx0XHRcdG9wZXJhdG9yID09PSBcIiQ9XCIgPyBjaGVjayAmJiByZXN1bHQuc2xpY2UoIC1jaGVjay5sZW5ndGggKSA9PT0gY2hlY2sgOlxuXHRcdFx0XHRcdG9wZXJhdG9yID09PSBcIn49XCIgPyAoIFwiIFwiICsgcmVzdWx0LnJlcGxhY2UoIHJ3aGl0ZXNwYWNlLCBcIiBcIiApICsgXCIgXCIgKS5pbmRleE9mKCBjaGVjayApID4gLTEgOlxuXHRcdFx0XHRcdG9wZXJhdG9yID09PSBcInw9XCIgPyByZXN1bHQgPT09IGNoZWNrIHx8IHJlc3VsdC5zbGljZSggMCwgY2hlY2subGVuZ3RoICsgMSApID09PSBjaGVjayArIFwiLVwiIDpcblx0XHRcdFx0XHRmYWxzZTtcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdFwiQ0hJTERcIjogZnVuY3Rpb24oIHR5cGUsIHdoYXQsIGFyZ3VtZW50LCBmaXJzdCwgbGFzdCApIHtcblx0XHRcdHZhciBzaW1wbGUgPSB0eXBlLnNsaWNlKCAwLCAzICkgIT09IFwibnRoXCIsXG5cdFx0XHRcdGZvcndhcmQgPSB0eXBlLnNsaWNlKCAtNCApICE9PSBcImxhc3RcIixcblx0XHRcdFx0b2ZUeXBlID0gd2hhdCA9PT0gXCJvZi10eXBlXCI7XG5cblx0XHRcdHJldHVybiBmaXJzdCA9PT0gMSAmJiBsYXN0ID09PSAwID9cblxuXHRcdFx0XHQvLyBTaG9ydGN1dCBmb3IgOm50aC0qKG4pXG5cdFx0XHRcdGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHRcdHJldHVybiAhIWVsZW0ucGFyZW50Tm9kZTtcblx0XHRcdFx0fSA6XG5cblx0XHRcdFx0ZnVuY3Rpb24oIGVsZW0sIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdFx0XHR2YXIgY2FjaGUsIHVuaXF1ZUNhY2hlLCBvdXRlckNhY2hlLCBub2RlLCBub2RlSW5kZXgsIHN0YXJ0LFxuXHRcdFx0XHRcdFx0ZGlyID0gc2ltcGxlICE9PSBmb3J3YXJkID8gXCJuZXh0U2libGluZ1wiIDogXCJwcmV2aW91c1NpYmxpbmdcIixcblx0XHRcdFx0XHRcdHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcblx0XHRcdFx0XHRcdG5hbWUgPSBvZlR5cGUgJiYgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0XHRcdFx0dXNlQ2FjaGUgPSAheG1sICYmICFvZlR5cGUsXG5cdFx0XHRcdFx0XHRkaWZmID0gZmFsc2U7XG5cblx0XHRcdFx0XHRpZiAoIHBhcmVudCApIHtcblxuXHRcdFx0XHRcdFx0Ly8gOihmaXJzdHxsYXN0fG9ubHkpLShjaGlsZHxvZi10eXBlKVxuXHRcdFx0XHRcdFx0aWYgKCBzaW1wbGUgKSB7XG5cdFx0XHRcdFx0XHRcdHdoaWxlICggZGlyICkge1xuXHRcdFx0XHRcdFx0XHRcdG5vZGUgPSBlbGVtO1xuXHRcdFx0XHRcdFx0XHRcdHdoaWxlICggKG5vZGUgPSBub2RlWyBkaXIgXSkgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIG9mVHlwZSA/XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZSA6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5vZGUubm9kZVR5cGUgPT09IDEgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQvLyBSZXZlcnNlIGRpcmVjdGlvbiBmb3IgOm9ubHktKiAoaWYgd2UgaGF2ZW4ndCB5ZXQgZG9uZSBzbylcblx0XHRcdFx0XHRcdFx0XHRzdGFydCA9IGRpciA9IHR5cGUgPT09IFwib25seVwiICYmICFzdGFydCAmJiBcIm5leHRTaWJsaW5nXCI7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN0YXJ0ID0gWyBmb3J3YXJkID8gcGFyZW50LmZpcnN0Q2hpbGQgOiBwYXJlbnQubGFzdENoaWxkIF07XG5cblx0XHRcdFx0XHRcdC8vIG5vbi14bWwgOm50aC1jaGlsZCguLi4pIHN0b3JlcyBjYWNoZSBkYXRhIG9uIGBwYXJlbnRgXG5cdFx0XHRcdFx0XHRpZiAoIGZvcndhcmQgJiYgdXNlQ2FjaGUgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gU2VlayBgZWxlbWAgZnJvbSBhIHByZXZpb3VzbHktY2FjaGVkIGluZGV4XG5cblx0XHRcdFx0XHRcdFx0Ly8gLi4uaW4gYSBnemlwLWZyaWVuZGx5IHdheVxuXHRcdFx0XHRcdFx0XHRub2RlID0gcGFyZW50O1xuXHRcdFx0XHRcdFx0XHRvdXRlckNhY2hlID0gbm9kZVsgZXhwYW5kbyBdIHx8IChub2RlWyBleHBhbmRvIF0gPSB7fSk7XG5cblx0XHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUgPDkgb25seVxuXHRcdFx0XHRcdFx0XHQvLyBEZWZlbmQgYWdhaW5zdCBjbG9uZWQgYXR0cm9wZXJ0aWVzIChqUXVlcnkgZ2gtMTcwOSlcblx0XHRcdFx0XHRcdFx0dW5pcXVlQ2FjaGUgPSBvdXRlckNhY2hlWyBub2RlLnVuaXF1ZUlEIF0gfHxcblx0XHRcdFx0XHRcdFx0XHQob3V0ZXJDYWNoZVsgbm9kZS51bmlxdWVJRCBdID0ge30pO1xuXG5cdFx0XHRcdFx0XHRcdGNhY2hlID0gdW5pcXVlQ2FjaGVbIHR5cGUgXSB8fCBbXTtcblx0XHRcdFx0XHRcdFx0bm9kZUluZGV4ID0gY2FjaGVbIDAgXSA9PT0gZGlycnVucyAmJiBjYWNoZVsgMSBdO1xuXHRcdFx0XHRcdFx0XHRkaWZmID0gbm9kZUluZGV4ICYmIGNhY2hlWyAyIF07XG5cdFx0XHRcdFx0XHRcdG5vZGUgPSBub2RlSW5kZXggJiYgcGFyZW50LmNoaWxkTm9kZXNbIG5vZGVJbmRleCBdO1xuXG5cdFx0XHRcdFx0XHRcdHdoaWxlICggKG5vZGUgPSArK25vZGVJbmRleCAmJiBub2RlICYmIG5vZGVbIGRpciBdIHx8XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBGYWxsYmFjayB0byBzZWVraW5nIGBlbGVtYCBmcm9tIHRoZSBzdGFydFxuXHRcdFx0XHRcdFx0XHRcdChkaWZmID0gbm9kZUluZGV4ID0gMCkgfHwgc3RhcnQucG9wKCkpICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gV2hlbiBmb3VuZCwgY2FjaGUgaW5kZXhlcyBvbiBgcGFyZW50YCBhbmQgYnJlYWtcblx0XHRcdFx0XHRcdFx0XHRpZiAoIG5vZGUubm9kZVR5cGUgPT09IDEgJiYgKytkaWZmICYmIG5vZGUgPT09IGVsZW0gKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR1bmlxdWVDYWNoZVsgdHlwZSBdID0gWyBkaXJydW5zLCBub2RlSW5kZXgsIGRpZmYgXTtcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBVc2UgcHJldmlvdXNseS1jYWNoZWQgZWxlbWVudCBpbmRleCBpZiBhdmFpbGFibGVcblx0XHRcdFx0XHRcdFx0aWYgKCB1c2VDYWNoZSApIHtcblx0XHRcdFx0XHRcdFx0XHQvLyAuLi5pbiBhIGd6aXAtZnJpZW5kbHkgd2F5XG5cdFx0XHRcdFx0XHRcdFx0bm9kZSA9IGVsZW07XG5cdFx0XHRcdFx0XHRcdFx0b3V0ZXJDYWNoZSA9IG5vZGVbIGV4cGFuZG8gXSB8fCAobm9kZVsgZXhwYW5kbyBdID0ge30pO1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUgPDkgb25seVxuXHRcdFx0XHRcdFx0XHRcdC8vIERlZmVuZCBhZ2FpbnN0IGNsb25lZCBhdHRyb3BlcnRpZXMgKGpRdWVyeSBnaC0xNzA5KVxuXHRcdFx0XHRcdFx0XHRcdHVuaXF1ZUNhY2hlID0gb3V0ZXJDYWNoZVsgbm9kZS51bmlxdWVJRCBdIHx8XG5cdFx0XHRcdFx0XHRcdFx0XHQob3V0ZXJDYWNoZVsgbm9kZS51bmlxdWVJRCBdID0ge30pO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y2FjaGUgPSB1bmlxdWVDYWNoZVsgdHlwZSBdIHx8IFtdO1xuXHRcdFx0XHRcdFx0XHRcdG5vZGVJbmRleCA9IGNhY2hlWyAwIF0gPT09IGRpcnJ1bnMgJiYgY2FjaGVbIDEgXTtcblx0XHRcdFx0XHRcdFx0XHRkaWZmID0gbm9kZUluZGV4O1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Ly8geG1sIDpudGgtY2hpbGQoLi4uKVxuXHRcdFx0XHRcdFx0XHQvLyBvciA6bnRoLWxhc3QtY2hpbGQoLi4uKSBvciA6bnRoKC1sYXN0KT8tb2YtdHlwZSguLi4pXG5cdFx0XHRcdFx0XHRcdGlmICggZGlmZiA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gVXNlIHRoZSBzYW1lIGxvb3AgYXMgYWJvdmUgdG8gc2VlayBgZWxlbWAgZnJvbSB0aGUgc3RhcnRcblx0XHRcdFx0XHRcdFx0XHR3aGlsZSAoIChub2RlID0gKytub2RlSW5kZXggJiYgbm9kZSAmJiBub2RlWyBkaXIgXSB8fFxuXHRcdFx0XHRcdFx0XHRcdFx0KGRpZmYgPSBub2RlSW5kZXggPSAwKSB8fCBzdGFydC5wb3AoKSkgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmICggKCBvZlR5cGUgP1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUgOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRub2RlLm5vZGVUeXBlID09PSAxICkgJiZcblx0XHRcdFx0XHRcdFx0XHRcdFx0KytkaWZmICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIENhY2hlIHRoZSBpbmRleCBvZiBlYWNoIGVuY291bnRlcmVkIGVsZW1lbnRcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCB1c2VDYWNoZSApIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRvdXRlckNhY2hlID0gbm9kZVsgZXhwYW5kbyBdIHx8IChub2RlWyBleHBhbmRvIF0gPSB7fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8OSBvbmx5XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gRGVmZW5kIGFnYWluc3QgY2xvbmVkIGF0dHJvcGVydGllcyAoalF1ZXJ5IGdoLTE3MDkpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dW5pcXVlQ2FjaGUgPSBvdXRlckNhY2hlWyBub2RlLnVuaXF1ZUlEIF0gfHxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdChvdXRlckNhY2hlWyBub2RlLnVuaXF1ZUlEIF0gPSB7fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1bmlxdWVDYWNoZVsgdHlwZSBdID0gWyBkaXJydW5zLCBkaWZmIF07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoIG5vZGUgPT09IGVsZW0gKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gSW5jb3Jwb3JhdGUgdGhlIG9mZnNldCwgdGhlbiBjaGVjayBhZ2FpbnN0IGN5Y2xlIHNpemVcblx0XHRcdFx0XHRcdGRpZmYgLT0gbGFzdDtcblx0XHRcdFx0XHRcdHJldHVybiBkaWZmID09PSBmaXJzdCB8fCAoIGRpZmYgJSBmaXJzdCA9PT0gMCAmJiBkaWZmIC8gZmlyc3QgPj0gMCApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0XCJQU0VVRE9cIjogZnVuY3Rpb24oIHBzZXVkbywgYXJndW1lbnQgKSB7XG5cdFx0XHQvLyBwc2V1ZG8tY2xhc3MgbmFtZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmVcblx0XHRcdC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jcHNldWRvLWNsYXNzZXNcblx0XHRcdC8vIFByaW9yaXRpemUgYnkgY2FzZSBzZW5zaXRpdml0eSBpbiBjYXNlIGN1c3RvbSBwc2V1ZG9zIGFyZSBhZGRlZCB3aXRoIHVwcGVyY2FzZSBsZXR0ZXJzXG5cdFx0XHQvLyBSZW1lbWJlciB0aGF0IHNldEZpbHRlcnMgaW5oZXJpdHMgZnJvbSBwc2V1ZG9zXG5cdFx0XHR2YXIgYXJncyxcblx0XHRcdFx0Zm4gPSBFeHByLnBzZXVkb3NbIHBzZXVkbyBdIHx8IEV4cHIuc2V0RmlsdGVyc1sgcHNldWRvLnRvTG93ZXJDYXNlKCkgXSB8fFxuXHRcdFx0XHRcdFNpenpsZS5lcnJvciggXCJ1bnN1cHBvcnRlZCBwc2V1ZG86IFwiICsgcHNldWRvICk7XG5cblx0XHRcdC8vIFRoZSB1c2VyIG1heSB1c2UgY3JlYXRlUHNldWRvIHRvIGluZGljYXRlIHRoYXRcblx0XHRcdC8vIGFyZ3VtZW50cyBhcmUgbmVlZGVkIHRvIGNyZWF0ZSB0aGUgZmlsdGVyIGZ1bmN0aW9uXG5cdFx0XHQvLyBqdXN0IGFzIFNpenpsZSBkb2VzXG5cdFx0XHRpZiAoIGZuWyBleHBhbmRvIF0gKSB7XG5cdFx0XHRcdHJldHVybiBmbiggYXJndW1lbnQgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQnV0IG1haW50YWluIHN1cHBvcnQgZm9yIG9sZCBzaWduYXR1cmVzXG5cdFx0XHRpZiAoIGZuLmxlbmd0aCA+IDEgKSB7XG5cdFx0XHRcdGFyZ3MgPSBbIHBzZXVkbywgcHNldWRvLCBcIlwiLCBhcmd1bWVudCBdO1xuXHRcdFx0XHRyZXR1cm4gRXhwci5zZXRGaWx0ZXJzLmhhc093blByb3BlcnR5KCBwc2V1ZG8udG9Mb3dlckNhc2UoKSApID9cblx0XHRcdFx0XHRtYXJrRnVuY3Rpb24oZnVuY3Rpb24oIHNlZWQsIG1hdGNoZXMgKSB7XG5cdFx0XHRcdFx0XHR2YXIgaWR4LFxuXHRcdFx0XHRcdFx0XHRtYXRjaGVkID0gZm4oIHNlZWQsIGFyZ3VtZW50ICksXG5cdFx0XHRcdFx0XHRcdGkgPSBtYXRjaGVkLmxlbmd0aDtcblx0XHRcdFx0XHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0XHRcdFx0XHRpZHggPSBpbmRleE9mKCBzZWVkLCBtYXRjaGVkW2ldICk7XG5cdFx0XHRcdFx0XHRcdHNlZWRbIGlkeCBdID0gISggbWF0Y2hlc1sgaWR4IF0gPSBtYXRjaGVkW2ldICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSkgOlxuXHRcdFx0XHRcdGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZuKCBlbGVtLCAwLCBhcmdzICk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZuO1xuXHRcdH1cblx0fSxcblxuXHRwc2V1ZG9zOiB7XG5cdFx0Ly8gUG90ZW50aWFsbHkgY29tcGxleCBwc2V1ZG9zXG5cdFx0XCJub3RcIjogbWFya0Z1bmN0aW9uKGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHRcdC8vIFRyaW0gdGhlIHNlbGVjdG9yIHBhc3NlZCB0byBjb21waWxlXG5cdFx0XHQvLyB0byBhdm9pZCB0cmVhdGluZyBsZWFkaW5nIGFuZCB0cmFpbGluZ1xuXHRcdFx0Ly8gc3BhY2VzIGFzIGNvbWJpbmF0b3JzXG5cdFx0XHR2YXIgaW5wdXQgPSBbXSxcblx0XHRcdFx0cmVzdWx0cyA9IFtdLFxuXHRcdFx0XHRtYXRjaGVyID0gY29tcGlsZSggc2VsZWN0b3IucmVwbGFjZSggcnRyaW0sIFwiJDFcIiApICk7XG5cblx0XHRcdHJldHVybiBtYXRjaGVyWyBleHBhbmRvIF0gP1xuXHRcdFx0XHRtYXJrRnVuY3Rpb24oZnVuY3Rpb24oIHNlZWQsIG1hdGNoZXMsIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdFx0XHR2YXIgZWxlbSxcblx0XHRcdFx0XHRcdHVubWF0Y2hlZCA9IG1hdGNoZXIoIHNlZWQsIG51bGwsIHhtbCwgW10gKSxcblx0XHRcdFx0XHRcdGkgPSBzZWVkLmxlbmd0aDtcblxuXHRcdFx0XHRcdC8vIE1hdGNoIGVsZW1lbnRzIHVubWF0Y2hlZCBieSBgbWF0Y2hlcmBcblx0XHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRcdGlmICggKGVsZW0gPSB1bm1hdGNoZWRbaV0pICkge1xuXHRcdFx0XHRcdFx0XHRzZWVkW2ldID0gIShtYXRjaGVzW2ldID0gZWxlbSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSA6XG5cdFx0XHRcdGZ1bmN0aW9uKCBlbGVtLCBjb250ZXh0LCB4bWwgKSB7XG5cdFx0XHRcdFx0aW5wdXRbMF0gPSBlbGVtO1xuXHRcdFx0XHRcdG1hdGNoZXIoIGlucHV0LCBudWxsLCB4bWwsIHJlc3VsdHMgKTtcblx0XHRcdFx0XHQvLyBEb24ndCBrZWVwIHRoZSBlbGVtZW50IChpc3N1ZSAjMjk5KVxuXHRcdFx0XHRcdGlucHV0WzBdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gIXJlc3VsdHMucG9wKCk7XG5cdFx0XHRcdH07XG5cdFx0fSksXG5cblx0XHRcImhhc1wiOiBtYXJrRnVuY3Rpb24oZnVuY3Rpb24oIHNlbGVjdG9yICkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHRyZXR1cm4gU2l6emxlKCBzZWxlY3RvciwgZWxlbSApLmxlbmd0aCA+IDA7XG5cdFx0XHR9O1xuXHRcdH0pLFxuXG5cdFx0XCJjb250YWluc1wiOiBtYXJrRnVuY3Rpb24oZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHRyZXR1cm4gKCBlbGVtLnRleHRDb250ZW50IHx8IGVsZW0uaW5uZXJUZXh0IHx8IGdldFRleHQoIGVsZW0gKSApLmluZGV4T2YoIHRleHQgKSA+IC0xO1xuXHRcdFx0fTtcblx0XHR9KSxcblxuXHRcdC8vIFwiV2hldGhlciBhbiBlbGVtZW50IGlzIHJlcHJlc2VudGVkIGJ5IGEgOmxhbmcoKSBzZWxlY3RvclxuXHRcdC8vIGlzIGJhc2VkIHNvbGVseSBvbiB0aGUgZWxlbWVudCdzIGxhbmd1YWdlIHZhbHVlXG5cdFx0Ly8gYmVpbmcgZXF1YWwgdG8gdGhlIGlkZW50aWZpZXIgQyxcblx0XHQvLyBvciBiZWdpbm5pbmcgd2l0aCB0aGUgaWRlbnRpZmllciBDIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IFwiLVwiLlxuXHRcdC8vIFRoZSBtYXRjaGluZyBvZiBDIGFnYWluc3QgdGhlIGVsZW1lbnQncyBsYW5ndWFnZSB2YWx1ZSBpcyBwZXJmb3JtZWQgY2FzZS1pbnNlbnNpdGl2ZWx5LlxuXHRcdC8vIFRoZSBpZGVudGlmaWVyIEMgZG9lcyBub3QgaGF2ZSB0byBiZSBhIHZhbGlkIGxhbmd1YWdlIG5hbWUuXCJcblx0XHQvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2xhbmctcHNldWRvXG5cdFx0XCJsYW5nXCI6IG1hcmtGdW5jdGlvbiggZnVuY3Rpb24oIGxhbmcgKSB7XG5cdFx0XHQvLyBsYW5nIHZhbHVlIG11c3QgYmUgYSB2YWxpZCBpZGVudGlmaWVyXG5cdFx0XHRpZiAoICFyaWRlbnRpZmllci50ZXN0KGxhbmcgfHwgXCJcIikgKSB7XG5cdFx0XHRcdFNpenpsZS5lcnJvciggXCJ1bnN1cHBvcnRlZCBsYW5nOiBcIiArIGxhbmcgKTtcblx0XHRcdH1cblx0XHRcdGxhbmcgPSBsYW5nLnJlcGxhY2UoIHJ1bmVzY2FwZSwgZnVuZXNjYXBlICkudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJldHVybiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0dmFyIGVsZW1MYW5nO1xuXHRcdFx0XHRkbyB7XG5cdFx0XHRcdFx0aWYgKCAoZWxlbUxhbmcgPSBkb2N1bWVudElzSFRNTCA/XG5cdFx0XHRcdFx0XHRlbGVtLmxhbmcgOlxuXHRcdFx0XHRcdFx0ZWxlbS5nZXRBdHRyaWJ1dGUoXCJ4bWw6bGFuZ1wiKSB8fCBlbGVtLmdldEF0dHJpYnV0ZShcImxhbmdcIikpICkge1xuXG5cdFx0XHRcdFx0XHRlbGVtTGFuZyA9IGVsZW1MYW5nLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZWxlbUxhbmcgPT09IGxhbmcgfHwgZWxlbUxhbmcuaW5kZXhPZiggbGFuZyArIFwiLVwiICkgPT09IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IHdoaWxlICggKGVsZW0gPSBlbGVtLnBhcmVudE5vZGUpICYmIGVsZW0ubm9kZVR5cGUgPT09IDEgKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fTtcblx0XHR9KSxcblxuXHRcdC8vIE1pc2NlbGxhbmVvdXNcblx0XHRcInRhcmdldFwiOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuXHRcdFx0cmV0dXJuIGhhc2ggJiYgaGFzaC5zbGljZSggMSApID09PSBlbGVtLmlkO1xuXHRcdH0sXG5cblx0XHRcInJvb3RcIjogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gZG9jRWxlbTtcblx0XHR9LFxuXG5cdFx0XCJmb2N1c1wiOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmICghZG9jdW1lbnQuaGFzRm9jdXMgfHwgZG9jdW1lbnQuaGFzRm9jdXMoKSkgJiYgISEoZWxlbS50eXBlIHx8IGVsZW0uaHJlZiB8fCB+ZWxlbS50YWJJbmRleCk7XG5cdFx0fSxcblxuXHRcdC8vIEJvb2xlYW4gcHJvcGVydGllc1xuXHRcdFwiZW5hYmxlZFwiOiBjcmVhdGVEaXNhYmxlZFBzZXVkbyggZmFsc2UgKSxcblx0XHRcImRpc2FibGVkXCI6IGNyZWF0ZURpc2FibGVkUHNldWRvKCB0cnVlICksXG5cblx0XHRcImNoZWNrZWRcIjogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHQvLyBJbiBDU1MzLCA6Y2hlY2tlZCBzaG91bGQgcmV0dXJuIGJvdGggY2hlY2tlZCBhbmQgc2VsZWN0ZWQgZWxlbWVudHNcblx0XHRcdC8vIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTEvUkVDLWNzczMtc2VsZWN0b3JzLTIwMTEwOTI5LyNjaGVja2VkXG5cdFx0XHR2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRyZXR1cm4gKG5vZGVOYW1lID09PSBcImlucHV0XCIgJiYgISFlbGVtLmNoZWNrZWQpIHx8IChub2RlTmFtZSA9PT0gXCJvcHRpb25cIiAmJiAhIWVsZW0uc2VsZWN0ZWQpO1xuXHRcdH0sXG5cblx0XHRcInNlbGVjdGVkXCI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0Ly8gQWNjZXNzaW5nIHRoaXMgcHJvcGVydHkgbWFrZXMgc2VsZWN0ZWQtYnktZGVmYXVsdFxuXHRcdFx0Ly8gb3B0aW9ucyBpbiBTYWZhcmkgd29yayBwcm9wZXJseVxuXHRcdFx0aWYgKCBlbGVtLnBhcmVudE5vZGUgKSB7XG5cdFx0XHRcdGVsZW0ucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZWxlbS5zZWxlY3RlZCA9PT0gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0Ly8gQ29udGVudHNcblx0XHRcImVtcHR5XCI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0Ly8gaHR0cDovL3d3dy53My5vcmcvVFIvc2VsZWN0b3JzLyNlbXB0eS1wc2V1ZG9cblx0XHRcdC8vIDplbXB0eSBpcyBuZWdhdGVkIGJ5IGVsZW1lbnQgKDEpIG9yIGNvbnRlbnQgbm9kZXMgKHRleHQ6IDM7IGNkYXRhOiA0OyBlbnRpdHkgcmVmOiA1KSxcblx0XHRcdC8vICAgYnV0IG5vdCBieSBvdGhlcnMgKGNvbW1lbnQ6IDg7IHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb246IDc7IGV0Yy4pXG5cdFx0XHQvLyBub2RlVHlwZSA8IDYgd29ya3MgYmVjYXVzZSBhdHRyaWJ1dGVzICgyKSBkbyBub3QgYXBwZWFyIGFzIGNoaWxkcmVuXG5cdFx0XHRmb3IgKCBlbGVtID0gZWxlbS5maXJzdENoaWxkOyBlbGVtOyBlbGVtID0gZWxlbS5uZXh0U2libGluZyApIHtcblx0XHRcdFx0aWYgKCBlbGVtLm5vZGVUeXBlIDwgNiApIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cblx0XHRcInBhcmVudFwiOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiAhRXhwci5wc2V1ZG9zW1wiZW1wdHlcIl0oIGVsZW0gKTtcblx0XHR9LFxuXG5cdFx0Ly8gRWxlbWVudC9pbnB1dCB0eXBlc1xuXHRcdFwiaGVhZGVyXCI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIHJoZWFkZXIudGVzdCggZWxlbS5ub2RlTmFtZSApO1xuXHRcdH0sXG5cblx0XHRcImlucHV0XCI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIHJpbnB1dHMudGVzdCggZWxlbS5ub2RlTmFtZSApO1xuXHRcdH0sXG5cblx0XHRcImJ1dHRvblwiOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHZhciBuYW1lID0gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIG5hbWUgPT09IFwiaW5wdXRcIiAmJiBlbGVtLnR5cGUgPT09IFwiYnV0dG9uXCIgfHwgbmFtZSA9PT0gXCJidXR0b25cIjtcblx0XHR9LFxuXG5cdFx0XCJ0ZXh0XCI6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0dmFyIGF0dHI7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImlucHV0XCIgJiZcblx0XHRcdFx0ZWxlbS50eXBlID09PSBcInRleHRcIiAmJlxuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IElFPDhcblx0XHRcdFx0Ly8gTmV3IEhUTUw1IGF0dHJpYnV0ZSB2YWx1ZXMgKGUuZy4sIFwic2VhcmNoXCIpIGFwcGVhciB3aXRoIGVsZW0udHlwZSA9PT0gXCJ0ZXh0XCJcblx0XHRcdFx0KCAoYXR0ciA9IGVsZW0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSkgPT0gbnVsbCB8fCBhdHRyLnRvTG93ZXJDYXNlKCkgPT09IFwidGV4dFwiICk7XG5cdFx0fSxcblxuXHRcdC8vIFBvc2l0aW9uLWluLWNvbGxlY3Rpb25cblx0XHRcImZpcnN0XCI6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gWyAwIF07XG5cdFx0fSksXG5cblx0XHRcImxhc3RcIjogY3JlYXRlUG9zaXRpb25hbFBzZXVkbyhmdW5jdGlvbiggbWF0Y2hJbmRleGVzLCBsZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gWyBsZW5ndGggLSAxIF07XG5cdFx0fSksXG5cblx0XHRcImVxXCI6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oZnVuY3Rpb24oIG1hdGNoSW5kZXhlcywgbGVuZ3RoLCBhcmd1bWVudCApIHtcblx0XHRcdHJldHVybiBbIGFyZ3VtZW50IDwgMCA/IGFyZ3VtZW50ICsgbGVuZ3RoIDogYXJndW1lbnQgXTtcblx0XHR9KSxcblxuXHRcdFwiZXZlblwiOiBjcmVhdGVQb3NpdGlvbmFsUHNldWRvKGZ1bmN0aW9uKCBtYXRjaEluZGV4ZXMsIGxlbmd0aCApIHtcblx0XHRcdHZhciBpID0gMDtcblx0XHRcdGZvciAoIDsgaSA8IGxlbmd0aDsgaSArPSAyICkge1xuXHRcdFx0XHRtYXRjaEluZGV4ZXMucHVzaCggaSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1hdGNoSW5kZXhlcztcblx0XHR9KSxcblxuXHRcdFwib2RkXCI6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oZnVuY3Rpb24oIG1hdGNoSW5kZXhlcywgbGVuZ3RoICkge1xuXHRcdFx0dmFyIGkgPSAxO1xuXHRcdFx0Zm9yICggOyBpIDwgbGVuZ3RoOyBpICs9IDIgKSB7XG5cdFx0XHRcdG1hdGNoSW5kZXhlcy5wdXNoKCBpICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWF0Y2hJbmRleGVzO1xuXHRcdH0pLFxuXG5cdFx0XCJsdFwiOiBjcmVhdGVQb3NpdGlvbmFsUHNldWRvKGZ1bmN0aW9uKCBtYXRjaEluZGV4ZXMsIGxlbmd0aCwgYXJndW1lbnQgKSB7XG5cdFx0XHR2YXIgaSA9IGFyZ3VtZW50IDwgMCA/IGFyZ3VtZW50ICsgbGVuZ3RoIDogYXJndW1lbnQ7XG5cdFx0XHRmb3IgKCA7IC0taSA+PSAwOyApIHtcblx0XHRcdFx0bWF0Y2hJbmRleGVzLnB1c2goIGkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtYXRjaEluZGV4ZXM7XG5cdFx0fSksXG5cblx0XHRcImd0XCI6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oZnVuY3Rpb24oIG1hdGNoSW5kZXhlcywgbGVuZ3RoLCBhcmd1bWVudCApIHtcblx0XHRcdHZhciBpID0gYXJndW1lbnQgPCAwID8gYXJndW1lbnQgKyBsZW5ndGggOiBhcmd1bWVudDtcblx0XHRcdGZvciAoIDsgKytpIDwgbGVuZ3RoOyApIHtcblx0XHRcdFx0bWF0Y2hJbmRleGVzLnB1c2goIGkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtYXRjaEluZGV4ZXM7XG5cdFx0fSlcblx0fVxufTtcblxuRXhwci5wc2V1ZG9zW1wibnRoXCJdID0gRXhwci5wc2V1ZG9zW1wiZXFcIl07XG5cbi8vIEFkZCBidXR0b24vaW5wdXQgdHlwZSBwc2V1ZG9zXG5mb3IgKCBpIGluIHsgcmFkaW86IHRydWUsIGNoZWNrYm94OiB0cnVlLCBmaWxlOiB0cnVlLCBwYXNzd29yZDogdHJ1ZSwgaW1hZ2U6IHRydWUgfSApIHtcblx0RXhwci5wc2V1ZG9zWyBpIF0gPSBjcmVhdGVJbnB1dFBzZXVkbyggaSApO1xufVxuZm9yICggaSBpbiB7IHN1Ym1pdDogdHJ1ZSwgcmVzZXQ6IHRydWUgfSApIHtcblx0RXhwci5wc2V1ZG9zWyBpIF0gPSBjcmVhdGVCdXR0b25Qc2V1ZG8oIGkgKTtcbn1cblxuLy8gRWFzeSBBUEkgZm9yIGNyZWF0aW5nIG5ldyBzZXRGaWx0ZXJzXG5mdW5jdGlvbiBzZXRGaWx0ZXJzKCkge31cbnNldEZpbHRlcnMucHJvdG90eXBlID0gRXhwci5maWx0ZXJzID0gRXhwci5wc2V1ZG9zO1xuRXhwci5zZXRGaWx0ZXJzID0gbmV3IHNldEZpbHRlcnMoKTtcblxudG9rZW5pemUgPSBTaXp6bGUudG9rZW5pemUgPSBmdW5jdGlvbiggc2VsZWN0b3IsIHBhcnNlT25seSApIHtcblx0dmFyIG1hdGNoZWQsIG1hdGNoLCB0b2tlbnMsIHR5cGUsXG5cdFx0c29GYXIsIGdyb3VwcywgcHJlRmlsdGVycyxcblx0XHRjYWNoZWQgPSB0b2tlbkNhY2hlWyBzZWxlY3RvciArIFwiIFwiIF07XG5cblx0aWYgKCBjYWNoZWQgKSB7XG5cdFx0cmV0dXJuIHBhcnNlT25seSA/IDAgOiBjYWNoZWQuc2xpY2UoIDAgKTtcblx0fVxuXG5cdHNvRmFyID0gc2VsZWN0b3I7XG5cdGdyb3VwcyA9IFtdO1xuXHRwcmVGaWx0ZXJzID0gRXhwci5wcmVGaWx0ZXI7XG5cblx0d2hpbGUgKCBzb0ZhciApIHtcblxuXHRcdC8vIENvbW1hIGFuZCBmaXJzdCBydW5cblx0XHRpZiAoICFtYXRjaGVkIHx8IChtYXRjaCA9IHJjb21tYS5leGVjKCBzb0ZhciApKSApIHtcblx0XHRcdGlmICggbWF0Y2ggKSB7XG5cdFx0XHRcdC8vIERvbid0IGNvbnN1bWUgdHJhaWxpbmcgY29tbWFzIGFzIHZhbGlkXG5cdFx0XHRcdHNvRmFyID0gc29GYXIuc2xpY2UoIG1hdGNoWzBdLmxlbmd0aCApIHx8IHNvRmFyO1xuXHRcdFx0fVxuXHRcdFx0Z3JvdXBzLnB1c2goICh0b2tlbnMgPSBbXSkgKTtcblx0XHR9XG5cblx0XHRtYXRjaGVkID0gZmFsc2U7XG5cblx0XHQvLyBDb21iaW5hdG9yc1xuXHRcdGlmICggKG1hdGNoID0gcmNvbWJpbmF0b3JzLmV4ZWMoIHNvRmFyICkpICkge1xuXHRcdFx0bWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XG5cdFx0XHR0b2tlbnMucHVzaCh7XG5cdFx0XHRcdHZhbHVlOiBtYXRjaGVkLFxuXHRcdFx0XHQvLyBDYXN0IGRlc2NlbmRhbnQgY29tYmluYXRvcnMgdG8gc3BhY2Vcblx0XHRcdFx0dHlwZTogbWF0Y2hbMF0ucmVwbGFjZSggcnRyaW0sIFwiIFwiIClcblx0XHRcdH0pO1xuXHRcdFx0c29GYXIgPSBzb0Zhci5zbGljZSggbWF0Y2hlZC5sZW5ndGggKTtcblx0XHR9XG5cblx0XHQvLyBGaWx0ZXJzXG5cdFx0Zm9yICggdHlwZSBpbiBFeHByLmZpbHRlciApIHtcblx0XHRcdGlmICggKG1hdGNoID0gbWF0Y2hFeHByWyB0eXBlIF0uZXhlYyggc29GYXIgKSkgJiYgKCFwcmVGaWx0ZXJzWyB0eXBlIF0gfHxcblx0XHRcdFx0KG1hdGNoID0gcHJlRmlsdGVyc1sgdHlwZSBdKCBtYXRjaCApKSkgKSB7XG5cdFx0XHRcdG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xuXHRcdFx0XHR0b2tlbnMucHVzaCh7XG5cdFx0XHRcdFx0dmFsdWU6IG1hdGNoZWQsXG5cdFx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0XHRtYXRjaGVzOiBtYXRjaFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0c29GYXIgPSBzb0Zhci5zbGljZSggbWF0Y2hlZC5sZW5ndGggKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoICFtYXRjaGVkICkge1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBsZW5ndGggb2YgdGhlIGludmFsaWQgZXhjZXNzXG5cdC8vIGlmIHdlJ3JlIGp1c3QgcGFyc2luZ1xuXHQvLyBPdGhlcndpc2UsIHRocm93IGFuIGVycm9yIG9yIHJldHVybiB0b2tlbnNcblx0cmV0dXJuIHBhcnNlT25seSA/XG5cdFx0c29GYXIubGVuZ3RoIDpcblx0XHRzb0ZhciA/XG5cdFx0XHRTaXp6bGUuZXJyb3IoIHNlbGVjdG9yICkgOlxuXHRcdFx0Ly8gQ2FjaGUgdGhlIHRva2Vuc1xuXHRcdFx0dG9rZW5DYWNoZSggc2VsZWN0b3IsIGdyb3VwcyApLnNsaWNlKCAwICk7XG59O1xuXG5mdW5jdGlvbiB0b1NlbGVjdG9yKCB0b2tlbnMgKSB7XG5cdHZhciBpID0gMCxcblx0XHRsZW4gPSB0b2tlbnMubGVuZ3RoLFxuXHRcdHNlbGVjdG9yID0gXCJcIjtcblx0Zm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0c2VsZWN0b3IgKz0gdG9rZW5zW2ldLnZhbHVlO1xuXHR9XG5cdHJldHVybiBzZWxlY3Rvcjtcbn1cblxuZnVuY3Rpb24gYWRkQ29tYmluYXRvciggbWF0Y2hlciwgY29tYmluYXRvciwgYmFzZSApIHtcblx0dmFyIGRpciA9IGNvbWJpbmF0b3IuZGlyLFxuXHRcdHNraXAgPSBjb21iaW5hdG9yLm5leHQsXG5cdFx0a2V5ID0gc2tpcCB8fCBkaXIsXG5cdFx0Y2hlY2tOb25FbGVtZW50cyA9IGJhc2UgJiYga2V5ID09PSBcInBhcmVudE5vZGVcIixcblx0XHRkb25lTmFtZSA9IGRvbmUrKztcblxuXHRyZXR1cm4gY29tYmluYXRvci5maXJzdCA/XG5cdFx0Ly8gQ2hlY2sgYWdhaW5zdCBjbG9zZXN0IGFuY2VzdG9yL3ByZWNlZGluZyBlbGVtZW50XG5cdFx0ZnVuY3Rpb24oIGVsZW0sIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdHdoaWxlICggKGVsZW0gPSBlbGVtWyBkaXIgXSkgKSB7XG5cdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSB8fCBjaGVja05vbkVsZW1lbnRzICkge1xuXHRcdFx0XHRcdHJldHVybiBtYXRjaGVyKCBlbGVtLCBjb250ZXh0LCB4bWwgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gOlxuXG5cdFx0Ly8gQ2hlY2sgYWdhaW5zdCBhbGwgYW5jZXN0b3IvcHJlY2VkaW5nIGVsZW1lbnRzXG5cdFx0ZnVuY3Rpb24oIGVsZW0sIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdHZhciBvbGRDYWNoZSwgdW5pcXVlQ2FjaGUsIG91dGVyQ2FjaGUsXG5cdFx0XHRcdG5ld0NhY2hlID0gWyBkaXJydW5zLCBkb25lTmFtZSBdO1xuXG5cdFx0XHQvLyBXZSBjYW4ndCBzZXQgYXJiaXRyYXJ5IGRhdGEgb24gWE1MIG5vZGVzLCBzbyB0aGV5IGRvbid0IGJlbmVmaXQgZnJvbSBjb21iaW5hdG9yIGNhY2hpbmdcblx0XHRcdGlmICggeG1sICkge1xuXHRcdFx0XHR3aGlsZSAoIChlbGVtID0gZWxlbVsgZGlyIF0pICkge1xuXHRcdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSB8fCBjaGVja05vbkVsZW1lbnRzICkge1xuXHRcdFx0XHRcdFx0aWYgKCBtYXRjaGVyKCBlbGVtLCBjb250ZXh0LCB4bWwgKSApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3aGlsZSAoIChlbGVtID0gZWxlbVsgZGlyIF0pICkge1xuXHRcdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSB8fCBjaGVja05vbkVsZW1lbnRzICkge1xuXHRcdFx0XHRcdFx0b3V0ZXJDYWNoZSA9IGVsZW1bIGV4cGFuZG8gXSB8fCAoZWxlbVsgZXhwYW5kbyBdID0ge30pO1xuXG5cdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8OSBvbmx5XG5cdFx0XHRcdFx0XHQvLyBEZWZlbmQgYWdhaW5zdCBjbG9uZWQgYXR0cm9wZXJ0aWVzIChqUXVlcnkgZ2gtMTcwOSlcblx0XHRcdFx0XHRcdHVuaXF1ZUNhY2hlID0gb3V0ZXJDYWNoZVsgZWxlbS51bmlxdWVJRCBdIHx8IChvdXRlckNhY2hlWyBlbGVtLnVuaXF1ZUlEIF0gPSB7fSk7XG5cblx0XHRcdFx0XHRcdGlmICggc2tpcCAmJiBza2lwID09PSBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW0gPSBlbGVtWyBkaXIgXSB8fCBlbGVtO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICggKG9sZENhY2hlID0gdW5pcXVlQ2FjaGVbIGtleSBdKSAmJlxuXHRcdFx0XHRcdFx0XHRvbGRDYWNoZVsgMCBdID09PSBkaXJydW5zICYmIG9sZENhY2hlWyAxIF0gPT09IGRvbmVOYW1lICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIEFzc2lnbiB0byBuZXdDYWNoZSBzbyByZXN1bHRzIGJhY2stcHJvcGFnYXRlIHRvIHByZXZpb3VzIGVsZW1lbnRzXG5cdFx0XHRcdFx0XHRcdHJldHVybiAobmV3Q2FjaGVbIDIgXSA9IG9sZENhY2hlWyAyIF0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly8gUmV1c2UgbmV3Y2FjaGUgc28gcmVzdWx0cyBiYWNrLXByb3BhZ2F0ZSB0byBwcmV2aW91cyBlbGVtZW50c1xuXHRcdFx0XHRcdFx0XHR1bmlxdWVDYWNoZVsga2V5IF0gPSBuZXdDYWNoZTtcblxuXHRcdFx0XHRcdFx0XHQvLyBBIG1hdGNoIG1lYW5zIHdlJ3JlIGRvbmU7IGEgZmFpbCBtZWFucyB3ZSBoYXZlIHRvIGtlZXAgY2hlY2tpbmdcblx0XHRcdFx0XHRcdFx0aWYgKCAobmV3Q2FjaGVbIDIgXSA9IG1hdGNoZXIoIGVsZW0sIGNvbnRleHQsIHhtbCApKSApIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRNYXRjaGVyKCBtYXRjaGVycyApIHtcblx0cmV0dXJuIG1hdGNoZXJzLmxlbmd0aCA+IDEgP1xuXHRcdGZ1bmN0aW9uKCBlbGVtLCBjb250ZXh0LCB4bWwgKSB7XG5cdFx0XHR2YXIgaSA9IG1hdGNoZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0XHRpZiAoICFtYXRjaGVyc1tpXSggZWxlbSwgY29udGV4dCwgeG1sICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IDpcblx0XHRtYXRjaGVyc1swXTtcbn1cblxuZnVuY3Rpb24gbXVsdGlwbGVDb250ZXh0cyggc2VsZWN0b3IsIGNvbnRleHRzLCByZXN1bHRzICkge1xuXHR2YXIgaSA9IDAsXG5cdFx0bGVuID0gY29udGV4dHMubGVuZ3RoO1xuXHRmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRTaXp6bGUoIHNlbGVjdG9yLCBjb250ZXh0c1tpXSwgcmVzdWx0cyApO1xuXHR9XG5cdHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBjb25kZW5zZSggdW5tYXRjaGVkLCBtYXAsIGZpbHRlciwgY29udGV4dCwgeG1sICkge1xuXHR2YXIgZWxlbSxcblx0XHRuZXdVbm1hdGNoZWQgPSBbXSxcblx0XHRpID0gMCxcblx0XHRsZW4gPSB1bm1hdGNoZWQubGVuZ3RoLFxuXHRcdG1hcHBlZCA9IG1hcCAhPSBudWxsO1xuXG5cdGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdGlmICggKGVsZW0gPSB1bm1hdGNoZWRbaV0pICkge1xuXHRcdFx0aWYgKCAhZmlsdGVyIHx8IGZpbHRlciggZWxlbSwgY29udGV4dCwgeG1sICkgKSB7XG5cdFx0XHRcdG5ld1VubWF0Y2hlZC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdGlmICggbWFwcGVkICkge1xuXHRcdFx0XHRcdG1hcC5wdXNoKCBpICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbmV3VW5tYXRjaGVkO1xufVxuXG5mdW5jdGlvbiBzZXRNYXRjaGVyKCBwcmVGaWx0ZXIsIHNlbGVjdG9yLCBtYXRjaGVyLCBwb3N0RmlsdGVyLCBwb3N0RmluZGVyLCBwb3N0U2VsZWN0b3IgKSB7XG5cdGlmICggcG9zdEZpbHRlciAmJiAhcG9zdEZpbHRlclsgZXhwYW5kbyBdICkge1xuXHRcdHBvc3RGaWx0ZXIgPSBzZXRNYXRjaGVyKCBwb3N0RmlsdGVyICk7XG5cdH1cblx0aWYgKCBwb3N0RmluZGVyICYmICFwb3N0RmluZGVyWyBleHBhbmRvIF0gKSB7XG5cdFx0cG9zdEZpbmRlciA9IHNldE1hdGNoZXIoIHBvc3RGaW5kZXIsIHBvc3RTZWxlY3RvciApO1xuXHR9XG5cdHJldHVybiBtYXJrRnVuY3Rpb24oZnVuY3Rpb24oIHNlZWQsIHJlc3VsdHMsIGNvbnRleHQsIHhtbCApIHtcblx0XHR2YXIgdGVtcCwgaSwgZWxlbSxcblx0XHRcdHByZU1hcCA9IFtdLFxuXHRcdFx0cG9zdE1hcCA9IFtdLFxuXHRcdFx0cHJlZXhpc3RpbmcgPSByZXN1bHRzLmxlbmd0aCxcblxuXHRcdFx0Ly8gR2V0IGluaXRpYWwgZWxlbWVudHMgZnJvbSBzZWVkIG9yIGNvbnRleHRcblx0XHRcdGVsZW1zID0gc2VlZCB8fCBtdWx0aXBsZUNvbnRleHRzKCBzZWxlY3RvciB8fCBcIipcIiwgY29udGV4dC5ub2RlVHlwZSA/IFsgY29udGV4dCBdIDogY29udGV4dCwgW10gKSxcblxuXHRcdFx0Ly8gUHJlZmlsdGVyIHRvIGdldCBtYXRjaGVyIGlucHV0LCBwcmVzZXJ2aW5nIGEgbWFwIGZvciBzZWVkLXJlc3VsdHMgc3luY2hyb25pemF0aW9uXG5cdFx0XHRtYXRjaGVySW4gPSBwcmVGaWx0ZXIgJiYgKCBzZWVkIHx8ICFzZWxlY3RvciApID9cblx0XHRcdFx0Y29uZGVuc2UoIGVsZW1zLCBwcmVNYXAsIHByZUZpbHRlciwgY29udGV4dCwgeG1sICkgOlxuXHRcdFx0XHRlbGVtcyxcblxuXHRcdFx0bWF0Y2hlck91dCA9IG1hdGNoZXIgP1xuXHRcdFx0XHQvLyBJZiB3ZSBoYXZlIGEgcG9zdEZpbmRlciwgb3IgZmlsdGVyZWQgc2VlZCwgb3Igbm9uLXNlZWQgcG9zdEZpbHRlciBvciBwcmVleGlzdGluZyByZXN1bHRzLFxuXHRcdFx0XHRwb3N0RmluZGVyIHx8ICggc2VlZCA/IHByZUZpbHRlciA6IHByZWV4aXN0aW5nIHx8IHBvc3RGaWx0ZXIgKSA/XG5cblx0XHRcdFx0XHQvLyAuLi5pbnRlcm1lZGlhdGUgcHJvY2Vzc2luZyBpcyBuZWNlc3Nhcnlcblx0XHRcdFx0XHRbXSA6XG5cblx0XHRcdFx0XHQvLyAuLi5vdGhlcndpc2UgdXNlIHJlc3VsdHMgZGlyZWN0bHlcblx0XHRcdFx0XHRyZXN1bHRzIDpcblx0XHRcdFx0bWF0Y2hlckluO1xuXG5cdFx0Ly8gRmluZCBwcmltYXJ5IG1hdGNoZXNcblx0XHRpZiAoIG1hdGNoZXIgKSB7XG5cdFx0XHRtYXRjaGVyKCBtYXRjaGVySW4sIG1hdGNoZXJPdXQsIGNvbnRleHQsIHhtbCApO1xuXHRcdH1cblxuXHRcdC8vIEFwcGx5IHBvc3RGaWx0ZXJcblx0XHRpZiAoIHBvc3RGaWx0ZXIgKSB7XG5cdFx0XHR0ZW1wID0gY29uZGVuc2UoIG1hdGNoZXJPdXQsIHBvc3RNYXAgKTtcblx0XHRcdHBvc3RGaWx0ZXIoIHRlbXAsIFtdLCBjb250ZXh0LCB4bWwgKTtcblxuXHRcdFx0Ly8gVW4tbWF0Y2ggZmFpbGluZyBlbGVtZW50cyBieSBtb3ZpbmcgdGhlbSBiYWNrIHRvIG1hdGNoZXJJblxuXHRcdFx0aSA9IHRlbXAubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRcdGlmICggKGVsZW0gPSB0ZW1wW2ldKSApIHtcblx0XHRcdFx0XHRtYXRjaGVyT3V0WyBwb3N0TWFwW2ldIF0gPSAhKG1hdGNoZXJJblsgcG9zdE1hcFtpXSBdID0gZWxlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIHNlZWQgKSB7XG5cdFx0XHRpZiAoIHBvc3RGaW5kZXIgfHwgcHJlRmlsdGVyICkge1xuXHRcdFx0XHRpZiAoIHBvc3RGaW5kZXIgKSB7XG5cdFx0XHRcdFx0Ly8gR2V0IHRoZSBmaW5hbCBtYXRjaGVyT3V0IGJ5IGNvbmRlbnNpbmcgdGhpcyBpbnRlcm1lZGlhdGUgaW50byBwb3N0RmluZGVyIGNvbnRleHRzXG5cdFx0XHRcdFx0dGVtcCA9IFtdO1xuXHRcdFx0XHRcdGkgPSBtYXRjaGVyT3V0Lmxlbmd0aDtcblx0XHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRcdGlmICggKGVsZW0gPSBtYXRjaGVyT3V0W2ldKSApIHtcblx0XHRcdFx0XHRcdFx0Ly8gUmVzdG9yZSBtYXRjaGVySW4gc2luY2UgZWxlbSBpcyBub3QgeWV0IGEgZmluYWwgbWF0Y2hcblx0XHRcdFx0XHRcdFx0dGVtcC5wdXNoKCAobWF0Y2hlckluW2ldID0gZWxlbSkgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cG9zdEZpbmRlciggbnVsbCwgKG1hdGNoZXJPdXQgPSBbXSksIHRlbXAsIHhtbCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTW92ZSBtYXRjaGVkIGVsZW1lbnRzIGZyb20gc2VlZCB0byByZXN1bHRzIHRvIGtlZXAgdGhlbSBzeW5jaHJvbml6ZWRcblx0XHRcdFx0aSA9IG1hdGNoZXJPdXQubGVuZ3RoO1xuXHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRpZiAoIChlbGVtID0gbWF0Y2hlck91dFtpXSkgJiZcblx0XHRcdFx0XHRcdCh0ZW1wID0gcG9zdEZpbmRlciA/IGluZGV4T2YoIHNlZWQsIGVsZW0gKSA6IHByZU1hcFtpXSkgPiAtMSApIHtcblxuXHRcdFx0XHRcdFx0c2VlZFt0ZW1wXSA9ICEocmVzdWx0c1t0ZW1wXSA9IGVsZW0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0Ly8gQWRkIGVsZW1lbnRzIHRvIHJlc3VsdHMsIHRocm91Z2ggcG9zdEZpbmRlciBpZiBkZWZpbmVkXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1hdGNoZXJPdXQgPSBjb25kZW5zZShcblx0XHRcdFx0bWF0Y2hlck91dCA9PT0gcmVzdWx0cyA/XG5cdFx0XHRcdFx0bWF0Y2hlck91dC5zcGxpY2UoIHByZWV4aXN0aW5nLCBtYXRjaGVyT3V0Lmxlbmd0aCApIDpcblx0XHRcdFx0XHRtYXRjaGVyT3V0XG5cdFx0XHQpO1xuXHRcdFx0aWYgKCBwb3N0RmluZGVyICkge1xuXHRcdFx0XHRwb3N0RmluZGVyKCBudWxsLCByZXN1bHRzLCBtYXRjaGVyT3V0LCB4bWwgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIG1hdGNoZXJPdXQgKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVyRnJvbVRva2VucyggdG9rZW5zICkge1xuXHR2YXIgY2hlY2tDb250ZXh0LCBtYXRjaGVyLCBqLFxuXHRcdGxlbiA9IHRva2Vucy5sZW5ndGgsXG5cdFx0bGVhZGluZ1JlbGF0aXZlID0gRXhwci5yZWxhdGl2ZVsgdG9rZW5zWzBdLnR5cGUgXSxcblx0XHRpbXBsaWNpdFJlbGF0aXZlID0gbGVhZGluZ1JlbGF0aXZlIHx8IEV4cHIucmVsYXRpdmVbXCIgXCJdLFxuXHRcdGkgPSBsZWFkaW5nUmVsYXRpdmUgPyAxIDogMCxcblxuXHRcdC8vIFRoZSBmb3VuZGF0aW9uYWwgbWF0Y2hlciBlbnN1cmVzIHRoYXQgZWxlbWVudHMgYXJlIHJlYWNoYWJsZSBmcm9tIHRvcC1sZXZlbCBjb250ZXh0KHMpXG5cdFx0bWF0Y2hDb250ZXh0ID0gYWRkQ29tYmluYXRvciggZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gY2hlY2tDb250ZXh0O1xuXHRcdH0sIGltcGxpY2l0UmVsYXRpdmUsIHRydWUgKSxcblx0XHRtYXRjaEFueUNvbnRleHQgPSBhZGRDb21iaW5hdG9yKCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBpbmRleE9mKCBjaGVja0NvbnRleHQsIGVsZW0gKSA+IC0xO1xuXHRcdH0sIGltcGxpY2l0UmVsYXRpdmUsIHRydWUgKSxcblx0XHRtYXRjaGVycyA9IFsgZnVuY3Rpb24oIGVsZW0sIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdHZhciByZXQgPSAoICFsZWFkaW5nUmVsYXRpdmUgJiYgKCB4bWwgfHwgY29udGV4dCAhPT0gb3V0ZXJtb3N0Q29udGV4dCApICkgfHwgKFxuXHRcdFx0XHQoY2hlY2tDb250ZXh0ID0gY29udGV4dCkubm9kZVR5cGUgP1xuXHRcdFx0XHRcdG1hdGNoQ29udGV4dCggZWxlbSwgY29udGV4dCwgeG1sICkgOlxuXHRcdFx0XHRcdG1hdGNoQW55Q29udGV4dCggZWxlbSwgY29udGV4dCwgeG1sICkgKTtcblx0XHRcdC8vIEF2b2lkIGhhbmdpbmcgb250byBlbGVtZW50IChpc3N1ZSAjMjk5KVxuXHRcdFx0Y2hlY2tDb250ZXh0ID0gbnVsbDtcblx0XHRcdHJldHVybiByZXQ7XG5cdFx0fSBdO1xuXG5cdGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdGlmICggKG1hdGNoZXIgPSBFeHByLnJlbGF0aXZlWyB0b2tlbnNbaV0udHlwZSBdKSApIHtcblx0XHRcdG1hdGNoZXJzID0gWyBhZGRDb21iaW5hdG9yKGVsZW1lbnRNYXRjaGVyKCBtYXRjaGVycyApLCBtYXRjaGVyKSBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXRjaGVyID0gRXhwci5maWx0ZXJbIHRva2Vuc1tpXS50eXBlIF0uYXBwbHkoIG51bGwsIHRva2Vuc1tpXS5tYXRjaGVzICk7XG5cblx0XHRcdC8vIFJldHVybiBzcGVjaWFsIHVwb24gc2VlaW5nIGEgcG9zaXRpb25hbCBtYXRjaGVyXG5cdFx0XHRpZiAoIG1hdGNoZXJbIGV4cGFuZG8gXSApIHtcblx0XHRcdFx0Ly8gRmluZCB0aGUgbmV4dCByZWxhdGl2ZSBvcGVyYXRvciAoaWYgYW55KSBmb3IgcHJvcGVyIGhhbmRsaW5nXG5cdFx0XHRcdGogPSArK2k7XG5cdFx0XHRcdGZvciAoIDsgaiA8IGxlbjsgaisrICkge1xuXHRcdFx0XHRcdGlmICggRXhwci5yZWxhdGl2ZVsgdG9rZW5zW2pdLnR5cGUgXSApIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gc2V0TWF0Y2hlcihcblx0XHRcdFx0XHRpID4gMSAmJiBlbGVtZW50TWF0Y2hlciggbWF0Y2hlcnMgKSxcblx0XHRcdFx0XHRpID4gMSAmJiB0b1NlbGVjdG9yKFxuXHRcdFx0XHRcdFx0Ly8gSWYgdGhlIHByZWNlZGluZyB0b2tlbiB3YXMgYSBkZXNjZW5kYW50IGNvbWJpbmF0b3IsIGluc2VydCBhbiBpbXBsaWNpdCBhbnktZWxlbWVudCBgKmBcblx0XHRcdFx0XHRcdHRva2Vucy5zbGljZSggMCwgaSAtIDEgKS5jb25jYXQoeyB2YWx1ZTogdG9rZW5zWyBpIC0gMiBdLnR5cGUgPT09IFwiIFwiID8gXCIqXCIgOiBcIlwiIH0pXG5cdFx0XHRcdFx0KS5yZXBsYWNlKCBydHJpbSwgXCIkMVwiICksXG5cdFx0XHRcdFx0bWF0Y2hlcixcblx0XHRcdFx0XHRpIDwgaiAmJiBtYXRjaGVyRnJvbVRva2VucyggdG9rZW5zLnNsaWNlKCBpLCBqICkgKSxcblx0XHRcdFx0XHRqIDwgbGVuICYmIG1hdGNoZXJGcm9tVG9rZW5zKCAodG9rZW5zID0gdG9rZW5zLnNsaWNlKCBqICkpICksXG5cdFx0XHRcdFx0aiA8IGxlbiAmJiB0b1NlbGVjdG9yKCB0b2tlbnMgKVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0bWF0Y2hlcnMucHVzaCggbWF0Y2hlciApO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBlbGVtZW50TWF0Y2hlciggbWF0Y2hlcnMgKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlckZyb21Hcm91cE1hdGNoZXJzKCBlbGVtZW50TWF0Y2hlcnMsIHNldE1hdGNoZXJzICkge1xuXHR2YXIgYnlTZXQgPSBzZXRNYXRjaGVycy5sZW5ndGggPiAwLFxuXHRcdGJ5RWxlbWVudCA9IGVsZW1lbnRNYXRjaGVycy5sZW5ndGggPiAwLFxuXHRcdHN1cGVyTWF0Y2hlciA9IGZ1bmN0aW9uKCBzZWVkLCBjb250ZXh0LCB4bWwsIHJlc3VsdHMsIG91dGVybW9zdCApIHtcblx0XHRcdHZhciBlbGVtLCBqLCBtYXRjaGVyLFxuXHRcdFx0XHRtYXRjaGVkQ291bnQgPSAwLFxuXHRcdFx0XHRpID0gXCIwXCIsXG5cdFx0XHRcdHVubWF0Y2hlZCA9IHNlZWQgJiYgW10sXG5cdFx0XHRcdHNldE1hdGNoZWQgPSBbXSxcblx0XHRcdFx0Y29udGV4dEJhY2t1cCA9IG91dGVybW9zdENvbnRleHQsXG5cdFx0XHRcdC8vIFdlIG11c3QgYWx3YXlzIGhhdmUgZWl0aGVyIHNlZWQgZWxlbWVudHMgb3Igb3V0ZXJtb3N0IGNvbnRleHRcblx0XHRcdFx0ZWxlbXMgPSBzZWVkIHx8IGJ5RWxlbWVudCAmJiBFeHByLmZpbmRbXCJUQUdcIl0oIFwiKlwiLCBvdXRlcm1vc3QgKSxcblx0XHRcdFx0Ly8gVXNlIGludGVnZXIgZGlycnVucyBpZmYgdGhpcyBpcyB0aGUgb3V0ZXJtb3N0IG1hdGNoZXJcblx0XHRcdFx0ZGlycnVuc1VuaXF1ZSA9IChkaXJydW5zICs9IGNvbnRleHRCYWNrdXAgPT0gbnVsbCA/IDEgOiBNYXRoLnJhbmRvbSgpIHx8IDAuMSksXG5cdFx0XHRcdGxlbiA9IGVsZW1zLmxlbmd0aDtcblxuXHRcdFx0aWYgKCBvdXRlcm1vc3QgKSB7XG5cdFx0XHRcdG91dGVybW9zdENvbnRleHQgPSBjb250ZXh0ID09PSBkb2N1bWVudCB8fCBjb250ZXh0IHx8IG91dGVybW9zdDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWRkIGVsZW1lbnRzIHBhc3NpbmcgZWxlbWVudE1hdGNoZXJzIGRpcmVjdGx5IHRvIHJlc3VsdHNcblx0XHRcdC8vIFN1cHBvcnQ6IElFPDksIFNhZmFyaVxuXHRcdFx0Ly8gVG9sZXJhdGUgTm9kZUxpc3QgcHJvcGVydGllcyAoSUU6IFwibGVuZ3RoXCI7IFNhZmFyaTogPG51bWJlcj4pIG1hdGNoaW5nIGVsZW1lbnRzIGJ5IGlkXG5cdFx0XHRmb3IgKCA7IGkgIT09IGxlbiAmJiAoZWxlbSA9IGVsZW1zW2ldKSAhPSBudWxsOyBpKysgKSB7XG5cdFx0XHRcdGlmICggYnlFbGVtZW50ICYmIGVsZW0gKSB7XG5cdFx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdFx0aWYgKCAhY29udGV4dCAmJiBlbGVtLm93bmVyRG9jdW1lbnQgIT09IGRvY3VtZW50ICkge1xuXHRcdFx0XHRcdFx0c2V0RG9jdW1lbnQoIGVsZW0gKTtcblx0XHRcdFx0XHRcdHhtbCA9ICFkb2N1bWVudElzSFRNTDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0d2hpbGUgKCAobWF0Y2hlciA9IGVsZW1lbnRNYXRjaGVyc1tqKytdKSApIHtcblx0XHRcdFx0XHRcdGlmICggbWF0Y2hlciggZWxlbSwgY29udGV4dCB8fCBkb2N1bWVudCwgeG1sKSApIHtcblx0XHRcdFx0XHRcdFx0cmVzdWx0cy5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIG91dGVybW9zdCApIHtcblx0XHRcdFx0XHRcdGRpcnJ1bnMgPSBkaXJydW5zVW5pcXVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFRyYWNrIHVubWF0Y2hlZCBlbGVtZW50cyBmb3Igc2V0IGZpbHRlcnNcblx0XHRcdFx0aWYgKCBieVNldCApIHtcblx0XHRcdFx0XHQvLyBUaGV5IHdpbGwgaGF2ZSBnb25lIHRocm91Z2ggYWxsIHBvc3NpYmxlIG1hdGNoZXJzXG5cdFx0XHRcdFx0aWYgKCAoZWxlbSA9ICFtYXRjaGVyICYmIGVsZW0pICkge1xuXHRcdFx0XHRcdFx0bWF0Y2hlZENvdW50LS07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTGVuZ3RoZW4gdGhlIGFycmF5IGZvciBldmVyeSBlbGVtZW50LCBtYXRjaGVkIG9yIG5vdFxuXHRcdFx0XHRcdGlmICggc2VlZCApIHtcblx0XHRcdFx0XHRcdHVubWF0Y2hlZC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIGBpYCBpcyBub3cgdGhlIGNvdW50IG9mIGVsZW1lbnRzIHZpc2l0ZWQgYWJvdmUsIGFuZCBhZGRpbmcgaXQgdG8gYG1hdGNoZWRDb3VudGBcblx0XHRcdC8vIG1ha2VzIHRoZSBsYXR0ZXIgbm9ubmVnYXRpdmUuXG5cdFx0XHRtYXRjaGVkQ291bnQgKz0gaTtcblxuXHRcdFx0Ly8gQXBwbHkgc2V0IGZpbHRlcnMgdG8gdW5tYXRjaGVkIGVsZW1lbnRzXG5cdFx0XHQvLyBOT1RFOiBUaGlzIGNhbiBiZSBza2lwcGVkIGlmIHRoZXJlIGFyZSBubyB1bm1hdGNoZWQgZWxlbWVudHMgKGkuZS4sIGBtYXRjaGVkQ291bnRgXG5cdFx0XHQvLyBlcXVhbHMgYGlgKSwgdW5sZXNzIHdlIGRpZG4ndCB2aXNpdCBfYW55XyBlbGVtZW50cyBpbiB0aGUgYWJvdmUgbG9vcCBiZWNhdXNlIHdlIGhhdmVcblx0XHRcdC8vIG5vIGVsZW1lbnQgbWF0Y2hlcnMgYW5kIG5vIHNlZWQuXG5cdFx0XHQvLyBJbmNyZW1lbnRpbmcgYW4gaW5pdGlhbGx5LXN0cmluZyBcIjBcIiBgaWAgYWxsb3dzIGBpYCB0byByZW1haW4gYSBzdHJpbmcgb25seSBpbiB0aGF0XG5cdFx0XHQvLyBjYXNlLCB3aGljaCB3aWxsIHJlc3VsdCBpbiBhIFwiMDBcIiBgbWF0Y2hlZENvdW50YCB0aGF0IGRpZmZlcnMgZnJvbSBgaWAgYnV0IGlzIGFsc29cblx0XHRcdC8vIG51bWVyaWNhbGx5IHplcm8uXG5cdFx0XHRpZiAoIGJ5U2V0ICYmIGkgIT09IG1hdGNoZWRDb3VudCApIHtcblx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdHdoaWxlICggKG1hdGNoZXIgPSBzZXRNYXRjaGVyc1tqKytdKSApIHtcblx0XHRcdFx0XHRtYXRjaGVyKCB1bm1hdGNoZWQsIHNldE1hdGNoZWQsIGNvbnRleHQsIHhtbCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCBzZWVkICkge1xuXHRcdFx0XHRcdC8vIFJlaW50ZWdyYXRlIGVsZW1lbnQgbWF0Y2hlcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHNvcnRpbmdcblx0XHRcdFx0XHRpZiAoIG1hdGNoZWRDb3VudCA+IDAgKSB7XG5cdFx0XHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCAhKHVubWF0Y2hlZFtpXSB8fCBzZXRNYXRjaGVkW2ldKSApIHtcblx0XHRcdFx0XHRcdFx0XHRzZXRNYXRjaGVkW2ldID0gcG9wLmNhbGwoIHJlc3VsdHMgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIERpc2NhcmQgaW5kZXggcGxhY2Vob2xkZXIgdmFsdWVzIHRvIGdldCBvbmx5IGFjdHVhbCBtYXRjaGVzXG5cdFx0XHRcdFx0c2V0TWF0Y2hlZCA9IGNvbmRlbnNlKCBzZXRNYXRjaGVkICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBBZGQgbWF0Y2hlcyB0byByZXN1bHRzXG5cdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIHNldE1hdGNoZWQgKTtcblxuXHRcdFx0XHQvLyBTZWVkbGVzcyBzZXQgbWF0Y2hlcyBzdWNjZWVkaW5nIG11bHRpcGxlIHN1Y2Nlc3NmdWwgbWF0Y2hlcnMgc3RpcHVsYXRlIHNvcnRpbmdcblx0XHRcdFx0aWYgKCBvdXRlcm1vc3QgJiYgIXNlZWQgJiYgc2V0TWF0Y2hlZC5sZW5ndGggPiAwICYmXG5cdFx0XHRcdFx0KCBtYXRjaGVkQ291bnQgKyBzZXRNYXRjaGVycy5sZW5ndGggKSA+IDEgKSB7XG5cblx0XHRcdFx0XHRTaXp6bGUudW5pcXVlU29ydCggcmVzdWx0cyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIE92ZXJyaWRlIG1hbmlwdWxhdGlvbiBvZiBnbG9iYWxzIGJ5IG5lc3RlZCBtYXRjaGVyc1xuXHRcdFx0aWYgKCBvdXRlcm1vc3QgKSB7XG5cdFx0XHRcdGRpcnJ1bnMgPSBkaXJydW5zVW5pcXVlO1xuXHRcdFx0XHRvdXRlcm1vc3RDb250ZXh0ID0gY29udGV4dEJhY2t1cDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVubWF0Y2hlZDtcblx0XHR9O1xuXG5cdHJldHVybiBieVNldCA/XG5cdFx0bWFya0Z1bmN0aW9uKCBzdXBlck1hdGNoZXIgKSA6XG5cdFx0c3VwZXJNYXRjaGVyO1xufVxuXG5jb21waWxlID0gU2l6emxlLmNvbXBpbGUgPSBmdW5jdGlvbiggc2VsZWN0b3IsIG1hdGNoIC8qIEludGVybmFsIFVzZSBPbmx5ICovICkge1xuXHR2YXIgaSxcblx0XHRzZXRNYXRjaGVycyA9IFtdLFxuXHRcdGVsZW1lbnRNYXRjaGVycyA9IFtdLFxuXHRcdGNhY2hlZCA9IGNvbXBpbGVyQ2FjaGVbIHNlbGVjdG9yICsgXCIgXCIgXTtcblxuXHRpZiAoICFjYWNoZWQgKSB7XG5cdFx0Ly8gR2VuZXJhdGUgYSBmdW5jdGlvbiBvZiByZWN1cnNpdmUgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2hlY2sgZWFjaCBlbGVtZW50XG5cdFx0aWYgKCAhbWF0Y2ggKSB7XG5cdFx0XHRtYXRjaCA9IHRva2VuaXplKCBzZWxlY3RvciApO1xuXHRcdH1cblx0XHRpID0gbWF0Y2gubGVuZ3RoO1xuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0Y2FjaGVkID0gbWF0Y2hlckZyb21Ub2tlbnMoIG1hdGNoW2ldICk7XG5cdFx0XHRpZiAoIGNhY2hlZFsgZXhwYW5kbyBdICkge1xuXHRcdFx0XHRzZXRNYXRjaGVycy5wdXNoKCBjYWNoZWQgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnRNYXRjaGVycy5wdXNoKCBjYWNoZWQgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBDYWNoZSB0aGUgY29tcGlsZWQgZnVuY3Rpb25cblx0XHRjYWNoZWQgPSBjb21waWxlckNhY2hlKCBzZWxlY3RvciwgbWF0Y2hlckZyb21Hcm91cE1hdGNoZXJzKCBlbGVtZW50TWF0Y2hlcnMsIHNldE1hdGNoZXJzICkgKTtcblxuXHRcdC8vIFNhdmUgc2VsZWN0b3IgYW5kIHRva2VuaXphdGlvblxuXHRcdGNhY2hlZC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHR9XG5cdHJldHVybiBjYWNoZWQ7XG59O1xuXG4vKipcbiAqIEEgbG93LWxldmVsIHNlbGVjdGlvbiBmdW5jdGlvbiB0aGF0IHdvcmtzIHdpdGggU2l6emxlJ3MgY29tcGlsZWRcbiAqICBzZWxlY3RvciBmdW5jdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBzZWxlY3RvciBBIHNlbGVjdG9yIG9yIGEgcHJlLWNvbXBpbGVkXG4gKiAgc2VsZWN0b3IgZnVuY3Rpb24gYnVpbHQgd2l0aCBTaXp6bGUuY29tcGlsZVxuICogQHBhcmFtIHtFbGVtZW50fSBjb250ZXh0XG4gKiBAcGFyYW0ge0FycmF5fSBbcmVzdWx0c11cbiAqIEBwYXJhbSB7QXJyYXl9IFtzZWVkXSBBIHNldCBvZiBlbGVtZW50cyB0byBtYXRjaCBhZ2FpbnN0XG4gKi9cbnNlbGVjdCA9IFNpenpsZS5zZWxlY3QgPSBmdW5jdGlvbiggc2VsZWN0b3IsIGNvbnRleHQsIHJlc3VsdHMsIHNlZWQgKSB7XG5cdHZhciBpLCB0b2tlbnMsIHRva2VuLCB0eXBlLCBmaW5kLFxuXHRcdGNvbXBpbGVkID0gdHlwZW9mIHNlbGVjdG9yID09PSBcImZ1bmN0aW9uXCIgJiYgc2VsZWN0b3IsXG5cdFx0bWF0Y2ggPSAhc2VlZCAmJiB0b2tlbml6ZSggKHNlbGVjdG9yID0gY29tcGlsZWQuc2VsZWN0b3IgfHwgc2VsZWN0b3IpICk7XG5cblx0cmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG5cblx0Ly8gVHJ5IHRvIG1pbmltaXplIG9wZXJhdGlvbnMgaWYgdGhlcmUgaXMgb25seSBvbmUgc2VsZWN0b3IgaW4gdGhlIGxpc3QgYW5kIG5vIHNlZWRcblx0Ly8gKHRoZSBsYXR0ZXIgb2Ygd2hpY2ggZ3VhcmFudGVlcyB1cyBjb250ZXh0KVxuXHRpZiAoIG1hdGNoLmxlbmd0aCA9PT0gMSApIHtcblxuXHRcdC8vIFJlZHVjZSBjb250ZXh0IGlmIHRoZSBsZWFkaW5nIGNvbXBvdW5kIHNlbGVjdG9yIGlzIGFuIElEXG5cdFx0dG9rZW5zID0gbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSggMCApO1xuXHRcdGlmICggdG9rZW5zLmxlbmd0aCA+IDIgJiYgKHRva2VuID0gdG9rZW5zWzBdKS50eXBlID09PSBcIklEXCIgJiZcblx0XHRcdFx0Y29udGV4dC5ub2RlVHlwZSA9PT0gOSAmJiBkb2N1bWVudElzSFRNTCAmJiBFeHByLnJlbGF0aXZlWyB0b2tlbnNbMV0udHlwZSBdICkge1xuXG5cdFx0XHRjb250ZXh0ID0gKCBFeHByLmZpbmRbXCJJRFwiXSggdG9rZW4ubWF0Y2hlc1swXS5yZXBsYWNlKHJ1bmVzY2FwZSwgZnVuZXNjYXBlKSwgY29udGV4dCApIHx8IFtdIClbMF07XG5cdFx0XHRpZiAoICFjb250ZXh0ICkge1xuXHRcdFx0XHRyZXR1cm4gcmVzdWx0cztcblxuXHRcdFx0Ly8gUHJlY29tcGlsZWQgbWF0Y2hlcnMgd2lsbCBzdGlsbCB2ZXJpZnkgYW5jZXN0cnksIHNvIHN0ZXAgdXAgYSBsZXZlbFxuXHRcdFx0fSBlbHNlIGlmICggY29tcGlsZWQgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBjb250ZXh0LnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHNlbGVjdG9yID0gc2VsZWN0b3Iuc2xpY2UoIHRva2Vucy5zaGlmdCgpLnZhbHVlLmxlbmd0aCApO1xuXHRcdH1cblxuXHRcdC8vIEZldGNoIGEgc2VlZCBzZXQgZm9yIHJpZ2h0LXRvLWxlZnQgbWF0Y2hpbmdcblx0XHRpID0gbWF0Y2hFeHByW1wibmVlZHNDb250ZXh0XCJdLnRlc3QoIHNlbGVjdG9yICkgPyAwIDogdG9rZW5zLmxlbmd0aDtcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHRva2VuID0gdG9rZW5zW2ldO1xuXG5cdFx0XHQvLyBBYm9ydCBpZiB3ZSBoaXQgYSBjb21iaW5hdG9yXG5cdFx0XHRpZiAoIEV4cHIucmVsYXRpdmVbICh0eXBlID0gdG9rZW4udHlwZSkgXSApIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIChmaW5kID0gRXhwci5maW5kWyB0eXBlIF0pICkge1xuXHRcdFx0XHQvLyBTZWFyY2gsIGV4cGFuZGluZyBjb250ZXh0IGZvciBsZWFkaW5nIHNpYmxpbmcgY29tYmluYXRvcnNcblx0XHRcdFx0aWYgKCAoc2VlZCA9IGZpbmQoXG5cdFx0XHRcdFx0dG9rZW4ubWF0Y2hlc1swXS5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApLFxuXHRcdFx0XHRcdHJzaWJsaW5nLnRlc3QoIHRva2Vuc1swXS50eXBlICkgJiYgdGVzdENvbnRleHQoIGNvbnRleHQucGFyZW50Tm9kZSApIHx8IGNvbnRleHRcblx0XHRcdFx0KSkgKSB7XG5cblx0XHRcdFx0XHQvLyBJZiBzZWVkIGlzIGVtcHR5IG9yIG5vIHRva2VucyByZW1haW4sIHdlIGNhbiByZXR1cm4gZWFybHlcblx0XHRcdFx0XHR0b2tlbnMuc3BsaWNlKCBpLCAxICk7XG5cdFx0XHRcdFx0c2VsZWN0b3IgPSBzZWVkLmxlbmd0aCAmJiB0b1NlbGVjdG9yKCB0b2tlbnMgKTtcblx0XHRcdFx0XHRpZiAoICFzZWxlY3RvciApIHtcblx0XHRcdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIHNlZWQgKTtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ29tcGlsZSBhbmQgZXhlY3V0ZSBhIGZpbHRlcmluZyBmdW5jdGlvbiBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG5cdC8vIFByb3ZpZGUgYG1hdGNoYCB0byBhdm9pZCByZXRva2VuaXphdGlvbiBpZiB3ZSBtb2RpZmllZCB0aGUgc2VsZWN0b3IgYWJvdmVcblx0KCBjb21waWxlZCB8fCBjb21waWxlKCBzZWxlY3RvciwgbWF0Y2ggKSApKFxuXHRcdHNlZWQsXG5cdFx0Y29udGV4dCxcblx0XHQhZG9jdW1lbnRJc0hUTUwsXG5cdFx0cmVzdWx0cyxcblx0XHQhY29udGV4dCB8fCByc2libGluZy50ZXN0KCBzZWxlY3RvciApICYmIHRlc3RDb250ZXh0KCBjb250ZXh0LnBhcmVudE5vZGUgKSB8fCBjb250ZXh0XG5cdCk7XG5cdHJldHVybiByZXN1bHRzO1xufTtcblxuLy8gT25lLXRpbWUgYXNzaWdubWVudHNcblxuLy8gU29ydCBzdGFiaWxpdHlcbnN1cHBvcnQuc29ydFN0YWJsZSA9IGV4cGFuZG8uc3BsaXQoXCJcIikuc29ydCggc29ydE9yZGVyICkuam9pbihcIlwiKSA9PT0gZXhwYW5kbztcblxuLy8gU3VwcG9ydDogQ2hyb21lIDE0LTM1K1xuLy8gQWx3YXlzIGFzc3VtZSBkdXBsaWNhdGVzIGlmIHRoZXkgYXJlbid0IHBhc3NlZCB0byB0aGUgY29tcGFyaXNvbiBmdW5jdGlvblxuc3VwcG9ydC5kZXRlY3REdXBsaWNhdGVzID0gISFoYXNEdXBsaWNhdGU7XG5cbi8vIEluaXRpYWxpemUgYWdhaW5zdCB0aGUgZGVmYXVsdCBkb2N1bWVudFxuc2V0RG9jdW1lbnQoKTtcblxuLy8gU3VwcG9ydDogV2Via2l0PDUzNy4zMiAtIFNhZmFyaSA2LjAuMy9DaHJvbWUgMjUgKGZpeGVkIGluIENocm9tZSAyNylcbi8vIERldGFjaGVkIG5vZGVzIGNvbmZvdW5kaW5nbHkgZm9sbG93ICplYWNoIG90aGVyKlxuc3VwcG9ydC5zb3J0RGV0YWNoZWQgPSBhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHQvLyBTaG91bGQgcmV0dXJuIDEsIGJ1dCByZXR1cm5zIDQgKGZvbGxvd2luZylcblx0cmV0dXJuIGVsLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZmllbGRzZXRcIikgKSAmIDE7XG59KTtcblxuLy8gU3VwcG9ydDogSUU8OFxuLy8gUHJldmVudCBhdHRyaWJ1dGUvcHJvcGVydHkgXCJpbnRlcnBvbGF0aW9uXCJcbi8vIGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzY0MjklMjhWUy44NSUyOS5hc3B4XG5pZiAoICFhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHRlbC5pbm5lckhUTUwgPSBcIjxhIGhyZWY9JyMnPjwvYT5cIjtcblx0cmV0dXJuIGVsLmZpcnN0Q2hpbGQuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSA9PT0gXCIjXCIgO1xufSkgKSB7XG5cdGFkZEhhbmRsZSggXCJ0eXBlfGhyZWZ8aGVpZ2h0fHdpZHRoXCIsIGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCBpc1hNTCApIHtcblx0XHRpZiAoICFpc1hNTCApIHtcblx0XHRcdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggbmFtZSwgbmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInR5cGVcIiA/IDEgOiAyICk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLy8gU3VwcG9ydDogSUU8OVxuLy8gVXNlIGRlZmF1bHRWYWx1ZSBpbiBwbGFjZSBvZiBnZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKVxuaWYgKCAhc3VwcG9ydC5hdHRyaWJ1dGVzIHx8ICFhc3NlcnQoZnVuY3Rpb24oIGVsICkge1xuXHRlbC5pbm5lckhUTUwgPSBcIjxpbnB1dC8+XCI7XG5cdGVsLmZpcnN0Q2hpbGQuc2V0QXR0cmlidXRlKCBcInZhbHVlXCIsIFwiXCIgKTtcblx0cmV0dXJuIGVsLmZpcnN0Q2hpbGQuZ2V0QXR0cmlidXRlKCBcInZhbHVlXCIgKSA9PT0gXCJcIjtcbn0pICkge1xuXHRhZGRIYW5kbGUoIFwidmFsdWVcIiwgZnVuY3Rpb24oIGVsZW0sIG5hbWUsIGlzWE1MICkge1xuXHRcdGlmICggIWlzWE1MICYmIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJpbnB1dFwiICkge1xuXHRcdFx0cmV0dXJuIGVsZW0uZGVmYXVsdFZhbHVlO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vIFN1cHBvcnQ6IElFPDlcbi8vIFVzZSBnZXRBdHRyaWJ1dGVOb2RlIHRvIGZldGNoIGJvb2xlYW5zIHdoZW4gZ2V0QXR0cmlidXRlIGxpZXNcbmlmICggIWFzc2VydChmdW5jdGlvbiggZWwgKSB7XG5cdHJldHVybiBlbC5nZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKSA9PSBudWxsO1xufSkgKSB7XG5cdGFkZEhhbmRsZSggYm9vbGVhbnMsIGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCBpc1hNTCApIHtcblx0XHR2YXIgdmFsO1xuXHRcdGlmICggIWlzWE1MICkge1xuXHRcdFx0cmV0dXJuIGVsZW1bIG5hbWUgXSA9PT0gdHJ1ZSA/IG5hbWUudG9Mb3dlckNhc2UoKSA6XG5cdFx0XHRcdFx0KHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlTm9kZSggbmFtZSApKSAmJiB2YWwuc3BlY2lmaWVkID9cblx0XHRcdFx0XHR2YWwudmFsdWUgOlxuXHRcdFx0XHRudWxsO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vIEVYUE9TRVxudmFyIF9zaXp6bGUgPSB3aW5kb3cuU2l6emxlO1xuXG5TaXp6bGUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIHdpbmRvdy5TaXp6bGUgPT09IFNpenpsZSApIHtcblx0XHR3aW5kb3cuU2l6emxlID0gX3NpenpsZTtcblx0fVxuXG5cdHJldHVybiBTaXp6bGU7XG59O1xuXG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kICkge1xuXHRkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBTaXp6bGU7IH0pO1xuLy8gU2l6emxlIHJlcXVpcmVzIHRoYXQgdGhlcmUgYmUgYSBnbG9iYWwgd2luZG93IGluIENvbW1vbi1KUyBsaWtlIGVudmlyb25tZW50c1xufSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cyApIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBTaXp6bGU7XG59IGVsc2Uge1xuXHR3aW5kb3cuU2l6emxlID0gU2l6emxlO1xufVxuLy8gRVhQT1NFXG5cbn0pKCB3aW5kb3cgKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgb2JqID0ge307XG4gIHZhciBzcmNMaXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHNyY0xpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgc3JjID0gc3JjTGlzdFtpXTtcbiAgICBmb3IgKHZhciBxIGluIHNyYykge1xuICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShxKSkge1xuICAgICAgICBvYmpbcV0gPSBzcmNbcV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50KG5hbWUsIGhhbmRsZXIpIHtcbiAgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICB9IGVsc2UgaWYgKHdpbmRvdy5hdHRhY2hFdmVudCkge1xuICAgIHdpbmRvdy5hdHRhY2hFdmVudCgnb24nICsgbmFtZSwgaGFuZGxlcik7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93WydvbicgKyBuYW1lXSA9IGhhbmRsZXI7XG4gIH1cbn1cblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmo7XG59IDogZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqO1xufTtcblxudmFyIGNsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn07XG5cbnZhciBjcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfTtcbn0oKTtcblxuLyoqXG4gKiBSTm9kZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUg5b+F6aG7XG4gKlxuICogdmFsdWU6ICAgICDljLrliIblkIznuqfoioLngrnnmoTllK/kuIDmoIfor4ZcbiAqIHBhcmFtczogICAgdmFsdWXljIXlkKvnmoTlj4LmlbDvvIzkvb/nlKh75Y+C5pWw5ZCNOuWPguaVsOinhOWImX3plK7lgLzlr7nooajnpLpcbiAqIGJlZm9yZTogICAg6Lev55Sx5Yy56YWN5pe277yMdXJs5pS55Y+Y5LmL5YmN5omn6KGM55qE5Zue6LCD5Ye95pWw5oiW6Zif5YiXXG4gKiBjYWxsYmFja3M6IOi3r+eUseWMuemFjeaXtuaJp+ihjOeahOWbnuiwg+WHveaVsOaIlumYn+WIl1xuICogYWZ0ZXI6ICAgICDot6/nlLHljLnphY3ml7bvvIx1cmzmlLnlj5jkuYvlkI7vvIxjYWxsYmFja3PmiafooYzlrozlho3miafooYznmoTlm57osIPlh73mlbDmiJbpmJ/liJdcbiAqXG4gKiBfY2hpbGRyZW46IOWtkOiKgueCueW8leeUqOWIl+ihqFxuICogX3BhcmVudDogICDniLboioLngrnlvJXnlKhcbiAqL1xuXG52YXIgUk5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFJOb2RlKHZhbHVlKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgUk5vZGUpO1xuXG4gICAgdmFyIHZhbHVlVHlwZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YodmFsdWUpO1xuICAgIGlmICh2YWx1ZVR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIHN0cmluZyBpbiB0aGUgZmlyc3QgYXJndW1lbnQsIGdvdCAnICsgdmFsdWVUeXBlKTtcbiAgICB9XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMucGFyYW1zID0ge307XG4gICAgdGhpcy5jYWxsYmFja3MgPSBudWxsO1xuICAgIHRoaXMuYmVmb3JlID0gbnVsbDtcbiAgICB0aGlzLmFmdGVyID0gbnVsbDtcbiAgICB0aGlzLl9jaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuX3BhcmVudCA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogc2V0L2dldCBjaGlsZHJlblxuICAgKiBAcGFyYW0ge1JOb2RlfFtSTm9kZV19IGNoaWxkcmVuICoqb3B0aW9uYWwqKlxuICAgKiBAcmV0dXJuIHtbUk5vZGVdfFJOb2RlfSByZXR1cm4gY2hpbGRyZW4gbm9kZSBsaXN0IG9yIHRoaXNcbiAgICovXG5cblxuICBjcmVhdGVDbGFzcyhSTm9kZSwgW3tcbiAgICBrZXk6ICdjaGlsZHJlbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNoaWxkcmVuKF9jaGlsZHJlbikge1xuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gX2NoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcbiAgICAgIH1cbiAgICAgIGlmIChfY2hpbGRyZW4gaW5zdGFuY2VvZiBSTm9kZSkge1xuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKF9jaGlsZHJlbik7XG4gICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoX2NoaWxkcmVuKSkge1xuICAgICAgICB0aGlzLl9jaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuLmNvbmNhdChfY2hpbGRyZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgUk5vZGUgb3IgQXJyYXkgaW4gdGhlIGZpcnN0IGFyZ3VtZW50LCBnb3QgJyArIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChfY2hpbGRyZW4pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldC9nZXQgcGFyZW50XG4gICAgICogQHBhcmFtIHtSTm9kZX0gcGFyZW50ICoqb3B0aW9uYWwqKlxuICAgICAqIEByZXR1cm4ge1JOb2RlfSByZXR1cm4gcGFyZW50IG5vZGUgb3IgdGhpc1xuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6ICdwYXJlbnQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJlbnQoX3BhcmVudCkge1xuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gX3BhcmVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xuICAgICAgfVxuICAgICAgaWYgKF9wYXJlbnQgaW5zdGFuY2VvZiBSTm9kZSkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBfcGFyZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgUk5vZGUgaW4gdGhlIGZpcnN0IGFyZ3VtZW50LCBnb3QgJyArIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChfcGFyZW50KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFJOb2RlO1xufSgpO1xuXG52YXIgaGlzdG9yeVN1cHBvcnQgPSB0eXBlb2Ygd2luZG93Lmhpc3RvcnlbJ3B1c2hTdGF0ZSddICE9PSBcInVuZGVmaW5lZFwiO1xuXG4vLy8gTGlzdGVuZXJcbnZhciBMaXN0ZW5lciA9IHtcbiAgbGlzdGVuZXJzOiBudWxsLFxuXG4gIGhpc3Rvcnk6IGZhbHNlLFxuXG4gIHNldFVybE9ubHk6IGZhbHNlLFxuXG4gIGluaXQ6IGZ1bmN0aW9uIGluaXQobW9kZSkge1xuICAgIHRoaXMuaGlzdG9yeSA9IG1vZGUgPT09ICdoaXN0b3J5JztcbiAgICBpZiAodGhpcy5oaXN0b3J5ICYmIGhpc3RvcnlTdXBwb3J0KSB7XG4gICAgICAvLyBJRSAxMCtcbiAgICAgIGFkZEV2ZW50KCdwb3BzdGF0ZScsIG9uY2hhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWRkRXZlbnQoJ2hhc2hjaGFuZ2UnLCBvbmNoYW5nZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGFkZDogZnVuY3Rpb24gYWRkKGZuKSB7XG4gICAgaWYgKCF0aGlzLmxpc3RlbmVycykge1xuICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChmbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0SGFzaEhpc3Rvcnk6IGZ1bmN0aW9uIHNldEhhc2hIaXN0b3J5KHBhdGgpIHtcbiAgICBpZiAodGhpcy5oaXN0b3J5KSB7XG4gICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgZG9jdW1lbnQudGl0bGUsIHBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGF0aFswXSA9PT0gJy8nKSB7XG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIScgKyBwYXRoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGN1cnJlbnRVUkwgPSBsb2NhdGlvbi5oYXNoLnNsaWNlKDIpOyAvLyDljrvmjonliY3pnaLnmoQjIVxuICAgICAgICB2YXIgaWRmID0gY3VycmVudFVSTC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChpZGYgIT09IC0xKSB7XG4gICAgICAgICAgY3VycmVudFVSTCA9IGN1cnJlbnRVUkwuc2xpY2UoMCwgaWRmKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoLy4qXFwvJC8udGVzdChjdXJyZW50VVJMKSkge1xuICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIScgKyBjdXJyZW50VVJMICsgcGF0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaGFzaCA9IGN1cnJlbnRVUkwucmVwbGFjZSgvKFteXFwvXSt8KSQvLCBmdW5jdGlvbiAoJDEpIHtcbiAgICAgICAgICAgIHJldHVybiAkMSA9PT0gJycgPyAnLycgKyBwYXRoIDogcGF0aDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJyEnICsgaGFzaDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcblxuZnVuY3Rpb24gb25jaGFuZ2Uob25DaGFuZ2VFdmVudCkge1xuICBpZiAoTGlzdGVuZXIuc2V0VXJsT25seSkge1xuICAgIExpc3RlbmVyLnNldFVybE9ubHkgPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGxpc3RlbmVycyA9IExpc3RlbmVyLmxpc3RlbmVycztcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbGlzdGVuZXJzW2ldKG9uQ2hhbmdlRXZlbnQpO1xuICB9XG59XG5cbnZhciBxdWVyeXN0cmluZyA9IHtcbiAgLyoqXG4gICAqIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeVxuICAgKiBAcGFyYW0geyBPYmplY3QgfSBvYmpcbiAgICogQHBhcmFtIHsgQm9vbGVhbiB9IHRyYWRpdGlvbmFsIFtkZWZhdWx0OmZhbHNlXVxuICAgKiBAcmV0dXJuIHsgU3RyaW5nIH1cbiAgICpcbiAgICogdHJhZGl0aW9uYWwgaXMgdHJ1ZTogIHt4OiBbMSwgMl19ID0+ICd4PTEmeD0yJ1xuICAgKiB0cmFkaXRpb25hbCBpcyBmYWxzZToge3g6IFsxLCAyXX0gPT4gJ3hbXT0xJnhbXT0yJ1xuICAgKi9cbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiBzdHJpbmdpZnkob2JqLCB0cmFkaXRpb25hbCkge1xuICAgIGlmICghb2JqKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHZhciBhcHBlbmRTdHJpbmcgPSB0cmFkaXRpb25hbCA/ICcnIDogJ1tdJztcbiAgICB2YXIgbmFtZXMgPSBPYmplY3Qua2V5cyhvYmopLnNvcnQoKTtcblxuICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBvYmpbbmFtZV07XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZS5zb3J0KCk7XG4gICAgICAgIHZhciBfcGFydHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7ICsraikge1xuICAgICAgICAgIF9wYXJ0cy5wdXNoKCcnICsgZW5jb2RlVVJJQ29tcG9uZW50KG5hbWUpLnJlcGxhY2UoLyUyMC9nLCAnKycpICsgYXBwZW5kU3RyaW5nICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKS5yZXBsYWNlKC8lMjAvZywgJysnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFydHMucHVzaChfcGFydHMuam9pbignJicpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBwYXJ0cy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChuYW1lKS5yZXBsYWNlKC8lMjAvZywgJysnKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkucmVwbGFjZSgvJTIwL2csICcrJykpO1xuICAgIH1cbiAgICByZXR1cm4gcGFydHMuam9pbignJicpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBxdWVyeXN0cmluZy5wYXJzZVxuICAgKiBAcGFyYW0geyBTdHJpbmcgfSBxdWVyeVN0cmluZ1xuICAgKiBAcmV0dXJuIHsgT2JqZWN0IH1cbiAgICogXG4gICAqICd4PTEmeT0yJyA9PiB7eDogMSwgeTogMn1cbiAgICogJ3g9MSZ4PTInID0+IHt4OiAyfVxuICAgKi9cbiAgcGFyc2U6IGZ1bmN0aW9uIHBhcnNlKHF1ZXJ5U3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiBxdWVyeVN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBxdWVyeVN0cmluZyA9IHF1ZXJ5U3RyaW5nLnRyaW0oKS5yZXBsYWNlKC9eKFxcP3wjKS8sICcnKTtcblxuICAgIGlmIChxdWVyeVN0cmluZyA9PT0gJycpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICB2YXIgcXVlcnlQYXJ0cyA9IHF1ZXJ5U3RyaW5nLnNwbGl0KCcmJyk7XG5cbiAgICB2YXIgcXVlcnkgPSB7fTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHBhcnRzID0gcXVlcnlQYXJ0c1tpXS5yZXBsYWNlKC9cXCsvZywgJyUyMCcpLnNwbGl0KCc9Jyk7IC8vIOeJueauiuWtl+espmArYOi9rOaNouS4uuepuuagvFxuICAgICAgdmFyIG5hbWUgPSBwYXJ0c1swXSxcbiAgICAgICAgICB2YWx1ZSA9IHBhcnRzWzFdO1xuXG4gICAgICBuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpO1xuXG4gICAgICB2YWx1ZSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcblxuICAgICAgaWYgKCFxdWVyeS5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBxdWVyeVtuYW1lXSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5W25hbWVdKSkge1xuICAgICAgICBxdWVyeVtuYW1lXS5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5W25hbWVdID0gW3F1ZXJ5W25hbWVdLCB2YWx1ZV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBxdWVyeTtcbiAgfVxufTtcblxuLy8gVE9ETzogcm9vdOaAjuS5iOWkhOeQhu+8n1xuZnVuY3Rpb24gaGFuZGxlcihvbkNoYW5nZUV2ZW50KSB7XG4gIHZhciBtb2RlID0gdGhpcy5vcHRpb25zLm1vZGU7XG4gIHZhciB1cmwgPSB2b2lkIDA7XG4gIHN3aXRjaCAobW9kZSkge1xuICAgIGNhc2UgJ2hpc3RvcnknOlxuICAgICAgdXJsID0gbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2ggKyBsb2NhdGlvbi5oYXNoO1xuICAgICAgaWYgKHVybC5zdWJzdHIoMCwgMSkgIT09ICcvJykge1xuICAgICAgICB1cmwgPSAnLycgKyB1cmw7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdoYXNoYmFuZyc6XG4gICAgZGVmYXVsdDpcbiAgICAgIHZhciBoYXNoID0gbG9jYXRpb24uaGFzaC5zbGljZSgxKTtcbiAgICAgIGlmIChoYXNoID09PSAnJyB8fCBoYXNoID09PSAnIScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVkaXJlY3QodGhpcy5vcHRpb25zLnJvb3QpO1xuICAgICAgfVxuICAgICAgdmFyIG5ld1VSTCA9IG9uQ2hhbmdlRXZlbnQgJiYgb25DaGFuZ2VFdmVudC5uZXdVUkwgfHwgbG9jYXRpb24uaGFzaDtcbiAgICAgIHVybCA9IG5ld1VSTC5yZXBsYWNlKC8uKiMhLywgJycpO1xuICB9XG4gIHRoaXMuZGlzcGF0Y2godXJsLmNoYXJBdCgwKSA9PT0gJy8nID8gdXJsIDogJy8nICsgdXJsKTtcbn1cblxuLyoqXG4gKiDmoLnmja7nu5nlrprnmoRwYXRo77yM5p+l5om+6Lev55Sx5qCR77yM6L+U5ZuecGF0aOWvueW6lOeahOiKgueCueOAguWmguaenOiKgueCueS4jeWtmOWcqOWwseWIm+W7uuaWsOeahOiKgueCuVxuICog5Yy56YWN5Y+C5pWw77yI5Y+C5pWw5ZCN55Sx5a2X5q+N44CB5pWw5a2X44CB5LiL5YiS57q/57uE5oiQ77yM5LiN6IO95Lul5pWw5a2X5byA5aS044CC5ZCO6Z2i5bim5ous5Y+355qE5piv54m55a6a5Y+C5pWw55qE5Yy56YWN6KeE5YiZ44CC77yJXG4gKiBAcGFyYW0ge1JOb2RlfSB0cmVlXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtCb29sZWFufSBvbmx5RmluZCDlj6rmib7oioLngrnvvIzlvZPoioLngrnkuI3lrZjlnKjml7bkuI3opoHliJvlu7rmlrDoioLngrlcbiAqIEByZXR1cm4ge1JOb2RlfVxuICogKi9cbmZ1bmN0aW9uIGZpbmROb2RlKHRyZWUsIHBhdGgsIG9ubHlGaW5kKSB7XG4gIG9ubHlGaW5kID0gISFvbmx5RmluZDtcbiAgdmFyIHBhcnRzID0gcGF0aC5zcGxpdCgnLycpO1xuICB2YXIgdGFyZ2V0ID0gbnVsbCxcbiAgICAgIGZvdW5kID0gZmFsc2U7XG4gIHZhciBwYXJlbnQgPSB0cmVlO1xuICB2YXIgcGFyYW1zO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gcGFydHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBwYXJhbXMgPSBmYWxzZTtcbiAgICB2YXIgcmVhbEN1cnJlbnRWYWx1ZSA9IHBhcnRzW2ldO1xuXG4gICAgdmFyIG1hdGNoZXIgPSAvOihbYS16QS1aX11bYS16QS1aMC05X10qKShcXChbXlxcKV0rXFwpKT8vZztcblxuICAgIHZhciBrID0gMDtcblxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgICByZWFsQ3VycmVudFZhbHVlID0gcmVhbEN1cnJlbnRWYWx1ZS5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uICgkMSwgJDIsICQzKSB7XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwgW107XG4gICAgICBwYXJhbXNbaysrXSA9ICQyO1xuICAgICAgaWYgKHR5cGVvZiAkMyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuICcoW2EtekEtWjAtOV9dKyknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICQzO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcmVudC5fY2hpbGRyZW4ubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChwYXJlbnQuX2NoaWxkcmVuW2pdLnZhbHVlID09PSByZWFsQ3VycmVudFZhbHVlKSB7XG4gICAgICAgIHRhcmdldCA9IHBhcmVudC5fY2hpbGRyZW5bal07XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIC8vIOS4jeWtmOWcqO+8jOWIm+W7uuaWsOiKgueCuVxuICAgICAgaWYgKG9ubHlGaW5kKSByZXR1cm4gZmFsc2U7XG4gICAgICB2YXIgZXh0ZW5kTm9kZSA9IG5ldyBSTm9kZShyZWFsQ3VycmVudFZhbHVlKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbihleHRlbmROb2RlKTtcbiAgICAgIGV4dGVuZE5vZGUucGFyZW50KHBhcmVudCk7XG4gICAgICBleHRlbmROb2RlLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgIHRhcmdldCA9IGV4dGVuZE5vZGU7XG4gICAgfVxuICAgIHBhcmVudCA9IHRhcmdldDtcbiAgICBmb3VuZCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICog5p6E6YCg6Lev55Sx5qCRL+WtkOagkVxuICogQHBhcmFtIHtSTm9kZX0gcm9vdCDlvZPliY3moLnoioLngrlcbiAqIEBwYXJhbSB7T2JqZWN0fSByb3V0ZXMg5b2T5YmN6IqC54K555qE6Lev55Sx6KGoXG4gKiBAcmV0dXJuIHtSTm9kZX0g6L+U5Zue5qC56IqC54K5XG4gKiAqL1xuZnVuY3Rpb24gY3JlYXRlUm91dGVUcmVlKHJvb3QsIHJvdXRlcykge1xuXG4gIGlmICh0eXBlb2Ygcm91dGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcm9vdC5jYWxsYmFja3MgPSBbcm91dGVzXTtcbiAgICByZXR1cm4gcm9vdDtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJvdXRlcykpIHtcbiAgICByb290LmNhbGxiYWNrcyA9IHJvdXRlcztcbiAgICByZXR1cm4gcm9vdDtcbiAgfVxuXG4gIGZvciAodmFyIHBhdGggaW4gcm91dGVzKSB7XG4gICAgaWYgKHJvdXRlcy5oYXNPd25Qcm9wZXJ0eShwYXRoKSkge1xuXG4gICAgICB2YXIgZm5zID0gcm91dGVzW3BhdGhdO1xuXG4gICAgICBpZiAocGF0aCA9PT0gJy8nKSB7XG4gICAgICAgIGNyZWF0ZVJvdXRlVHJlZShyb290LCBmbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhdGggIT09ICcnICYmIHBhdGhbMF0gPT09ICcvJykge1xuICAgICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGNyZWF0ZVJvdXRlVHJlZShmaW5kTm9kZShyb290LCBwYXRoKSwgZm5zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcm9vdDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JOb2RlfSByb290IOW9k+WJjeiKgueCuVxuICogQHBhcmFtIHtBcnJheX0gcGFydHMg6Lev5b6E5YiG5q615pWw57uEXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGNpIOW9k+WJjei3r+W+hOWIhuautee0ouW8lVxuICogQHBhcmFtIHtJbnRlZ2VyfSByaSDlvZPliY3oioLngrnmiYDlnKjlhYTlvJ/oioLngrnliJfooajnmoTkvY3nva5cbiAqIEBwYXJhbXMge09iamVjdH0gcGFyYW1zIOiusOW9leWPguaVsOeahOWvueixoVxuICogQHJldHVybiB7W1JOb2RlLCBPYmplY3RdfSDlkIzml7bov5Tlm57oioLngrnlkozlj4LmlbBcbiAqL1xuZnVuY3Rpb24gZGZzKHJvb3QsIHBhcnRzLCBjaSwgcmksIHBhcmFtcykge1xuXG4gIHZhciB2YWx1ZSA9IHBhcnRzW2NpXTtcblxuICB2YXIgbmV3UGFyYW1zID0ge307XG4gIGZvciAodmFyIHAgaW4gcGFyYW1zKSB7XG4gICAgLy8gY29weTogcGFyYW1zID0+IG5ld1BhcmFtc1xuICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgIG5ld1BhcmFtc1twXSA9IHBhcmFtc1twXTtcbiAgICB9XG4gIH1cblxuICB2YXIgcGFyZW50ID0gcm9vdC5wYXJlbnQoKTtcblxuICBpZiAocGFyZW50ID09PSBudWxsICYmIHJpID4gMCkge1xuICAgIC8vIGZpbmFsbHkgbm90IG1hdGNoZWRcbiAgICByZXR1cm4gW2ZhbHNlLCBuZXdQYXJhbXNdO1xuICB9XG5cbiAgaWYgKHBhcmVudCAhPT0gbnVsbCAmJiByaSA+IHBhcmVudC5fY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xuICAgIC8vIG5vdCBtYXRjaGVkLCBnbyBiYWNrXG4gICAgcmV0dXJuIFtmYWxzZSwgbmV3UGFyYW1zXTtcbiAgfVxuXG4gIGlmIChjaSA+IHBhcnRzLmxlbmd0aCAtIDEgfHwgY2kgPCAwKSByZXR1cm4gW2ZhbHNlLCBuZXdQYXJhbXNdO1xuXG4gIHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cCgnXicgKyByb290LnZhbHVlICsgJyQnKTtcbiAgdmFyIG1hdGNoZXMgPSB2YWx1ZS5tYXRjaChtYXRjaGVyKTtcblxuICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkgcmV0dXJuIFtmYWxzZSwgbmV3UGFyYW1zXTsgLy8gbm90IG1hdGNoZWQsIGdvIGJhY2tcblxuICBpZiAoISFyb290LnBhcmFtcykge1xuICAgIG1hdGNoZXMgPSBbXS5zbGljZS5hcHBseShtYXRjaGVzLCBbMV0pO1xuICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbWF0Y2hlcy5sZW5ndGg7ICsraykge1xuICAgICAgbmV3UGFyYW1zW3Jvb3QucGFyYW1zW2tdXSA9IG1hdGNoZXNba107XG4gICAgfVxuICB9XG5cbiAgaWYgKGNpID09PSBwYXJ0cy5sZW5ndGggLSAxICYmIHJvb3QuY2FsbGJhY2tzICE9PSBudWxsKSB7XG4gICAgLy8gZmluYWxseSBtYXRjaGVkXG4gICAgcmV0dXJuIFtyb290LCBuZXdQYXJhbXNdO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByb290Ll9jaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgIHZhciBmb3VuZCA9IGRmcyhyb290Ll9jaGlsZHJlbltpXSwgcGFydHMsIGNpICsgMSwgaSwgbmV3UGFyYW1zKTsgLy8gbWF0Y2hlZCwgZ28gYWhlYWRcbiAgICBpZiAoIWZvdW5kWzBdKSBjb250aW51ZTtcbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICByZXR1cm4gZGZzKHJvb3QsIHBhcnRzLCBjaSwgcmkgKyAxLCBwYXJhbXMpOyAvLyBub3QgbWF0Y2hlZCwgZ28gYmFja1xufVxuXG4vKipcbiAqIOaQnOe0oui3r+eUseagke+8jOeci+aYr+WQpuWtmOWcqOWMuemFjeeahOi3r+W+hO+8jOWmguaenOWtmOWcqO+8jOi/lOWbnuebuOW6lOeahOWbnuiwg+WHveaVsFxuICogQHRvZG8g5Y+q6L+U5Zue56ys5LiA5Liq5Yy56YWN5Yiw55qE6Lev55Sx77yI5aaC5p6c5a2Y5Zyo5aSa5Liq5Yy56YWN77yf77yJXG4gKiBAcGFyYW0ge1JOb2RlfSB0cmVlIOagkeaguVxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGgg6KaB5Yy56YWN55qE6Lev5b6EXG4gKiDov5Tlm57lgLzljIXlkKvkuKTkuKrvvIznlKjmlbDnu4TooajnpLpbY2FsbGJhY2tzLCBwYXJhbXNdXG4gKiBAcmV0dXJuIHtGdW5jdGlvbnxBcnJheXxudWxsfSDlpoLmnpzlrZjlnKjlsLHov5Tlm57nm7jlupTnmoTlm57osIPvvIzlkKbliJnov5Tlm55udWxsXG4gKiBAcmV0dXJuIHtbQXJyYXksIE9iamVjdF19IOWQjOaXtui/lOWbnuWbnuiwg+WSjOWPguaVsFxuICpcbiAqICovXG5mdW5jdGlvbiBzZWFyY2hSb3V0ZVRyZWUodHJlZSwgcGF0aCkge1xuXG4gIHZhciBmb3VuZCA9IGRmcyh0cmVlLCBwYXRoLnNwbGl0KCcvJyksIDAsIDAsIHt9KTtcblxuICBpZiAoIWZvdW5kWzBdKSB7XG4gICAgcmV0dXJuIFtudWxsLCB7fV07XG4gIH1cblxuICByZXR1cm4gW2ZvdW5kWzBdLmNhbGxiYWNrcywgZm91bmRbMV1dO1xufVxuXG52YXIgb3B0aW9uRGVmYXVsdHMgPSB7XG4gIC8vIG1vZGXlj6/ku6XmmK9oaXN0b3J5fGhhc2hiYW5nXG4gIC8vIG1vZGU6aGlzdG9yeSAgICAg5L2/55SoSFRNTDUgSGlzdG9yeSBBUElcbiAgLy8gbW9kZTpoYXNoYmFuZyAgICDkvb/nlKhoYXNo77yIaGFzaGJhbmfmqKHlvI/vvIlcbiAgcm9vdDogJy8nLCAvLyBUT0RPXG4gIG1vZGU6ICdoYXNoYmFuZycsXG4gIG5vdEZvdW5kOiBmYWxzZSxcbiAgcmVjdXJzZTogZmFsc2UgLy8gVE9ET1xufTtcblxuLyoqXG4gKiBSb3V0ZXIgKHJvdXRlcylcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IHJvdXRlcyAqKk9wdGlvbmFsKipcbiAqL1xuXG5mdW5jdGlvbiBSb3V0ZXIocm91dGVzKSB7XG4gIHJvdXRlcyA9IHJvdXRlcyB8fCB7fTtcbiAgdmFyIHJvb3QgPSBuZXcgUk5vZGUoJycpO1xuICByb290LnBhcmFtcyA9IGZhbHNlO1xuICB0aGlzLnJvdXRlVHJlZSA9IGNyZWF0ZVJvdXRlVHJlZShyb290LCByb3V0ZXMpO1xuICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgdGhpcy5faG9va3MgPSB7fTtcbiAgdGhpcy5jb25maWd1cmUob3B0aW9uRGVmYXVsdHMpO1xufVxuXG52YXIgcHJvdG8gPSBSb3V0ZXIucHJvdG90eXBlO1xuXG4vKipcbiAqIC5jb25maWd1cmUoKVxuICogQG1ldGhvZFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKipPcHRpb25hbCoqXG4gKiBAcmV0dXJuIHRoaXNcbiAqL1xucHJvdG8uY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMub3B0aW9ucyA9IGV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogLnN0YXJ0KClcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHRoaXNcbiAqL1xucHJvdG8uc3RhcnQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLl9ob29rc1snYmVmb3JlRWFjaCddID0gb3B0aW9ucy5iZWZvcmVFYWNoID8gW29wdGlvbnMuYmVmb3JlRWFjaF0gOiBbXTtcbiAgdGhpcy5faG9va3NbJ2FmdGVyRWFjaCddID0gb3B0aW9ucy5hZnRlckVhY2ggPyBbb3B0aW9ucy5hZnRlckVhY2hdIDogW107XG4gIC8vIOWIneWni+WMlumFjee9rlxuICB0aGlzLmNvbmZpZ3VyZShvcHRpb25zKTtcbiAgTGlzdGVuZXIuaW5pdCh0aGlzLm9wdGlvbnMubW9kZSkuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gaGFuZGxlci5jYWxsKF90aGlzKTtcbiAgfSk7XG4gIC8vIOmmluasoeinpuWPkVxuICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8g5YGc5q2i6Lev55Sx55uR5ZCsXG5wcm90by5zdG9wID0gZnVuY3Rpb24gKCkge1xuICBMaXN0ZW5lci5zdG9wKCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiAubW91bnQoKSDlsIbot6/nlLHmjILovb3liLDmn5DkuKroioLngrnkuIpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge09iamVjdH0gcm91dGVzXG4gKiBAcmV0dXJuIHRoaXNcbiAqL1xucHJvdG8ubW91bnQgPSBmdW5jdGlvbiAocGF0aCwgcm91dGVzKSB7XG4gIGlmIChwYXRoICE9PSAnJyAmJiBwYXRoWzBdID09PSAnLycpIHtcbiAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcbiAgfVxuICBjcmVhdGVSb3V0ZVRyZWUoZmluZE5vZGUodGhpcy5yb3V0ZVRyZWUsIHBhdGgpLCByb3V0ZXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogLm9uKClcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gcGF0aFxuICogQHBhcmFtIHtGdW5jdGlvbnxBcnJheX0gaGFuZGxlcnNcbiAqIEByZXR1cm4gdGhpc1xuICovXG5wcm90by5vbiA9IGZ1bmN0aW9uIChwYXRoLCBoYW5kbGVycykge1xuICBpZiAocGF0aCAhPT0gJycgJiYgcGF0aFswXSA9PT0gJy8nKSB7XG4gICAgcGF0aCA9IHBhdGguc2xpY2UoMSk7XG4gIH1cbiAgdmFyIG4gPSBmaW5kTm9kZSh0aGlzLnJvdXRlVHJlZSwgcGF0aCk7XG4gIG4uY2FsbGJhY2tzID0gbi5jYWxsYmFja3MgfHwgW107XG4gIGlmIChBcnJheS5pc0FycmF5KGhhbmRsZXJzKSkge1xuICAgIG4uY2FsbGJhY2tzID0gbi5jYWxsYmFja3MuY29uY2F0KGhhbmRsZXJzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgaGFuZGxlcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBuLmNhbGxiYWNrcy5wdXNoKGhhbmRsZXJzKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogLmRpc3BhdGNoKCkg5qC55o2u57uZ5a6a55qE6Lev5b6E77yM6YGN5Y6G6Lev55Sx5qCR77yM5Y+q6KaB5om+5Yiw5LiA5Liq5Yy56YWN55qE5bCx5oqK6Lev55Sx6L+U5ZueXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB0aGlzXG4gKi9cbnByb3RvLmRpc3BhdGNoID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgdmFyIHJvdXRlVHJlZSA9IHRoaXMucm91dGVUcmVlO1xuICAvLyDkv53lrZjljp/lp4vor7fmsYJ1cmlcbiAgdmFyIHVyaSA9IHBhdGg7XG4gIC8vIOWPluWHunF1ZXJ56YOo5YiGXG4gIHZhciBxdWVyeUluZGV4ID0gcGF0aC5pbmRleE9mKCc/Jyk7XG4gIHZhciBoYXNoSW5kZXggPSBwYXRoLmluZGV4T2YoJyMnKTtcbiAgaGFzaEluZGV4ID0gaGFzaEluZGV4ID09PSAtMSA/IHBhdGgubGVuZ3RoIDogaGFzaEluZGV4O1xuICB2YXIgcXVlcnlTdHJpbmcgPSBxdWVyeUluZGV4ID09PSAtMSA/ICcnIDogcGF0aC5zbGljZShxdWVyeUluZGV4ICsgMSwgaGFzaEluZGV4KTtcbiAgcGF0aCA9IHF1ZXJ5SW5kZXggPT09IC0xID8gcGF0aCA6IHBhdGguc2xpY2UoMCwgcXVlcnlJbmRleCk7XG4gIHZhciByZXEgPSB7IHVyaTogdXJpLCBwYXRoOiBwYXRoLCBxdWVyeTogcXVlcnlzdHJpbmcucGFyc2UocXVlcnlTdHJpbmcpLCAkcm91dGVyOiB0aGlzIH07XG5cbiAgaWYgKHBhdGggPT09ICcvJykge1xuICAgIHBhdGggPSAnJztcbiAgfVxuICB2YXIgcmVzdWx0ID0gc2VhcmNoUm91dGVUcmVlKHJvdXRlVHJlZSwgcGF0aCk7XG4gIHZhciBjYWxsYmFja3MgPSByZXN1bHRbMF07XG4gIHJlcS5wYXJhbXMgPSByZXN1bHRbMV07XG4gIHRoaXMuX2NhbGxIb29rcygnYmVmb3JlRWFjaCcsIHJlcSk7XG4gIGlmIChjYWxsYmFja3MgIT09IG51bGwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIC8vIOS4jeiAg+iZkeW8guatpeaTjeS9nFxuICAgICAgICB2YXIgcHJlID0gY2FsbGJhY2tzW2ldLmNhbGwodGhpcywgcmVxKTsgLy8gQFRPRE8g5Y+v5Lul5Lit5patIGNhbGxiYWNrIOeahOiwg+eUqFxuICAgICAgICBpZiAodHlwZW9mIHByZSA9PT0gJ2Jvb2xlYW4nICYmICFwcmUpIHtcbiAgICAgICAgICAvLyDlpoLmnpzliY3kuIDkuKogY2FsbGJhY2sg6L+U5Zue5LqGIGZhbHNlIO+8jOWwseS4jeaJp+ihjOWQjumdoueahCBjYWxsYmFja1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIEFycmF5LCBnb3QgJyArICh0eXBlb2YgY2FsbGJhY2tzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihjYWxsYmFja3MpKSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5ub3RGb3VuZCkge1xuICAgIHRoaXMub3B0aW9ucy5ub3RGb3VuZChyZXEpO1xuICB9XG4gIHRoaXMuX2NhbGxIb29rcygnYWZ0ZXJFYWNoJywgcmVxKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIOi/meS4quaWueazleS8muaUueWPmOW9k+WJjeeahGB1cmxg77yM5LuO6ICM6Kem5Y+R6Lev55Sx77yI5ZKMZGlzcGF0Y2jnsbvkvLzvvIzkvYbmmK9kaXNwYXRjaOS4jeS8muaUueWKqGB1cmxg77yJXG4gKiDov5nkuKrmlrnms5Xlr7nkuo5oYXNoL2hhc2hiYW5n5qih5byP5rKh5pyJ5aSa5aSn55So5aSE77yM55So5oi35Y+v5Lul6YCa6L+H54K55Ye7PGE+5qCH562+5a6e546wYHVybGDmlLnlj5jogIzkuI3ot7PovazpobXpnaLvvIzkvYbmmK/lnKhoaXN0b3J55qih5byP5LiL77yM55So5oi35peg5rOV6YCa6L+H5qCH562+5pS55Y+YYHVybGDogIzkuI3ot7PovazpobXpnaJcbiAqIOaUueaWueazleebuOW9k+S6juiwg+eUqOS4gOasoWhpc3RvcnkucHVzaFN0YXRlKCnnhLblkI7lho3osIPnlKguZGlzcGF0Y2goKVxuICog5aaC5p6cdXJs5rKh5pyJ5pS55Y+Y77yM5YiZ5LiNXCLliLfmlrBcIlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHRoaXNcbiAqL1xucHJvdG8uc2V0Um91dGUgPSBmdW5jdGlvbiAocGF0aCkge1xuICB2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uO1xuICB2YXIgb2xkVVJJID0gbG9jLnBhdGhuYW1lICsgbG9jLnNlYXJjaDtcbiAgTGlzdGVuZXIuc2V0SGFzaEhpc3RvcnkocGF0aCk7XG4gIHZhciBuZXdVUkkgPSBsb2MucGF0aG5hbWUgKyBsb2Muc2VhcmNoO1xuICBpZiAodGhpcy5vcHRpb25zLm1vZGUgPT09ICdoaXN0b3J5JyAmJiBvbGRVUkkgIT09IG5ld1VSSSkge1xuICAgIHRoaXMuZGlzcGF0Y2gobmV3VVJJKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICog6L+Z5Liq5pa55rOV5Lya5pS55Y+Y5b2T5YmN55qEIGB1cmxgIOS9huaYr+S4jeinpuWPkei3r+eUsVxuICovXG5wcm90by5zZXRVcmwgPSBmdW5jdGlvbiAocGF0aCkge1xuICBMaXN0ZW5lci5zZXRVcmxPbmx5ID0gdHJ1ZTtcbiAgTGlzdGVuZXIuc2V0SGFzaEhpc3RvcnkocGF0aCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBhbGlhczogYHNldFJvdXRlYFxuICovXG5wcm90by5yZWRpcmVjdCA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIHJldHVybiB0aGlzLnNldFJvdXRlKHBhdGgpO1xufTtcblxuLyoqXG4gKiBUT0RPOiBvbmNlXG4gKiDlkowub24oKeaWueazleexu+S8vO+8jOS9huWPquS8muinpuWPkeS4gOasoVxuICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufEFycmF5fSBoYW5kbGVyc1xuICogQHJldHVybiB0aGlzXG4gKi9cbnByb3RvLm9uY2UgPSBmdW5jdGlvbiAocGF0aCwgaGFuZGxlcnMpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIC5vZmYoKeaWueazleihqOekuuS4jeWGjeS+puWQrOafkOS4qui3r+eUse+8jOebtOaOpeWwhuivpei3r+eUseiKgueCueeahOaJgOaciWNhbGxiYWNrc+enu+mZpFxuICogQHJldHVybiB0aGlzXG4gKi9cbnByb3RvLm9mZiA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmIChwYXRoICE9PSAnJyAmJiBwYXRoWzBdID09PSAnLycpIHtcbiAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcbiAgfVxuICB2YXIgbiA9IGZpbmROb2RlKHRoaXMucm91dGVUcmVlLCBwYXRoKTtcbiAgaWYgKG4gIT09IG51bGwgJiYgbi5jYWxsYmFja3MgIT09IG51bGwpIHtcbiAgICBuLmNhbGxiYWNrcy5zcGxpY2UoMCwgbi5jYWxsYmFja3MubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogLnJlbG9hZCgpXG4gKiByZWxvYWQgcGFnZTogcmVkaXNwYXRjaCBjdXJyZW50IHBhdGhcbiAqIEBtZXRob2RcbiAqIEByZXR1cm4gdGhpc1xuICovXG5wcm90by5yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMubW9kZSA9PT0gJ2hpc3RvcnknKSB7XG4gICAgdGhpcy5kaXNwYXRjaChsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2gpO1xuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5tb2RlID09PSAnaGFzaGJhbmcnKSB7XG4gICAgdGhpcy5kaXNwYXRjaChsb2NhdGlvbi5oYXNoLnNsaWNlKDIpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRpc3BhdGNoKGxvY2F0aW9uLmhhc2guc2xpY2UoMSkpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uX2NhbGxIb29rcyA9IGZ1bmN0aW9uIChob29rTmFtZSwgcmVxKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9ob29rc1tob29rTmFtZV0gfHwgW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgY2FsbGJhY2tzW2ldLmNhbGwodGhpcywgcmVxKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zcGEtcm91dGVyLmpzLm1hcFxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFuc2lSZWdleCA9IHJlcXVpcmUoJ2Fuc2ktcmVnZXgnKSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIpIHtcblx0cmV0dXJuIHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnID8gc3RyLnJlcGxhY2UoYW5zaVJlZ2V4LCAnJykgOiBzdHI7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFyZ3YgPSBwcm9jZXNzLmFyZ3Y7XG5cbnZhciB0ZXJtaW5hdG9yID0gYXJndi5pbmRleE9mKCctLScpO1xudmFyIGhhc0ZsYWcgPSBmdW5jdGlvbiAoZmxhZykge1xuXHRmbGFnID0gJy0tJyArIGZsYWc7XG5cdHZhciBwb3MgPSBhcmd2LmluZGV4T2YoZmxhZyk7XG5cdHJldHVybiBwb3MgIT09IC0xICYmICh0ZXJtaW5hdG9yICE9PSAtMSA/IHBvcyA8IHRlcm1pbmF0b3IgOiB0cnVlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblx0aWYgKCdGT1JDRV9DT0xPUicgaW4gcHJvY2Vzcy5lbnYpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmIChoYXNGbGFnKCduby1jb2xvcicpIHx8XG5cdFx0aGFzRmxhZygnbm8tY29sb3JzJykgfHxcblx0XHRoYXNGbGFnKCdjb2xvcj1mYWxzZScpKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aWYgKGhhc0ZsYWcoJ2NvbG9yJykgfHxcblx0XHRoYXNGbGFnKCdjb2xvcnMnKSB8fFxuXHRcdGhhc0ZsYWcoJ2NvbG9yPXRydWUnKSB8fFxuXHRcdGhhc0ZsYWcoJ2NvbG9yPWFsd2F5cycpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAocHJvY2Vzcy5zdGRvdXQgJiYgIXByb2Nlc3Muc3Rkb3V0LmlzVFRZKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmICgnQ09MT1JURVJNJyBpbiBwcm9jZXNzLmVudikge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKHByb2Nlc3MuZW52LlRFUk0gPT09ICdkdW1iJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGlmICgvXnNjcmVlbnxeeHRlcm18XnZ0MTAwfGNvbG9yfGFuc2l8Y3lnd2lufGxpbnV4L2kudGVzdChwcm9jZXNzLmVudi5URVJNKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufSkoKTtcbiIsIi8qKlxuICogVGVtcGxhdGU3IDEuMS4wXG4gKiBNb2JpbGUtZmlyc3QgSmF2YVNjcmlwdCB0ZW1wbGF0ZSBlbmdpbmVcbiAqIFxuICogaHR0cDovL3d3dy5pZGFuZ2Vyby51cy90ZW1wbGF0ZTcvXG4gKiBcbiAqIENvcHlyaWdodCAyMDE1LCBWbGFkaW1pciBLaGFybGFtcGlkaVxuICogVGhlIGlEYW5nZXJvLnVzXG4gKiBodHRwOi8vd3d3LmlkYW5nZXJvLnVzL1xuICogXG4gKiBMaWNlbnNlZCB1bmRlciBNSVRcbiAqIFxuICogUmVsZWFzZWQgb246IE9jdG9iZXIgMywgMjAxNVxuICovXG53aW5kb3cuVGVtcGxhdGU3PWZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZShlKXtyZXR1cm5cIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGUpfWZ1bmN0aW9uIHQoZSl7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgZX1mdW5jdGlvbiByKGUpe3ZhciB0LHIsbixpPWUucmVwbGFjZSgvW3t9I31dL2csXCJcIikuc3BsaXQoXCIgXCIpLGE9W107Zm9yKHI9MDtyPGkubGVuZ3RoO3IrKyl7dmFyIGw9aVtyXTtpZigwPT09cilhLnB1c2gobCk7ZWxzZSBpZigwPT09bC5pbmRleE9mKCdcIicpKWlmKDI9PT1sLm1hdGNoKC9cIi9nKS5sZW5ndGgpYS5wdXNoKGwpO2Vsc2V7Zm9yKHQ9MCxuPXIrMTtuPGkubGVuZ3RoO24rKylpZihsKz1cIiBcIitpW25dLGlbbl0uaW5kZXhPZignXCInKT49MCl7dD1uLGEucHVzaChsKTticmVha310JiYocj10KX1lbHNlIGlmKGwuaW5kZXhPZihcIj1cIik+MCl7dmFyIG89bC5zcGxpdChcIj1cIikscD1vWzBdLHM9b1sxXTtpZigyIT09cy5tYXRjaCgvXCIvZykubGVuZ3RoKXtmb3IodD0wLG49cisxO248aS5sZW5ndGg7bisrKWlmKHMrPVwiIFwiK2lbbl0saVtuXS5pbmRleE9mKCdcIicpPj0wKXt0PW47YnJlYWt9dCYmKHI9dCl9dmFyIGY9W3Ascy5yZXBsYWNlKC9cIi9nLFwiXCIpXTthLnB1c2goZil9ZWxzZSBhLnB1c2gobCl9cmV0dXJuIGF9ZnVuY3Rpb24gbih0KXt2YXIgbixpLGE9W107aWYoIXQpcmV0dXJuW107dmFyIGw9dC5zcGxpdCgvKHt7W157Xn1dKn19KS8pO2ZvcihuPTA7bjxsLmxlbmd0aDtuKyspe3ZhciBvPWxbbl07aWYoXCJcIiE9PW8paWYoby5pbmRleE9mKFwie3tcIik8MClhLnB1c2goe3R5cGU6XCJwbGFpblwiLGNvbnRlbnQ6b30pO2Vsc2V7aWYoby5pbmRleE9mKFwiey9cIik+PTApY29udGludWU7aWYoby5pbmRleE9mKFwieyNcIik8MCYmby5pbmRleE9mKFwiIFwiKTwwJiZvLmluZGV4T2YoXCJlbHNlXCIpPDApe2EucHVzaCh7dHlwZTpcInZhcmlhYmxlXCIsY29udGV4dE5hbWU6by5yZXBsYWNlKC9be31dL2csXCJcIil9KTtjb250aW51ZX12YXIgcD1yKG8pLHM9cFswXSxmPVwiPlwiPT09cyxjPVtdLHU9e307Zm9yKGk9MTtpPHAubGVuZ3RoO2krKyl7dmFyIGg9cFtpXTtlKGgpP3VbaFswXV09XCJmYWxzZVwiPT09aFsxXT8hMTpoWzFdOmMucHVzaChoKX1pZihvLmluZGV4T2YoXCJ7I1wiKT49MCl7dmFyIGQsdj1cIlwiLGc9XCJcIixtPTAseD0hMSx5PSExLE89MDtmb3IoaT1uKzE7aTxsLmxlbmd0aDtpKyspaWYobFtpXS5pbmRleE9mKFwie3sjXCIpPj0wJiZPKyssbFtpXS5pbmRleE9mKFwie3svXCIpPj0wJiZPLS0sbFtpXS5pbmRleE9mKFwie3sjXCIrcyk+PTApdis9bFtpXSx5JiYoZys9bFtpXSksbSsrO2Vsc2UgaWYobFtpXS5pbmRleE9mKFwie3svXCIrcyk+PTApe2lmKCEobT4wKSl7ZD1pLHg9ITA7YnJlYWt9bS0tLHYrPWxbaV0seSYmKGcrPWxbaV0pfWVsc2UgbFtpXS5pbmRleE9mKFwiZWxzZVwiKT49MCYmMD09PU8/eT0hMDooeXx8KHYrPWxbaV0pLHkmJihnKz1sW2ldKSk7eCYmKGQmJihuPWQpLGEucHVzaCh7dHlwZTpcImhlbHBlclwiLGhlbHBlck5hbWU6cyxjb250ZXh0TmFtZTpjLGNvbnRlbnQ6dixpbnZlcnNlQ29udGVudDpnLGhhc2g6dX0pKX1lbHNlIG8uaW5kZXhPZihcIiBcIik+MCYmKGYmJihzPVwiX3BhcnRpYWxcIixjWzBdJiYoY1swXT0nXCInK2NbMF0ucmVwbGFjZSgvXCJ8Jy9nLFwiXCIpKydcIicpKSxhLnB1c2goe3R5cGU6XCJoZWxwZXJcIixoZWxwZXJOYW1lOnMsY29udGV4dE5hbWU6YyxoYXNoOnV9KSl9fXJldHVybiBhfXZhciBpPWZ1bmN0aW9uKGUpe2Z1bmN0aW9uIHQoZSx0KXtyZXR1cm4gZS5jb250ZW50P2woZS5jb250ZW50LHQpOmZ1bmN0aW9uKCl7cmV0dXJuXCJcIn19ZnVuY3Rpb24gcihlLHQpe3JldHVybiBlLmludmVyc2VDb250ZW50P2woZS5pbnZlcnNlQ29udGVudCx0KTpmdW5jdGlvbigpe3JldHVyblwiXCJ9fWZ1bmN0aW9uIGkoZSx0KXt2YXIgcixuLGk9MDtpZigwPT09ZS5pbmRleE9mKFwiLi4vXCIpKXtpPWUuc3BsaXQoXCIuLi9cIikubGVuZ3RoLTE7dmFyIGE9dC5zcGxpdChcIl9cIilbMV0taTt0PVwiY3R4X1wiKyhhPj0xP2E6MSksbj1lLnNwbGl0KFwiLi4vXCIpW2ldLnNwbGl0KFwiLlwiKX1lbHNlIDA9PT1lLmluZGV4T2YoXCJAZ2xvYmFsXCIpPyh0PVwiVGVtcGxhdGU3Lmdsb2JhbFwiLG49ZS5zcGxpdChcIkBnbG9iYWwuXCIpWzFdLnNwbGl0KFwiLlwiKSk6MD09PWUuaW5kZXhPZihcIkByb290XCIpPyh0PVwicm9vdFwiLG49ZS5zcGxpdChcIkByb290LlwiKVsxXS5zcGxpdChcIi5cIikpOm49ZS5zcGxpdChcIi5cIik7cj10O2Zvcih2YXIgbD0wO2w8bi5sZW5ndGg7bCsrKXt2YXIgbz1uW2xdOzA9PT1vLmluZGV4T2YoXCJAXCIpP2w+MD9yKz1cIlsoZGF0YSAmJiBkYXRhLlwiK28ucmVwbGFjZShcIkBcIixcIlwiKStcIildXCI6cj1cIihkYXRhICYmIGRhdGEuXCIrZS5yZXBsYWNlKFwiQFwiLFwiXCIpK1wiKVwiOmlzRmluaXRlKG8pP3IrPVwiW1wiK28rXCJdXCI6MD09PW8uaW5kZXhPZihcInRoaXNcIik/cj1vLnJlcGxhY2UoXCJ0aGlzXCIsdCk6cis9XCIuXCIrb31yZXR1cm4gcn1mdW5jdGlvbiBhKGUsdCl7Zm9yKHZhciByPVtdLG49MDtuPGUubGVuZ3RoO24rKykwPT09ZVtuXS5pbmRleE9mKCdcIicpP3IucHVzaChlW25dKTpyLnB1c2goaShlW25dLHQpKTtyZXR1cm4gci5qb2luKFwiLCBcIil9ZnVuY3Rpb24gbChlLGwpe2lmKGw9bHx8MSxlPWV8fG8udGVtcGxhdGUsXCJzdHJpbmdcIiE9dHlwZW9mIGUpdGhyb3cgbmV3IEVycm9yKFwiVGVtcGxhdGU3OiBUZW1wbGF0ZSBtdXN0IGJlIGEgc3RyaW5nXCIpO3ZhciBwPW4oZSk7aWYoMD09PXAubGVuZ3RoKXJldHVybiBmdW5jdGlvbigpe3JldHVyblwiXCJ9O3ZhciBzPVwiY3R4X1wiK2wsZj1cIlwiO2YrPTE9PT1sP1wiKGZ1bmN0aW9uIChcIitzK1wiLCBkYXRhLCByb290KSB7XFxuXCI6XCIoZnVuY3Rpb24gKFwiK3MrXCIsIGRhdGEpIHtcXG5cIiwxPT09bCYmKGYrPVwiZnVuY3Rpb24gaXNBcnJheShhcnIpe3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGFycikgPT09ICdbb2JqZWN0IEFycmF5XSc7fVxcblwiLGYrPVwiZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jKXtyZXR1cm4gKHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKTt9XFxuXCIsZis9J2Z1bmN0aW9uIGModmFsLCBjdHgpIHtpZiAodHlwZW9mIHZhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiB2YWwgIT09IG51bGwpIHtpZiAoaXNGdW5jdGlvbih2YWwpKSB7cmV0dXJuIHZhbC5jYWxsKGN0eCk7fSBlbHNlIHJldHVybiB2YWw7fSBlbHNlIHJldHVybiBcIlwiO31cXG4nLGYrPVwicm9vdCA9IHJvb3QgfHwgY3R4XzEgfHwge307XFxuXCIpLGYrPVwidmFyIHIgPSAnJztcXG5cIjt2YXIgYztmb3IoYz0wO2M8cC5sZW5ndGg7YysrKXt2YXIgdT1wW2NdO2lmKFwicGxhaW5cIiE9PXUudHlwZSl7dmFyIGgsZDtpZihcInZhcmlhYmxlXCI9PT11LnR5cGUmJihoPWkodS5jb250ZXh0TmFtZSxzKSxmKz1cInIgKz0gYyhcIitoK1wiLCBcIitzK1wiKTtcIiksXCJoZWxwZXJcIj09PXUudHlwZSlpZih1LmhlbHBlck5hbWUgaW4gby5oZWxwZXJzKWQ9YSh1LmNvbnRleHROYW1lLHMpLGYrPVwiciArPSAoVGVtcGxhdGU3LmhlbHBlcnMuXCIrdS5oZWxwZXJOYW1lK1wiKS5jYWxsKFwiK3MrXCIsIFwiKyhkJiZkK1wiLCBcIikrXCJ7aGFzaDpcIitKU09OLnN0cmluZ2lmeSh1Lmhhc2gpK1wiLCBkYXRhOiBkYXRhIHx8IHt9LCBmbjogXCIrdCh1LGwrMSkrXCIsIGludmVyc2U6IFwiK3IodSxsKzEpK1wiLCByb290OiByb290fSk7XCI7ZWxzZXtpZih1LmNvbnRleHROYW1lLmxlbmd0aD4wKXRocm93IG5ldyBFcnJvcignVGVtcGxhdGU3OiBNaXNzaW5nIGhlbHBlcjogXCInK3UuaGVscGVyTmFtZSsnXCInKTtoPWkodS5oZWxwZXJOYW1lLHMpLGYrPVwiaWYgKFwiK2grXCIpIHtcIixmKz1cImlmIChpc0FycmF5KFwiK2grXCIpKSB7XCIsZis9XCJyICs9IChUZW1wbGF0ZTcuaGVscGVycy5lYWNoKS5jYWxsKFwiK3MrXCIsIFwiK2grXCIsIHtoYXNoOlwiK0pTT04uc3RyaW5naWZ5KHUuaGFzaCkrXCIsIGRhdGE6IGRhdGEgfHwge30sIGZuOiBcIit0KHUsbCsxKStcIiwgaW52ZXJzZTogXCIrcih1LGwrMSkrXCIsIHJvb3Q6IHJvb3R9KTtcIixmKz1cIn1lbHNlIHtcIixmKz1cInIgKz0gKFRlbXBsYXRlNy5oZWxwZXJzLndpdGgpLmNhbGwoXCIrcytcIiwgXCIraCtcIiwge2hhc2g6XCIrSlNPTi5zdHJpbmdpZnkodS5oYXNoKStcIiwgZGF0YTogZGF0YSB8fCB7fSwgZm46IFwiK3QodSxsKzEpK1wiLCBpbnZlcnNlOiBcIityKHUsbCsxKStcIiwgcm9vdDogcm9vdH0pO1wiLGYrPVwifX1cIn19ZWxzZSBmKz1cInIgKz0nXCIrdS5jb250ZW50LnJlcGxhY2UoL1xcci9nLFwiXFxcXHJcIikucmVwbGFjZSgvXFxuL2csXCJcXFxcblwiKS5yZXBsYWNlKC8nL2csXCJcXFxcJ1wiKStcIic7XCJ9cmV0dXJuIGYrPVwiXFxucmV0dXJuIHI7fSlcIixldmFsLmNhbGwod2luZG93LGYpfXZhciBvPXRoaXM7by50ZW1wbGF0ZT1lLG8uY29tcGlsZT1mdW5jdGlvbihlKXtyZXR1cm4gby5jb21waWxlZHx8KG8uY29tcGlsZWQ9bChlKSksby5jb21waWxlZH19O2kucHJvdG90eXBlPXtvcHRpb25zOnt9LHBhcnRpYWxzOnt9LGhlbHBlcnM6e19wYXJ0aWFsOmZ1bmN0aW9uKGUsdCl7dmFyIHI9aS5wcm90b3R5cGUucGFydGlhbHNbZV07aWYoIXJ8fHImJiFyLnRlbXBsYXRlKXJldHVyblwiXCI7ci5jb21waWxlZHx8KHIuY29tcGlsZWQ9YS5jb21waWxlKHIudGVtcGxhdGUpKTt2YXIgbj10aGlzO2Zvcih2YXIgbCBpbiB0Lmhhc2gpbltsXT10Lmhhc2hbbF07cmV0dXJuIHIuY29tcGlsZWQobix0LmRhdGEsdC5yb290KX0sZXNjYXBlOmZ1bmN0aW9uKGUsdCl7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGUpdGhyb3cgbmV3IEVycm9yKCdUZW1wbGF0ZTc6IFBhc3NlZCBjb250ZXh0IHRvIFwiZXNjYXBlXCIgaGVscGVyIHNob3VsZCBiZSBhIHN0cmluZycpO3JldHVybiBlLnJlcGxhY2UoLyYvZyxcIiZhbXA7XCIpLnJlcGxhY2UoLzwvZyxcIiZsdDtcIikucmVwbGFjZSgvPi9nLFwiJmd0O1wiKS5yZXBsYWNlKC9cIi9nLFwiJnF1b3Q7XCIpfSxcImlmXCI6ZnVuY3Rpb24oZSxyKXtyZXR1cm4gdChlKSYmKGU9ZS5jYWxsKHRoaXMpKSxlP3IuZm4odGhpcyxyLmRhdGEpOnIuaW52ZXJzZSh0aGlzLHIuZGF0YSl9LHVubGVzczpmdW5jdGlvbihlLHIpe3JldHVybiB0KGUpJiYoZT1lLmNhbGwodGhpcykpLGU/ci5pbnZlcnNlKHRoaXMsci5kYXRhKTpyLmZuKHRoaXMsci5kYXRhKX0sZWFjaDpmdW5jdGlvbihyLG4pe3ZhciBpPVwiXCIsYT0wO2lmKHQocikmJihyPXIuY2FsbCh0aGlzKSksZShyKSl7Zm9yKG4uaGFzaC5yZXZlcnNlJiYocj1yLnJldmVyc2UoKSksYT0wO2E8ci5sZW5ndGg7YSsrKWkrPW4uZm4oclthXSx7Zmlyc3Q6MD09PWEsbGFzdDphPT09ci5sZW5ndGgtMSxpbmRleDphfSk7bi5oYXNoLnJldmVyc2UmJihyPXIucmV2ZXJzZSgpKX1lbHNlIGZvcih2YXIgbCBpbiByKWErKyxpKz1uLmZuKHJbbF0se2tleTpsfSk7cmV0dXJuIGE+MD9pOm4uaW52ZXJzZSh0aGlzKX0sXCJ3aXRoXCI6ZnVuY3Rpb24oZSxyKXtyZXR1cm4gdChlKSYmKGU9ZS5jYWxsKHRoaXMpKSxyLmZuKGUpfSxqb2luOmZ1bmN0aW9uKGUscil7cmV0dXJuIHQoZSkmJihlPWUuY2FsbCh0aGlzKSksZS5qb2luKHIuaGFzaC5kZWxpbWl0ZXJ8fHIuaGFzaC5kZWxpbWV0ZXIpfSxqczpmdW5jdGlvbihlLHQpe3ZhciByO3JldHVybiByPWUuaW5kZXhPZihcInJldHVyblwiKT49MD9cIihmdW5jdGlvbigpe1wiK2UrXCJ9KVwiOlwiKGZ1bmN0aW9uKCl7cmV0dXJuIChcIitlK1wiKX0pXCIsZXZhbC5jYWxsKHRoaXMscikuY2FsbCh0aGlzKX0sanNfY29tcGFyZTpmdW5jdGlvbihlLHQpe3ZhciByO3I9ZS5pbmRleE9mKFwicmV0dXJuXCIpPj0wP1wiKGZ1bmN0aW9uKCl7XCIrZStcIn0pXCI6XCIoZnVuY3Rpb24oKXtyZXR1cm4gKFwiK2UrXCIpfSlcIjt2YXIgbj1ldmFsLmNhbGwodGhpcyxyKS5jYWxsKHRoaXMpO3JldHVybiBuP3QuZm4odGhpcyx0LmRhdGEpOnQuaW52ZXJzZSh0aGlzLHQuZGF0YSl9fX07dmFyIGE9ZnVuY3Rpb24oZSx0KXtpZigyPT09YXJndW1lbnRzLmxlbmd0aCl7dmFyIHI9bmV3IGkoZSksbj1yLmNvbXBpbGUoKSh0KTtyZXR1cm4gcj1udWxsLG59cmV0dXJuIG5ldyBpKGUpfTtyZXR1cm4gYS5yZWdpc3RlckhlbHBlcj1mdW5jdGlvbihlLHQpe2kucHJvdG90eXBlLmhlbHBlcnNbZV09dH0sYS51bnJlZ2lzdGVySGVscGVyPWZ1bmN0aW9uKGUpe2kucHJvdG90eXBlLmhlbHBlcnNbZV09dm9pZCAwLGRlbGV0ZSBpLnByb3RvdHlwZS5oZWxwZXJzW2VdfSxhLnJlZ2lzdGVyUGFydGlhbD1mdW5jdGlvbihlLHQpe2kucHJvdG90eXBlLnBhcnRpYWxzW2VdPXt0ZW1wbGF0ZTp0fX0sYS51bnJlZ2lzdGVyUGFydGlhbD1mdW5jdGlvbihlLHQpe2kucHJvdG90eXBlLnBhcnRpYWxzW2VdJiYoaS5wcm90b3R5cGUucGFydGlhbHNbZV09dm9pZCAwLGRlbGV0ZSBpLnByb3RvdHlwZS5wYXJ0aWFsc1tlXSl9LGEuY29tcGlsZT1mdW5jdGlvbihlLHQpe3ZhciByPW5ldyBpKGUsdCk7cmV0dXJuIHIuY29tcGlsZSgpfSxhLm9wdGlvbnM9aS5wcm90b3R5cGUub3B0aW9ucyxhLmhlbHBlcnM9aS5wcm90b3R5cGUuaGVscGVycyxhLnBhcnRpYWxzPWkucHJvdG90eXBlLnBhcnRpYWxzLGF9KCk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10ZW1wbGF0ZTcubWluLmpzLm1hcFxuIiwiY29uc3QgTGlzdENvbXBvbmVudCA9IHJlcXVpcmUoJy4vbGlzdCcpO1xuY29uc3QgSXRlbUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgTGlzdENvbXBvbmVudCxcbiAgSXRlbUNvbXBvbmVudCxcbn07IiwiY29uc3QgeyBDb21wb25lbnQgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUnKTtcbmNvbnN0IFRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuXG5jbGFzcyBJdGVtQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbmFtZTogJ0l0ZW0nLFxuICAgICAgdGFnTmFtZTogJ2l0ZW0nLFxuICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICBjb21wb25lbnRUZW1wbGF0ZTogVGVtcGxhdGUsXG4gICAgfSk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIGNsYXNzQ3NzOiAnY3NzLWl0ZW0nLFxuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbUNvbXBvbmVudDtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2xhc3NDc3MsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBjbGFzc05hbWUgPSAnJyArIGNsYXNzQ3NzO1xuICAgIHJldHVybiBgPGEgaHJlZj1cIlwiIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+VGVzdDwvYT5gO1xufSIsImNvbnN0IHsgQ29tcG9uZW50IH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlJyk7XG5jb25zdCB7IFBvc3RzIH0gPSByZXF1aXJlKCcuLi8uLi9tb2NrcycpO1xuY29uc3QgVGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJyk7XG5cbmNsYXNzIExpc3RDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7XG4gICAgICBpZDogJ2xpc3QnLFxuICAgICAgbmFtZTogJ0xpc3QnLFxuICAgICAgdGFnTmFtZTogJ2xpc3QnLFxuICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICBjbGFzc0NzczogJ2xpc3QtaXRlbXMnLFxuICAgICAgdGFyZ2V0OiAnbGlzdCcsXG4gICAgICBjb21wb25lbnRUZW1wbGF0ZTogVGVtcGxhdGUsXG4gICAgfSk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIGNsYXNzQ3NzOiAnY3NzLWxpc3QnLFxuICAgICAgUG9zdHMsXG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0Q29tcG9uZW50OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2xhc3NDc3MsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBjbGFzc05hbWUgPSAnJyArIGNsYXNzQ3NzO1xuICAgIGNvbnN0IHBvc3RzID0gb3B0aW9ucy5yb290LlBvc3RzO1xuICAgIGNvbnN0IGxlbmd0aCA9IHBvc3RzLmxlbmd0aDtcbiAgICBsZXQgaXRlbXMgPSAnJztcbiAgICBmb3IobGV0IGk9MDsgbGVuZ3RoID4gaTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1JZCA9IGBpdGVtLSR7cG9zdHNbaV0uaWR9YDtcbiAgICAgICAgaXRlbXMgKz0gYDxsaT48aXRlbSBpZD1cIiR7aXRlbUlkfVwiPjwvaXRlbT48L2xpPmA7XG4gICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzLnB1c2goYCR7aXRlbUlkfTppdGVtYCk7XG4gICAgfVxuICAgIHJldHVybiBgPHVsIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+JHtpdGVtc308L3VsPmA7XG59IiwicmVxdWlyZSgndGVtcGxhdGU3L2Rpc3QvdGVtcGxhdGU3Lm1pbi5qcycpO1xuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9tb2R1bGUnKTtcblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgTW9kdWxlIHtcbiAgY29uc3RydWN0b3IoYXJncykge1xuICAgIHN1cGVyKGFyZ3MpO1xuICAgIHRoaXMuaWQgPSBhcmdzLmlkO1xuICAgIHRoaXMuZGVwZW5kZW5jaWVzID0gW107XG4gICAgdGhpcy5vRGF0YSA9IHtcbiAgICAgIGN1cnJlbnQ6IHt9LFxuICAgICAgcHJldmlvdXM6IHt9LFxuICAgIH07XG4gICAgdGhpcy5oYXNoRGF0YSA9IHtcbiAgICAgIGN1cnJlbnQ6IHt9LFxuICAgICAgcHJldmlvdXM6IHt9LFxuICAgIH07XG4gICAgdGhpcy50cGwgPSBhcmdzLnRlbXBsYXRlIHx8IG51bGw7XG4gICAgdGhpcy5jb250YWluZXJDYWNoZSA9IG51bGw7XG4gICAgdGhpcy50YXJnZXQgPSBgJHthcmdzLnRhcmdldH1gO1xuICAgIHRoaXMuYnVpbGRDYWNoZSA9IG51bGw7XG4gICAgdGhpcy5tb3VudGVkQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMucmVmRG9tQ2FjaGUgPSBudWxsO1xuICAgIHRoaXMudGFyZ2V0Q2FjaGUgPSBudWxsO1xuICAgIHRoaXMudGVtcGxhdGVFbmdpbmUgPSB3aW5kb3cuVGVtcGxhdGU3O1xuICAgIHRoaXMuY29tcG9uZW50VGVtcGxhdGUgPSBhcmdzLmNvbXBvbmVudFRlbXBsYXRlIHx8IG51bGw7XG4gICAgdGhpcy50YWdOYW1lID0gYXJncy50YWdOYW1lIHx8ICdkZWZhdWx0JztcbiAgICB0aGlzLmNsYXNzQ3NzPSBhcmdzLmNsYXNzQ3NzIHx8ICdkZWZhdWx0JztcbiAgfVxuXG4gIHNldCBtb3VudGVkKHZhbHVlKSB7XG4gICAgdGhpcy5tb3VudGVkQ2FjaGUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBtb3VudGVkKCkge1xuICAgIHJldHVybiB0aGlzLm1vdW50ZWRDYWNoZTtcbiAgfVxuXG4gIHNldCBidWlsZCh2YWx1ZSkge1xuICAgIHRoaXMuYnVpbGRDYWNoZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLmJ1aWxkQ2FjaGU7XG4gIH1cblxuICBzZXQgdGVtcGxhdGUodmFsdWUpIHtcbiAgICB0aGlzLnRwbCA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHRlbXBsYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnRwbDtcbiAgfVxuXG4gIHNldCBkYXRhKHZhbHVlKSB7XG4gICAgdGhpcy5vRGF0YSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMub0RhdGE7XG4gIH1cblxuICBnZXQgcmVmRG9tKCkge1xuICAgIHJldHVybiB0aGlzLnJlZkRvbUNhY2hlO1xuICB9XG5cbiAgc2V0IHJlZkRvbSh2YWx1ZSkge1xuICAgIHRoaXMucmVmRG9tQ2FjaGUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBjb250YWluZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyQ2FjaGU7XG4gIH1cblxuICBzZXQgY29udGFpbmVyKHZhbHVlKSB7XG4gICAgdGhpcy5jb250YWluZXJDYWNoZSA9IHZhbHVlO1xuICB9XG5cblxuICBsaXN0ZW5FdmVudHMoKSB7XG4gICAgdGhpcy5saXN0ZW5Ubyh7XG4gICAgICBvbkNoYW5nZURhdGE6ICgpID0+IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YS5jdXJyZW50O1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGB7eyR7dGhpcy50YWdOYW1lfSBjbGFzc0Nzc319YDtcbiAgICAgICAgdGhpcy5jcmVhdGVCdWlsZChkYXRhLCB0ZW1wbGF0ZSk7XG4gICAgICB9LFxuICAgICAgb25CdWlsZDogKCkgPT4ge1xuICAgICAgICBjb25zdCBidWlsZCA9IHRoaXMuYnVpbGQ7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuICAgICAgICB0aGlzLm1vdW50KGJ1aWxkLCB0YXJnZXQpO1xuICAgICAgfSxcbiAgICAgIG9uTW91bnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgbW91bnRlZCA9IHRoaXMubW91bnRlZDtcbiAgICAgICAgdGhpcy5yZW5kZXJEZXBlbmRlbmNpZXMobW91bnRlZCk7XG4gICAgICB9LFxuICAgICAgb25SZW5kZXJEZXBlbmRlbmNpZXM6ICgpID0+IHtcbiAgICAgICAgY29uc3QgY29pbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50O1xuICAgICAgICBjb25zdCB0YXJnZXQgPSAgdGhpcy50YXJnZXRDYWNoZTtcbiAgICAgICAgY29uc3QgbW91bnRlZCA9IHRoaXMubW91bnRlZDtcbiAgICAgICAgdGhpcy5pbnNlcnREb20odGFyZ2V0LCBtb3VudGVkKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBtb3VudChidWlsZCwgdGFyZ2V0KSB7XG4gICAgY29uc3QgY29pbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50O1xuICAgIHRoaXMudGFyZ2V0Q2FjaGUgPSAgdGhpcy5yZWZEb20gfHwgdGhpcy4kKGAjJHt0aGlzLnRhcmdldH1gLCBjb2ludGFpbmVyKVswXTtcbiAgICBjb25zdCB0eXBlID0gdGhpcy50YXJnZXRDYWNoZS5ub2RlTmFtZTtcbiAgICBjb25zdCBtb3VudGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICBtb3VudGVkLmlkID0gdGFyZ2V0O1xuICAgIG1vdW50ZWQuaW5uZXJIVE1MID0gYnVpbGQ7XG4gICAgdGhpcy5tb3VudGVkID0gbW91bnRlZDtcbiAgICB0aGlzLmVtaXQoYCR7dGhpcy5pZH06b25Nb3VudGAsIHtcbiAgICAgIGRhdGE6IHRoaXMuZGF0YSxcbiAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlLFxuICAgICAgYnVpbGQ6IHRoaXMuYnVpbGQsXG4gICAgICBtb3VudGVkOiB0aGlzLm1vdW50ZWQsXG4gICAgfSk7XG4gIH1cblxuICBpbnNlcnREb20odGFyZ2V0LCBtb3VudGVkKSB7XG4gICAgY29uc3QgdGFyZ2V0RWxlbWVudCA9IHRhcmdldDtcbiAgICB0YXJnZXRFbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG1vdW50ZWQsIHRhcmdldEVsZW1lbnQpO1xuICAgIHRoaXMucmVmRG9tID0gbW91bnRlZDtcbiAgICB0aGlzLmVtaXQoYCR7dGhpcy5pZH06b25SZW5kZXJgLCB7XG4gICAgICBpZDogYCR7dGhpcy5pZH06JHt0aGlzLnRhZ05hbWV9YCxcbiAgICB9KTtcbiAgfVxuXG4gIHNldHVwKG9wdGlvbnMpIHtcblxuICAgIGlmKG9wdGlvbnMudGFyZ2V0KXtcbiAgICAgIHRoaXMudGFyZ2V0ID0gb3B0aW9ucy50YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYob3B0aW9ucy5pZCl7XG4gICAgICB0aGlzLmlkID0gb3B0aW9ucy5pZDtcbiAgICB9XG5cbiAgICBpZihvcHRpb25zLm5hbWUpe1xuICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIH1cblxuICAgIGlmKG9wdGlvbnMudGVtcGxhdGUpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlO1xuICAgIH1cblxuICAgIGlmKG9wdGlvbnMucmVmRG9tKSB7XG4gICAgICB0aGlzLnJlZkRvbSA9IG9wdGlvbnMucmVmRG9tO1xuICAgIH1cblxuICAgIGlmKG9wdGlvbnMuZGF0YSkge1xuICAgICAgdGhpcy5zZXREYXRhKG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuXG4gICAgaWYob3B0aW9ucy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXI7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlQnVpbGQobmV3RGF0YSwgbmV3VGVtcGxhdGUpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ld1RlbXBsYXRlIHx8IHRoaXMudGVtcGxhdGU7XG4gICAgY29uc3QgZGF0YSA9IG5ld0RhdGEgfHwgdGhpcy5kYXRhLmN1cnJlbnQ7XG4gICAgdGhpcy5idWlsZCA9IHRoaXMuY29tcGlsZSh0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgdGhpcy5lbWl0KGAke3RoaXMuaWR9Om9uQnVpbGRgLCB7XG4gICAgICBkYXRhOiB0aGlzLmRhdGEsXG4gICAgICB0ZW1wbGF0ZTogdGhpcy50ZW1wbGF0ZSxcbiAgICAgIGJ1aWxkOiB0aGlzLmJ1aWxkXG4gICAgfSk7XG4gIH1cblxuICByZWdpc3RlclRhZ3MoKSB7XG4gICAgY29uc3QgdGVtcGxhdGVFbmdpbmUgPSB0aGlzLnRlbXBsYXRlRW5naW5lO1xuICAgIHRlbXBsYXRlRW5naW5lLnJlZ2lzdGVySGVscGVyKGAke3RoaXMudGFnTmFtZX1gLCB0aGlzLmNvbXBvbmVudFRlbXBsYXRlLmJpbmQodGhpcykpO1xuICB9XG5cbiAgY29tcGlsZSh0ZW1wbGF0ZSwgZGF0YSkge1xuICAgIGNvbnN0IHRlbXBsYXRlRW5naW5lID0gdGhpcy50ZW1wbGF0ZUVuZ2luZTtcbiAgICB0aGlzLnJlZ2lzdGVyVGFncygpO1xuICAgIGNvbnN0IGNvbXBpbGVkVGVtcGxhdGUgPSB0ZW1wbGF0ZUVuZ2luZS5jb21waWxlKHRlbXBsYXRlKTtcbiAgICByZXR1cm4gY29tcGlsZWRUZW1wbGF0ZShkYXRhKTtcbiAgfVxuXG4gIGhhc2hDb2RlKHN0cmluZykge1xuICAgIGxldCBoYXNoID0gMCwgaSwgY2hyO1xuICAgIGNvbnN0IGxlbiA9IHN0cmluZy5sZW5ndGg7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPT09IDApIHJldHVybiBoYXNoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY2hyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbiAgfVxuXG4gIGhhc0NoYW5nZURhdGEobmV3RGF0YSwgZm9yY2VUb0NoYW5nZSkge1xuICAgIGNvbnN0IG5ld0hhc2hEYXRhID0gdGhpcy5oYXNoQ29kZShKU09OLnN0cmluZ2lmeShuZXdEYXRhKSk7XG4gICAgbGV0IGhhc0NoYW5nZWQgPSBmYWxzZTtcbiAgICBpZiAoZm9yY2VUb0NoYW5nZSB8fCBuZXdIYXNoRGF0YSAhPT0gdGhpcy5oYXNoRGF0YS5jdXJyZW50KSB7XG4gICAgICB0aGlzLmhhc2hEYXRhLnByZXZpb3VzID0gdGhpcy5oYXNoRGF0YS5jdXJyZW50O1xuICAgICAgdGhpcy5oYXNoRGF0YS5jdXJyZW50ID0gbmV3SGFzaERhdGE7XG4gICAgICBoYXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc0NoYW5nZWQ7XG4gIH1cblxuICBzZXREYXRhKG5ld0RhdGEsIGZvcmNlVG9DaGFuZ2UgPSBmYWxzZSkge1xuICAgIGlmKHRoaXMuaGFzQ2hhbmdlRGF0YShuZXdEYXRhLCBmb3JjZVRvQ2hhbmdlKSl7XG4gICAgICB0aGlzLmRhdGEucHJldmlvdXMgPSB0aGlzLmRhdGEuY3VycmVudDtcbiAgICAgIHRoaXMuZGF0YS5jdXJyZW50ID0gT2JqZWN0LmFzc2lnbih0aGlzLmRhdGEuY3VycmVudCwgbmV3RGF0YSk7XG4gICAgICB0aGlzLmVtaXQoYCR7dGhpcy5pZH06b25DaGFuZ2VEYXRhYCwge1xuICAgICAgICBkYXRhOiB0aGlzLmRhdGFcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlckRlcGVuZGVuY2llcyhtb3VudGVkKSB7XG4gICAgY29uc3QgdGFyZ2V0RGVwZW5kZW5jaWVzID0gdGhpcy5kZXBlbmRlbmNpZXM7XG4gICAgY29uc3QgbGVuZ3RoID0gdGFyZ2V0RGVwZW5kZW5jaWVzLmxlbmd0aDtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvcig7IGxlbmd0aCA+IGk7IGkrKyl7XG4gICAgICBjb25zdCBpbnN0YW5jZU5hbWUgPSB0YXJnZXREZXBlbmRlbmNpZXNbaV0uc3BsaXQoJzonKVswXTtcbiAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRhcmdldERlcGVuZGVuY2llc1tpXS5zcGxpdCgnOicpWzFdO1xuICAgICAgQXBwLmNvbXBvbmVudCh0YXJnZXREZXBlbmRlbmNpZXNbaV0pLnNldHVwKHsgaWQ6IGluc3RhbmNlTmFtZSwgdGFyZ2V0OiBpbnN0YW5jZU5hbWUsIGNvbnRhaW5lcjogbW91bnRlZCB9KTtcbiAgICAgIEFwcC5jb21wb25lbnQodGFyZ2V0RGVwZW5kZW5jaWVzW2ldKS5saXN0ZW5FdmVudHMoKTtcbiAgICAgIEFwcC5jb21wb25lbnQodGFyZ2V0RGVwZW5kZW5jaWVzW2ldKS5saXN0ZW5Ubyh7XG4gICAgICAgIG9uUmVuZGVyOiAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zdCBpZCA9IGV2ZW50LmRldGFpbC5pZDtcbiAgICAgICAgICBpZiAoKGxlbmd0aCAtMSkgPT09IGNvdW50ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChgJHt0aGlzLmlkfTpvblJlbmRlckRlcGVuZGVuY2llc2ApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb3VudGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCBpbnN0YW5jZU5hbWUpO1xuXG4gICAgICBBcHAuY29tcG9uZW50KHRhcmdldERlcGVuZGVuY2llc1tpXSkucmVuZGVyKHRoaXMuZGF0YSk7XG4gICAgfVxuXG4gICAgaWYobGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmVtaXQoYCR7dGhpcy5pZH06b25SZW5kZXJEZXBlbmRlbmNpZXNgKTtcbiAgICB9XG4gIH1cblxuICByZW5kZXIobmV3RGF0YSwgZm9yY2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IGRhdGEgPSBuZXdEYXRhIHx8IHRoaXMuZGF0YTtcbiAgICB0aGlzLnNldERhdGEoZGF0YSwgZm9yY2UpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50O1xuIiwiY29uc3QgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKTtcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlJyk7XG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBDb21wb25lbnQsXG4gIE1vZHVsZSxcbiAgVmlldyxcbn0iLCJjb25zdCBTaXp6bGUgPSByZXF1aXJlKCdzaXp6bGUnKTtcblxuY29uc3QgeyBkZWJ1ZywgZGlzcGF0Y2hlciB9ID0gcmVxdWlyZSgnLi8uLi9zYW5kYm94Jyk7XG5cbmNsYXNzIE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICB0aGlzLm5hbWUgPSBhcmdzLm5hbWUgfHwgJ2RlZmF1bHRNb2R1bGUnO1xuICAgIHRoaXMudHlwZSA9IGFyZ3MudHlwZSB8fCAnbW9kdWxlJztcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgZGVsYXk6IDAsXG4gICAgICBldmVudHM6IHtcbiAgICAgICAgb25TdGFydDogKCkgPT4ge30sXG4gICAgICAgIG9uU3RvcDogKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgcmVxdWlyZXM6IFtdLFxuICAgIH07XG4gIH1cblxuICBzZXRDb25maWcoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBPYmplY3QuYXNzaWduKHRoaXMuY29uZmlnLCBjb25maWcpO1xuICB9XG5cbiAgbGlzdGVuRXZlbnRzKCl7XG4gICAgdGhpcy5saXN0ZW5Ubyh7XG4gICAgICAnb25TdGFydCc6IHRoaXMuY29uZmlnLmV2ZW50cy5vblN0YXJ0LFxuICAgICAgJ29uU3RvcCc6IHRoaXMuY29uZmlnLmV2ZW50cy5vblN0b3AsXG4gICAgfSwgdGhpcy5pZCk7XG4gIH1cblxuICAkKCkge1xuICAgIHJldHVybiBTaXp6bGUuYXBwbHkoU2l6emxlLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgbGlzdGVuVG8oZXZlbnRzID0ge30sIHR5cGUgPSB0aGlzLmlkKSB7XG4gICBmb3IoY29uc3QgZXZlbnQgaW4gZXZlbnRzKSB7XG4gICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudHNbZXZlbnRdO1xuICAgICBsZXQgdGFyZ2V0ID0gd2luZG93O1xuICAgICBsZXQgZXZlbnROYW1lID0gYCR7dHlwZX06JHtldmVudH1gO1xuXG4gICAgIGlmKHR5cGUgPT09ICdEb20nKSB7XG4gICAgICAgdGFyZ2V0ID0gdGhpcy4kKGV2ZW50LnNwbGl0KCc6JylbMF0pO1xuICAgICAgIGV2ZW50TmFtZSA9IGV2ZW50LnNwbGl0KCc6JylbMV07XG4gICAgIH1cblxuICAgICB0aGlzLnN1YnNjcmliZSh0YXJnZXQsIGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgfVxuICB9XG5cbiAgc2V0dXAoY29uZmlnKSB7XG4gICAgdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIHJlcXVpcmUobW9kdWxlcyA9IFtdKSB7XG4gICAgbW9kdWxlcy5tYXAoKG1vZHVsZU5hbWUsIGluZGV4KSA9PiB7XG4gICAgICB0aGlzLnJlcWlyZXMucHVzaChtb2R1bGVOYW1lKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGBtb2R1bGU6JHttb2R1bGVOYW1lfWAsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCB7IHJ1bm5pbmcsIG1vZHVsZU5hbWUgfSA9IGV2ZW50LmRldGFpbDtcbiAgICAgICAgaWYocnVubmluZykge1xuICAgICAgICAgIGxldCByZXF1aXJlcyA9IHRoaXMucmVxdWlyZXM7XG4gICAgICAgICAgY29uc3QgcG9zVG9EZWxldGUgPSByZXF1aXJlcy5pbmRleE9mKG1vZHVsZU5hbWUpO1xuICAgICAgICAgIHJlcXVpcmVzLnNsaWNlKHBvc1RvRGVsZXRlLCByZXF1aXJlcy5sZW5ndGgpO1xuICAgICAgICAgIHRoaXMucmVxdWlyZXMgPSByZXF1aXJlcztcbiAgICAgICAgICB0aGlzLmNoZWNrUmVxdWlyZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmblN0YXJ0KGNhbGxiYWNrKSB7XG4gICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICBkZWJ1Zy5sb2coYE1vZHVsZSgke3RoaXMuaWR9KSBpcyBzdGFydGVkYCk7XG4gICAgdGhpcy5lbWl0KCdvblN0YXJ0Jyk7XG4gIH1cblxuICBjaGVja1JlcXVpcmVzKCkge1xuICAgIGNvbnN0IHJlcXVpcmVzID0gdGhpcy5jb25maWcucmVxdWlyZXM7XG4gICAgaWYocmVxdWlyZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJ1blN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbiAgcnVuU3RhcnQoKSB7XG4gICAgaWYodGhpcy5jb25maWcuZGVsYXkgPT09IDApe1xuICAgICAgdGhpcy5mblN0YXJ0KCk7XG4gICAgfWVsc2V7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5mblN0YXJ0KCk7IH0sIHRoaXMuY29uZmlnLmRlbGF5KTtcbiAgICB9XG4gIH1cblxuICBzdGFydCgpXG4gIHtcbiAgICB0aGlzLmxpc3RlbkV2ZW50cygpO1xuICAgIHRoaXMuY2hlY2tSZXF1aXJlcygpO1xuICB9XG5cbiAgZ2V0RXZlbnROYW1lKGV2ZW50TmFtZSkge1xuICAgIHJldHVybiBldmVudE5hbWUuaW5kZXhPZignOicpID09PSAtMSA/IGAke3RoaXMuaWR9OiR7ZXZlbnROYW1lfWAgOiBldmVudE5hbWU7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgIGRlYnVnLmxvZyhgTW9kdWxlKCR7dGhpcy5pZH0pIGlzIHN0b3BlZGApO1xuICAgIHRoaXMuZW1pdChgJHt0aGlzLmlkfTpvblN0b3BgKTtcbiAgfVxuXG4gIGVtaXQoZXZlbnROYW1lLCBhcmdzID0gJycpIHtcbiAgICB0aGlzLmNyZWF0ZUV2ZW50KGV2ZW50TmFtZSwgYXJncyk7XG4gICAgY29uc3QgZXZlbnQgPSB0aGlzLmdldEV2ZW50TmFtZShldmVudE5hbWUpO1xuICAgIGRpc3BhdGNoZXIuZW1pdChldmVudCk7XG4gIH1cblxuICBjcmVhdGVFdmVudChldmVudE5hbWUsIGRldGFpbHMpIHtcbiAgICBjb25zdCBldmVudCA9IHRoaXMuZ2V0RXZlbnROYW1lKGV2ZW50TmFtZSk7XG4gICAgZGlzcGF0Y2hlci5jcmVhdGVFdmVudChldmVudCwgZGV0YWlscyk7XG4gIH1cblxuICBzdWJzY3JpYmUodGFyZ2V0ID0gd2luZG93LCBldmVudE5hbWUsIGhhbmRsZXIsIGJ1YmJsaW5nID0gZmFsc2UpIHtcbiAgICBjb25zdCBldmVudCA9IGV2ZW50TmFtZS5pbmRleE9mKCc6JykgPT09IC0xID8gYCR7dGhpcy5pZH06JHtldmVudE5hbWV9YCA6IGV2ZW50TmFtZTtcbiAgICBkaXNwYXRjaGVyLnN1YnNjcmliZSh0YXJnZXQsIGV2ZW50LCBoYW5kbGVyLCBidWJibGluZyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7IiwiY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9tb2R1bGUnKTtcbmNvbnN0IHsgZGVidWcgfSA9IHJlcXVpcmUoJy4vLi4vc2FuZGJveCcpO1xuY29uc3QgUm91dGVyID0gcmVxdWlyZSgnc3BhLXJvdXRlci1iZXR0ZXInKTtcblxuY2xhc3MgVmlldyBleHRlbmRzIE1vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICBzdXBlcihhcmdzKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGFyZ3MuY29udGFpbmVyIHx8ICcnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9IG51bGw7XG4gICAgdGhpcy5yb3V0ZXMgPSBhcmdzLnJvdXRlcyB8fCBudWxsO1xuICAgIGlmKHRoaXMucm91dGVzICE9PSBudWxsKSB7XG4gICAgICBmb3IobGV0IHJvdXRlIGluIHRoaXMucm91dGVzKXtcbiAgICAgICAgZGVidWcubG9nKCdyb3V0ZScsIHJvdXRlLCB0aGlzLnJvdXRlc1tyb3V0ZV0pO1xuICAgICAgICBBcHAucm91dGVyLm9uKHJvdXRlLCAocmVxKSA9PiB7XG4gICAgICAgICAgZGVidWcubG9nKCdyZXEnLCByZXEpO1xuICAgICAgICAgIHRoaXMucm91dGVzW3JlcS5wYXRoXShyZXEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsb2FkVmlldyhwYXRoVmlldykge1xuICAgIEFwcC5yb3V0ZXIuc2V0Um91dGUocGF0aFZpZXcpO1xuICB9XG5cbiAgc2VuZFJlcXVlc3QoKSB7fVxuXG4gIHJlYWRSZXNwb25zZSgpIHt9XG5cbiAgc2V0dXAoKSB7XG5cbiAgfVxuXG4gIG9uU2hvdygpIHt9XG5cbiAgb25Mb2FkKCkge1xuXG4gIH1cblxuICBvbnVuTG9hZCgpIHtcblxuICB9XG5cbiAgc3RhcnQoYXJncykge1xuICAgIHN1cGVyLnN0YXJ0KGFyZ3MpO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9IHRoaXMuJChgIyR7dGhpcy5jb250YWluZXJ9YClbMF07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIiwiY29uc3QgUm91dGVyID0gcmVxdWlyZSgnc3BhLXJvdXRlci1iZXR0ZXInKTtcbmNvbnN0IHsgTW9kdWxlIH0gPSByZXF1aXJlKCcuL2NvcmUnKTtcbmNvbnN0IHsgZGVidWcsIHV0aWxzIH0gPSByZXF1aXJlKCcuL3NhbmRib3gnKTtcbmNvbnN0IFZpZXdzID0gcmVxdWlyZSgnLi92aWV3cycpO1xuY29uc3QgQ29tcG9uZW50cyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cycpO1xuXG5jbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzICBNb2R1bGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7XG4gICAgICBuYW1lOiAnQXBwJyxcbiAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbicsXG4gICAgfSk7XG4gICAgdGhpcy52aWV3cyA9IHt9O1xuICAgIHRoaXMuY29tcG9uZW50cyA9IHt9O1xuICAgIHRoaXMucm91dGVzID0ge1xuICAgICAgJy9kb25hdGluZ2ttL3d3dy90ZXN0Lmh0bWwnOiB0aGlzLnJvb3RWaWV3LmJpbmQodGhpcyksXG4gICAgfTtcbiAgICB0aGlzLnJvdXRlciA9IG5ldyBSb3V0ZXIodGhpcy5yb3V0ZXMpO1xuICB9XG5cbiAgcm9vdFZpZXcocmVxKSB7XG4gICAgZGVidWcubG9nKCdSb290VmlldyBpcyBsb2FkZWQnLCByZXEpO1xuICAgIEFwcC52aWV3KCdyb290Jykuc3RhcnQoeyB0ZXN0OiAnSGVsbG8gd29ybGQnfSk7XG4gIH1cblxuICBsaXN0ZW5FdmVudHMoKXtcbiAgICBzdXBlci5saXN0ZW5FdmVudHMoKTtcblxuICB9XG5cbiAgdmlldyhuYW1lKSB7XG4gICAgY29uc3QgbmFtZVZpZXcgPSBgJHt1dGlscy5jYXBpdGFsaXplKG5hbWUpfVZpZXdgO1xuICAgIGlmKCF0aGlzLnZpZXdzW25hbWVWaWV3XSkge1xuICAgICAgdGhpcy52aWV3c1tuYW1lVmlld10gPSBuZXcgVmlld3NbbmFtZVZpZXddKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnZpZXdzW25hbWVWaWV3XTtcbiAgfVxuXG4gIGNvbXBvbmVudChuYW1lKSB7XG4gICAgY29uc3QgaW5zdGFuY2VOYW1lID0gbmFtZS5zcGxpdCgnOicpWzBdO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IHV0aWxzLmNhcGl0YWxpemUobmFtZS5zcGxpdCgnOicpWzFdKTtcbiAgICBpZighdGhpcy5jb21wb25lbnRzW2luc3RhbmNlTmFtZV0pIHtcbiAgICAgIHRoaXMuY29tcG9uZW50c1tpbnN0YW5jZU5hbWVdID0gbmV3IENvbXBvbmVudHNbYCR7Y2xhc3NOYW1lfUNvbXBvbmVudGBdKHsgaWQ6IGluc3RhbmNlTmFtZSB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzW2luc3RhbmNlTmFtZV07XG4gIH1cblxuXG4gIGdvKHBhdGhWaWV3KSB7XG4gICAgdGhpcy5yb3V0ZXIuZGlzcGF0Y2gocGF0aFZpZXcpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgaWYoIXdpbmRvdy5BcHApIHtcbiAgICAgIHdpbmRvdy5BcHAgPSB0aGlzO1xuICAgIH1cbiAgICBzdXBlci5zdGFydCgpO1xuICAgIHRoaXMucm91dGVyLnN0YXJ0KHtcbiAgICAgIHJvb3Q6ICcvZG9uYXRpbmdrbS93d3cvdGVzdC5odG1sJyxcbiAgICAgIG5vdEZvdW5kOiAocmVxKSA9PiBkZWJ1Zy5sb2coJzQwNCBub3QgZm91bmQnLCByZXEpLFxuICAgICAgbW9kZTogJ2hpc3RvcnknLFxuICAgIH0pO1xuICB9XG59O1xuXG5jb25zdCBBcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbkFwcC5zdGFydCgpO1xuXG5cblxuXG5cbiIsImNvbnN0IE1hcmtlcnMgPSByZXF1aXJlKCcuL21hcmtlcnMnKTtcbmNvbnN0IFBvc3RzID0gcmVxdWlyZSgnLi9wb3N0cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgUG9zdHMsXG4gIE1hcmtlcnMsXG59IiwiY29uc3QgTWFya2VycyA9IFtcclxuICB7XHJcbiAgICBcInBvaW50XCI6ICcxJyxcclxuICAgIFwiaG9tZVRlYW1cIjpcIkxhd3JlbmNlIExpYnJhcnlcIixcclxuICAgIFwiYXdheVRlYW1cIjpcIkxVR2lwXCIsXHJcbiAgICBcIm1hcmtlckltYWdlXCI6XCJpbWFnZXMvcmVkLnBuZ1wiLFxyXG4gICAgXCJpbmZvcm1hdGlvblwiOiBcIkxpbnV4IHVzZXJzIGdyb3VwIG1lZXRzIHNlY29uZCBXZWRuZXNkYXkgb2YgZWFjaCBtb250aC5cIixcclxuICAgIFwiZml4dHVyZVwiOlwiV2VkbmVzZGF5IDdwbVwiLFxyXG4gICAgXCJjYXBhY2l0eVwiOlwiXCIsXHJcbiAgICBcInByZXZpb3VzU2NvcmVcIjpcIlwiXHJcbiAgfSxcclxuICB7XHJcbiAgICBcInBvaW50XCI6JzInLFxyXG4gICAgXCJob21lVGVhbVwiOlwiSGFtaWx0b24gTGlicmFyeVwiLFxyXG4gICAgXCJhd2F5VGVhbVwiOlwiTFVHaXAgSFcgU0lHXCIsXHJcbiAgICBcIm1hcmtlckltYWdlXCI6XCJpbWFnZXMvd2hpdGUucG5nXCIsXHJcbiAgICBcImluZm9ybWF0aW9uXCI6IFwiTGludXggdXNlcnMgY2FuIG1lZXQgdGhlIGZpcnN0IFR1ZXNkYXkgb2YgdGhlIG1vbnRoIHRvIHdvcmsgb3V0IGhhcndhcmQgYW5kIGNvbmZpZ3VyYXRpb24gaXNzdWVzLlwiLFxyXG4gICAgXCJmaXh0dXJlXCI6XCJUdWVzZGF5IDdwbVwiLFxyXG4gICAgXCJjYXBhY2l0eVwiOlwiXCIsXHJcbiAgICBcInR2XCI6XCJcIlxyXG4gIH0sXHJcbiAge1xyXG4gICAgXCJwb2ludFwiOiczJyxcclxuICAgIFwiaG9tZVRlYW1cIjpcIkFwcGxlYmVlc1wiLFxyXG4gICAgXCJhd2F5VGVhbVwiOlwiQWZ0ZXIgTFVQaXAgTXRnIFNwb3RcIixcclxuICAgIFwibWFya2VySW1hZ2VcIjpcImltYWdlcy9uZXdjYXN0bGUucG5nXCIsXHJcbiAgICBcImluZm9ybWF0aW9uXCI6IFwiU29tZSBvZiB1cyBnbyB0aGVyZSBhZnRlciB0aGUgbWFpbiBMVUdpcCBtZWV0aW5nLCBkcmluayBicmV3cywgYW5kIHRhbGsuXCIsXHJcbiAgICBcImZpeHR1cmVcIjpcIldlZG5lc2RheSB3aGVuZXZlclwiLFxyXG4gICAgXCJjYXBhY2l0eVwiOlwiMiB0byA0IHBpbnRzXCIsXHJcbiAgICBcInR2XCI6XCJcIlxyXG4gIH0sXHJcbl07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtlcnM7IiwiY29uc3QgUG9zdHMgPSBbXG4gIHtcbiAgICBcImlkXCI6IFwiWDk5OV9ZOTk5XCIsXG4gICAgXCJmcm9tXCI6IHtcbiAgICAgIFwibmFtZVwiOiBcIlRvbSBCcmFkeVwiLCBcImlkXCI6IFwiWDEyXCIsXG4gICAgfSxcbiAgICBcIm1lc3NhZ2VcIjogXCJMb29raW5nIGZvcndhcmQgdG8gMjAxMCFcIixcbiAgICBcImFjdGlvbnNcIjogW1xuICAgICAge1xuICAgICAgICBcIm5hbWVcIjogXCJDb21tZW50XCIsXG4gICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuZmFjZWJvb2suY29tL1g5OTkvcG9zdHMvWTk5OVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiTGlrZVwiLFxuICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmZhY2Vib29rLmNvbS9YOTk5L3Bvc3RzL1k5OTlcIixcbiAgICAgIH1cbiAgICBdLFxuICAgIFwidHlwZVwiOiBcInN0YXR1c1wiLFxuICAgIFwiY3JlYXRlZF90aW1lXCI6IFwiMjAxMC0wOC0wMlQyMToyNzo0NCswMDAwXCIsXG4gICAgXCJ1cGRhdGVkX3RpbWVcIjogXCIyMDEwLTA4LTAyVDIxOjI3OjQ0KzAwMDBcIixcbiAgfSxcbiAge1xuICAgIFwiaWRcIjogXCJYOTk4X1k5OThcIixcbiAgICBcImZyb21cIjoge1xuICAgICAgXCJuYW1lXCI6IFwiUGV5dG9uIE1hbm5pbmdcIiwgXCJpZFwiOiBcIlgxOFwiLFxuICAgIH0sXG4gICAgXCJtZXNzYWdlXCI6IFwiV2hlcmUncyBteSBjb250cmFjdD9cIixcbiAgICBcImFjdGlvbnNcIjogW1xuICAgICAge1xuICAgICAgICBcIm5hbWVcIjogXCJDb21tZW50XCIsXG4gICAgICAgIFwibGlua1wiOiBcImh0dHA6Ly93d3cuZmFjZWJvb2suY29tL1g5OTgvcG9zdHMvWTk5OFwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiTGlrZVwiLFxuICAgICAgICBcImxpbmtcIjogXCJodHRwOi8vd3d3LmZhY2Vib29rLmNvbS9YOTk4L3Bvc3RzL1k5OThcIixcbiAgICAgIH1cbiAgICBdLFxuICAgIFwidHlwZVwiOiBcInN0YXR1c1wiLFxuICAgIFwiY3JlYXRlZF90aW1lXCI6IFwiMjAxMC0wOC0wMlQyMToyNzo0NCswMDAwXCIsXG4gICAgXCJ1cGRhdGVkX3RpbWVcIjogXCIyMDEwLTA4LTAyVDIxOjI3OjQ0KzAwMDBcIixcbiAgfVxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3N0czsiLCIndXNlIHN0cmljdCdcclxuXHJcbi8qKlxyXG4gKiBAbGljZW5zZSBDb3B5cmlnaHQgKGMpIFVzZXJab29tIDIwMTYuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuIGh0dHA6Ly93d3cudXNlcnpvb20uY29tL1xyXG4gKlxyXG4gKiBQcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsXHJcbiAqXHJcbiAqIE5PVElDRTogQWxsIGluZm9ybWF0aW9uIGNvbnRhaW5lZCBoZXJlaW4gaXMsIGFuZCByZW1haW5zIHRoZSBwcm9wZXJ0eVxyXG4gKiBvZiBVc2VyWm9vbSBUZWNobm9sb2dpZXMgU0wuIFRoZSBpbnRlbGxlY3R1YWwgYW5kIHRlY2huaWNhbCBjb25jZXB0c1xyXG4gKiBjb250YWluZWQgaGVyZWluIGFyZSBwcm9wcmlldGFyeSB0byBVc2VyWm9vbSBUZWNobm9sb2dpZXMgU0wgYW5kXHJcbiAqIG1heSBiZSBjb3ZlcmVkIGJ5IFUuUy4gYW5kIEZvcmVpZ24gUGF0ZW50cywgcGF0ZW50cyBpbiBwcm9jZXNzLCBhbmQgYXJlXHJcbiAqIHByb3RlY3RlZCBieSB0cmFkZSBzZWNyZXQgb3IgY29weXJpZ2h0IGxhdy4gRGlzc2VtaW5hdGlvbiBvZiB0aGlzXHJcbiAqIGluZm9ybWF0aW9uIG9yIHJlcHJvZHVjdGlvbiBvZiB0aGlzIG1hdGVyaWFsIGlzIHN0cmljdGx5IGZvcmJpZGRlbiB1bmxlc3NcclxuICogcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uIGlzIG9idGFpbmVkIGZyb20gVXNlclpvb20gVGVjaG5vbG9naWVzIFNMLlxyXG4gKlxyXG4gKiBAY29tcGFueSBVc2VyWm9vbSBUZWNobm9sb2dpZXMgU0xcclxuICogQGZpbGUgICAgbG9nLmpzXHJcbiAqIEBhdXRob3IgIFVzZXJab29tIFImRFxyXG4gKiBAZW1haWwgICByZEB1c2Vyem9vbS5jb21cclxuICogQGRhdGUgICAgMjAxNi0wMy0xMVxyXG4gKiBAc3VtbWFyeSBMb2cgdXRpbHNcclxuICovXHJcblxyXG4vKipcclxuICogRGVwZW5kZW5jaWVzIGZyb20gbm9kZV9tb2R1bGVzIGRpcmVjdG9yeVxyXG4gKi9cclxuY29uc3QgY2hhbGsgID0gcmVxdWlyZSgnY2hhbGsnKTtcclxuY29uc3QgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG4vKipcclxuICogRGVwZW5kZW5jaWVzIGZyb20gQVBJIG5vZGVcclxuICovXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuXHJcblxyXG4vKipcclxuICogQWxsb3cgdG8gc2hvdyBtZXNzYWdlc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbXNnIGJvZHkgb2YgbWVzc2FnZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgZGVmaW5lIHRoZSBvdXB1dCBjb2xvciBvZiBtZXNzYWdlIGluIGNvbnNvbGVcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAZXhhbXBsZSBsb2coXCJIZWxsbyBXb3JsZCEhXCIsIFwid2hpdGVcIilcclxuICovXHJcblxyXG5jbGFzcyBEZWJ1ZyB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmNvbG9ycyA9IHtcclxuICAgICAgJ3RpbWUnOiAnd2hpdGUnLFxyXG4gICAgICAnbG9nJzogJ3doaXRlJyxcclxuICAgICAgJ2Vycm9yJzogJ3JlZCcsXHJcbiAgICAgICdpbmZvJzogJ2JsdWUnLFxyXG4gICAgICAnd2Fybic6ICd5ZWxsb3cnLFxyXG4gICAgICAndGltZSc6ICdibHVlJ1xyXG4gICAgfTtcclxuICAgIHJldHVybiB0aGlzLmFwcGx5TWV0aG9kcygpO1xyXG4gIH1cclxuXHJcbiAgYXBwbHlNZXRob2RzKCl7XHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgIGxldCBkZWJ1ZyA9IHRoaXM7XHJcbiAgICBsZXQgY29sb3IgPSAnJztcclxuICAgIGZvciAobGV0IG1ldGhvZCBpbiBjb25zb2xlKSB7XHJcbiAgICAgIGRlYnVnW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuICAgICAgICBjb25zdCBjb2xvciA9IHNlbGYuY29sb3JzW21ldGhvZF07XHJcbiAgICAgICAgY29uc3QgcHJlZml4ID0gY2hhbGsuYm9sZFtjb2xvcl0oYFske21vbWVudCgpLmZvcm1hdCgnSEg6bW06c3MnKX1dYCk7XHJcbiAgICAgICAgZm9yIChsZXQgYXJnIGluIGFyZ3MpIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgYXJnc1thcmddID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBhcmdzW2FyZ10gPSBjaGFsay5ib2xkW2NvbG9yXShhcmdzW2FyZ10pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtZXNzYWdlID0gW3ByZWZpeF0uY29uY2F0KGFyZ3MpO1xyXG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXS5hcHBseShjb25zb2xlLCBtZXNzYWdlKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBkZWJ1ZztcclxuICB9XHJcblxyXG5cclxufVxyXG5cclxuY29uc3QgZGVidWcgPSBuZXcgRGVidWcoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZGVidWc7IiwiY2xhc3MgRGlzcGF0Y2hlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLl9fZXZlbnRzX18gPSB7fTtcclxuICB9XHJcblxyXG4gIGVtaXQoZXZlbnROYW1lKSB7XHJcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudCh0aGlzLl9fZXZlbnRzX19bYCR7ZXZlbnROYW1lfWBdKTtcclxuICB9XHJcblxyXG4gIGNyZWF0ZUV2ZW50KGV2ZW50TmFtZSwgZGV0YWlsKSB7XHJcbiAgICB0aGlzLl9fZXZlbnRzX19bZXZlbnROYW1lXSA9IG5ldyBDdXN0b21FdmVudChgJHtldmVudE5hbWV9YCwge1xyXG4gICAgICBkZXRhaWwsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN1YnNjcmliZSh0YXJnZXQgPSB3aW5kb3csIGV2ZW50TmFtZSwgaGFuZGxlciwgYnVibGluZyA9IGZhbHNlKSB7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGJ1YmxpbmcpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRGlzcGF0Y2hlcigpOyIsImNvbnN0IGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xyXG5jb25zdCB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuY29uc3QgZGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vZGlzcGF0Y2hlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgdXRpbHMsXHJcbiAgZGVidWcsXHJcbiAgZGlzcGF0Y2hlcixcclxufTtcclxuIiwiXG5mdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1xcYlxcdy9nLCBmdW5jdGlvbihsKXsgcmV0dXJuIGwudG9VcHBlckNhc2UoKSB9KTtcbn1cbmZ1bmN0aW9uIGdldFR5cGUob2JqKSB7XG4gIGxldCB0eXBlID0gbnVsbDtcblxuICBpZiAob2JqID09PSB1bmRlZmluZWQpIHtcbiAgICB0eXBlID0gJ1VuZGVmaW5lZCc7XG4gIH1cblxuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgdHlwZSA9ICdOdWxsJztcbiAgfVxuXG4gIGNvbnN0IHR5cGVTdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbiAgdHlwZSA9IHR5cGVTdHJpbmcuc2xpY2UodHlwZVN0cmluZy5pbmRleE9mKCcgJykgKyAxLCAtMSk7XG4gIHJldHVybiB0eXBlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0VHlwZSxcbiAgY2FwaXRhbGl6ZSxcbn07XG4iLCJjb25zdCBSb290VmlldyA9IHJlcXVpcmUoJy4vcm9vdCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgUm9vdFZpZXcsXHJcbn07IiwiY29uc3QgeyBWaWV3IH0gPSByZXF1aXJlKCcuLy4uLy4uL2NvcmUnKTtcbmNvbnN0IHsgZGVidWcgfSA9IHJlcXVpcmUoJy4vLi4vLi4vc2FuZGJveCcpO1xuXG5jbGFzcyBSb290VmlldyBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7XG4gICAgICBuYW1lOiAnaW5kZXhQYWdlJyxcbiAgICAgIGNvbnRhaW5lcjogJ0RLTScsXG4gICAgfSk7XG4gIH1cblxuICBzdGFydChhcmdzKSB7XG4gICAgc3VwZXIuc3RhcnQoYXJncyk7XG4gICAgZGVidWcubG9nKCdJbmRleCBwYWdlIGlzIHN0YXJ0ZWQnKTtcbiAgICBBcHAuY29tcG9uZW50KCd0ZXN0Omxpc3QnKS5zZXR1cCh7XG4gICAgICBjb250YWluZXI6IHRoaXMuJGNvbnRhaW5lcixcbiAgICB9KTtcbiAgICBBcHAuY29tcG9uZW50KCd0ZXN0Omxpc3QnKS5zdGFydCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm9vdFZpZXc7XG4iXX0=
