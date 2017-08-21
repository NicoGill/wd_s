"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Foundation = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.core');

var _foundationUtil2 = require('./foundation.util.mediaQuery');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FOUNDATION_VERSION = '6.4.3';

// Global Foundation object
// This is attached to the window, or used as a module for AMD/Browserify
var Foundation = {
  version: FOUNDATION_VERSION,

  /**
   * Stores initialized plugins.
   */
  _plugins: {},

  /**
   * Stores generated unique ids for plugin instances
   */
  _uuids: [],

  /**
   * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
   * @param {Object} plugin - The constructor of the plugin.
   */
  plugin: function plugin(_plugin, name) {
    // Object key to use when adding to global Foundation object
    // Examples: Foundation.Reveal, Foundation.OffCanvas
    var className = name || functionName(_plugin);
    // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
    // Examples: data-reveal, data-off-canvas
    var attrName = hyphenate(className);

    // Add to the Foundation object and the plugins list (for reflowing)
    this._plugins[attrName] = this[className] = _plugin;
  },
  /**
   * @function
   * Populates the _uuids array with pointers to each individual plugin instance.
   * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
   * Also fires the initialization event for each plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @param {String} name - the name of the plugin, passed as a camelCased string.
   * @fires Plugin#init
   */
  registerPlugin: function registerPlugin(plugin, name) {
    var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
    plugin.uuid = (0, _foundationUtil.GetYoDigits)(6, pluginName);

    if (!plugin.$element.attr('data-' + pluginName)) {
      plugin.$element.attr('data-' + pluginName, plugin.uuid);
    }
    if (!plugin.$element.data('zfPlugin')) {
      plugin.$element.data('zfPlugin', plugin);
    }
    /**
     * Fires when the plugin has initialized.
     * @event Plugin#init
     */
    plugin.$element.trigger('init.zf.' + pluginName);

    this._uuids.push(plugin.uuid);

    return;
  },
  /**
   * @function
   * Removes the plugins uuid from the _uuids array.
   * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
   * Also fires the destroyed event for the plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#destroyed
   */
  unregisterPlugin: function unregisterPlugin(plugin) {
    var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

    this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
    plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    .trigger('destroyed.zf.' + pluginName);
    for (var prop in plugin) {
      plugin[prop] = null; //clean up script to prep for garbage collection.
    }
    return;
  },

  /**
   * @function
   * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
   * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
   * @default If no argument is passed, reflow all currently active plugins.
   */
  reInit: function reInit(plugins) {
    var isJQ = plugins instanceof _jquery2.default;
    try {
      if (isJQ) {
        plugins.each(function () {
          (0, _jquery2.default)(this).data('zfPlugin')._init();
        });
      } else {
        var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
            _this = this,
            fns = {
          'object': function object(plgs) {
            plgs.forEach(function (p) {
              p = hyphenate(p);
              (0, _jquery2.default)('[data-' + p + ']').foundation('_init');
            });
          },
          'string': function string() {
            plugins = hyphenate(plugins);
            (0, _jquery2.default)('[data-' + plugins + ']').foundation('_init');
          },
          'undefined': function undefined() {
            this['object'](Object.keys(_this._plugins));
          }
        };
        fns[type](plugins);
      }
    } catch (err) {
      console.error(err);
    } finally {
      return plugins;
    }
  },

  /**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
  reflow: function reflow(elem, plugins) {

    // If plugins is undefined, just grab everything
    if (typeof plugins === 'undefined') {
      plugins = Object.keys(this._plugins);
    }
    // If plugins is a string, convert it to an array with one item
    else if (typeof plugins === 'string') {
        plugins = [plugins];
      }

    var _this = this;

    // Iterate through each plugin
    _jquery2.default.each(plugins, function (i, name) {
      // Get the current plugin
      var plugin = _this._plugins[name];

      // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
      var $elem = (0, _jquery2.default)(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

      // For each plugin found, initialize it
      $elem.each(function () {
        var $el = (0, _jquery2.default)(this),
            opts = {};
        // Don't double-dip on plugins
        if ($el.data('zfPlugin')) {
          console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
          return;
        }

        if ($el.attr('data-options')) {
          var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
            var opt = e.split(':').map(function (el) {
              return el.trim();
            });
            if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
          });
        }
        try {
          $el.data('zfPlugin', new plugin((0, _jquery2.default)(this), opts));
        } catch (er) {
          console.error(er);
        } finally {
          return;
        }
      });
    });
  },
  getFnName: functionName,

  addToJquery: function addToJquery($) {
    // TODO: consider not making this a jQuery function
    // TODO: need way to reflow vs. re-initialize
    /**
     * The Foundation jQuery method.
     * @param {String|Array} method - An action to perform on the current jQuery object.
     */
    var foundation = function foundation(method) {
      var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
          $noJS = $('.no-js');

      if ($noJS.length) {
        $noJS.removeClass('no-js');
      }

      if (type === 'undefined') {
        //needs to initialize the Foundation object, or an individual plugin.
        _foundationUtil2.MediaQuery._init();
        Foundation.reflow(this);
      } else if (type === 'string') {
        //an individual method to invoke on a plugin or group of plugins
        var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
        var plugClass = this.data('zfPlugin'); //determine the class of plugin

        if (plugClass !== undefined && plugClass[method] !== undefined) {
          //make sure both the class and method exist
          if (this.length === 1) {
            //if there's only one, call it directly.
            plugClass[method].apply(plugClass, args);
          } else {
            this.each(function (i, el) {
              //otherwise loop through the jQuery collection and invoke the method on each
              plugClass[method].apply($(el).data('zfPlugin'), args);
            });
          }
        } else {
          //error for no class or no method
          throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
        }
      } else {
        //error for invalid argument type
        throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
      }
      return this;
    };
    $.fn.foundation = foundation;
    return $;
  }
};

Foundation.util = {
  /**
   * Function for applying a debounce effect to a function call.
   * @function
   * @param {Function} func - Function to be called at end of timeout.
   * @param {Number} delay - Time in ms to delay the call of `func`.
   * @returns function
   */
  throttle: function throttle(func, delay) {
    var timer = null;

    return function () {
      var context = this,
          args = arguments;

      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
};

window.Foundation = Foundation;

// Polyfill for requestAnimationFrame
(function () {
  if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
  /**
   * Polyfill for performance.now, required by rAF
   */
  if (!window.performance || !window.performance.now) {
    window.performance = {
      start: Date.now(),
      now: function now() {
        return Date.now() - this.start;
      }
    };
  }
})();
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function fNOP() {},
        fBound = function fBound() {
      return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
    };

    if (this.prototype) {
      // native functions don't have a prototype
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
// Polyfill to get the name of a function in IE9
function functionName(fn) {
  if (Function.prototype.name === undefined) {
    var funcNameRegex = /function\s([^(]{1,})\(/;
    var results = funcNameRegex.exec(fn.toString());
    return results && results.length > 1 ? results[1].trim() : "";
  } else if (fn.prototype === undefined) {
    return fn.constructor.name;
  } else {
    return fn.prototype.constructor.name;
  }
}
function parseValue(str) {
  if ('true' === str) return true;else if ('false' === str) return false;else if (!isNaN(str * 1)) return parseFloat(str);
  return str;
}
// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

exports.Foundation = Foundation;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MediaQuery = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Default set of media queries
var defaultQueries = {
  'default': 'only screen',
  landscape: 'only screen and (orientation: landscape)',
  portrait: 'only screen and (orientation: portrait)',
  retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
};

// matchMedia() polyfill - Test a CSS media type/query in JS.
// Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
var matchMedia = window.matchMedia || function () {
  'use strict';

  // For browsers that support matchMedium api such as IE 9 and webkit

  var styleMedia = window.styleMedia || window.media;

  // For those that don't support matchMedium
  if (!styleMedia) {
    var style = document.createElement('style'),
        script = document.getElementsByTagName('script')[0],
        info = null;

    style.type = 'text/css';
    style.id = 'matchmediajs-test';

    script && script.parentNode && script.parentNode.insertBefore(style, script);

    // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
    info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

    styleMedia = {
      matchMedium: function matchMedium(media) {
        var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

        // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
        if (style.styleSheet) {
          style.styleSheet.cssText = text;
        } else {
          style.textContent = text;
        }

        // Test if media query is true or false
        return info.width === '1px';
      }
    };
  }

  return function (media) {
    return {
      matches: styleMedia.matchMedium(media || 'all'),
      media: media || 'all'
    };
  };
}();

var MediaQuery = {
  queries: [],

  current: '',

  /**
   * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
   * @function
   * @private
   */
  _init: function _init() {
    var self = this;
    var $meta = (0, _jquery2.default)('meta.foundation-mq');
    if (!$meta.length) {
      (0, _jquery2.default)('<meta class="foundation-mq">').appendTo(document.head);
    }

    var extractedStyles = (0, _jquery2.default)('.foundation-mq').css('font-family');
    var namedQueries;

    namedQueries = parseStyleToObject(extractedStyles);

    for (var key in namedQueries) {
      if (namedQueries.hasOwnProperty(key)) {
        self.queries.push({
          name: key,
          value: 'only screen and (min-width: ' + namedQueries[key] + ')'
        });
      }
    }

    this.current = this._getCurrentSize();

    this._watcher();
  },


  /**
   * Checks if the screen is at least as wide as a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
   */
  atLeast: function atLeast(size) {
    var query = this.get(size);

    if (query) {
      return matchMedia(query).matches;
    }

    return false;
  },


  /**
   * Checks if the screen matches to a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
   */
  is: function is(size) {
    size = size.trim().split(' ');
    if (size.length > 1 && size[1] === 'only') {
      if (size[0] === this._getCurrentSize()) return true;
    } else {
      return this.atLeast(size[0]);
    }
    return false;
  },


  /**
   * Gets the media query of a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to get.
   * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
   */
  get: function get(size) {
    for (var i in this.queries) {
      if (this.queries.hasOwnProperty(i)) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }
    }

    return null;
  },


  /**
   * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
   * @function
   * @private
   * @returns {String} Name of the current breakpoint.
   */
  _getCurrentSize: function _getCurrentSize() {
    var matched;

    for (var i = 0; i < this.queries.length; i++) {
      var query = this.queries[i];

      if (matchMedia(query.value).matches) {
        matched = query;
      }
    }

    if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
      return matched.name;
    } else {
      return matched;
    }
  },


  /**
   * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
   * @function
   * @private
   */
  _watcher: function _watcher() {
    var _this = this;

    (0, _jquery2.default)(window).off('resize.zf.mediaquery').on('resize.zf.mediaquery', function () {
      var newSize = _this._getCurrentSize(),
          currentSize = _this.current;

      if (newSize !== currentSize) {
        // Change the current media query
        _this.current = newSize;

        // Broadcast the media query change on the window
        (0, _jquery2.default)(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
      }
    });
  }
};

// Thank you: https://github.com/sindresorhus/query-string
function parseStyleToObject(str) {
  var styleObject = {};

  if (typeof str !== 'string') {
    return styleObject;
  }

  str = str.trim().slice(1, -1); // browsers re-quote string style values

  if (!str) {
    return styleObject;
  }

  styleObject = str.split('&').reduce(function (ret, param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = parts[0];
    var val = parts[1];
    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (!ret.hasOwnProperty(key)) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
    return ret;
  }, {});

  return styleObject;
}

exports.MediaQuery = MediaQuery;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.keyboard');

var _foundationUtil2 = require('./foundation.util.nest');

var _foundationUtil3 = require('./foundation.util.core');

var _foundation = require('./foundation.plugin');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * AccordionMenu module.
 * @module foundation.accordionMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.nest
 */

var AccordionMenu = function (_Plugin) {
  _inherits(AccordionMenu, _Plugin);

  function AccordionMenu() {
    _classCallCheck(this, AccordionMenu);

    return _possibleConstructorReturn(this, (AccordionMenu.__proto__ || Object.getPrototypeOf(AccordionMenu)).apply(this, arguments));
  }

  _createClass(AccordionMenu, [{
    key: '_setup',

    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @name AccordionMenu
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    value: function _setup(element, options) {
      this.$element = element;
      this.options = _jquery2.default.extend({}, AccordionMenu.defaults, this.$element.data(), options);
      this.className = 'AccordionMenu'; // ie9 back compat

      this._init();

      _foundationUtil.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */

  }, {
    key: '_init',
    value: function _init() {
      _foundationUtil2.Nest.Feather(this.$element, 'accordion');

      var _this = this;

      this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
      this.$element.attr({
        'role': 'tree',
        'aria-multiselectable': this.options.multiOpen
      });

      this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
      this.$menuLinks.each(function () {
        var linkId = this.id || (0, _foundationUtil3.GetYoDigits)(6, 'acc-menu-link'),
            $elem = (0, _jquery2.default)(this),
            $sub = $elem.children('[data-submenu]'),
            subId = $sub[0].id || (0, _foundationUtil3.GetYoDigits)(6, 'acc-menu'),
            isActive = $sub.hasClass('is-active');

        if (_this.options.submenuToggle) {
          $elem.addClass('has-submenu-toggle');
          $elem.children('a').after('<button id="' + linkId + '" class="submenu-toggle" aria-controls="' + subId + '" aria-expanded="' + isActive + '" title="' + _this.options.submenuToggleText + '"><span class="submenu-toggle-text">' + _this.options.submenuToggleText + '</span></button>');
        } else {
          $elem.attr({
            'aria-controls': subId,
            'aria-expanded': isActive,
            'id': linkId
          });
        }
        $sub.attr({
          'aria-labelledby': linkId,
          'aria-hidden': !isActive,
          'role': 'group',
          'id': subId
        });
      });
      this.$element.find('li').attr({
        'role': 'treeitem'
      });
      var initPanes = this.$element.find('.is-active');
      if (initPanes.length) {
        var _this = this;
        initPanes.each(function () {
          _this.down((0, _jquery2.default)(this));
        });
      }
      this._events();
    }

    /**
     * Adds event handlers for items within the menu.
     * @private
     */

  }, {
    key: '_events',
    value: function _events() {
      var _this = this;

      this.$element.find('li').each(function () {
        var $submenu = (0, _jquery2.default)(this).children('[data-submenu]');

        if ($submenu.length) {
          if (_this.options.submenuToggle) {
            (0, _jquery2.default)(this).children('.submenu-toggle').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              _this.toggle($submenu);
            });
          } else {
            (0, _jquery2.default)(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              e.preventDefault();
              _this.toggle($submenu);
            });
          }
        }
      }).on('keydown.zf.accordionmenu', function (e) {
        var $element = (0, _jquery2.default)(this),
            $elements = $element.parent('ul').children('li'),
            $prevElement,
            $nextElement,
            $target = $element.children('[data-submenu]');

        $elements.each(function (i) {
          if ((0, _jquery2.default)(this).is($element)) {
            $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
            $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

            if ((0, _jquery2.default)(this).children('[data-submenu]:visible').length) {
              // has open sub menu
              $nextElement = $element.find('li:first-child').find('a').first();
            }
            if ((0, _jquery2.default)(this).is(':first-child')) {
              // is first element of sub menu
              $prevElement = $element.parents('li').first().find('a').first();
            } else if ($prevElement.parents('li').first().children('[data-submenu]:visible').length) {
              // if previous element has open sub menu
              $prevElement = $prevElement.parents('li').find('li:last-child').find('a').first();
            }
            if ((0, _jquery2.default)(this).is(':last-child')) {
              // is last element of sub menu
              $nextElement = $element.parents('li').first().next('li').find('a').first();
            }

            return;
          }
        });

        _foundationUtil.Keyboard.handleKey(e, 'AccordionMenu', {
          open: function open() {
            if ($target.is(':hidden')) {
              _this.down($target);
              $target.find('li').first().find('a').first().focus();
            }
          },
          close: function close() {
            if ($target.length && !$target.is(':hidden')) {
              // close active sub of this item
              _this.up($target);
            } else if ($element.parent('[data-submenu]').length) {
              // close currently open sub
              _this.up($element.parent('[data-submenu]'));
              $element.parents('li').first().find('a').first().focus();
            }
          },
          up: function up() {
            $prevElement.focus();
            return true;
          },
          down: function down() {
            $nextElement.focus();
            return true;
          },
          toggle: function toggle() {
            if (_this.options.submenuToggle) {
              return false;
            }
            if ($element.children('[data-submenu]').length) {
              _this.toggle($element.children('[data-submenu]'));
              return true;
            }
          },
          closeAll: function closeAll() {
            _this.hideAll();
          },
          handled: function handled(preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
            e.stopImmediatePropagation();
          }
        });
      }); //.attr('tabindex', 0);
    }

    /**
     * Closes all panes of the menu.
     * @function
     */

  }, {
    key: 'hideAll',
    value: function hideAll() {
      this.up(this.$element.find('[data-submenu]'));
    }

    /**
     * Opens all panes of the menu.
     * @function
     */

  }, {
    key: 'showAll',
    value: function showAll() {
      this.down(this.$element.find('[data-submenu]'));
    }

    /**
     * Toggles the open/close state of a submenu.
     * @function
     * @param {jQuery} $target - the submenu to toggle
     */

  }, {
    key: 'toggle',
    value: function toggle($target) {
      if (!$target.is(':animated')) {
        if (!$target.is(':hidden')) {
          this.up($target);
        } else {
          this.down($target);
        }
      }
    }

    /**
     * Opens the sub-menu defined by `$target`.
     * @param {jQuery} $target - Sub-menu to open.
     * @fires AccordionMenu#down
     */

  }, {
    key: 'down',
    value: function down($target) {
      var _this = this;

      if (!this.options.multiOpen) {
        this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
      }

      $target.addClass('is-active').attr({ 'aria-hidden': false });

      if (this.options.submenuToggle) {
        $target.prev('.submenu-toggle').attr({ 'aria-expanded': true });
      } else {
        $target.parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });
      }

      $target.slideDown(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done opening.
         * @event AccordionMenu#down
         */
        _this.$element.trigger('down.zf.accordionMenu', [$target]);
      });
    }

    /**
     * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
     * @param {jQuery} $target - Sub-menu to close.
     * @fires AccordionMenu#up
     */

  }, {
    key: 'up',
    value: function up($target) {
      var _this = this;
      $target.slideUp(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done collapsing up.
         * @event AccordionMenu#up
         */
        _this.$element.trigger('up.zf.accordionMenu', [$target]);
      });

      var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

      if (this.options.submenuToggle) {
        $menus.prev('.submenu-toggle').attr('aria-expanded', false);
      } else {
        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
      }
    }

    /**
     * Destroys an instance of accordion menu.
     * @fires AccordionMenu#destroyed
     */

  }, {
    key: '_destroy',
    value: function _destroy() {
      this.$element.find('[data-submenu]').slideDown(0).css('display', '');
      this.$element.find('a').off('click.zf.accordionMenu');

      if (this.options.submenuToggle) {
        this.$element.find('.has-submenu-toggle').removeClass('has-submenu-toggle');
        this.$element.find('.submenu-toggle').remove();
      }

      _foundationUtil2.Nest.Burn(this.$element, 'accordion');
    }
  }]);

  return AccordionMenu;
}(_foundation.Plugin);

AccordionMenu.defaults = {
  /**
   * Amount of time to animate the opening of a submenu in ms.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Adds a separate submenu toggle button. This allows the parent item to have a link.
   * @option
   * @example true
   */
  submenuToggle: false,
  /**
   * The text used for the submenu toggle if enabled. This is used for screen readers only.
   * @option
   * @example true
   */
  submenuToggleText: 'Toggle menu',
  /**
   * Allow the menu to have multiple open panes.
   * @option
   * @type {boolean}
   * @default true
   */
  multiOpen: true
};

exports.AccordionMenu = AccordionMenu;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DropdownMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.keyboard');

var _foundationUtil2 = require('./foundation.util.nest');

var _foundationUtil3 = require('./foundation.util.box');

var _foundationUtil4 = require('./foundation.util.core');

var _foundation = require('./foundation.plugin');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * DropdownMenu module.
 * @module foundation.dropdown-menu
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.nest
 */

var DropdownMenu = function (_Plugin) {
  _inherits(DropdownMenu, _Plugin);

  function DropdownMenu() {
    _classCallCheck(this, DropdownMenu);

    return _possibleConstructorReturn(this, (DropdownMenu.__proto__ || Object.getPrototypeOf(DropdownMenu)).apply(this, arguments));
  }

  _createClass(DropdownMenu, [{
    key: '_setup',

    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @name DropdownMenu
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    value: function _setup(element, options) {
      this.$element = element;
      this.options = _jquery2.default.extend({}, DropdownMenu.defaults, this.$element.data(), options);
      this.className = 'DropdownMenu'; // ie9 back compat

      this._init();

      _foundationUtil.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */

  }, {
    key: '_init',
    value: function _init() {
      _foundationUtil2.Nest.Feather(this.$element, 'dropdown');

      var subs = this.$element.find('li.is-dropdown-submenu-parent');
      this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

      this.$menuItems = this.$element.find('[role="menuitem"]');
      this.$tabs = this.$element.children('[role="menuitem"]');
      this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

      if (this.options.alignment === 'auto') {
        if (this.$element.hasClass(this.options.rightClass) || (0, _foundationUtil4.rtl)() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          this.options.alignment = 'left';
          subs.addClass('opens-right');
        }
      } else {
        if (this.options.alignment === 'right') {
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
      }
      this.changed = false;
      this._events();
    }
  }, {
    key: '_isVertical',
    value: function _isVertical() {
      return this.$tabs.css('display') === 'block' || this.$element.css('flex-direction') === 'column';
    }
  }, {
    key: '_isRtl',
    value: function _isRtl() {
      return this.$element.hasClass('align-right') || (0, _foundationUtil4.rtl)() && !this.$element.hasClass('align-left');
    }

    /**
     * Adds event listeners to elements within the menu
     * @private
     * @function
     */

  }, {
    key: '_events',
    value: function _events() {
      var _this = this,
          hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
          parClass = 'is-dropdown-submenu-parent';

      // used for onClick and in the keyboard handlers
      var handleClickFn = function handleClickFn(e) {
        var $elem = (0, _jquery2.default)(e.target).parentsUntil('ul', '.' + parClass),
            hasSub = $elem.hasClass(parClass),
            hasClicked = $elem.attr('data-is-click') === 'true',
            $sub = $elem.children('.is-dropdown-submenu');

        if (hasSub) {
          if (hasClicked) {
            if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
              return;
            } else {
              e.stopImmediatePropagation();
              e.preventDefault();
              _this._hide($elem);
            }
          } else {
            e.preventDefault();
            e.stopImmediatePropagation();
            _this._show($sub);
            $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
          }
        }
      };

      if (this.options.clickOpen || hasTouch) {
        this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
      }

      // Handle Leaf element Clicks
      if (_this.options.closeOnClickInside) {
        this.$menuItems.on('click.zf.dropdownmenu', function (e) {
          var $elem = (0, _jquery2.default)(this),
              hasSub = $elem.hasClass(parClass);
          if (!hasSub) {
            _this._hide();
          }
        });
      }

      if (!this.options.disableHover) {
        this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
          var $elem = (0, _jquery2.default)(this),
              hasSub = $elem.hasClass(parClass);

          if (hasSub) {
            clearTimeout($elem.data('_delay'));
            $elem.data('_delay', setTimeout(function () {
              _this._show($elem.children('.is-dropdown-submenu'));
            }, _this.options.hoverDelay));
          }
        }).on('mouseleave.zf.dropdownmenu', function (e) {
          var $elem = (0, _jquery2.default)(this),
              hasSub = $elem.hasClass(parClass);
          if (hasSub && _this.options.autoclose) {
            if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
              return false;
            }

            clearTimeout($elem.data('_delay'));
            $elem.data('_delay', setTimeout(function () {
              _this._hide($elem);
            }, _this.options.closingTime));
          }
        });
      }
      this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
        var $element = (0, _jquery2.default)(e.target).parentsUntil('ul', '[role="menuitem"]'),
            isTab = _this.$tabs.index($element) > -1,
            $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
            $prevElement,
            $nextElement;

        $elements.each(function (i) {
          if ((0, _jquery2.default)(this).is($element)) {
            $prevElement = $elements.eq(i - 1);
            $nextElement = $elements.eq(i + 1);
            return;
          }
        });

        var nextSibling = function nextSibling() {
          $nextElement.children('a:first').focus();
          e.preventDefault();
        },
            prevSibling = function prevSibling() {
          $prevElement.children('a:first').focus();
          e.preventDefault();
        },
            openSub = function openSub() {
          var $sub = $element.children('ul.is-dropdown-submenu');
          if ($sub.length) {
            _this._show($sub);
            $element.find('li > a:first').focus();
            e.preventDefault();
          } else {
            return;
          }
        },
            closeSub = function closeSub() {
          //if ($element.is(':first-child')) {
          var close = $element.parent('ul').parent('li');
          close.children('a:first').focus();
          _this._hide(close);
          e.preventDefault();
          //}
        };
        var functions = {
          open: openSub,
          close: function close() {
            _this._hide(_this.$element);
            _this.$menuItems.eq(0).children('a').focus(); // focus to first element
            e.preventDefault();
          },
          handled: function handled() {
            e.stopImmediatePropagation();
          }
        };

        if (isTab) {
          if (_this._isVertical()) {
            // vertical menu
            if (_this._isRtl()) {
              // right aligned
              _jquery2.default.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: closeSub,
                previous: openSub
              });
            } else {
              // left aligned
              _jquery2.default.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: openSub,
                previous: closeSub
              });
            }
          } else {
            // horizontal menu
            if (_this._isRtl()) {
              // right aligned
              _jquery2.default.extend(functions, {
                next: prevSibling,
                previous: nextSibling,
                down: openSub,
                up: closeSub
              });
            } else {
              // left aligned
              _jquery2.default.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          }
        } else {
          // not tabs -> one sub
          if (_this._isRtl()) {
            // right aligned
            _jquery2.default.extend(functions, {
              next: closeSub,
              previous: openSub,
              down: nextSibling,
              up: prevSibling
            });
          } else {
            // left aligned
            _jquery2.default.extend(functions, {
              next: openSub,
              previous: closeSub,
              down: nextSibling,
              up: prevSibling
            });
          }
        }
        _foundationUtil.Keyboard.handleKey(e, 'DropdownMenu', functions);
      });
    }

    /**
     * Adds an event handler to the body to close any dropdowns on a click.
     * @function
     * @private
     */

  }, {
    key: '_addBodyHandler',
    value: function _addBodyHandler() {
      var $body = (0, _jquery2.default)(document.body),
          _this = this;
      $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
        var $link = _this.$element.find(e.target);
        if ($link.length) {
          return;
        }

        _this._hide();
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
      });
    }

    /**
     * Opens a dropdown pane, and checks for collisions first.
     * @param {jQuery} $sub - ul element that is a submenu to show
     * @function
     * @private
     * @fires DropdownMenu#show
     */

  }, {
    key: '_show',
    value: function _show($sub) {
      var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
        return (0, _jquery2.default)(el).find($sub).length > 0;
      }));
      var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
      this._hide($sibs, idx);
      $sub.css('visibility', 'hidden').addClass('js-dropdown-active').parent('li.is-dropdown-submenu-parent').addClass('is-active');
      var clear = _foundationUtil3.Box.ImNotTouchingYou($sub, null, true);
      if (!clear) {
        var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
            $parentLi = $sub.parent('.is-dropdown-submenu-parent');
        $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
        clear = _foundationUtil3.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
        }
        this.changed = true;
      }
      $sub.css('visibility', '');
      if (this.options.closeOnClick) {
        this._addBodyHandler();
      }
      /**
       * Fires when the new dropdown pane is visible.
       * @event DropdownMenu#show
       */
      this.$element.trigger('show.zf.dropdownmenu', [$sub]);
    }

    /**
     * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
     * @function
     * @param {jQuery} $elem - element with a submenu to hide
     * @param {Number} idx - index of the $tabs collection to hide
     * @private
     */

  }, {
    key: '_hide',
    value: function _hide($elem, idx) {
      var $toClose;
      if ($elem && $elem.length) {
        $toClose = $elem;
      } else if (idx !== undefined) {
        $toClose = this.$tabs.not(function (i, el) {
          return i === idx;
        });
      } else {
        $toClose = this.$element;
      }
      var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

      if (somethingToClose) {
        $toClose.find('li.is-active').add($toClose).attr({
          'data-is-click': false
        }).removeClass('is-active');

        $toClose.find('ul.js-dropdown-active').removeClass('js-dropdown-active');

        if (this.changed || $toClose.find('opens-inner').length) {
          var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
          $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
          this.changed = false;
        }
        /**
         * Fires when the open menus are closed.
         * @event DropdownMenu#hide
         */
        this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
      }
    }

    /**
     * Destroys the plugin.
     * @function
     */

  }, {
    key: '_destroy',
    value: function _destroy() {
      this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
      (0, _jquery2.default)(document.body).off('.zf.dropdownmenu');
      _foundationUtil2.Nest.Burn(this.$element, 'dropdown');
    }
  }]);

  return DropdownMenu;
}(_foundation.Plugin);

/**
 * Default settings for plugin
 */


DropdownMenu.defaults = {
  /**
   * Disallows hover events from opening submenus
   * @option
   * @type {boolean}
   * @default false
   */
  disableHover: false,
  /**
   * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
   * @option
   * @type {boolean}
   * @default true
   */
  autoclose: true,
  /**
   * Amount of time to delay opening a submenu on hover event.
   * @option
   * @type {number}
   * @default 50
   */
  hoverDelay: 50,
  /**
   * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
   * @option
   * @type {boolean}
   * @default false
   */
  clickOpen: false,
  /**
   * Amount of time to delay closing a submenu on a mouseleave event.
   * @option
   * @type {number}
   * @default 500
   */

  closingTime: 500,
  /**
   * Position of the menu relative to what direction the submenus should open. Handled by JS. Can be `'auto'`, `'left'` or `'right'`.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow clicks on the body to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Allow clicks on leaf anchor links to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClickInside: true,
  /**
   * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'vertical'
   */
  verticalClass: 'vertical',
  /**
   * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'align-right'
   */
  rightClass: 'align-right',
  /**
   * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
   * @option
   * @type {boolean}
   * @default true
   */
  forceFollow: true
};

exports.DropdownMenu = DropdownMenu;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OffCanvas = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.keyboard');

var _foundationUtil2 = require('./foundation.util.mediaQuery');

var _foundationUtil3 = require('./foundation.util.core');

var _foundation = require('./foundation.plugin');

var _foundationUtil4 = require('./foundation.util.triggers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * OffCanvas module.
 * @module foundation.offcanvas
 * @requires foundation.util.keyboard
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

var OffCanvas = function (_Plugin) {
  _inherits(OffCanvas, _Plugin);

  function OffCanvas() {
    _classCallCheck(this, OffCanvas);

    return _possibleConstructorReturn(this, (OffCanvas.__proto__ || Object.getPrototypeOf(OffCanvas)).apply(this, arguments));
  }

  _createClass(OffCanvas, [{
    key: '_setup',

    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @name OffCanvas
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    value: function _setup(element, options) {
      var _this3 = this;

      this.className = 'OffCanvas'; // ie9 back compat
      this.$element = element;
      this.options = _jquery2.default.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.contentClasses = { base: [], reveal: [] };
      this.$lastTrigger = (0, _jquery2.default)();
      this.$triggers = (0, _jquery2.default)();
      this.position = 'left';
      this.$content = (0, _jquery2.default)();
      this.nested = !!this.options.nested;

      // Defines the CSS transition/position classes of the off-canvas content container.
      (0, _jquery2.default)(['push', 'overlap']).each(function (index, val) {
        _this3.contentClasses.base.push('has-transition-' + val);
      });
      (0, _jquery2.default)(['left', 'right', 'top', 'bottom']).each(function (index, val) {
        _this3.contentClasses.base.push('has-position-' + val);
        _this3.contentClasses.reveal.push('has-reveal-' + val);
      });

      // Triggers init is idempotent, just need to make sure it is initialized
      _foundationUtil4.Triggers.init(_jquery2.default);
      _foundationUtil2.MediaQuery._init();

      this._init();
      this._events();

      _foundationUtil.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */

  }, {
    key: '_init',
    value: function _init() {
      var id = this.$element.attr('id');

      this.$element.attr('aria-hidden', 'true');

      // Find off-canvas content, either by ID (if specified), by siblings or by closest selector (fallback)
      if (this.options.contentId) {
        this.$content = (0, _jquery2.default)('#' + this.options.contentId);
      } else if (this.$element.siblings('[data-off-canvas-content]').length) {
        this.$content = this.$element.siblings('[data-off-canvas-content]').first();
      } else {
        this.$content = this.$element.closest('[data-off-canvas-content]').first();
      }

      if (!this.options.contentId) {
        // Assume that the off-canvas element is nested if it isn't a sibling of the content
        this.nested = this.$element.siblings('[data-off-canvas-content]').length === 0;
      } else if (this.options.contentId && this.options.nested === null) {
        // Warning if using content ID without setting the nested option
        // Once the element is nested it is required to work properly in this case
        console.warn('Remember to use the nested option if using the content ID option!');
      }

      if (this.nested === true) {
        // Force transition overlap if nested
        this.options.transition = 'overlap';
        // Remove appropriate classes if already assigned in markup
        this.$element.removeClass('is-transition-push');
      }

      this.$element.addClass('is-transition-' + this.options.transition + ' is-closed');

      // Find triggers that affect this element and add aria-expanded to them
      this.$triggers = (0, _jquery2.default)(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

      // Get position by checking for related CSS class
      this.position = this.$element.is('.position-left, .position-top, .position-right, .position-bottom') ? this.$element.attr('class').match(/position\-(left|top|right|bottom)/)[1] : this.position;

      // Add an overlay over the content if necessary
      if (this.options.contentOverlay === true) {
        var overlay = document.createElement('div');
        var overlayPosition = (0, _jquery2.default)(this.$element).css("position") === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
        overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
        this.$overlay = (0, _jquery2.default)(overlay);
        if (overlayPosition === 'is-overlay-fixed') {
          (0, _jquery2.default)(this.$overlay).insertAfter(this.$element);
        } else {
          this.$content.append(this.$overlay);
        }
      }

      this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

      if (this.options.isRevealed === true) {
        this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
        this._setMQChecker();
      }

      if (this.options.transitionTime) {
        this.$element.css('transition-duration', this.options.transitionTime);
      }

      // Initally remove all transition/position CSS classes from off-canvas content container.
      this._removeContentClasses();
    }

    /**
     * Adds event handlers to the off-canvas wrapper and the exit overlay.
     * @function
     * @private
     */

  }, {
    key: '_events',
    value: function _events() {
      this.$element.off('.zf.trigger .zf.offcanvas').on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': this.close.bind(this),
        'toggle.zf.trigger': this.toggle.bind(this),
        'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
      });

      if (this.options.closeOnClick === true) {
        var $target = this.options.contentOverlay ? this.$overlay : this.$content;
        $target.on({ 'click.zf.offcanvas': this.close.bind(this) });
      }
    }

    /**
     * Applies event listener for elements that will reveal at certain breakpoints.
     * @private
     */

  }, {
    key: '_setMQChecker',
    value: function _setMQChecker() {
      var _this = this;

      (0, _jquery2.default)(window).on('changed.zf.mediaquery', function () {
        if (_foundationUtil2.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        } else {
          _this.reveal(false);
        }
      }).one('load.zf.offcanvas', function () {
        if (_foundationUtil2.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        }
      });
    }

    /**
     * Removes the CSS transition/position classes of the off-canvas content container.
     * Removing the classes is important when another off-canvas gets opened that uses the same content container.
     * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
     * @private
     */

  }, {
    key: '_removeContentClasses',
    value: function _removeContentClasses(hasReveal) {
      if (typeof hasReveal !== 'boolean') {
        this.$content.removeClass(this.contentClasses.base.join(' '));
      } else if (hasReveal === false) {
        this.$content.removeClass('has-reveal-' + this.position);
      }
    }

    /**
     * Adds the CSS transition/position classes of the off-canvas content container, based on the opening off-canvas element.
     * Beforehand any transition/position class gets removed.
     * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
     * @private
     */

  }, {
    key: '_addContentClasses',
    value: function _addContentClasses(hasReveal) {
      this._removeContentClasses(hasReveal);
      if (typeof hasReveal !== 'boolean') {
        this.$content.addClass('has-transition-' + this.options.transition + ' has-position-' + this.position);
      } else if (hasReveal === true) {
        this.$content.addClass('has-reveal-' + this.position);
      }
    }

    /**
     * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
     * @param {Boolean} isRevealed - true if element should be revealed.
     * @function
     */

  }, {
    key: 'reveal',
    value: function reveal(isRevealed) {
      if (isRevealed) {
        this.close();
        this.isRevealed = true;
        this.$element.attr('aria-hidden', 'false');
        this.$element.off('open.zf.trigger toggle.zf.trigger');
        this.$element.removeClass('is-closed');
      } else {
        this.isRevealed = false;
        this.$element.attr('aria-hidden', 'true');
        this.$element.off('open.zf.trigger toggle.zf.trigger').on({
          'open.zf.trigger': this.open.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this)
        });
        this.$element.addClass('is-closed');
      }
      this._addContentClasses(isRevealed);
    }

    /**
     * Stops scrolling of the body when offcanvas is open on mobile Safari and other troublesome browsers.
     * @private
     */

  }, {
    key: '_stopScrolling',
    value: function _stopScrolling(event) {
      return false;
    }

    // Taken and adapted from http://stackoverflow.com/questions/16889447/prevent-full-page-scrolling-ios
    // Only really works for y, not sure how to extend to x or if we need to.

  }, {
    key: '_recordScrollable',
    value: function _recordScrollable(event) {
      var elem = this; // called from event handler context with this as elem

      // If the element is scrollable (content overflows), then...
      if (elem.scrollHeight !== elem.clientHeight) {
        // If we're at the top, scroll down one pixel to allow scrolling up
        if (elem.scrollTop === 0) {
          elem.scrollTop = 1;
        }
        // If we're at the bottom, scroll up one pixel to allow scrolling down
        if (elem.scrollTop === elem.scrollHeight - elem.clientHeight) {
          elem.scrollTop = elem.scrollHeight - elem.clientHeight - 1;
        }
      }
      elem.allowUp = elem.scrollTop > 0;
      elem.allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
      elem.lastY = event.originalEvent.pageY;
    }
  }, {
    key: '_stopScrollPropagation',
    value: function _stopScrollPropagation(event) {
      var elem = this; // called from event handler context with this as elem
      var up = event.pageY < elem.lastY;
      var down = !up;
      elem.lastY = event.pageY;

      if (up && elem.allowUp || down && elem.allowDown) {
        event.stopPropagation();
      } else {
        event.preventDefault();
      }
    }

    /**
     * Opens the off-canvas menu.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     * @fires OffCanvas#opened
     */

  }, {
    key: 'open',
    value: function open(event, trigger) {
      if (this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }
      var _this = this;

      if (trigger) {
        this.$lastTrigger = trigger;
      }

      if (this.options.forceTo === 'top') {
        window.scrollTo(0, 0);
      } else if (this.options.forceTo === 'bottom') {
        window.scrollTo(0, document.body.scrollHeight);
      }

      if (this.options.transitionTime && this.options.transition !== 'overlap') {
        this.$element.siblings('[data-off-canvas-content]').css('transition-duration', this.options.transitionTime);
      } else {
        this.$element.siblings('[data-off-canvas-content]').css('transition-duration', '');
      }

      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#opened
       */
      this.$element.addClass('is-open').removeClass('is-closed');

      this.$triggers.attr('aria-expanded', 'true');
      this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

      this.$content.addClass('is-open-' + this.position);

      // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        (0, _jquery2.default)('body').addClass('is-off-canvas-open').on('touchmove', this._stopScrolling);
        this.$element.on('touchstart', this._recordScrollable);
        this.$element.on('touchmove', this._stopScrollPropagation);
      }

      if (this.options.contentOverlay === true) {
        this.$overlay.addClass('is-visible');
      }

      if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
        this.$overlay.addClass('is-closable');
      }

      if (this.options.autoFocus === true) {
        this.$element.one((0, _foundationUtil3.transitionend)(this.$element), function () {
          if (!_this.$element.hasClass('is-open')) {
            return; // exit if prematurely closed
          }
          var canvasFocus = _this.$element.find('[data-autofocus]');
          if (canvasFocus.length) {
            canvasFocus.eq(0).focus();
          } else {
            _this.$element.find('a, button').eq(0).focus();
          }
        });
      }

      if (this.options.trapFocus === true) {
        this.$content.attr('tabindex', '-1');
        _foundationUtil.Keyboard.trapFocus(this.$element);
      }

      this._addContentClasses();
    }

    /**
     * Closes the off-canvas menu.
     * @function
     * @param {Function} cb - optional cb to fire after closure.
     * @fires OffCanvas#closed
     */

  }, {
    key: 'close',
    value: function close(cb) {
      if (!this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }

      var _this = this;

      this.$element.removeClass('is-open');

      this.$element.attr('aria-hidden', 'true')
      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#closed
       */
      .trigger('closed.zf.offcanvas');

      this.$content.removeClass('is-open-left is-open-top is-open-right is-open-bottom');

      // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        (0, _jquery2.default)('body').removeClass('is-off-canvas-open').off('touchmove', this._stopScrolling);
        this.$element.off('touchstart', this._recordScrollable);
        this.$element.off('touchmove', this._stopScrollPropagation);
      }

      if (this.options.contentOverlay === true) {
        this.$overlay.removeClass('is-visible');
      }

      if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
        this.$overlay.removeClass('is-closable');
      }

      this.$triggers.attr('aria-expanded', 'false');

      if (this.options.trapFocus === true) {
        this.$content.removeAttr('tabindex');
        _foundationUtil.Keyboard.releaseFocus(this.$element);
      }

      // Listen to transitionEnd and add class when done.
      this.$element.one((0, _foundationUtil3.transitionend)(this.$element), function (e) {
        _this.$element.addClass('is-closed');
        _this._removeContentClasses();
      });
    }

    /**
     * Toggles the off-canvas menu open or closed.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     */

  }, {
    key: 'toggle',
    value: function toggle(event, trigger) {
      if (this.$element.hasClass('is-open')) {
        this.close(event, trigger);
      } else {
        this.open(event, trigger);
      }
    }

    /**
     * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
     * @function
     * @private
     */

  }, {
    key: '_handleKeyboard',
    value: function _handleKeyboard(e) {
      var _this4 = this;

      _foundationUtil.Keyboard.handleKey(e, 'OffCanvas', {
        close: function close() {
          _this4.close();
          _this4.$lastTrigger.focus();
          return true;
        },
        handled: function handled() {
          e.stopPropagation();
          e.preventDefault();
        }
      });
    }

    /**
     * Destroys the offcanvas plugin.
     * @function
     */

  }, {
    key: '_destroy',
    value: function _destroy() {
      this.close();
      this.$element.off('.zf.trigger .zf.offcanvas');
      this.$overlay.off('.zf.offcanvas');
    }
  }]);

  return OffCanvas;
}(_foundation.Plugin);

OffCanvas.defaults = {
  /**
   * Allow the user to click outside of the menu to close it.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,

  /**
   * Adds an overlay on top of `[data-off-canvas-content]`.
   * @option
   * @type {boolean}
   * @default true
   */
  contentOverlay: true,

  /**
   * Target an off-canvas content container by ID that may be placed anywhere. If null the closest content container will be taken.
   * @option
   * @type {?string}
   * @default null
   */
  contentId: null,

  /**
   * Define the off-canvas element is nested in an off-canvas content. This is required when using the contentId option for a nested element.
   * @option
   * @type {boolean}
   * @default null
   */
  nested: null,

  /**
   * Enable/disable scrolling of the main content when an off canvas panel is open.
   * @option
   * @type {boolean}
   * @default true
   */
  contentScroll: true,

  /**
   * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
   * @option
   * @type {number}
   * @default null
   */
  transitionTime: null,

  /**
   * Type of transition for the offcanvas menu. Options are 'push', 'detached' or 'slide'.
   * @option
   * @type {string}
   * @default push
   */
  transition: 'push',

  /**
   * Force the page to scroll to top or bottom on open.
   * @option
   * @type {?string}
   * @default null
   */
  forceTo: null,

  /**
   * Allow the offcanvas to remain open for certain breakpoints.
   * @option
   * @type {boolean}
   * @default false
   */
  isRevealed: false,

  /**
   * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
   * @option
   * @type {?string}
   * @default null
   */
  revealOn: null,

  /**
   * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
   * @option
   * @type {boolean}
   * @default true
   */
  autoFocus: true,

  /**
   * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
   * @option
   * @type {string}
   * @default reveal-for-
   * @todo improve the regex testing for this.
   */
  revealClass: 'reveal-for-',

  /**
   * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
   * @option
   * @type {boolean}
   * @default false
   */
  trapFocus: false
};

exports.OffCanvas = OffCanvas;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResponsiveMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.mediaQuery');

var _foundationUtil2 = require('./foundation.util.core');

var _foundation = require('./foundation.plugin');

var _foundation2 = require('./foundation.dropdownMenu');

var _foundation3 = require('./foundation.drilldown');

var _foundation4 = require('./foundation.accordionMenu');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MenuPlugins = {
  dropdown: {
    cssClass: 'dropdown',
    plugin: _foundation2.DropdownMenu
  },
  drilldown: {
    cssClass: 'drilldown',
    plugin: _foundation3.Drilldown
  },
  accordion: {
    cssClass: 'accordion-menu',
    plugin: _foundation4.AccordionMenu
  }
};

// import "foundation.util.triggers.js";


/**
 * ResponsiveMenu module.
 * @module foundation.responsiveMenu
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

var ResponsiveMenu = function (_Plugin) {
  _inherits(ResponsiveMenu, _Plugin);

  function ResponsiveMenu() {
    _classCallCheck(this, ResponsiveMenu);

    return _possibleConstructorReturn(this, (ResponsiveMenu.__proto__ || Object.getPrototypeOf(ResponsiveMenu)).apply(this, arguments));
  }

  _createClass(ResponsiveMenu, [{
    key: '_setup',

    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @name ResponsiveMenu
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    value: function _setup(element, options) {
      this.$element = (0, _jquery2.default)(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;
      this.className = 'ResponsiveMenu'; // ie9 back compat

      this._init();
      this._events();
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */

  }, {
    key: '_init',
    value: function _init() {

      _foundationUtil.MediaQuery._init();
      // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
      if (typeof this.rules === 'string') {
        var rulesTree = {};

        // Parse rules from "classes" pulled from data attribute
        var rules = this.rules.split(' ');

        // Iterate through every rule found
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i].split('-');
          var ruleSize = rule.length > 1 ? rule[0] : 'small';
          var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

          if (MenuPlugins[rulePlugin] !== null) {
            rulesTree[ruleSize] = MenuPlugins[rulePlugin];
          }
        }

        this.rules = rulesTree;
      }

      if (!_jquery2.default.isEmptyObject(this.rules)) {
        this._checkMediaQueries();
      }
      // Add data-mutate since children may need it.
      this.$element.attr('data-mutate', this.$element.attr('data-mutate') || (0, _foundationUtil2.GetYoDigits)(6, 'responsive-menu'));
    }

    /**
     * Initializes events for the Menu.
     * @function
     * @private
     */

  }, {
    key: '_events',
    value: function _events() {
      var _this = this;

      (0, _jquery2.default)(window).on('changed.zf.mediaquery', function () {
        _this._checkMediaQueries();
      });
      // $(window).on('resize.zf.ResponsiveMenu', function() {
      //   _this._checkMediaQueries();
      // });
    }

    /**
     * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
     * @function
     * @private
     */

  }, {
    key: '_checkMediaQueries',
    value: function _checkMediaQueries() {
      var matchedMq,
          _this = this;
      // Iterate through each rule and find the last matching rule
      _jquery2.default.each(this.rules, function (key) {
        if (_foundationUtil.MediaQuery.atLeast(key)) {
          matchedMq = key;
        }
      });

      // No match? No dice
      if (!matchedMq) return;

      // Plugin already initialized? We good
      if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

      // Remove existing plugin-specific CSS classes
      _jquery2.default.each(MenuPlugins, function (key, value) {
        _this.$element.removeClass(value.cssClass);
      });

      // Add the CSS class for the new plugin
      this.$element.addClass(this.rules[matchedMq].cssClass);

      // Create an instance of the new plugin
      if (this.currentPlugin) this.currentPlugin.destroy();
      this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
    }

    /**
     * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
     * @function
     */

  }, {
    key: '_destroy',
    value: function _destroy() {
      this.currentPlugin.destroy();
      (0, _jquery2.default)(window).off('.zf.ResponsiveMenu');
    }
  }]);

  return ResponsiveMenu;
}(_foundation.Plugin);

ResponsiveMenu.defaults = {};

exports.ResponsiveMenu = ResponsiveMenu;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResponsiveToggle = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.mediaQuery');

var _foundationUtil2 = require('./foundation.util.motion');

var _foundation = require('./foundation.plugin');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * ResponsiveToggle module.
 * @module foundation.responsiveToggle
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.motion
 */

var ResponsiveToggle = function (_Plugin) {
  _inherits(ResponsiveToggle, _Plugin);

  function ResponsiveToggle() {
    _classCallCheck(this, ResponsiveToggle);

    return _possibleConstructorReturn(this, (ResponsiveToggle.__proto__ || Object.getPrototypeOf(ResponsiveToggle)).apply(this, arguments));
  }

  _createClass(ResponsiveToggle, [{
    key: '_setup',

    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @name ResponsiveToggle
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    value: function _setup(element, options) {
      this.$element = (0, _jquery2.default)(element);
      this.options = _jquery2.default.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);
      this.className = 'ResponsiveToggle'; // ie9 back compat

      this._init();
      this._events();
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */

  }, {
    key: '_init',
    value: function _init() {
      _foundationUtil.MediaQuery._init();
      var targetID = this.$element.data('responsive-toggle');
      if (!targetID) {
        console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
      }

      this.$targetMenu = (0, _jquery2.default)('#' + targetID);
      this.$toggler = this.$element.find('[data-toggle]').filter(function () {
        var target = (0, _jquery2.default)(this).data('toggle');
        return target === targetID || target === "";
      });
      this.options = _jquery2.default.extend({}, this.options, this.$targetMenu.data());

      // If they were set, parse the animation classes
      if (this.options.animate) {
        var input = this.options.animate.split(' ');

        this.animationIn = input[0];
        this.animationOut = input[1] || null;
      }

      this._update();
    }

    /**
     * Adds necessary event handlers for the tab bar to work.
     * @function
     * @private
     */

  }, {
    key: '_events',
    value: function _events() {
      var _this = this;

      this._updateMqHandler = this._update.bind(this);

      (0, _jquery2.default)(window).on('changed.zf.mediaquery', this._updateMqHandler);

      this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
    }

    /**
     * Checks the current media query to determine if the tab bar should be visible or hidden.
     * @function
     * @private
     */

  }, {
    key: '_update',
    value: function _update() {
      // Mobile
      if (!_foundationUtil.MediaQuery.atLeast(this.options.hideFor)) {
        this.$element.show();
        this.$targetMenu.hide();
      }

      // Desktop
      else {
          this.$element.hide();
          this.$targetMenu.show();
        }
    }

    /**
     * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
     * @function
     * @fires ResponsiveToggle#toggled
     */

  }, {
    key: 'toggleMenu',
    value: function toggleMenu() {
      var _this3 = this;

      if (!_foundationUtil.MediaQuery.atLeast(this.options.hideFor)) {
        /**
         * Fires when the element attached to the tab bar toggles.
         * @event ResponsiveToggle#toggled
         */
        if (this.options.animate) {
          if (this.$targetMenu.is(':hidden')) {
            _foundationUtil2.Motion.animateIn(this.$targetMenu, this.animationIn, function () {
              _this3.$element.trigger('toggled.zf.responsiveToggle');
              _this3.$targetMenu.find('[data-mutate]').triggerHandler('mutateme.zf.trigger');
            });
          } else {
            _foundationUtil2.Motion.animateOut(this.$targetMenu, this.animationOut, function () {
              _this3.$element.trigger('toggled.zf.responsiveToggle');
            });
          }
        } else {
          this.$targetMenu.toggle(0);
          this.$targetMenu.find('[data-mutate]').trigger('mutateme.zf.trigger');
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }
  }, {
    key: '_destroy',
    value: function _destroy() {
      this.$element.off('.zf.responsiveToggle');
      this.$toggler.off('.zf.responsiveToggle');

      (0, _jquery2.default)(window).off('changed.zf.mediaquery', this._updateMqHandler);
    }
  }]);

  return ResponsiveToggle;
}(_foundation.Plugin);

ResponsiveToggle.defaults = {
  /**
   * The breakpoint after which the menu is always shown, and the tab bar is hidden.
   * @option
   * @type {string}
   * @default 'medium'
   */
  hideFor: 'medium',

  /**
   * To decide if the toggle should be animated or not.
   * @option
   * @type {boolean}
   * @default false
   */
  animate: false
};

exports.ResponsiveToggle = ResponsiveToggle;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Box = undefined;

var _foundationUtil = require("./foundation.util.core");

var Box = {
  ImNotTouchingYou: ImNotTouchingYou,
  OverlapArea: OverlapArea,
  GetDimensions: GetDimensions,
  GetOffsets: GetOffsets,
  GetExplicitOffsets: GetExplicitOffsets

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
};function ImNotTouchingYou(element, parent, lrOnly, tbOnly, ignoreBottom) {
  return OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) === 0;
};

function OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) {
  var eleDims = GetDimensions(element),
      topOver,
      bottomOver,
      leftOver,
      rightOver;
  if (parent) {
    var parDims = GetDimensions(parent);

    bottomOver = parDims.height + parDims.offset.top - (eleDims.offset.top + eleDims.height);
    topOver = eleDims.offset.top - parDims.offset.top;
    leftOver = eleDims.offset.left - parDims.offset.left;
    rightOver = parDims.width + parDims.offset.left - (eleDims.offset.left + eleDims.width);
  } else {
    bottomOver = eleDims.windowDims.height + eleDims.windowDims.offset.top - (eleDims.offset.top + eleDims.height);
    topOver = eleDims.offset.top - eleDims.windowDims.offset.top;
    leftOver = eleDims.offset.left - eleDims.windowDims.offset.left;
    rightOver = eleDims.windowDims.width - (eleDims.offset.left + eleDims.width);
  }

  bottomOver = ignoreBottom ? 0 : Math.min(bottomOver, 0);
  topOver = Math.min(topOver, 0);
  leftOver = Math.min(leftOver, 0);
  rightOver = Math.min(rightOver, 0);

  if (lrOnly) {
    return leftOver + rightOver;
  }
  if (tbOnly) {
    return topOver + bottomOver;
  }

  // use sum of squares b/c we care about overlap area.
  return Math.sqrt(topOver * topOver + bottomOver * bottomOver + leftOver * leftOver + rightOver * rightOver);
}

/**
 * Uses native methods to return an object of dimension values.
 * @function
 * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
 * @returns {Object} - nested object of integer pixel values
 * TODO - if element is window, return only those values.
 */
function GetDimensions(elem) {
  elem = elem.length ? elem[0] : elem;

  if (elem === window || elem === document) {
    throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
  }

  var rect = elem.getBoundingClientRect(),
      parRect = elem.parentNode.getBoundingClientRect(),
      winRect = document.body.getBoundingClientRect(),
      winY = window.pageYOffset,
      winX = window.pageXOffset;

  return {
    width: rect.width,
    height: rect.height,
    offset: {
      top: rect.top + winY,
      left: rect.left + winX
    },
    parentDims: {
      width: parRect.width,
      height: parRect.height,
      offset: {
        top: parRect.top + winY,
        left: parRect.left + winX
      }
    },
    windowDims: {
      width: winRect.width,
      height: winRect.height,
      offset: {
        top: winY,
        left: winX
      }
    }
  };
}

/**
 * Returns an object of top and left integer pixel values for dynamically rendered elements,
 * such as: Tooltip, Reveal, and Dropdown. Maintained for backwards compatibility, and where
 * you don't know alignment, but generally from
 * 6.4 forward you should use GetExplicitOffsets, as GetOffsets conflates position and alignment.
 * @function
 * @param {jQuery} element - jQuery object for the element being positioned.
 * @param {jQuery} anchor - jQuery object for the element's anchor point.
 * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
 * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
 * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
 * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
 * TODO alter/rewrite to work with `em` values as well/instead of pixels
 */
function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
  console.log("NOTE: GetOffsets is deprecated in favor of GetExplicitOffsets and will be removed in 6.5");
  switch (position) {
    case 'top':
      return (0, _foundationUtil.rtl)() ? GetExplicitOffsets(element, anchor, 'top', 'left', vOffset, hOffset, isOverflow) : GetExplicitOffsets(element, anchor, 'top', 'right', vOffset, hOffset, isOverflow);
    case 'bottom':
      return (0, _foundationUtil.rtl)() ? GetExplicitOffsets(element, anchor, 'bottom', 'left', vOffset, hOffset, isOverflow) : GetExplicitOffsets(element, anchor, 'bottom', 'right', vOffset, hOffset, isOverflow);
    case 'center top':
      return GetExplicitOffsets(element, anchor, 'top', 'center', vOffset, hOffset, isOverflow);
    case 'center bottom':
      return GetExplicitOffsets(element, anchor, 'bottom', 'center', vOffset, hOffset, isOverflow);
    case 'center left':
      return GetExplicitOffsets(element, anchor, 'left', 'center', vOffset, hOffset, isOverflow);
    case 'center right':
      return GetExplicitOffsets(element, anchor, 'right', 'center', vOffset, hOffset, isOverflow);
    case 'left bottom':
      return GetExplicitOffsets(element, anchor, 'bottom', 'left', vOffset, hOffset, isOverflow);
    case 'right bottom':
      return GetExplicitOffsets(element, anchor, 'bottom', 'right', vOffset, hOffset, isOverflow);
    // Backwards compatibility... this along with the reveal and reveal full
    // classes are the only ones that didn't reference anchor
    case 'center':
      return {
        left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2 + hOffset,
        top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - ($eleDims.height / 2 + vOffset)
      };
    case 'reveal':
      return {
        left: ($eleDims.windowDims.width - $eleDims.width) / 2 + hOffset,
        top: $eleDims.windowDims.offset.top + vOffset
      };
    case 'reveal full':
      return {
        left: $eleDims.windowDims.offset.left,
        top: $eleDims.windowDims.offset.top
      };
      break;
    default:
      return {
        left: (0, _foundationUtil.rtl)() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width - hOffset : $anchorDims.offset.left + hOffset,
        top: $anchorDims.offset.top + $anchorDims.height + vOffset
      };

  }
}

function GetExplicitOffsets(element, anchor, position, alignment, vOffset, hOffset, isOverflow) {
  var $eleDims = GetDimensions(element),
      $anchorDims = anchor ? GetDimensions(anchor) : null;

  var topVal, leftVal;

  // set position related attribute

  switch (position) {
    case 'top':
      topVal = $anchorDims.offset.top - ($eleDims.height + vOffset);
      break;
    case 'bottom':
      topVal = $anchorDims.offset.top + $anchorDims.height + vOffset;
      break;
    case 'left':
      leftVal = $anchorDims.offset.left - ($eleDims.width + hOffset);
      break;
    case 'right':
      leftVal = $anchorDims.offset.left + $anchorDims.width + hOffset;
      break;
  }

  // set alignment related attribute
  switch (position) {
    case 'top':
    case 'bottom':
      switch (alignment) {
        case 'left':
          leftVal = $anchorDims.offset.left + hOffset;
          break;
        case 'right':
          leftVal = $anchorDims.offset.left - $eleDims.width + $anchorDims.width - hOffset;
          break;
        case 'center':
          leftVal = isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2 + hOffset;
          break;
      }
      break;
    case 'right':
    case 'left':
      switch (alignment) {
        case 'bottom':
          topVal = $anchorDims.offset.top - vOffset + $anchorDims.height - $eleDims.height;
          break;
        case 'top':
          topVal = $anchorDims.offset.top + vOffset;
          break;
        case 'center':
          topVal = $anchorDims.offset.top + vOffset + $anchorDims.height / 2 - $eleDims.height / 2;
          break;
      }
      break;
  }
  return { top: topVal, left: leftVal };
}

exports.Box = Box;
/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Keyboard = undefined;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var keyCodes = {
  9: 'TAB',
  13: 'ENTER',
  27: 'ESCAPE',
  32: 'SPACE',
  35: 'END',
  36: 'HOME',
  37: 'ARROW_LEFT',
  38: 'ARROW_UP',
  39: 'ARROW_RIGHT',
  40: 'ARROW_DOWN'
};

var commands = {};

// Functions pulled out to be referenceable from internals
function findFocusable($element) {
  if (!$element) {
    return false;
  }
  return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
    if (!(0, _jquery2.default)(this).is(':visible') || (0, _jquery2.default)(this).attr('tabindex') < 0) {
      return false;
    } //only have visible elements and those that have a tabindex greater or equal 0
    return true;
  });
}

function parseKey(event) {
  var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

  // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
  key = key.replace(/\W+/, '');

  if (event.shiftKey) key = 'SHIFT_' + key;
  if (event.ctrlKey) key = 'CTRL_' + key;
  if (event.altKey) key = 'ALT_' + key;

  // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
  key = key.replace(/_$/, '');

  return key;
}

var Keyboard = {
  keys: getKeyCodes(keyCodes),

  /**
   * Parses the (keyboard) event and returns a String that represents its key
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   * @param {Event} event - the event generated by the event handler
   * @return String key - String that represents the key pressed
   */
  parseKey: parseKey,

  /**
   * Handles the given (keyboard) event
   * @param {Event} event - the event generated by the event handler
   * @param {String} component - Foundation component's name, e.g. Slider or Reveal
   * @param {Objects} functions - collection of functions that are to be executed
   */
  handleKey: function handleKey(event, component, functions) {
    var commandList = commands[component],
        keyCode = this.parseKey(event),
        cmds,
        command,
        fn;

    if (!commandList) return console.warn('Component not defined!');

    if (typeof commandList.ltr === 'undefined') {
      // this component does not differentiate between ltr and rtl
      cmds = commandList; // use plain list
    } else {
      // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
      if ((0, _foundationUtil.rtl)()) cmds = _jquery2.default.extend({}, commandList.ltr, commandList.rtl);else cmds = _jquery2.default.extend({}, commandList.rtl, commandList.ltr);
    }
    command = cmds[keyCode];

    fn = functions[command];
    if (fn && typeof fn === 'function') {
      // execute function  if exists
      var returnValue = fn.apply();
      if (functions.handled || typeof functions.handled === 'function') {
        // execute function when event was handled
        functions.handled(returnValue);
      }
    } else {
      if (functions.unhandled || typeof functions.unhandled === 'function') {
        // execute function when event was not handled
        functions.unhandled();
      }
    }
  },


  /**
   * Finds all focusable elements within the given `$element`
   * @param {jQuery} $element - jQuery object to search within
   * @return {jQuery} $focusable - all focusable elements within `$element`
   */

  findFocusable: findFocusable,

  /**
   * Returns the component name name
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @return String componentName
   */

  register: function register(componentName, cmds) {
    commands[componentName] = cmds;
  },


  // TODO9438: These references to Keyboard need to not require global. Will 'this' work in this context?
  //
  /**
   * Traps the focus in the given element.
   * @param  {jQuery} $element  jQuery object to trap the foucs into.
   */
  trapFocus: function trapFocus($element) {
    var $focusable = findFocusable($element),
        $firstFocusable = $focusable.eq(0),
        $lastFocusable = $focusable.eq(-1);

    $element.on('keydown.zf.trapfocus', function (event) {
      if (event.target === $lastFocusable[0] && parseKey(event) === 'TAB') {
        event.preventDefault();
        $firstFocusable.focus();
      } else if (event.target === $firstFocusable[0] && parseKey(event) === 'SHIFT_TAB') {
        event.preventDefault();
        $lastFocusable.focus();
      }
    });
  },

  /**
   * Releases the trapped focus from the given element.
   * @param  {jQuery} $element  jQuery object to release the focus for.
   */
  releaseFocus: function releaseFocus($element) {
    $element.off('keydown.zf.trapfocus');
  }
};

/*
 * Constants for easier comparing.
 * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
 */
function getKeyCodes(kcs) {
  var k = {};
  for (var kc in kcs) {
    k[kcs[kc]] = kcs[kc];
  }return k;
}

exports.Keyboard = Keyboard;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Motion = exports.Move = undefined;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Motion module.
 * @module foundation.motion
 */

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

var Motion = {
  animateIn: function animateIn(element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function animateOut(element, animation, cb) {
    animate(false, element, animation, cb);
  }
};

function Move(duration, elem, fn) {
  var anim,
      prog,
      start = null;
  // console.log('called');

  if (duration === 0) {
    fn.apply(elem);
    elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
    return;
  }

  function move(ts) {
    if (!start) start = ts;
    // console.log(start, ts);
    prog = ts - start;
    fn.apply(elem);

    if (prog < duration) {
      anim = window.requestAnimationFrame(move, elem);
    } else {
      window.cancelAnimationFrame(anim);
      elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
    }
  }
  anim = window.requestAnimationFrame(move);
}

/**
 * Animates an element in or out using a CSS transition class.
 * @function
 * @private
 * @param {Boolean} isIn - Defines if the animation is in or out.
 * @param {Object} element - jQuery or HTML object to animate.
 * @param {String} animation - CSS class to use.
 * @param {Function} cb - Callback to run when animation is finished.
 */
function animate(isIn, element, animation, cb) {
  element = (0, _jquery2.default)(element).eq(0);

  if (!element.length) return;

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();

  element.addClass(animation).css('transition', 'none');

  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '').addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one((0, _foundationUtil.transitionend)(element), finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

exports.Move = Move;
exports.Motion = Motion;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Nest = undefined;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Nest = {
  Feather: function Feather(menu) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';

    menu.attr('role', 'menubar');

    var items = menu.find('li').attr({ 'role': 'menuitem' }),
        subMenuClass = 'is-' + type + '-submenu',
        subItemClass = subMenuClass + '-item',
        hasSubClass = 'is-' + type + '-submenu-parent',
        applyAria = type !== 'accordion'; // Accordions handle their own ARIA attriutes.

    items.each(function () {
      var $item = (0, _jquery2.default)(this),
          $sub = $item.children('ul');

      if ($sub.length) {
        $item.addClass(hasSubClass);
        $sub.addClass('submenu ' + subMenuClass).attr({ 'data-submenu': '' });
        if (applyAria) {
          $item.attr({
            'aria-haspopup': true,
            'aria-label': $item.children('a:first').text()
          });
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if (type === 'drilldown') {
            $item.attr({ 'aria-expanded': false });
          }
        }
        $sub.addClass('submenu ' + subMenuClass).attr({
          'data-submenu': '',
          'role': 'menu'
        });
        if (type === 'drilldown') {
          $sub.attr({ 'aria-hidden': true });
        }
      }

      if ($item.parent('[data-submenu]').length) {
        $item.addClass('is-submenu-item ' + subItemClass);
      }
    });

    return;
  },
  Burn: function Burn(menu, type) {
    var //items = menu.find('li'),
    subMenuClass = 'is-' + type + '-submenu',
        subItemClass = subMenuClass + '-item',
        hasSubClass = 'is-' + type + '-submenu-parent';

    menu.find('>li, .menu, .menu > li').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');
  }
};

exports.Nest = Nest;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Triggers = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _foundationUtil = require('./foundation.util.motion');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MutationObserver = function () {
  var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
  for (var i = 0; i < prefixes.length; i++) {
    if (prefixes[i] + 'MutationObserver' in window) {
      return window[prefixes[i] + 'MutationObserver'];
    }
  }
  return false;
}();

var triggers = function triggers(el, type) {
  el.data(type).split(' ').forEach(function (id) {
    (0, _jquery2.default)('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
  });
};

var Triggers = {
  Listeners: {
    Basic: {},
    Global: {}
  },
  Initializers: {}
};

Triggers.Listeners.Basic = {
  openListener: function openListener() {
    triggers((0, _jquery2.default)(this), 'open');
  },
  closeListener: function closeListener() {
    var id = (0, _jquery2.default)(this).data('close');
    if (id) {
      triggers((0, _jquery2.default)(this), 'close');
    } else {
      (0, _jquery2.default)(this).trigger('close.zf.trigger');
    }
  },
  toggleListener: function toggleListener() {
    var id = (0, _jquery2.default)(this).data('toggle');
    if (id) {
      triggers((0, _jquery2.default)(this), 'toggle');
    } else {
      (0, _jquery2.default)(this).trigger('toggle.zf.trigger');
    }
  },
  closeableListener: function closeableListener(e) {
    e.stopPropagation();
    var animation = (0, _jquery2.default)(this).data('closable');

    if (animation !== '') {
      _foundationUtil.Motion.animateOut((0, _jquery2.default)(this), animation, function () {
        (0, _jquery2.default)(this).trigger('closed.zf');
      });
    } else {
      (0, _jquery2.default)(this).fadeOut().trigger('closed.zf');
    }
  },
  toggleFocusListener: function toggleFocusListener() {
    var id = (0, _jquery2.default)(this).data('toggle-focus');
    (0, _jquery2.default)('#' + id).triggerHandler('toggle.zf.trigger', [(0, _jquery2.default)(this)]);
  }
};

// Elements with [data-open] will reveal a plugin that supports it when clicked.
Triggers.Initializers.addOpenListener = function ($elem) {
  $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
  $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
};

// Elements with [data-close] will close a plugin that supports it when clicked.
// If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
Triggers.Initializers.addCloseListener = function ($elem) {
  $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
  $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
};

// Elements with [data-toggle] will toggle a plugin that supports it when clicked.
Triggers.Initializers.addToggleListener = function ($elem) {
  $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
  $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
};

// Elements with [data-closable] will respond to close.zf.trigger events.
Triggers.Initializers.addCloseableListener = function ($elem) {
  $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
  $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
};

// Elements with [data-toggle-focus] will respond to coming in and out of focus
Triggers.Initializers.addToggleFocusListener = function ($elem) {
  $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
  $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
};

// More Global/complex listeners and triggers
Triggers.Listeners.Global = {
  resizeListener: function resizeListener($nodes) {
    if (!MutationObserver) {
      //fallback for IE 9
      $nodes.each(function () {
        (0, _jquery2.default)(this).triggerHandler('resizeme.zf.trigger');
      });
    }
    //trigger all listening elements and signal a resize event
    $nodes.attr('data-events', "resize");
  },
  scrollListener: function scrollListener($nodes) {
    if (!MutationObserver) {
      //fallback for IE 9
      $nodes.each(function () {
        (0, _jquery2.default)(this).triggerHandler('scrollme.zf.trigger');
      });
    }
    //trigger all listening elements and signal a scroll event
    $nodes.attr('data-events', "scroll");
  },
  closeMeListener: function closeMeListener(e, pluginId) {
    var plugin = e.namespace.split('.')[0];
    var plugins = (0, _jquery2.default)('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

    plugins.each(function () {
      var _this = (0, _jquery2.default)(this);
      _this.triggerHandler('close.zf.trigger', [_this]);
    });
  }

  // Global, parses whole document.
};Triggers.Initializers.addClosemeListener = function (pluginName) {
  var yetiBoxes = (0, _jquery2.default)('[data-yeti-box]'),
      plugNames = ['dropdown', 'tooltip', 'reveal'];

  if (pluginName) {
    if (typeof pluginName === 'string') {
      plugNames.push(pluginName);
    } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
      plugNames.concat(pluginName);
    } else {
      console.error('Plugin names must be strings');
    }
  }
  if (yetiBoxes.length) {
    var listeners = plugNames.map(function (name) {
      return 'closeme.zf.' + name;
    }).join(' ');

    (0, _jquery2.default)(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
  }
};

function debounceGlobalListener(debounce, trigger, listener) {
  var timer = void 0,
      args = Array.prototype.slice.call(arguments, 3);
  (0, _jquery2.default)(window).off(trigger).on(trigger, function (e) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      listener.apply(null, args);
    }, debounce || 10); //default time to emit scroll event
  });
}

Triggers.Initializers.addResizeListener = function (debounce) {
  var $nodes = (0, _jquery2.default)('[data-resize]');
  if ($nodes.length) {
    debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
  }
};

Triggers.Initializers.addScrollListener = function (debounce) {
  var $nodes = (0, _jquery2.default)('[data-scroll]');
  if ($nodes.length) {
    debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
  }
};

Triggers.Initializers.addMutationEventsListener = function ($elem) {
  if (!MutationObserver) {
    return false;
  }
  var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]');

  //element callback
  var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
    var $target = (0, _jquery2.default)(mutationRecordsList[0].target);

    //trigger the event handler for the element depending on type
    switch (mutationRecordsList[0].type) {
      case "attributes":
        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
        }
        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
        }
        if (mutationRecordsList[0].attributeName === "style") {
          $target.closest("[data-mutate]").attr("data-events", "mutate");
          $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
        }
        break;

      case "childList":
        $target.closest("[data-mutate]").attr("data-events", "mutate");
        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
        break;

      default:
        return false;
      //nothing
    }
  };

  if ($nodes.length) {
    //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
    for (var i = 0; i <= $nodes.length - 1; i++) {
      var elementObserver = new MutationObserver(listeningElementsMutation);
      elementObserver.observe($nodes[i], { attributes: true, childList: true, characterData: false, subtree: true, attributeFilter: ["data-events", "style"] });
    }
  }
};

Triggers.Initializers.addSimpleListeners = function () {
  var $document = (0, _jquery2.default)(document);

  Triggers.Initializers.addOpenListener($document);
  Triggers.Initializers.addCloseListener($document);
  Triggers.Initializers.addToggleListener($document);
  Triggers.Initializers.addCloseableListener($document);
  Triggers.Initializers.addToggleFocusListener($document);
};

Triggers.Initializers.addGlobalListeners = function () {
  var $document = (0, _jquery2.default)(document);
  Triggers.Initializers.addMutationEventsListener($document);
  Triggers.Initializers.addResizeListener();
  Triggers.Initializers.addScrollListener();
  Triggers.Initializers.addClosemeListener();
};

Triggers.init = function ($, Foundation) {
  if (typeof $.triggersInitialized === 'undefined') {
    var $document = $(document);

    if (document.readyState === "complete") {
      Triggers.Initializers.addSimpleListeners();
      Triggers.Initializers.addGlobalListeners();
    } else {
      $(window).on('load', function () {
        Triggers.Initializers.addSimpleListeners();
        Triggers.Initializers.addGlobalListeners();
      });
    }

    $.triggersInitialized = true;
  }

  if (Foundation) {
    Foundation.Triggers = Triggers;
    // Legacy included to be backwards compatible for now.
    Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
  }
};

exports.Triggers = Triggers;
'use strict';

/**
 * File hero-carousel.js
 *
 * Create a carousel if we have more than one hero slide.
 */
window.wdsHeroCarousel = {};
(function (window, $, app) {

	// Constructor.
	app.init = function () {
		app.cache();

		if (app.meetsRequirements()) {
			app.bindEvents();
		}
	};

	// Cache all the things.
	app.cache = function () {
		app.$c = {
			window: $(window),
			heroCarousel: $('.carousel')
		};
	};

	// Combine all events.
	app.bindEvents = function () {
		app.$c.window.on('load', app.doSlick);
		app.$c.window.on('load', app.doFirstAnimation);
	};

	// Do we meet the requirements?
	app.meetsRequirements = function () {
		return app.$c.heroCarousel.length;
	};

	// Animate the first slide on window load.
	app.doFirstAnimation = function () {

		// Get the first slide content area and animation attribute.
		var firstSlide = app.$c.heroCarousel.find('[data-slick-index=0]'),
		    firstSlideContent = firstSlide.find('.hero-content'),
		    firstAnimation = firstSlideContent.attr('data-animation');

		// Add the animation class to the first slide.
		firstSlideContent.addClass(firstAnimation);
	};

	// Animate the slide content.
	app.doAnimation = function (event, slick) {

		var slides = $('.slide'),
		    activeSlide = $('.slick-current'),
		    activeContent = activeSlide.find('.hero-content'),


		// This is a string like so: 'animated someCssClass'.
		animationClass = activeContent.attr('data-animation'),
		    splitAnimation = animationClass.split(' '),


		// This is the 'animated' class.
		animationTrigger = splitAnimation[0],


		// This is the animate.css class.
		animateCss = splitAnimation[1];

		// Go through each slide to see if we've already set animation classes.
		slides.each(function (index, element) {

			var slideContent = $(this).find('.hero-content');

			// If we've set animation classes on a slide, remove them.
			if (slideContent.hasClass('animated')) {

				// Get the last class, which is the animate.css class.
				var lastClass = slideContent.attr('class').split(' ').pop();

				// Remove both animation classes.
				slideContent.removeClass(lastClass).removeClass(animationTrigger);
			}
		});

		// Add animation classes after slide is in view.
		activeContent.addClass(animationClass);
	};

	// Allow background videos to autoplay.
	app.playBackgroundVideos = function () {

		// Get all the videos in our slides object.
		$('video').each(function () {

			// Let them autoplay. TODO: Possibly change this later to only play the visible slide video.
			this.play();
		});
	};

	// Kick off Slick.
	app.doSlick = function () {

		app.$c.heroCarousel.on('init', app.playBackgroundVideos);

		app.$c.heroCarousel.slick({
			autoplay: true,
			autoplaySpeed: 5000,
			arrows: false,
			dots: false,
			focusOnSelect: true,
			waitForAnimate: true
		});

		app.$c.heroCarousel.on('afterChange', app.doAnimation);
	};

	// Engage!
	$(app.init);
})(window, jQuery, window.wdsHeroCarousel);
'use strict';

/**
 * File js-enabled.js
 *
 * If Javascript is enabled, replace the <body> class "no-js".
 */
document.body.className = document.body.className.replace('no-js', 'js');
'use strict';

/**
 * File skip-link-focus-fix.js.
 *
 * Helps with accessibility for keyboard only users.
 *
 * Learn more: https://git.io/vWdr2
 */
(function () {
	var isWebkit = -1 < navigator.userAgent.toLowerCase().indexOf('webkit'),
	    isOpera = -1 < navigator.userAgent.toLowerCase().indexOf('opera'),
	    isIe = -1 < navigator.userAgent.toLowerCase().indexOf('msie');

	if ((isWebkit || isOpera || isIe) && document.getElementById && window.addEventListener) {
		window.addEventListener('hashchange', function () {
			var id = location.hash.substring(1),
			    element;

			if (!/^[A-z0-9_-]+$/.test(id)) {
				return;
			}

			element = document.getElementById(id);

			if (element) {
				if (!/^(?:a|select|input|button|textarea)$/i.test(element.tagName)) {
					element.tabIndex = -1;
				}

				element.focus();
			}
		}, false);
	}
})();
"use strict";

/**
 * File: foundation-init.js
 *
 * We must simply initialize Foundation for Foundation JS to do its thing.
 */
jQuery(document).foundation();
'use strict';

/**
 * File window-ready.js
 *
 * Add a "ready" class to <body> when window is ready.
 */
window.wdsWindowReady = {};
(function (window, $, app) {

	// Constructor.
	app.init = function () {
		app.cache();
		app.bindEvents();
	};

	// Cache document elements.
	app.cache = function () {
		app.$c = {
			'window': $(window),
			'body': $(document.body)
		};
	};

	// Combine all events.
	app.bindEvents = function () {
		app.$c.window.load(app.addBodyClass);
	};

	// Add a class to <body>.
	app.addBodyClass = function () {
		app.$c.body.addClass('ready');
	};

	// Engage!
	$(app.init);
})(window, jQuery, window.wdsWindowReady);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5LmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bk1lbnUuanMiLCJmb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1vdGlvbi5qcyIsImZvdW5kYXRpb24udXRpbC5uZXN0LmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwiaGVyby1jYXJvdXNlbC5qcyIsImpzLWVuYWJsZWQuanMiLCJza2lwLWxpbmstZm9jdXMtZml4LmpzIiwid2RzLWZvdW5kYXRpb24uanMiLCJ3aW5kb3ctcmVhZHkuanMiXSwibmFtZXMiOlsiRk9VTkRBVElPTl9WRVJTSU9OIiwiRm91bmRhdGlvbiIsInZlcnNpb24iLCJfcGx1Z2lucyIsIl91dWlkcyIsInBsdWdpbiIsIm5hbWUiLCJjbGFzc05hbWUiLCJmdW5jdGlvbk5hbWUiLCJhdHRyTmFtZSIsImh5cGhlbmF0ZSIsInJlZ2lzdGVyUGx1Z2luIiwicGx1Z2luTmFtZSIsImNvbnN0cnVjdG9yIiwidG9Mb3dlckNhc2UiLCJ1dWlkIiwiJGVsZW1lbnQiLCJhdHRyIiwiZGF0YSIsInRyaWdnZXIiLCJwdXNoIiwidW5yZWdpc3RlclBsdWdpbiIsInNwbGljZSIsImluZGV4T2YiLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsInR5cGUiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicmVmbG93IiwiZWxlbSIsImkiLCIkZWxlbSIsImZpbmQiLCJhZGRCYWNrIiwiJGVsIiwib3B0cyIsIndhcm4iLCJ0aGluZyIsInNwbGl0IiwiZSIsIm9wdCIsIm1hcCIsImVsIiwidHJpbSIsInBhcnNlVmFsdWUiLCJlciIsImdldEZuTmFtZSIsImFkZFRvSnF1ZXJ5IiwiJCIsIm1ldGhvZCIsIiRub0pTIiwibGVuZ3RoIiwicmVtb3ZlQ2xhc3MiLCJhcmdzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJhcmd1bWVudHMiLCJwbHVnQ2xhc3MiLCJ1bmRlZmluZWQiLCJhcHBseSIsIlJlZmVyZW5jZUVycm9yIiwiVHlwZUVycm9yIiwiZm4iLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJ0aW1lciIsImNvbnRleHQiLCJzZXRUaW1lb3V0Iiwid2luZG93IiwiRGF0ZSIsIm5vdyIsImdldFRpbWUiLCJ2ZW5kb3JzIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwidnAiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJsYXN0VGltZSIsImNhbGxiYWNrIiwibmV4dFRpbWUiLCJNYXRoIiwibWF4IiwiY2xlYXJUaW1lb3V0IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInRvU3RyaW5nIiwic3RyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwicmVwbGFjZSIsImRlZmF1bHRRdWVyaWVzIiwibGFuZHNjYXBlIiwicG9ydHJhaXQiLCJyZXRpbmEiLCJtYXRjaE1lZGlhIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic3R5bGUiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJzY3JpcHQiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImluZm8iLCJpZCIsInBhcmVudE5vZGUiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsIndpZHRoIiwibWF0Y2hlcyIsIk1lZGlhUXVlcnkiLCJxdWVyaWVzIiwiY3VycmVudCIsInNlbGYiLCIkbWV0YSIsImFwcGVuZFRvIiwiaGVhZCIsImV4dHJhY3RlZFN0eWxlcyIsImNzcyIsIm5hbWVkUXVlcmllcyIsInBhcnNlU3R5bGVUb09iamVjdCIsImtleSIsImhhc093blByb3BlcnR5IiwidmFsdWUiLCJfZ2V0Q3VycmVudFNpemUiLCJfd2F0Y2hlciIsImF0TGVhc3QiLCJzaXplIiwicXVlcnkiLCJnZXQiLCJpcyIsIm1hdGNoZWQiLCJvZmYiLCJvbiIsIm5ld1NpemUiLCJjdXJyZW50U2l6ZSIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJBY2NvcmRpb25NZW51IiwiZWxlbWVudCIsIm9wdGlvbnMiLCJleHRlbmQiLCJkZWZhdWx0cyIsInJlZ2lzdGVyIiwiRmVhdGhlciIsIm5vdCIsInNsaWRlVXAiLCJtdWx0aU9wZW4iLCIkbWVudUxpbmtzIiwibGlua0lkIiwiJHN1YiIsImNoaWxkcmVuIiwic3ViSWQiLCJpc0FjdGl2ZSIsImhhc0NsYXNzIiwic3VibWVudVRvZ2dsZSIsImFkZENsYXNzIiwiYWZ0ZXIiLCJzdWJtZW51VG9nZ2xlVGV4dCIsImluaXRQYW5lcyIsImRvd24iLCJfZXZlbnRzIiwiJHN1Ym1lbnUiLCJ0b2dnbGUiLCJwcmV2ZW50RGVmYXVsdCIsIiRlbGVtZW50cyIsInBhcmVudCIsIiRwcmV2RWxlbWVudCIsIiRuZXh0RWxlbWVudCIsIiR0YXJnZXQiLCJlcSIsImZpcnN0IiwibWluIiwicGFyZW50cyIsIm5leHQiLCJoYW5kbGVLZXkiLCJvcGVuIiwiZm9jdXMiLCJjbG9zZSIsInVwIiwiY2xvc2VBbGwiLCJoaWRlQWxsIiwiaGFuZGxlZCIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsInBhcmVudHNVbnRpbCIsImFkZCIsInByZXYiLCJzbGlkZURvd24iLCJzbGlkZVNwZWVkIiwiJG1lbnVzIiwicmVtb3ZlIiwiQnVybiIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCIkbWVudUl0ZW1zIiwiJHRhYnMiLCJ2ZXJ0aWNhbENsYXNzIiwiYWxpZ25tZW50IiwicmlnaHRDbGFzcyIsImNoYW5nZWQiLCJoYXNUb3VjaCIsIm9udG91Y2hzdGFydCIsInBhckNsYXNzIiwiaGFuZGxlQ2xpY2tGbiIsInRhcmdldCIsImhhc1N1YiIsImhhc0NsaWNrZWQiLCJjbG9zZU9uQ2xpY2siLCJjbGlja09wZW4iLCJmb3JjZUZvbGxvdyIsIl9oaWRlIiwiX3Nob3ciLCJjbG9zZU9uQ2xpY2tJbnNpZGUiLCJkaXNhYmxlSG92ZXIiLCJob3ZlckRlbGF5IiwiYXV0b2Nsb3NlIiwiY2xvc2luZ1RpbWUiLCJpc1RhYiIsImluZGV4Iiwic2libGluZ3MiLCJuZXh0U2libGluZyIsInByZXZTaWJsaW5nIiwib3BlblN1YiIsImNsb3NlU3ViIiwiZnVuY3Rpb25zIiwiX2lzVmVydGljYWwiLCJfaXNSdGwiLCJwcmV2aW91cyIsIiRib2R5IiwiYm9keSIsIiRsaW5rIiwiaWR4IiwiZmlsdGVyIiwiJHNpYnMiLCJjbGVhciIsIkltTm90VG91Y2hpbmdZb3UiLCJvbGRDbGFzcyIsIiRwYXJlbnRMaSIsIl9hZGRCb2R5SGFuZGxlciIsIiR0b0Nsb3NlIiwic29tZXRoaW5nVG9DbG9zZSIsIk9mZkNhbnZhcyIsImNvbnRlbnRDbGFzc2VzIiwiYmFzZSIsInJldmVhbCIsIiRsYXN0VHJpZ2dlciIsIiR0cmlnZ2VycyIsInBvc2l0aW9uIiwiJGNvbnRlbnQiLCJuZXN0ZWQiLCJpbml0IiwiY29udGVudElkIiwiY2xvc2VzdCIsInRyYW5zaXRpb24iLCJtYXRjaCIsImNvbnRlbnRPdmVybGF5Iiwib3ZlcmxheSIsIm92ZXJsYXlQb3NpdGlvbiIsInNldEF0dHJpYnV0ZSIsIiRvdmVybGF5IiwiaW5zZXJ0QWZ0ZXIiLCJhcHBlbmQiLCJpc1JldmVhbGVkIiwiUmVnRXhwIiwicmV2ZWFsQ2xhc3MiLCJyZXZlYWxPbiIsIl9zZXRNUUNoZWNrZXIiLCJ0cmFuc2l0aW9uVGltZSIsIl9yZW1vdmVDb250ZW50Q2xhc3NlcyIsIl9oYW5kbGVLZXlib2FyZCIsIm9uZSIsImhhc1JldmVhbCIsImpvaW4iLCJfYWRkQ29udGVudENsYXNzZXMiLCJldmVudCIsInNjcm9sbEhlaWdodCIsImNsaWVudEhlaWdodCIsInNjcm9sbFRvcCIsImFsbG93VXAiLCJhbGxvd0Rvd24iLCJsYXN0WSIsIm9yaWdpbmFsRXZlbnQiLCJwYWdlWSIsInN0b3BQcm9wYWdhdGlvbiIsImZvcmNlVG8iLCJzY3JvbGxUbyIsImNvbnRlbnRTY3JvbGwiLCJfc3RvcFNjcm9sbGluZyIsIl9yZWNvcmRTY3JvbGxhYmxlIiwiX3N0b3BTY3JvbGxQcm9wYWdhdGlvbiIsImF1dG9Gb2N1cyIsImNhbnZhc0ZvY3VzIiwidHJhcEZvY3VzIiwiY2IiLCJyZWxlYXNlRm9jdXMiLCJNZW51UGx1Z2lucyIsImRyb3Bkb3duIiwiY3NzQ2xhc3MiLCJkcmlsbGRvd24iLCJhY2NvcmRpb24iLCJSZXNwb25zaXZlTWVudSIsInJ1bGVzIiwiY3VycmVudE1xIiwiY3VycmVudFBsdWdpbiIsInJ1bGVzVHJlZSIsInJ1bGUiLCJydWxlU2l6ZSIsInJ1bGVQbHVnaW4iLCJpc0VtcHR5T2JqZWN0IiwiX2NoZWNrTWVkaWFRdWVyaWVzIiwibWF0Y2hlZE1xIiwiZGVzdHJveSIsIlJlc3BvbnNpdmVUb2dnbGUiLCJ0YXJnZXRJRCIsIiR0YXJnZXRNZW51IiwiJHRvZ2dsZXIiLCJhbmltYXRlIiwiaW5wdXQiLCJhbmltYXRpb25JbiIsImFuaW1hdGlvbk91dCIsIl91cGRhdGUiLCJfdXBkYXRlTXFIYW5kbGVyIiwidG9nZ2xlTWVudSIsImhpZGVGb3IiLCJzaG93IiwiaGlkZSIsImFuaW1hdGVJbiIsInRyaWdnZXJIYW5kbGVyIiwiYW5pbWF0ZU91dCIsIkJveCIsIk92ZXJsYXBBcmVhIiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJHZXRFeHBsaWNpdE9mZnNldHMiLCJsck9ubHkiLCJ0Yk9ubHkiLCJpZ25vcmVCb3R0b20iLCJlbGVEaW1zIiwidG9wT3ZlciIsImJvdHRvbU92ZXIiLCJsZWZ0T3ZlciIsInJpZ2h0T3ZlciIsInBhckRpbXMiLCJoZWlnaHQiLCJvZmZzZXQiLCJ0b3AiLCJsZWZ0Iiwid2luZG93RGltcyIsInNxcnQiLCJFcnJvciIsInJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJwYXJSZWN0Iiwid2luUmVjdCIsIndpblkiLCJwYWdlWU9mZnNldCIsIndpblgiLCJwYWdlWE9mZnNldCIsInBhcmVudERpbXMiLCJhbmNob3IiLCJ2T2Zmc2V0IiwiaE9mZnNldCIsImlzT3ZlcmZsb3ciLCJsb2ciLCIkZWxlRGltcyIsIiRhbmNob3JEaW1zIiwidG9wVmFsIiwibGVmdFZhbCIsImtleUNvZGVzIiwiY29tbWFuZHMiLCJmaW5kRm9jdXNhYmxlIiwicGFyc2VLZXkiLCJ3aGljaCIsImtleUNvZGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsIktleWJvYXJkIiwiZ2V0S2V5Q29kZXMiLCJjb21wb25lbnQiLCJjb21tYW5kTGlzdCIsImNtZHMiLCJjb21tYW5kIiwibHRyIiwicnRsIiwicmV0dXJuVmFsdWUiLCJ1bmhhbmRsZWQiLCJjb21wb25lbnROYW1lIiwiJGZvY3VzYWJsZSIsIiRmaXJzdEZvY3VzYWJsZSIsIiRsYXN0Rm9jdXNhYmxlIiwia2NzIiwiayIsImtjIiwiaW5pdENsYXNzZXMiLCJhY3RpdmVDbGFzc2VzIiwiTW90aW9uIiwiYW5pbWF0aW9uIiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiaW5pdENsYXNzIiwiYWN0aXZlQ2xhc3MiLCJyZXNldCIsIm9mZnNldFdpZHRoIiwiZmluaXNoIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIm1lbnUiLCJpdGVtcyIsInN1Yk1lbnVDbGFzcyIsInN1Ykl0ZW1DbGFzcyIsImhhc1N1YkNsYXNzIiwiYXBwbHlBcmlhIiwiJGl0ZW0iLCJNdXRhdGlvbk9ic2VydmVyIiwicHJlZml4ZXMiLCJ0cmlnZ2VycyIsIlRyaWdnZXJzIiwiTGlzdGVuZXJzIiwiQmFzaWMiLCJHbG9iYWwiLCJJbml0aWFsaXplcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZUxpc3RlbmVyIiwidG9nZ2xlTGlzdGVuZXIiLCJjbG9zZWFibGVMaXN0ZW5lciIsImZhZGVPdXQiLCJ0b2dnbGVGb2N1c0xpc3RlbmVyIiwiYWRkT3Blbkxpc3RlbmVyIiwiYWRkQ2xvc2VMaXN0ZW5lciIsImFkZFRvZ2dsZUxpc3RlbmVyIiwiYWRkQ2xvc2VhYmxlTGlzdGVuZXIiLCJhZGRUb2dnbGVGb2N1c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCIkbm9kZXMiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlTWVMaXN0ZW5lciIsInBsdWdpbklkIiwibmFtZXNwYWNlIiwiYWRkQ2xvc2VtZUxpc3RlbmVyIiwieWV0aUJveGVzIiwicGx1Z05hbWVzIiwibGlzdGVuZXJzIiwiZGVib3VuY2VHbG9iYWxMaXN0ZW5lciIsImRlYm91bmNlIiwibGlzdGVuZXIiLCJhZGRSZXNpemVMaXN0ZW5lciIsImFkZFNjcm9sbExpc3RlbmVyIiwiYWRkTXV0YXRpb25FdmVudHNMaXN0ZW5lciIsImxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24iLCJtdXRhdGlvblJlY29yZHNMaXN0IiwiYXR0cmlidXRlTmFtZSIsImVsZW1lbnRPYnNlcnZlciIsIm9ic2VydmUiLCJhdHRyaWJ1dGVzIiwiY2hpbGRMaXN0IiwiY2hhcmFjdGVyRGF0YSIsInN1YnRyZWUiLCJhdHRyaWJ1dGVGaWx0ZXIiLCJhZGRTaW1wbGVMaXN0ZW5lcnMiLCIkZG9jdW1lbnQiLCJhZGRHbG9iYWxMaXN0ZW5lcnMiLCJ0cmlnZ2Vyc0luaXRpYWxpemVkIiwicmVhZHlTdGF0ZSIsIklIZWFyWW91Iiwid2RzSGVyb0Nhcm91c2VsIiwiYXBwIiwiY2FjaGUiLCJtZWV0c1JlcXVpcmVtZW50cyIsImJpbmRFdmVudHMiLCIkYyIsImhlcm9DYXJvdXNlbCIsImRvU2xpY2siLCJkb0ZpcnN0QW5pbWF0aW9uIiwiZmlyc3RTbGlkZSIsImZpcnN0U2xpZGVDb250ZW50IiwiZmlyc3RBbmltYXRpb24iLCJkb0FuaW1hdGlvbiIsInNsaWNrIiwic2xpZGVzIiwiYWN0aXZlU2xpZGUiLCJhY3RpdmVDb250ZW50IiwiYW5pbWF0aW9uQ2xhc3MiLCJzcGxpdEFuaW1hdGlvbiIsImFuaW1hdGlvblRyaWdnZXIiLCJhbmltYXRlQ3NzIiwic2xpZGVDb250ZW50IiwibGFzdENsYXNzIiwicG9wIiwicGxheUJhY2tncm91bmRWaWRlb3MiLCJwbGF5IiwiYXV0b3BsYXkiLCJhdXRvcGxheVNwZWVkIiwiYXJyb3dzIiwiZG90cyIsImZvY3VzT25TZWxlY3QiLCJ3YWl0Rm9yQW5pbWF0ZSIsImpRdWVyeSIsImlzV2Via2l0IiwiaXNPcGVyYSIsImlzSWUiLCJnZXRFbGVtZW50QnlJZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJsb2NhdGlvbiIsImhhc2giLCJzdWJzdHJpbmciLCJ0YWdOYW1lIiwidGFiSW5kZXgiLCJ3ZHNXaW5kb3dSZWFkeSIsImxvYWQiLCJhZGRCb2R5Q2xhc3MiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUFFQTs7OztBQUNBOztBQUNBOzs7O0FBRUEsSUFBSUEscUJBQXFCLE9BQXpCOztBQUVBO0FBQ0E7QUFDQSxJQUFJQyxhQUFhO0FBQ2ZDLFdBQVNGLGtCQURNOztBQUdmOzs7QUFHQUcsWUFBVSxFQU5LOztBQVFmOzs7QUFHQUMsVUFBUSxFQVhPOztBQWFmOzs7O0FBSUFDLFVBQVEsZ0JBQVNBLE9BQVQsRUFBaUJDLElB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QUE2RTtBQUM1RXZYLGFBQVF3WCxRQUFSLEdBQW1CLENBQUMsQ0FBcEI7QUFDQTs7QUFFRHhYLFlBQVFzQyxLQUFSO0FBQ0E7QUFDRCxHQWpCRCxFQWlCRyxLQWpCSDtBQWtCQTtBQUNELENBekJDLEdBQUY7OztBQ1BBOzs7OztBQUtBd1UsT0FBUWxhLFFBQVIsRUFBbUI3RixVQUFuQjs7O0FDTEE7Ozs7O0FBS0FrRCxPQUFPd2QsY0FBUCxHQUF3QixFQUF4QjtBQUNFLFdBQVV4ZCxNQUFWLEVBQWtCeEIsQ0FBbEIsRUFBcUJzYyxHQUFyQixFQUEyQjs7QUFFNUI7QUFDQUEsS0FBSWhPLElBQUosR0FBVyxZQUFXO0FBQ3JCZ08sTUFBSUMsS0FBSjtBQUNBRCxNQUFJRyxVQUFKO0FBQ0EsRUFIRDs7QUFLQTtBQUNBSCxLQUFJQyxLQUFKLEdBQVksWUFBVztBQUN0QkQsTUFBSUksRUFBSixHQUFTO0FBQ1IsYUFBVTFjLEVBQUd3QixNQUFILENBREY7QUFFUixXQUFReEIsRUFBR21FLFNBQVM4SSxJQUFaO0FBRkEsR0FBVDtBQUlBLEVBTEQ7O0FBT0E7QUFDQXFQLEtBQUlHLFVBQUosR0FBaUIsWUFBVztBQUMzQkgsTUFBSUksRUFBSixDQUFPbGIsTUFBUCxDQUFjeWQsSUFBZCxDQUFvQjNDLElBQUk0QyxZQUF4QjtBQUNBLEVBRkQ7O0FBSUE7QUFDQTVDLEtBQUk0QyxZQUFKLEdBQW1CLFlBQVc7QUFDN0I1QyxNQUFJSSxFQUFKLENBQU96UCxJQUFQLENBQVl6RSxRQUFaLENBQXNCLE9BQXRCO0FBQ0EsRUFGRDs7QUFJQTtBQUNBeEksR0FBR3NjLElBQUloTyxJQUFQO0FBQ0EsQ0E1QkMsRUE0QkM5TSxNQTVCRCxFQTRCUzZjLE1BNUJULEVBNEJpQjdjLE9BQU93ZCxjQTVCeEIsQ0FBRiIsImZpbGUiOiJwcm9qZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5pbXBvcnQgeyBHZXRZb0RpZ2l0cyB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLmNvcmUnO1xuaW1wb3J0IHsgTWVkaWFRdWVyeSB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnknO1xuXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuNC4zJztcblxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XG52YXIgRm91bmRhdGlvbiA9IHtcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cbiAgICovXG4gIF9wbHVnaW5zOiB7fSxcblxuICAvKipcbiAgICogU3RvcmVzIGdlbmVyYXRlZCB1bmlxdWUgaWRzIGZvciBwbHVnaW4gaW5zdGFuY2VzXG4gICAqL1xuICBfdXVpZHM6IFtdLFxuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSBHZXRZb0RpZ2l0cyg2LCBwbHVnaW5OYW1lKTtcblxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkpeyBwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCwgcGx1Z2luLnV1aWQpOyB9XG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpKXsgcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJywgcGx1Z2luKTsgfVxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgaW5pdGlhbGl6ZWQuXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNpbml0XG4gICAgICAgICAgICovXG4gICAgcGx1Z2luLiRlbGVtZW50LnRyaWdnZXIoYGluaXQuemYuJHtwbHVnaW5OYW1lfWApO1xuXG4gICAgdGhpcy5fdXVpZHMucHVzaChwbHVnaW4udXVpZCk7XG5cbiAgICByZXR1cm47XG4gIH0sXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogUmVtb3ZlcyB0aGUgcGx1Z2lucyB1dWlkIGZyb20gdGhlIF91dWlkcyBhcnJheS5cbiAgICogUmVtb3ZlcyB0aGUgemZQbHVnaW4gZGF0YSBhdHRyaWJ1dGUsIGFzIHdlbGwgYXMgdGhlIGRhdGEtcGx1Z2luLW5hbWUgYXR0cmlidXRlLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBkZXN0cm95ZWQgZXZlbnQgZm9yIHRoZSBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBmaXJlcyBQbHVnaW4jZGVzdHJveWVkXG4gICAqL1xuICB1bnJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4pe1xuICAgIHZhciBwbHVnaW5OYW1lID0gaHlwaGVuYXRlKGZ1bmN0aW9uTmFtZShwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKS5jb25zdHJ1Y3RvcikpO1xuXG4gICAgdGhpcy5fdXVpZHMuc3BsaWNlKHRoaXMuX3V1aWRzLmluZGV4T2YocGx1Z2luLnV1aWQpLCAxKTtcbiAgICBwbHVnaW4uJGVsZW1lbnQucmVtb3ZlQXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkucmVtb3ZlRGF0YSgnemZQbHVnaW4nKVxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgYmVlbiBkZXN0cm95ZWQuXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNkZXN0cm95ZWRcbiAgICAgICAgICAgKi9cbiAgICAgICAgICAudHJpZ2dlcihgZGVzdHJveWVkLnpmLiR7cGx1Z2luTmFtZX1gKTtcbiAgICBmb3IodmFyIHByb3AgaW4gcGx1Z2luKXtcbiAgICAgIHBsdWdpbltwcm9wXSA9IG51bGw7Ly9jbGVhbiB1cCBzY3JpcHQgdG8gcHJlcCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgIH1cbiAgICByZXR1cm47XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBDYXVzZXMgb25lIG9yIG1vcmUgYWN0aXZlIHBsdWdpbnMgdG8gcmUtaW5pdGlhbGl6ZSwgcmVzZXR0aW5nIGV2ZW50IGxpc3RlbmVycywgcmVjYWxjdWxhdGluZyBwb3NpdGlvbnMsIGV0Yy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBsdWdpbnMgLSBvcHRpb25hbCBzdHJpbmcgb2YgYW4gaW5kaXZpZHVhbCBwbHVnaW4ga2V5LCBhdHRhaW5lZCBieSBjYWxsaW5nIGAkKGVsZW1lbnQpLmRhdGEoJ3BsdWdpbk5hbWUnKWAsIG9yIHN0cmluZyBvZiBhIHBsdWdpbiBjbGFzcyBpLmUuIGAnZHJvcGRvd24nYFxuICAgKiBAZGVmYXVsdCBJZiBubyBhcmd1bWVudCBpcyBwYXNzZWQsIHJlZmxvdyBhbGwgY3VycmVudGx5IGFjdGl2ZSBwbHVnaW5zLlxuICAgKi9cbiAgIHJlSW5pdDogZnVuY3Rpb24ocGx1Z2lucyl7XG4gICAgIHZhciBpc0pRID0gcGx1Z2lucyBpbnN0YW5jZW9mICQ7XG4gICAgIHRyeXtcbiAgICAgICBpZihpc0pRKXtcbiAgICAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAkKHRoaXMpLmRhdGEoJ3pmUGx1Z2luJykuX2luaXQoKTtcbiAgICAgICAgIH0pO1xuICAgICAgIH1lbHNle1xuICAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgcGx1Z2lucyxcbiAgICAgICAgIF90aGlzID0gdGhpcyxcbiAgICAgICAgIGZucyA9IHtcbiAgICAgICAgICAgJ29iamVjdCc6IGZ1bmN0aW9uKHBsZ3Mpe1xuICAgICAgICAgICAgIHBsZ3MuZm9yRWFjaChmdW5jdGlvbihwKXtcbiAgICAgICAgICAgICAgIHAgPSBoeXBoZW5hdGUocCk7XG4gICAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICdzdHJpbmcnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHBsdWdpbnMgPSBoeXBoZW5hdGUocGx1Z2lucyk7XG4gICAgICAgICAgICAgJCgnW2RhdGEtJysgcGx1Z2lucyArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAndW5kZWZpbmVkJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICB0aGlzWydvYmplY3QnXShPYmplY3Qua2V5cyhfdGhpcy5fcGx1Z2lucykpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9O1xuICAgICAgICAgZm5zW3R5cGVdKHBsdWdpbnMpO1xuICAgICAgIH1cbiAgICAgfWNhdGNoKGVycil7XG4gICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICB9ZmluYWxseXtcbiAgICAgICByZXR1cm4gcGx1Z2lucztcbiAgICAgfVxuICAgfSxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwbHVnaW5zIG9uIGFueSBlbGVtZW50cyB3aXRoaW4gYGVsZW1gIChhbmQgYGVsZW1gIGl0c2VsZikgdGhhdCBhcmVuJ3QgYWxyZWFkeSBpbml0aWFsaXplZC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBqUXVlcnkgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVsZW1lbnQgdG8gY2hlY2sgaW5zaWRlLiBBbHNvIGNoZWNrcyB0aGUgZWxlbWVudCBpdHNlbGYsIHVubGVzcyBpdCdzIHRoZSBgZG9jdW1lbnRgIG9iamVjdC5cbiAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IHBsdWdpbnMgLSBBIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplLiBMZWF2ZSB0aGlzIG91dCB0byBpbml0aWFsaXplIGV2ZXJ5dGhpbmcuXG4gICAqL1xuICByZWZsb3c6IGZ1bmN0aW9uKGVsZW0sIHBsdWdpbnMpIHtcblxuICAgIC8vIElmIHBsdWdpbnMgaXMgdW5kZWZpbmVkLCBqdXN0IGdyYWIgZXZlcnl0aGluZ1xuICAgIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLl9wbHVnaW5zKTtcbiAgICB9XG4gICAgLy8gSWYgcGx1Z2lucyBpcyBhIHN0cmluZywgY29udmVydCBpdCB0byBhbiBhcnJheSB3aXRoIG9uZSBpdGVtXG4gICAgZWxzZSBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwbHVnaW5zID0gW3BsdWdpbnNdO1xuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBwbHVnaW5cbiAgICAkLmVhY2gocGx1Z2lucywgZnVuY3Rpb24oaSwgbmFtZSkge1xuICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IHBsdWdpblxuICAgICAgdmFyIHBsdWdpbiA9IF90aGlzLl9wbHVnaW5zW25hbWVdO1xuXG4gICAgICAvLyBMb2NhbGl6ZSB0aGUgc2VhcmNoIHRvIGFsbCBlbGVtZW50cyBpbnNpZGUgZWxlbSwgYXMgd2VsbCBhcyBlbGVtIGl0c2VsZiwgdW5sZXNzIGVsZW0gPT09IGRvY3VtZW50XG4gICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLmZpbmQoJ1tkYXRhLScrbmFtZSsnXScpLmFkZEJhY2soJ1tkYXRhLScrbmFtZSsnXScpO1xuXG4gICAgICAvLyBGb3IgZWFjaCBwbHVnaW4gZm91bmQsIGluaXRpYWxpemUgaXRcbiAgICAgICRlbGVtLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkZWwgPSAkKHRoaXMpLFxuICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICAvLyBEb24ndCBkb3VibGUtZGlwIG9uIHBsdWdpbnNcbiAgICAgICAgaWYgKCRlbC5kYXRhKCd6ZlBsdWdpbicpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiVHJpZWQgdG8gaW5pdGlhbGl6ZSBcIituYW1lK1wiIG9uIGFuIGVsZW1lbnQgdGhhdCBhbHJlYWR5IGhhcyBhIEZvdW5kYXRpb24gcGx1Z2luLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZigkZWwuYXR0cignZGF0YS1vcHRpb25zJykpe1xuICAgICAgICAgIHZhciB0aGluZyA9ICRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKS5zcGxpdCgnOycpLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XG4gICAgICAgICAgICB2YXIgb3B0ID0gZS5zcGxpdCgnOicpLm1hcChmdW5jdGlvbihlbCl7IHJldHVybiBlbC50cmltKCk7IH0pO1xuICAgICAgICAgICAgaWYob3B0WzBdKSBvcHRzW29wdFswXV0gPSBwYXJzZVZhbHVlKG9wdFsxXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5e1xuICAgICAgICAgICRlbC5kYXRhKCd6ZlBsdWdpbicsIG5ldyBwbHVnaW4oJCh0aGlzKSwgb3B0cykpO1xuICAgICAgICB9Y2F0Y2goZXIpe1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXIpO1xuICAgICAgICB9ZmluYWxseXtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuICBnZXRGbk5hbWU6IGZ1bmN0aW9uTmFtZSxcblxuICBhZGRUb0pxdWVyeTogZnVuY3Rpb24oJCkge1xuICAgIC8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuICAgIC8vIFRPRE86IG5lZWQgd2F5IHRvIHJlZmxvdyB2cy4gcmUtaW5pdGlhbGl6ZVxuICAgIC8qKlxuICAgICAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IG1ldGhvZCAtIEFuIGFjdGlvbiB0byBwZXJmb3JtIG9uIHRoZSBjdXJyZW50IGpRdWVyeSBvYmplY3QuXG4gICAgICovXG4gICAgdmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgIHZhciB0eXBlID0gdHlwZW9mIG1ldGhvZCxcbiAgICAgICAgICAkbm9KUyA9ICQoJy5uby1qcycpO1xuXG4gICAgICBpZigkbm9KUy5sZW5ndGgpe1xuICAgICAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgICAgIH1cblxuICAgICAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxuICAgICAgICBNZWRpYVF1ZXJ5Ll9pbml0KCk7XG4gICAgICAgIEZvdW5kYXRpb24ucmVmbG93KHRoaXMpO1xuICAgICAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpOy8vY29sbGVjdCBhbGwgdGhlIGFyZ3VtZW50cywgaWYgbmVjZXNzYXJ5XG4gICAgICAgIHZhciBwbHVnQ2xhc3MgPSB0aGlzLmRhdGEoJ3pmUGx1Z2luJyk7Ly9kZXRlcm1pbmUgdGhlIGNsYXNzIG9mIHBsdWdpblxuXG4gICAgICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgICAgICBpZih0aGlzLmxlbmd0aCA9PT0gMSl7Ly9pZiB0aGVyZSdzIG9ubHkgb25lLCBjYWxsIGl0IGRpcmVjdGx5LlxuICAgICAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGVsKXsvL290aGVyd2lzZSBsb29wIHRocm91Z2ggdGhlIGpRdWVyeSBjb2xsZWN0aW9uIGFuZCBpbnZva2UgdGhlIG1ldGhvZCBvbiBlYWNoXG4gICAgICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcbiAgICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgICAgIH1cbiAgICAgIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgICQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XG4gICAgcmV0dXJuICQ7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24udXRpbCA9IHtcbiAgLyoqXG4gICAqIEZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGRlYm91bmNlIGVmZmVjdCB0byBhIGZ1bmN0aW9uIGNhbGwuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIC0gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGF0IGVuZCBvZiB0aW1lb3V0LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgLSBUaW1lIGluIG1zIHRvIGRlbGF5IHRoZSBjYWxsIG9mIGBmdW5jYC5cbiAgICogQHJldHVybnMgZnVuY3Rpb25cbiAgICovXG4gIHRocm90dGxlOiBmdW5jdGlvbiAoZnVuYywgZGVsYXkpIHtcbiAgICB2YXIgdGltZXIgPSBudWxsO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgaWYgKHRpbWVyID09PSBudWxsKSB7XG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdyB8fCAhd2luZG93LkRhdGUubm93KVxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxuICAvKipcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXG4gICAqL1xuICBpZighd2luZG93LnBlcmZvcm1hbmNlIHx8ICF3aW5kb3cucGVyZm9ybWFuY2Uubm93KXtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcbiAgICAgIG5vdzogZnVuY3Rpb24oKXsgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0OyB9XG4gICAgfTtcbiAgfVxufSkoKTtcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxuICAgICAgICBmQm91bmQgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxuICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICB9XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcbiAgaWYgKEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0udHJpbSgpIDogXCJcIjtcbiAgfVxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbi5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuZnVuY3Rpb24gcGFyc2VWYWx1ZShzdHIpe1xuICBpZiAoJ3RydWUnID09PSBzdHIpIHJldHVybiB0cnVlO1xuICBlbHNlIGlmICgnZmFsc2UnID09PSBzdHIpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZiAoIWlzTmFOKHN0ciAqIDEpKSByZXR1cm4gcGFyc2VGbG9hdChzdHIpO1xuICByZXR1cm4gc3RyO1xufVxuLy8gQ29udmVydCBQYXNjYWxDYXNlIHRvIGtlYmFiLWNhc2Vcbi8vIFRoYW5rIHlvdTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODk1NTU4MFxuZnVuY3Rpb24gaHlwaGVuYXRlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG59XG5cbmV4cG9ydCB7Rm91bmRhdGlvbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5cbi8vIERlZmF1bHQgc2V0IG9mIG1lZGlhIHF1ZXJpZXNcbmNvbnN0IGRlZmF1bHRRdWVyaWVzID0ge1xuICAnZGVmYXVsdCcgOiAnb25seSBzY3JlZW4nLFxuICBsYW5kc2NhcGUgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKScsXG4gIHBvcnRyYWl0IDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXG4gIHJldGluYSA6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXG4gIH07XG5cblxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2VcbmxldCBtYXRjaE1lZGlhID0gd2luZG93Lm1hdGNoTWVkaWEgfHwgKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBtYXRjaE1lZGl1bSBhcGkgc3VjaCBhcyBJRSA5IGFuZCB3ZWJraXRcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcblxuICAvLyBGb3IgdGhvc2UgdGhhdCBkb24ndCBzdXBwb3J0IG1hdGNoTWVkaXVtXG4gIGlmICghc3R5bGVNZWRpYSkge1xuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICBzY3JpcHQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSxcbiAgICBpbmZvICAgICAgICA9IG51bGw7XG5cbiAgICBzdHlsZS50eXBlICA9ICd0ZXh0L2Nzcyc7XG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xuXG4gICAgc2NyaXB0ICYmIHNjcmlwdC5wYXJlbnROb2RlICYmIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSkoKTtcblxudmFyIE1lZGlhUXVlcnkgPSB7XG4gIHF1ZXJpZXM6IFtdLFxuXG4gIGN1cnJlbnQ6ICcnLFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbWVkaWEgcXVlcnkgaGVscGVyLCBieSBleHRyYWN0aW5nIHRoZSBicmVha3BvaW50IGxpc3QgZnJvbSB0aGUgQ1NTIGFuZCBhY3RpdmF0aW5nIHRoZSBicmVha3BvaW50IHdhdGNoZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciAkbWV0YSA9ICQoJ21ldGEuZm91bmRhdGlvbi1tcScpO1xuICAgIGlmKCEkbWV0YS5sZW5ndGgpe1xuICAgICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gICAgfVxuXG4gICAgdmFyIGV4dHJhY3RlZFN0eWxlcyA9ICQoJy5mb3VuZGF0aW9uLW1xJykuY3NzKCdmb250LWZhbWlseScpO1xuICAgIHZhciBuYW1lZFF1ZXJpZXM7XG5cbiAgICBuYW1lZFF1ZXJpZXMgPSBwYXJzZVN0eWxlVG9PYmplY3QoZXh0cmFjdGVkU3R5bGVzKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBuYW1lZFF1ZXJpZXMpIHtcbiAgICAgIGlmKG5hbWVkUXVlcmllcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHNlbGYucXVlcmllcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgICAgdmFsdWU6IGBvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogJHtuYW1lZFF1ZXJpZXNba2V5XX0pYFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xuXG4gICAgdGhpcy5fd2F0Y2hlcigpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHNjcmVlbiBpcyBhdCBsZWFzdCBhcyB3aWRlIGFzIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0J3Mgc21hbGxlci5cbiAgICovXG4gIGF0TGVhc3Qoc2l6ZSkge1xuICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0KHNpemUpO1xuXG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIG1hdGNoZXMgdG8gYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLCBlaXRoZXIgJ3NtYWxsIG9ubHknIG9yICdzbWFsbCcuIE9taXR0aW5nICdvbmx5JyBmYWxscyBiYWNrIHRvIHVzaW5nIGF0TGVhc3QoKSBtZXRob2QuXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCBkb2VzIG5vdC5cbiAgICovXG4gIGlzKHNpemUpIHtcbiAgICBzaXplID0gc2l6ZS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICBpZihzaXplLmxlbmd0aCA+IDEgJiYgc2l6ZVsxXSA9PT0gJ29ubHknKSB7XG4gICAgICBpZihzaXplWzBdID09PSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuYXRMZWFzdChzaXplWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZWRpYSBxdWVyeSBvZiBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9IC0gVGhlIG1lZGlhIHF1ZXJ5IG9mIHRoZSBicmVha3BvaW50LCBvciBgbnVsbGAgaWYgdGhlIGJyZWFrcG9pbnQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIGdldChzaXplKSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIGlmKHRoaXMucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG4gICAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCBuYW1lIGJ5IHRlc3RpbmcgZXZlcnkgYnJlYWtwb2ludCBhbmQgcmV0dXJuaW5nIHRoZSBsYXN0IG9uZSB0byBtYXRjaCAodGhlIGJpZ2dlc3Qgb25lKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGN1cnJlbnQgYnJlYWtwb2ludC5cbiAgICovXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcbiAgICB2YXIgbWF0Y2hlZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG5cbiAgICAgIGlmIChtYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLm1lZGlhcXVlcnknKS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCksIGN1cnJlbnRTaXplID0gdGhpcy5jdXJyZW50O1xuXG4gICAgICBpZiAobmV3U2l6ZSAhPT0gY3VycmVudFNpemUpIHtcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG5cbiAgICAgICAgLy8gQnJvYWRjYXN0IHRoZSBtZWRpYSBxdWVyeSBjaGFuZ2Ugb24gdGhlIHdpbmRvd1xuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIGN1cnJlbnRTaXplXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cblxuXG4vLyBUaGFuayB5b3U6IGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcXVlcnktc3RyaW5nXG5mdW5jdGlvbiBwYXJzZVN0eWxlVG9PYmplY3Qoc3RyKSB7XG4gIHZhciBzdHlsZU9iamVjdCA9IHt9O1xuXG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0ciA9IHN0ci50cmltKCkuc2xpY2UoMSwgLTEpOyAvLyBicm93c2VycyByZS1xdW90ZSBzdHJpbmcgc3R5bGUgdmFsdWVzXG5cbiAgaWYgKCFzdHIpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHlsZU9iamVjdCA9IHN0ci5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbihyZXQsIHBhcmFtKSB7XG4gICAgdmFyIHBhcnRzID0gcGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykuc3BsaXQoJz0nKTtcbiAgICB2YXIga2V5ID0gcGFydHNbMF07XG4gICAgdmFyIHZhbCA9IHBhcnRzWzFdO1xuICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xuXG4gICAgLy8gbWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcbiAgICAvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG4gICAgdmFsID0gdmFsID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbCk7XG5cbiAgICBpZiAoIXJldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmV0W2tleV0pKSB7XG4gICAgICByZXRba2V5XS5wdXNoKHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFtrZXldID0gW3JldFtrZXldLCB2YWxdO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIHN0eWxlT2JqZWN0O1xufVxuXG5leHBvcnQge01lZGlhUXVlcnl9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5pbXBvcnQgeyBLZXlib2FyZCB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLmtleWJvYXJkJztcbmltcG9ydCB7IE5lc3QgfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC5uZXN0JztcbmltcG9ydCB7IEdldFlvRGlnaXRzIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwuY29yZSc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL2ZvdW5kYXRpb24ucGx1Z2luJztcblxuLyoqXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBBY2NvcmRpb25NZW51IGV4dGVuZHMgUGx1Z2luIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAbmFtZSBBY2NvcmRpb25NZW51XG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgX3NldHVwKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuY2xhc3NOYW1lID0gJ0FjY29yZGlvbk1lbnUnOyAvLyBpZTkgYmFjayBjb21wYXRcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEtleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnXG4gICAgfSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIE5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLm5vdCgnLmlzLWFjdGl2ZScpLnNsaWRlVXAoMCk7Ly8uZmluZCgnYScpLmNzcygncGFkZGluZy1sZWZ0JywgJzFyZW0nKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ3JvbGUnOiAndHJlZScsXG4gICAgICAnYXJpYS1tdWx0aXNlbGVjdGFibGUnOiB0aGlzLm9wdGlvbnMubXVsdGlPcGVuXG4gICAgfSk7XG5cbiAgICB0aGlzLiRtZW51TGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLiRtZW51TGlua3MuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyIGxpbmtJZCA9IHRoaXMuaWQgfHwgR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcbiAgICAgICAgICAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBHZXRZb0RpZ2l0cyg2LCAnYWNjLW1lbnUnKSxcbiAgICAgICAgICBpc0FjdGl2ZSA9ICRzdWIuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG5cbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuc3VibWVudVRvZ2dsZSkge1xuICAgICAgICAkZWxlbS5hZGRDbGFzcygnaGFzLXN1Ym1lbnUtdG9nZ2xlJyk7XG4gICAgICAgICRlbGVtLmNoaWxkcmVuKCdhJykuYWZ0ZXIoJzxidXR0b24gaWQ9XCInICsgbGlua0lkICsgJ1wiIGNsYXNzPVwic3VibWVudS10b2dnbGVcIiBhcmlhLWNvbnRyb2xzPVwiJyArIHN1YklkICsgJ1wiIGFyaWEtZXhwYW5kZWQ9XCInICsgaXNBY3RpdmUgKyAnXCIgdGl0bGU9XCInICsgX3RoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlVGV4dCArICdcIj48c3BhbiBjbGFzcz1cInN1Ym1lbnUtdG9nZ2xlLXRleHRcIj4nICsgX3RoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlVGV4dCArICc8L3NwYW4+PC9idXR0b24+Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkZWxlbS5hdHRyKHtcbiAgICAgICAgICAnYXJpYS1jb250cm9scyc6IHN1YklkLFxuICAgICAgICAgICdhcmlhLWV4cGFuZGVkJzogaXNBY3RpdmUsXG4gICAgICAgICAgJ2lkJzogbGlua0lkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHN1Yi5hdHRyKHtcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxuICAgICAgICAncm9sZSc6ICdncm91cCcsXG4gICAgICAgICdpZCc6IHN1YklkXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpJykuYXR0cih7XG4gICAgICAncm9sZSc6ICd0cmVlaXRlbSdcbiAgICB9KTtcbiAgICB2YXIgaW5pdFBhbmVzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWN0aXZlJyk7XG4gICAgaWYoaW5pdFBhbmVzLmxlbmd0aCl7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaW5pdFBhbmVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgX3RoaXMuZG93bigkKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIG1lbnUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkc3VibWVudSA9ICQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XG5cbiAgICAgIGlmICgkc3VibWVudS5sZW5ndGgpIHtcbiAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlKSB7XG4gICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignLnN1Ym1lbnUtdG9nZ2xlJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jykub24oJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBfdGhpcy50b2dnbGUoJHN1Ym1lbnUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS5jaGlsZHJlbignYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uTWVudScpLm9uKCdjbGljay56Zi5hY2NvcmRpb25NZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkc3VibWVudSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLm9uKCdrZXlkb3duLnpmLmFjY29yZGlvbm1lbnUnLCBmdW5jdGlvbihlKXtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLFxuICAgICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgICAkbmV4dEVsZW1lbnQsXG4gICAgICAgICAgJHRhcmdldCA9ICRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xuXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1heCgwLCBpLTEpKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5taW4oaSsxLCAkZWxlbWVudHMubGVuZ3RoLTEpKS5maW5kKCdhJykuZmlyc3QoKTtcblxuICAgICAgICAgIGlmICgkKHRoaXMpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGhhcyBvcGVuIHN1YiBtZW51XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5maW5kKCdsaTpmaXJzdC1jaGlsZCcpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnOmZpcnN0LWNoaWxkJykpIHsgLy8gaXMgZmlyc3QgZWxlbWVudCBvZiBzdWIgbWVudVxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJHByZXZFbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBpZiBwcmV2aW91cyBlbGVtZW50IGhhcyBvcGVuIHN1YiBtZW51XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkcHJldkVsZW1lbnQucGFyZW50cygnbGknKS5maW5kKCdsaTpsYXN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6bGFzdC1jaGlsZCcpKSB7IC8vIGlzIGxhc3QgZWxlbWVudCBvZiBzdWIgbWVudVxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLm5leHQoJ2xpJykuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb25NZW51Jywge1xuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5pcygnOmhpZGRlbicpKSB7XG4gICAgICAgICAgICBfdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgICAgICAgICAgJHRhcmdldC5maW5kKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5sZW5ndGggJiYgISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkgeyAvLyBjbG9zZSBhY3RpdmUgc3ViIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgX3RoaXMudXAoJHRhcmdldCk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7IC8vIGNsb3NlIGN1cnJlbnRseSBvcGVuIHN1YlxuICAgICAgICAgICAgX3RoaXMudXAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpKTtcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRwcmV2RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBwYW5lcyBvZiB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBoaWRlQWxsKCkge1xuICAgIHRoaXMudXAodGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhbGwgcGFuZXMgb2YgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgc2hvd0FsbCgpIHtcbiAgICB0aGlzLmRvd24odGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlIHN0YXRlIG9mIGEgc3VibWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gdGhlIHN1Ym1lbnUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCl7XG4gICAgaWYoISR0YXJnZXQuaXMoJzphbmltYXRlZCcpKSB7XG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIG9wZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cbiAgICovXG4gIGRvd24oJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbikge1xuICAgICAgdGhpcy51cCh0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5ub3QoJHRhcmdldC5wYXJlbnRzVW50aWwodGhpcy4kZWxlbWVudCkuYWRkKCR0YXJnZXQpKSk7XG4gICAgfVxuXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlKSB7XG4gICAgICAkdGFyZ2V0LnByZXYoJy5zdWJtZW51LXRvZ2dsZScpLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICR0YXJnZXQucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG4gICAgfVxuXG4gICAgJHRhcmdldC5zbGlkZURvd24oX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjZG93blxuICAgICAgICovXG4gICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuIEFsbCBzdWItbWVudXMgaW5zaWRlIHRoZSB0YXJnZXQgd2lsbCBiZSBjbG9zZWQgYXMgd2VsbC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBjbG9zZS5cbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjdXBcbiAgICovXG4gIHVwKCR0YXJnZXQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBkb25lIGNvbGxhcHNpbmcgdXAuXG4gICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSN1cFxuICAgICAgICovXG4gICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cC56Zi5hY2NvcmRpb25NZW51JywgWyR0YXJnZXRdKTtcbiAgICB9KTtcblxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5zdWJtZW51VG9nZ2xlKSB7XG4gICAgICAkbWVudXMucHJldignLnN1Ym1lbnUtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkbWVudXMucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rlc3Ryb3llZFxuICAgKi9cbiAgX2Rlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuc3VibWVudVRvZ2dsZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5maW5kKCcuaGFzLXN1Ym1lbnUtdG9nZ2xlJykucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51LXRvZ2dsZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5maW5kKCcuc3VibWVudS10b2dnbGUnKS5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBOZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2FjY29yZGlvbicpO1xuICB9XG59XG5cbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFkZHMgYSBzZXBhcmF0ZSBzdWJtZW51IHRvZ2dsZSBidXR0b24uIFRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgaXRlbSB0byBoYXZlIGEgbGluay5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBzdWJtZW51VG9nZ2xlOiBmYWxzZSxcbiAgLyoqXG4gICAqIFRoZSB0ZXh0IHVzZWQgZm9yIHRoZSBzdWJtZW51IHRvZ2dsZSBpZiBlbmFibGVkLiBUaGlzIGlzIHVzZWQgZm9yIHNjcmVlbiByZWFkZXJzIG9ubHkuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgc3VibWVudVRvZ2dsZVRleHQ6ICdUb2dnbGUgbWVudScsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgbWVudSB0byBoYXZlIG11bHRpcGxlIG9wZW4gcGFuZXMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIG11bHRpT3BlbjogdHJ1ZVxufTtcblxuZXhwb3J0IHtBY2NvcmRpb25NZW51fTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcbmltcG9ydCB7IEtleWJvYXJkIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQnO1xuaW1wb3J0IHsgTmVzdCB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLm5lc3QnO1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwuYm94JztcbmltcG9ydCB7IHJ0bCBhcyBSdGwgfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC5jb3JlJztcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vZm91bmRhdGlvbi5wbHVnaW4nO1xuXG5cbi8qKlxuICogRHJvcGRvd25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93bi1tZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgRHJvcGRvd25NZW51IGV4dGVuZHMgUGx1Z2luIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRHJvcGRvd25NZW51LlxuICAgKiBAY2xhc3NcbiAgICogQG5hbWUgRHJvcGRvd25NZW51XG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgX3NldHVwKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnRHJvcGRvd25NZW51JzsgLy8gaWU5IGJhY2sgY29tcGF0XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBLZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luLCBhbmQgY2FsbHMgX3ByZXBhcmVNZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xuXG4gICAgdmFyIHN1YnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3MoJ2ZpcnN0LXN1YicpO1xuXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzLmZpbmQoJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudmVydGljYWxDbGFzcyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2F1dG8nKSB7XG4gICAgICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5yaWdodENsYXNzKSB8fCBSdGwoKSB8fCB0aGlzLiRlbGVtZW50LnBhcmVudHMoJy50b3AtYmFyLXJpZ2h0JykuaXMoJyonKSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9ICdyaWdodCc7XG4gICAgICAgICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1sZWZ0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ2xlZnQnO1xuICAgICAgICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLWxlZnQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH07XG5cbiAgX2lzVmVydGljYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHRhYnMuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jaycgfHwgdGhpcy4kZWxlbWVudC5jc3MoJ2ZsZXgtZGlyZWN0aW9uJykgPT09ICdjb2x1bW4nO1xuICB9XG5cbiAgX2lzUnRsKCkge1xuICAgIHJldHVybiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhbGlnbi1yaWdodCcpIHx8IChSdGwoKSAmJiAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWxpZ24tbGVmdCcpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byBlbGVtZW50cyB3aXRoaW4gdGhlIG1lbnVcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIGhhc1RvdWNoID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IHx8ICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCAhPT0gJ3VuZGVmaW5lZCcpLFxuICAgICAgICBwYXJDbGFzcyA9ICdpcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCc7XG5cbiAgICAvLyB1c2VkIGZvciBvbkNsaWNrIGFuZCBpbiB0aGUga2V5Ym9hcmQgaGFuZGxlcnNcbiAgICB2YXIgaGFuZGxlQ2xpY2tGbiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbSA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCBgLiR7cGFyQ2xhc3N9YCksXG4gICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpLFxuICAgICAgICAgIGhhc0NsaWNrZWQgPSAkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyxcbiAgICAgICAgICAkc3ViID0gJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51Jyk7XG5cbiAgICAgIGlmIChoYXNTdWIpIHtcbiAgICAgICAgaWYgKGhhc0NsaWNrZWQpIHtcbiAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrIHx8ICghX3RoaXMub3B0aW9ucy5jbGlja09wZW4gJiYgIWhhc1RvdWNoKSB8fCAoX3RoaXMub3B0aW9ucy5mb3JjZUZvbGxvdyAmJiBoYXNUb3VjaCkpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBfdGhpcy5fc2hvdygkc3ViKTtcbiAgICAgICAgICAkZWxlbS5hZGQoJGVsZW0ucGFyZW50c1VudGlsKF90aGlzLiRlbGVtZW50LCBgLiR7cGFyQ2xhc3N9YCkpLmF0dHIoJ2RhdGEtaXMtY2xpY2snLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3BlbiB8fCBoYXNUb3VjaCkge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdjbGljay56Zi5kcm9wZG93bm1lbnUgdG91Y2hzdGFydC56Zi5kcm9wZG93bm1lbnUnLCBoYW5kbGVDbGlja0ZuKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgTGVhZiBlbGVtZW50IENsaWNrc1xuICAgIGlmKF90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrSW5zaWRlKXtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignY2xpY2suemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xuICAgICAgICBpZighaGFzU3ViKXtcbiAgICAgICAgICBfdGhpcy5faGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG5cbiAgICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICAgIGNsZWFyVGltZW91dCgkZWxlbS5kYXRhKCdfZGVsYXknKSk7XG4gICAgICAgICAgJGVsZW0uZGF0YSgnX2RlbGF5Jywgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpKTtcbiAgICAgICAgfVxuICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xuICAgICAgICBpZiAoaGFzU3ViICYmIF90aGlzLm9wdGlvbnMuYXV0b2Nsb3NlKSB7XG4gICAgICAgICAgaWYgKCRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnICYmIF90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KCRlbGVtLmRhdGEoJ19kZWxheScpKTtcbiAgICAgICAgICAkZWxlbS5kYXRhKCdfZGVsYXknLCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuJG1lbnVJdGVtcy5vbigna2V5ZG93bi56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgJ1tyb2xlPVwibWVudWl0ZW1cIl0nKSxcbiAgICAgICAgICBpc1RhYiA9IF90aGlzLiR0YWJzLmluZGV4KCRlbGVtZW50KSA+IC0xLFxuICAgICAgICAgICRlbGVtZW50cyA9IGlzVGFiID8gX3RoaXMuJHRhYnMgOiAkZWxlbWVudC5zaWJsaW5ncygnbGknKS5hZGQoJGVsZW1lbnQpLFxuICAgICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgICAkbmV4dEVsZW1lbnQ7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGktMSk7XG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGkrMSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIG5leHRTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRuZXh0RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0sIHByZXZTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRwcmV2RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0sIG9wZW5TdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdWIgPSAkZWxlbWVudC5jaGlsZHJlbigndWwuaXMtZHJvcGRvd24tc3VibWVudScpO1xuICAgICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgICBfdGhpcy5fc2hvdygkc3ViKTtcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdsaSA+IGE6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9LCBjbG9zZVN1YiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL2lmICgkZWxlbWVudC5pcygnOmZpcnN0LWNoaWxkJykpIHtcbiAgICAgICAgdmFyIGNsb3NlID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcbiAgICAgICAgY2xvc2UuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICBfdGhpcy5faGlkZShjbG9zZSk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy99XG4gICAgICB9O1xuICAgICAgdmFyIGZ1bmN0aW9ucyA9IHtcbiAgICAgICAgb3Blbjogb3BlblN1YixcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9oaWRlKF90aGlzLiRlbGVtZW50KTtcbiAgICAgICAgICBfdGhpcy4kbWVudUl0ZW1zLmVxKDApLmNoaWxkcmVuKCdhJykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKGlzVGFiKSB7XG4gICAgICAgIGlmIChfdGhpcy5faXNWZXJ0aWNhbCgpKSB7IC8vIHZlcnRpY2FsIG1lbnVcbiAgICAgICAgICBpZiAoX3RoaXMuX2lzUnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogb3BlblN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIGhvcml6b250YWwgbWVudVxuICAgICAgICAgIGlmIChfdGhpcy5faXNSdGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgbmV4dDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBuZXh0OiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgcHJldmlvdXM6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBkb3duOiBvcGVuU3ViLFxuICAgICAgICAgICAgICB1cDogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gbm90IHRhYnMgLT4gb25lIHN1YlxuICAgICAgICBpZiAoX3RoaXMuX2lzUnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEtleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd25NZW51JywgZnVuY3Rpb25zKTtcblxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xuICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpXG4gICAgICAgICAub24oJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XG4gICAgICAgICAgIGlmICgkbGluay5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgX3RoaXMuX2hpZGUoKTtcbiAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgZHJvcGRvd24gcGFuZSwgYW5kIGNoZWNrcyBmb3IgY29sbGlzaW9ucyBmaXJzdC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRzdWIgLSB1bCBlbGVtZW50IHRoYXQgaXMgYSBzdWJtZW51IHRvIHNob3dcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjc2hvd1xuICAgKi9cbiAgX3Nob3coJHN1Yikge1xuICAgIHZhciBpZHggPSB0aGlzLiR0YWJzLmluZGV4KHRoaXMuJHRhYnMuZmlsdGVyKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZmluZCgkc3ViKS5sZW5ndGggPiAwO1xuICAgIH0pKTtcbiAgICB2YXIgJHNpYnMgPSAkc3ViLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5zaWJsaW5ncygnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLl9oaWRlKCRzaWJzLCBpZHgpO1xuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKVxuICAgICAgICAucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICB2YXIgY2xlYXIgPSBCb3guSW1Ob3RUb3VjaGluZ1lvdSgkc3ViLCBudWxsLCB0cnVlKTtcbiAgICBpZiAoIWNsZWFyKSB7XG4gICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAnLXJpZ2h0JyA6ICctbGVmdCcsXG4gICAgICAgICAgJHBhcmVudExpID0gJHN1Yi5wYXJlbnQoJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgICAgJHBhcmVudExpLnJlbW92ZUNsYXNzKGBvcGVucyR7b2xkQ2xhc3N9YCkuYWRkQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKTtcbiAgICAgIGNsZWFyID0gQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgICBpZiAoIWNsZWFyKSB7XG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG5ldyBkcm9wZG93biBwYW5lIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3dubWVudScsIFskc3ViXSk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBoaWRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGlkZSgkZWxlbSwgaWR4KSB7XG4gICAgdmFyICR0b0Nsb3NlO1xuICAgIGlmICgkZWxlbSAmJiAkZWxlbS5sZW5ndGgpIHtcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiR0YWJzLm5vdChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xuICAgIH1cbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcblxuICAgIGlmIChzb21ldGhpbmdUb0Nsb3NlKSB7XG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKTtcblxuICAgICAgaWYgKHRoaXMuY2hhbmdlZCB8fCAkdG9DbG9zZS5maW5kKCdvcGVucy1pbm5lcicpLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZCgkdG9DbG9zZSlcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoYG9wZW5zLWlubmVyIG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgb3BlbnMtJHtvbGRDbGFzc31gKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9wZW4gbWVudXMgYXJlIGNsb3NlZC5cbiAgICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjaGlkZVxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd25tZW51JywgWyR0b0Nsb3NlXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2Rlc3Ryb3koKSB7XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9mZignLnpmLmRyb3Bkb3dubWVudScpLnJlbW92ZUF0dHIoJ2RhdGEtaXMtY2xpY2snKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XG4gICAgJChkb2N1bWVudC5ib2R5KS5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICBOZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRGlzYWxsb3dzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgc3VibWVudXNcbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRpc2FibGVIb3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gYXV0b21hdGljYWxseSBjbG9zZSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQsIGlmIG5vdCBjbGlja2VkIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGF1dG9jbG9zZTogdHJ1ZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDUwXG4gICAqL1xuICBob3ZlckRlbGF5OiA1MCxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBvcGVuL3JlbWFpbiBvcGVuIG9uIHBhcmVudCBjbGljayBldmVudC4gQWxsb3dzIGN1cnNvciB0byBtb3ZlIGF3YXkgZnJvbSBtZW51LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgY2xpY2tPcGVuOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IGNsb3NpbmcgYSBzdWJtZW51IG9uIGEgbW91c2VsZWF2ZSBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCA1MDBcbiAgICovXG5cbiAgY2xvc2luZ1RpbWU6IDUwMCxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHdoYXQgZGlyZWN0aW9uIHRoZSBzdWJtZW51cyBzaG91bGQgb3Blbi4gSGFuZGxlZCBieSBKUy4gQ2FuIGJlIGAnYXV0bydgLCBgJ2xlZnQnYCBvciBgJ3JpZ2h0J2AuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ2F1dG8nXG4gICAqL1xuICBhbGlnbm1lbnQ6ICdhdXRvJyxcbiAgLyoqXG4gICAqIEFsbG93IGNsaWNrcyBvbiB0aGUgYm9keSB0byBjbG9zZSBhbnkgb3BlbiBzdWJtZW51cy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIGxlYWYgYW5jaG9yIGxpbmtzIHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2tJbnNpZGU6IHRydWUsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHZlcnRpY2FsIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYHZlcnRpY2FsYC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ3ZlcnRpY2FsJ1xuICAgKi9cbiAgdmVydGljYWxDbGFzczogJ3ZlcnRpY2FsJyxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gcmlnaHQtc2lkZSBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGBhbGlnbi1yaWdodGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0ICdhbGlnbi1yaWdodCdcbiAgICovXG4gIHJpZ2h0Q2xhc3M6ICdhbGlnbi1yaWdodCcsXG4gIC8qKlxuICAgKiBCb29sZWFuIHRvIGZvcmNlIG92ZXJpZGUgdGhlIGNsaWNraW5nIG9mIGxpbmtzIHRvIHBlcmZvcm0gZGVmYXVsdCBhY3Rpb24sIG9uIHNlY29uZCB0b3VjaCBldmVudCBmb3IgbW9iaWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBmb3JjZUZvbGxvdzogdHJ1ZVxufTtcblxuZXhwb3J0IHtEcm9wZG93bk1lbnV9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHsgS2V5Ym9hcmQgfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC5rZXlib2FyZCc7XG5pbXBvcnQgeyBNZWRpYVF1ZXJ5IH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeSc7XG5pbXBvcnQgeyB0cmFuc2l0aW9uZW5kIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwuY29yZSc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL2ZvdW5kYXRpb24ucGx1Z2luJztcblxuaW1wb3J0IHsgVHJpZ2dlcnMgfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC50cmlnZ2Vycyc7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIE9mZkNhbnZhcyBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9mZi1jYW52YXMgd3JhcHBlci5cbiAgICogQGNsYXNzXG4gICAqIEBuYW1lIE9mZkNhbnZhc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIF9zZXR1cChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnT2ZmQ2FudmFzJzsgLy8gaWU5IGJhY2sgY29tcGF0XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9mZkNhbnZhcy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuY29udGVudENsYXNzZXMgPSB7IGJhc2U6IFtdLCByZXZlYWw6IFtdIH07XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9ICdsZWZ0JztcbiAgICB0aGlzLiRjb250ZW50ID0gJCgpO1xuICAgIHRoaXMubmVzdGVkID0gISEodGhpcy5vcHRpb25zLm5lc3RlZCk7XG5cbiAgICAvLyBEZWZpbmVzIHRoZSBDU1MgdHJhbnNpdGlvbi9wb3NpdGlvbiBjbGFzc2VzIG9mIHRoZSBvZmYtY2FudmFzIGNvbnRlbnQgY29udGFpbmVyLlxuICAgICQoWydwdXNoJywgJ292ZXJsYXAnXSkuZWFjaCgoaW5kZXgsIHZhbCkgPT4ge1xuICAgICAgdGhpcy5jb250ZW50Q2xhc3Nlcy5iYXNlLnB1c2goJ2hhcy10cmFuc2l0aW9uLScrdmFsKTtcbiAgICB9KTtcbiAgICAkKFsnbGVmdCcsICdyaWdodCcsICd0b3AnLCAnYm90dG9tJ10pLmVhY2goKGluZGV4LCB2YWwpID0+IHtcbiAgICAgIHRoaXMuY29udGVudENsYXNzZXMuYmFzZS5wdXNoKCdoYXMtcG9zaXRpb24tJyt2YWwpO1xuICAgICAgdGhpcy5jb250ZW50Q2xhc3Nlcy5yZXZlYWwucHVzaCgnaGFzLXJldmVhbC0nK3ZhbCk7XG4gICAgfSk7XG5cbiAgICAvLyBUcmlnZ2VycyBpbml0IGlzIGlkZW1wb3RlbnQsIGp1c3QgbmVlZCB0byBtYWtlIHN1cmUgaXQgaXMgaW5pdGlhbGl6ZWRcbiAgICBUcmlnZ2Vycy5pbml0KCQpO1xuICAgIE1lZGlhUXVlcnkuX2luaXQoKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEtleWJvYXJkLnJlZ2lzdGVyKCdPZmZDYW52YXMnLCB7XG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG9mZi1jYW52YXMgd3JhcHBlciBieSBhZGRpbmcgdGhlIGV4aXQgb3ZlcmxheSAoaWYgbmVlZGVkKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgIC8vIEZpbmQgb2ZmLWNhbnZhcyBjb250ZW50LCBlaXRoZXIgYnkgSUQgKGlmIHNwZWNpZmllZCksIGJ5IHNpYmxpbmdzIG9yIGJ5IGNsb3Nlc3Qgc2VsZWN0b3IgKGZhbGxiYWNrKVxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudElkKSB7XG4gICAgICB0aGlzLiRjb250ZW50ID0gJCgnIycrdGhpcy5vcHRpb25zLmNvbnRlbnRJZCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRjb250ZW50ID0gdGhpcy4kZWxlbWVudC5zaWJsaW5ncygnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmZpcnN0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGNvbnRlbnQgPSB0aGlzLiRlbGVtZW50LmNsb3Nlc3QoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5maXJzdCgpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmNvbnRlbnRJZCkge1xuICAgICAgLy8gQXNzdW1lIHRoYXQgdGhlIG9mZi1jYW52YXMgZWxlbWVudCBpcyBuZXN0ZWQgaWYgaXQgaXNuJ3QgYSBzaWJsaW5nIG9mIHRoZSBjb250ZW50XG4gICAgICB0aGlzLm5lc3RlZCA9IHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5sZW5ndGggPT09IDA7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50SWQgJiYgdGhpcy5vcHRpb25zLm5lc3RlZCA9PT0gbnVsbCkge1xuICAgICAgLy8gV2FybmluZyBpZiB1c2luZyBjb250ZW50IElEIHdpdGhvdXQgc2V0dGluZyB0aGUgbmVzdGVkIG9wdGlvblxuICAgICAgLy8gT25jZSB0aGUgZWxlbWVudCBpcyBuZXN0ZWQgaXQgaXMgcmVxdWlyZWQgdG8gd29yayBwcm9wZXJseSBpbiB0aGlzIGNhc2VcbiAgICAgIGNvbnNvbGUud2FybignUmVtZW1iZXIgdG8gdXNlIHRoZSBuZXN0ZWQgb3B0aW9uIGlmIHVzaW5nIHRoZSBjb250ZW50IElEIG9wdGlvbiEnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5uZXN0ZWQgPT09IHRydWUpIHtcbiAgICAgIC8vIEZvcmNlIHRyYW5zaXRpb24gb3ZlcmxhcCBpZiBuZXN0ZWRcbiAgICAgIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uID0gJ292ZXJsYXAnO1xuICAgICAgLy8gUmVtb3ZlIGFwcHJvcHJpYXRlIGNsYXNzZXMgaWYgYWxyZWFkeSBhc3NpZ25lZCBpbiBtYXJrdXBcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLXRyYW5zaXRpb24tcHVzaCcpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoYGlzLXRyYW5zaXRpb24tJHt0aGlzLm9wdGlvbnMudHJhbnNpdGlvbn0gaXMtY2xvc2VkYCk7XG5cbiAgICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxuICAgIHRoaXMuJHRyaWdnZXJzID0gJChkb2N1bWVudClcbiAgICAgIC5maW5kKCdbZGF0YS1vcGVuPVwiJytpZCsnXCJdLCBbZGF0YS1jbG9zZT1cIicraWQrJ1wiXSwgW2RhdGEtdG9nZ2xlPVwiJytpZCsnXCJdJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJylcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgaWQpO1xuXG4gICAgLy8gR2V0IHBvc2l0aW9uIGJ5IGNoZWNraW5nIGZvciByZWxhdGVkIENTUyBjbGFzc1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLiRlbGVtZW50LmlzKCcucG9zaXRpb24tbGVmdCwgLnBvc2l0aW9uLXRvcCwgLnBvc2l0aW9uLXJpZ2h0LCAucG9zaXRpb24tYm90dG9tJykgPyB0aGlzLiRlbGVtZW50LmF0dHIoJ2NsYXNzJykubWF0Y2goL3Bvc2l0aW9uXFwtKGxlZnR8dG9wfHJpZ2h0fGJvdHRvbSkvKVsxXSA6IHRoaXMucG9zaXRpb247XG5cbiAgICAvLyBBZGQgYW4gb3ZlcmxheSBvdmVyIHRoZSBjb250ZW50IGlmIG5lY2Vzc2FyeVxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB2YXIgb3ZlcmxheVBvc2l0aW9uID0gJCh0aGlzLiRlbGVtZW50KS5jc3MoXCJwb3NpdGlvblwiKSA9PT0gJ2ZpeGVkJyA/ICdpcy1vdmVybGF5LWZpeGVkJyA6ICdpcy1vdmVybGF5LWFic29sdXRlJztcbiAgICAgIG92ZXJsYXkuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLW92ZXJsYXkgJyArIG92ZXJsYXlQb3NpdGlvbik7XG4gICAgICB0aGlzLiRvdmVybGF5ID0gJChvdmVybGF5KTtcbiAgICAgIGlmKG92ZXJsYXlQb3NpdGlvbiA9PT0gJ2lzLW92ZXJsYXktZml4ZWQnKSB7XG4gICAgICAgICQodGhpcy4kb3ZlcmxheSkuaW5zZXJ0QWZ0ZXIodGhpcy4kZWxlbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiRjb250ZW50LmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9IHRoaXMub3B0aW9ucy5pc1JldmVhbGVkIHx8IG5ldyBSZWdFeHAodGhpcy5vcHRpb25zLnJldmVhbENsYXNzLCAnZycpLnRlc3QodGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc1JldmVhbGVkID09PSB0cnVlKSB7XG4gICAgICB0aGlzLm9wdGlvbnMucmV2ZWFsT24gPSB0aGlzLm9wdGlvbnMucmV2ZWFsT24gfHwgdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyhyZXZlYWwtZm9yLW1lZGl1bXxyZXZlYWwtZm9yLWxhcmdlKS9nKVswXS5zcGxpdCgnLScpWzJdO1xuICAgICAgdGhpcy5fc2V0TVFDaGVja2VyKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUpO1xuICAgIH1cblxuICAgIC8vIEluaXRhbGx5IHJlbW92ZSBhbGwgdHJhbnNpdGlvbi9wb3NpdGlvbiBDU1MgY2xhc3NlcyBmcm9tIG9mZi1jYW52YXMgY29udGVudCBjb250YWluZXIuXG4gICAgdGhpcy5fcmVtb3ZlQ29udGVudENsYXNzZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYW5kIHRoZSBleGl0IG92ZXJsYXkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpLm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdrZXlkb3duLnpmLm9mZmNhbnZhcyc6IHRoaXMuX2hhbmRsZUtleWJvYXJkLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrID09PSB0cnVlKSB7XG4gICAgICB2YXIgJHRhcmdldCA9IHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA/IHRoaXMuJG92ZXJsYXkgOiB0aGlzLiRjb250ZW50O1xuICAgICAgJHRhcmdldC5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKE1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xuICAgICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdGhpcy5yZXZlYWwoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pLm9uZSgnbG9hZC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChNZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIENTUyB0cmFuc2l0aW9uL3Bvc2l0aW9uIGNsYXNzZXMgb2YgdGhlIG9mZi1jYW52YXMgY29udGVudCBjb250YWluZXIuXG4gICAqIFJlbW92aW5nIHRoZSBjbGFzc2VzIGlzIGltcG9ydGFudCB3aGVuIGFub3RoZXIgb2ZmLWNhbnZhcyBnZXRzIG9wZW5lZCB0aGF0IHVzZXMgdGhlIHNhbWUgY29udGVudCBjb250YWluZXIuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaGFzUmV2ZWFsIC0gdHJ1ZSBpZiByZWxhdGVkIG9mZi1jYW52YXMgZWxlbWVudCBpcyByZXZlYWxlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZW1vdmVDb250ZW50Q2xhc3NlcyhoYXNSZXZlYWwpIHtcbiAgICBpZiAodHlwZW9mIGhhc1JldmVhbCAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICB0aGlzLiRjb250ZW50LnJlbW92ZUNsYXNzKHRoaXMuY29udGVudENsYXNzZXMuYmFzZS5qb2luKCcgJykpO1xuICAgIH0gZWxzZSBpZiAoaGFzUmV2ZWFsID09PSBmYWxzZSkge1xuICAgICAgdGhpcy4kY29udGVudC5yZW1vdmVDbGFzcyhgaGFzLXJldmVhbC0ke3RoaXMucG9zaXRpb259YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIENTUyB0cmFuc2l0aW9uL3Bvc2l0aW9uIGNsYXNzZXMgb2YgdGhlIG9mZi1jYW52YXMgY29udGVudCBjb250YWluZXIsIGJhc2VkIG9uIHRoZSBvcGVuaW5nIG9mZi1jYW52YXMgZWxlbWVudC5cbiAgICogQmVmb3JlaGFuZCBhbnkgdHJhbnNpdGlvbi9wb3NpdGlvbiBjbGFzcyBnZXRzIHJlbW92ZWQuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaGFzUmV2ZWFsIC0gdHJ1ZSBpZiByZWxhdGVkIG9mZi1jYW52YXMgZWxlbWVudCBpcyByZXZlYWxlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRDb250ZW50Q2xhc3NlcyhoYXNSZXZlYWwpIHtcbiAgICB0aGlzLl9yZW1vdmVDb250ZW50Q2xhc3NlcyhoYXNSZXZlYWwpO1xuICAgIGlmICh0eXBlb2YgaGFzUmV2ZWFsICE9PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMuJGNvbnRlbnQuYWRkQ2xhc3MoYGhhcy10cmFuc2l0aW9uLSR7dGhpcy5vcHRpb25zLnRyYW5zaXRpb259IGhhcy1wb3NpdGlvbi0ke3RoaXMucG9zaXRpb259YCk7XG4gICAgfSBlbHNlIGlmIChoYXNSZXZlYWwgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGNvbnRlbnQuYWRkQ2xhc3MoYGhhcy1yZXZlYWwtJHt0aGlzLnBvc2l0aW9ufWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIGlmIChpc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSB0cnVlO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ29wZW4uemYudHJpZ2dlciB0b2dnbGUuemYudHJpZ2dlcicpO1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IGZhbHNlO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZignb3Blbi56Zi50cmlnZ2VyIHRvZ2dsZS56Zi50cmlnZ2VyJykub24oe1xuICAgICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcylcbiAgICAgIH0pO1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgfVxuICAgIHRoaXMuX2FkZENvbnRlbnRDbGFzc2VzKGlzUmV2ZWFsZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHNjcm9sbGluZyBvZiB0aGUgYm9keSB3aGVuIG9mZmNhbnZhcyBpcyBvcGVuIG9uIG1vYmlsZSBTYWZhcmkgYW5kIG90aGVyIHRyb3VibGVzb21lIGJyb3dzZXJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0b3BTY3JvbGxpbmcoZXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUYWtlbiBhbmQgYWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTY4ODk0NDcvcHJldmVudC1mdWxsLXBhZ2Utc2Nyb2xsaW5nLWlvc1xuICAvLyBPbmx5IHJlYWxseSB3b3JrcyBmb3IgeSwgbm90IHN1cmUgaG93IHRvIGV4dGVuZCB0byB4IG9yIGlmIHdlIG5lZWQgdG8uXG4gIF9yZWNvcmRTY3JvbGxhYmxlKGV2ZW50KSB7XG4gICAgbGV0IGVsZW0gPSB0aGlzOyAvLyBjYWxsZWQgZnJvbSBldmVudCBoYW5kbGVyIGNvbnRleHQgd2l0aCB0aGlzIGFzIGVsZW1cblxuICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBzY3JvbGxhYmxlIChjb250ZW50IG92ZXJmbG93cyksIHRoZW4uLi5cbiAgICBpZiAoZWxlbS5zY3JvbGxIZWlnaHQgIT09IGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgdG9wLCBzY3JvbGwgZG93biBvbmUgcGl4ZWwgdG8gYWxsb3cgc2Nyb2xsaW5nIHVwXG4gICAgICBpZiAoZWxlbS5zY3JvbGxUb3AgPT09IDApIHtcbiAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSAxO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UncmUgYXQgdGhlIGJvdHRvbSwgc2Nyb2xsIHVwIG9uZSBwaXhlbCB0byBhbGxvdyBzY3JvbGxpbmcgZG93blxuICAgICAgaWYgKGVsZW0uc2Nyb2xsVG9wID09PSBlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIGVsZW0uc2Nyb2xsVG9wID0gZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCAtIDE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsZW0uYWxsb3dVcCA9IGVsZW0uc2Nyb2xsVG9wID4gMDtcbiAgICBlbGVtLmFsbG93RG93biA9IGVsZW0uc2Nyb2xsVG9wIDwgKGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQpO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5vcmlnaW5hbEV2ZW50LnBhZ2VZO1xuICB9XG5cbiAgX3N0b3BTY3JvbGxQcm9wYWdhdGlvbihldmVudCkge1xuICAgIGxldCBlbGVtID0gdGhpczsgLy8gY2FsbGVkIGZyb20gZXZlbnQgaGFuZGxlciBjb250ZXh0IHdpdGggdGhpcyBhcyBlbGVtXG4gICAgbGV0IHVwID0gZXZlbnQucGFnZVkgPCBlbGVtLmxhc3RZO1xuICAgIGxldCBkb3duID0gIXVwO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5wYWdlWTtcblxuICAgIGlmKCh1cCAmJiBlbGVtLmFsbG93VXApIHx8IChkb3duICYmIGVsZW0uYWxsb3dEb3duKSkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI29wZW5lZFxuICAgKi9cbiAgb3BlbihldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodHJpZ2dlcikge1xuICAgICAgdGhpcy4kbGFzdFRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUbyA9PT0gJ3RvcCcpIHtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAnYm90dG9tJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUgJiYgdGhpcy5vcHRpb25zLnRyYW5zaXRpb24gIT09ICdvdmVybGFwJykge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaWJsaW5ncygnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5jc3MoJ3RyYW5zaXRpb24tZHVyYXRpb24nLCAnJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpLnJlbW92ZUNsYXNzKCdpcy1jbG9zZWQnKTtcblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKVxuICAgICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgdGhpcy4kY29udGVudC5hZGRDbGFzcygnaXMtb3Blbi0nICsgdGhpcy5wb3NpdGlvbik7XG5cbiAgICAvLyBJZiBgY29udGVudFNjcm9sbGAgaXMgc2V0IHRvIGZhbHNlLCBhZGQgY2xhc3MgYW5kIGRpc2FibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbGluZyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaHN0YXJ0JywgdGhpcy5fcmVjb3JkU2Nyb2xsYWJsZSk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub25lKHRyYW5zaXRpb25lbmQodGhpcy4kZWxlbWVudCksIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIV90aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcbiAgICAgICAgICByZXR1cm47IC8vIGV4aXQgaWYgcHJlbWF0dXJlbHkgY2xvc2VkXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbnZhc0ZvY3VzID0gX3RoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtYXV0b2ZvY3VzXScpO1xuICAgICAgICBpZiAoY2FudmFzRm9jdXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYW52YXNGb2N1cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuZmluZCgnYSwgYnV0dG9uJykuZXEoMCkuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGNvbnRlbnQuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIEtleWJvYXJkLnRyYXBGb2N1cyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRDb250ZW50Q2xhc3NlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYiB0byBmaXJlIGFmdGVyIGNsb3N1cmUuXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjY2xvc2VkXG4gICAqL1xuICBjbG9zZShjYikge1xuICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXG4gICAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgICAgICovXG4gICAgICAgIC50cmlnZ2VyKCdjbG9zZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICB0aGlzLiRjb250ZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuLWxlZnQgaXMtb3Blbi10b3AgaXMtb3Blbi1yaWdodCBpcy1vcGVuLWJvdHRvbScpO1xuXG4gICAgLy8gSWYgYGNvbnRlbnRTY3JvbGxgIGlzIHNldCB0byBmYWxzZSwgcmVtb3ZlIGNsYXNzIGFuZCByZS1lbmFibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vZmYoJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxpbmcpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvdWNoc3RhcnQnLCB0aGlzLl9yZWNvcmRTY3JvbGxhYmxlKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGNvbnRlbnQucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgIEtleWJvYXJkLnJlbGVhc2VGb2N1cyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gdHJhbnNpdGlvbkVuZCBhbmQgYWRkIGNsYXNzIHdoZW4gZG9uZS5cbiAgICB0aGlzLiRlbGVtZW50Lm9uZSh0cmFuc2l0aW9uZW5kKHRoaXMuJGVsZW1lbnQpLCBmdW5jdGlvbihlKSB7XG4gICAgICBfdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtY2xvc2VkJyk7XG4gICAgICBfdGhpcy5fcmVtb3ZlQ29udGVudENsYXNzZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKi9cbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgdGhpcy5jbG9zZShldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hhbmRsZUtleWJvYXJkKGUpIHtcbiAgICBLZXlib2FyZC5oYW5kbGVLZXkoZSwgJ09mZkNhbnZhcycsIHtcbiAgICAgIGNsb3NlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy4kbGFzdFRyaWdnZXIuZm9jdXMoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgICAgaGFuZGxlZDogKCkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIG9mZmNhbnZhcyBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2Rlc3Ryb3koKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XG4gICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5vZmZjYW52YXMnKTtcbiAgfVxufVxuXG5PZmZDYW52YXMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgdXNlciB0byBjbGljayBvdXRzaWRlIG9mIHRoZSBtZW51IHRvIGNsb3NlIGl0LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gb3ZlcmxheSBvbiB0b3Agb2YgYFtkYXRhLW9mZi1jYW52YXMtY29udGVudF1gLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50T3ZlcmxheTogdHJ1ZSxcblxuICAvKipcbiAgICogVGFyZ2V0IGFuIG9mZi1jYW52YXMgY29udGVudCBjb250YWluZXIgYnkgSUQgdGhhdCBtYXkgYmUgcGxhY2VkIGFueXdoZXJlLiBJZiBudWxsIHRoZSBjbG9zZXN0IGNvbnRlbnQgY29udGFpbmVyIHdpbGwgYmUgdGFrZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIGNvbnRlbnRJZDogbnVsbCxcblxuICAvKipcbiAgICogRGVmaW5lIHRoZSBvZmYtY2FudmFzIGVsZW1lbnQgaXMgbmVzdGVkIGluIGFuIG9mZi1jYW52YXMgY29udGVudC4gVGhpcyBpcyByZXF1aXJlZCB3aGVuIHVzaW5nIHRoZSBjb250ZW50SWQgb3B0aW9uIGZvciBhIG5lc3RlZCBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBuZXN0ZWQ6IG51bGwsXG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIHNjcm9sbGluZyBvZiB0aGUgbWFpbiBjb250ZW50IHdoZW4gYW4gb2ZmIGNhbnZhcyBwYW5lbCBpcyBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50U2Nyb2xsOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIHRyYW5zaXRpb25UaW1lOiBudWxsLFxuXG4gIC8qKlxuICAgKiBUeXBlIG9mIHRyYW5zaXRpb24gZm9yIHRoZSBvZmZjYW52YXMgbWVudS4gT3B0aW9ucyBhcmUgJ3B1c2gnLCAnZGV0YWNoZWQnIG9yICdzbGlkZScuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcHVzaFxuICAgKi9cbiAgdHJhbnNpdGlvbjogJ3B1c2gnLFxuXG4gIC8qKlxuICAgKiBGb3JjZSB0aGUgcGFnZSB0byBzY3JvbGwgdG8gdG9wIG9yIGJvdHRvbSBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBmb3JjZVRvOiBudWxsLFxuXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgaXNSZXZlYWxlZDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICByZXZlYWxPbjogbnVsbCxcblxuICAvKipcbiAgICogRm9yY2UgZm9jdXMgdG8gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLiBJZiB0cnVlLCB3aWxsIGZvY3VzIHRoZSBvcGVuaW5nIHRyaWdnZXIgb24gY2xvc2UuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogdHJ1ZSxcblxuICAvKipcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcmV2ZWFsLWZvci1cbiAgICogQHRvZG8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cbiAgICovXG4gIHJldmVhbENsYXNzOiAncmV2ZWFsLWZvci0nLFxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBvcHRpb25hbCBmb2N1cyB0cmFwcGluZyB3aGVuIG9wZW5pbmcgYW4gb2ZmY2FudmFzLiBTZXRzIHRhYmluZGV4IG9mIFtkYXRhLW9mZi1jYW52YXMtY29udGVudF0gdG8gLTEgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlXG59XG5cbmV4cG9ydCB7T2ZmQ2FudmFzfTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcblxuaW1wb3J0IHsgTWVkaWFRdWVyeSB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnknO1xuaW1wb3J0IHsgR2V0WW9EaWdpdHMgfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC5jb3JlJztcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vZm91bmRhdGlvbi5wbHVnaW4nO1xuXG5pbXBvcnQgeyBEcm9wZG93bk1lbnUgfSBmcm9tICcuL2ZvdW5kYXRpb24uZHJvcGRvd25NZW51JztcbmltcG9ydCB7IERyaWxsZG93biB9IGZyb20gJy4vZm91bmRhdGlvbi5kcmlsbGRvd24nO1xuaW1wb3J0IHsgQWNjb3JkaW9uTWVudSB9IGZyb20gJy4vZm91bmRhdGlvbi5hY2NvcmRpb25NZW51JztcblxubGV0IE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRHJvcGRvd25NZW51XG4gIH0sXG4gZHJpbGxkb3duOiB7XG4gICAgY3NzQ2xhc3M6ICdkcmlsbGRvd24nLFxuICAgIHBsdWdpbjogRHJpbGxkb3duXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogQWNjb3JkaW9uTWVudVxuICB9XG59O1xuXG4gIC8vIGltcG9ydCBcImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qc1wiO1xuXG5cbi8qKlxuICogUmVzcG9uc2l2ZU1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlTWVudSBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgcmVzcG9uc2l2ZSBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQG5hbWUgUmVzcG9uc2l2ZU1lbnVcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVNZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIF9zZXR1cChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnUmVzcG9uc2l2ZU1lbnUnOyAvLyBpZTkgYmFjayBjb21wYXRcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgTWVudSBieSBwYXJzaW5nIHRoZSBjbGFzc2VzIGZyb20gdGhlICdkYXRhLVJlc3BvbnNpdmVNZW51JyBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG5cbiAgICBNZWRpYVF1ZXJ5Ll9pbml0KCk7XG4gICAgLy8gVGhlIGZpcnN0IHRpbWUgYW4gSW50ZXJjaGFuZ2UgcGx1Z2luIGlzIGluaXRpYWxpemVkLCB0aGlzLnJ1bGVzIGlzIGNvbnZlcnRlZCBmcm9tIGEgc3RyaW5nIG9mIFwiY2xhc3Nlc1wiIHRvIGFuIG9iamVjdCBvZiBydWxlc1xuICAgIGlmICh0eXBlb2YgdGhpcy5ydWxlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxldCBydWxlc1RyZWUgPSB7fTtcblxuICAgICAgLy8gUGFyc2UgcnVsZXMgZnJvbSBcImNsYXNzZXNcIiBwdWxsZWQgZnJvbSBkYXRhIGF0dHJpYnV0ZVxuICAgICAgbGV0IHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xuXG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggZXZlcnkgcnVsZSBmb3VuZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XG4gICAgICAgIGxldCBydWxlU2l6ZSA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMF0gOiAnc21hbGwnO1xuICAgICAgICBsZXQgcnVsZVBsdWdpbiA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMV0gOiBydWxlWzBdO1xuXG4gICAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJ1bGVzVHJlZVtydWxlU2l6ZV0gPSBNZW51UGx1Z2luc1tydWxlUGx1Z2luXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnJ1bGVzID0gcnVsZXNUcmVlO1xuICAgIH1cblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHRoaXMucnVsZXMpKSB7XG4gICAgICB0aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH1cbiAgICAvLyBBZGQgZGF0YS1tdXRhdGUgc2luY2UgY2hpbGRyZW4gbWF5IG5lZWQgaXQuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLW11dGF0ZScsICh0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtbXV0YXRlJykgfHwgR2V0WW9EaWdpdHMoNiwgJ3Jlc3BvbnNpdmUtbWVudScpKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgTWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfSk7XG4gICAgLy8gJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuUmVzcG9uc2l2ZU1lbnUnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBzY3JlZW4gd2lkdGggYWdhaW5zdCBhdmFpbGFibGUgbWVkaWEgcXVlcmllcy4gSWYgdGhlIG1lZGlhIHF1ZXJ5IGhhcyBjaGFuZ2VkLCBhbmQgdGhlIHBsdWdpbiBuZWVkZWQgaGFzIGNoYW5nZWQsIHRoZSBwbHVnaW5zIHdpbGwgc3dhcCBvdXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrTWVkaWFRdWVyaWVzKCkge1xuICAgIHZhciBtYXRjaGVkTXEsIF90aGlzID0gdGhpcztcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlIGFuZCBmaW5kIHRoZSBsYXN0IG1hdGNoaW5nIHJ1bGVcbiAgICAkLmVhY2godGhpcy5ydWxlcywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfZGVzdHJveSgpIHtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xuICAgICQod2luZG93KS5vZmYoJy56Zi5SZXNwb25zaXZlTWVudScpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbmV4cG9ydCB7UmVzcG9uc2l2ZU1lbnV9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuXG5pbXBvcnQgeyBNZWRpYVF1ZXJ5IH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeSc7XG5pbXBvcnQgeyBNb3Rpb24gfSBmcm9tICcuL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24nO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnBsdWdpbic7XG5cbi8qKlxuICogUmVzcG9uc2l2ZVRvZ2dsZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICovXG5cbmNsYXNzIFJlc3BvbnNpdmVUb2dnbGUgZXh0ZW5kcyBQbHVnaW4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUYWIgQmFyLlxuICAgKiBAY2xhc3NcbiAgICogQG5hbWUgUmVzcG9uc2l2ZVRvZ2dsZVxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggdGFiIGJhciBmdW5jdGlvbmFsaXR5IHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBfc2V0dXAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnUmVzcG9uc2l2ZVRvZ2dsZSc7IC8vIGllOSBiYWNrIGNvbXBhdFxuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICBNZWRpYVF1ZXJ5Ll9pbml0KCk7XG4gICAgdmFyIHRhcmdldElEID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLXRvZ2dsZScpO1xuICAgIGlmICghdGFyZ2V0SUQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1lvdXIgdGFiIGJhciBuZWVkcyBhbiBJRCBvZiBhIE1lbnUgYXMgdGhlIHZhbHVlIG9mIGRhdGEtdGFiLWJhci4nKTtcbiAgICB9XG5cbiAgICB0aGlzLiR0YXJnZXRNZW51ID0gJChgIyR7dGFyZ2V0SUR9YCk7XG4gICAgdGhpcy4kdG9nZ2xlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdG9nZ2xlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZScpO1xuICAgICAgcmV0dXJuICh0YXJnZXQgPT09IHRhcmdldElEIHx8IHRhcmdldCA9PT0gXCJcIik7XG4gICAgfSk7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgdGhpcy4kdGFyZ2V0TWVudS5kYXRhKCkpO1xuXG4gICAgLy8gSWYgdGhleSB3ZXJlIHNldCwgcGFyc2UgdGhlIGFuaW1hdGlvbiBjbGFzc2VzXG4gICAgaWYodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcbiAgICAgIGxldCBpbnB1dCA9IHRoaXMub3B0aW9ucy5hbmltYXRlLnNwbGl0KCcgJyk7XG5cbiAgICAgIHRoaXMuYW5pbWF0aW9uSW4gPSBpbnB1dFswXTtcbiAgICAgIHRoaXMuYW5pbWF0aW9uT3V0ID0gaW5wdXRbMV0gfHwgbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLl91cGRhdGVNcUhhbmRsZXIgPSB0aGlzLl91cGRhdGUuYmluZCh0aGlzKTtcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fdXBkYXRlTXFIYW5kbGVyKTtcblxuICAgIHRoaXMuJHRvZ2dsZXIub24oJ2NsaWNrLnpmLnJlc3BvbnNpdmVUb2dnbGUnLCB0aGlzLnRvZ2dsZU1lbnUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5IHRvIGRldGVybWluZSBpZiB0aGUgdGFiIGJhciBzaG91bGQgYmUgdmlzaWJsZSBvciBoaWRkZW4uXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZSgpIHtcbiAgICAvLyBNb2JpbGVcbiAgICBpZiAoIU1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVza3RvcFxuICAgIGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnNob3coKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhci4gVGhlIHRvZ2dsZSBvbmx5IGhhcHBlbnMgaWYgdGhlIHNjcmVlbiBpcyBzbWFsbCBlbm91Z2ggdG8gYWxsb3cgaXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAqL1xuICB0b2dnbGVNZW51KCkge1xuICAgIGlmICghTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgKi9cbiAgICAgIGlmKHRoaXMub3B0aW9ucy5hbmltYXRlKSB7XG4gICAgICAgIGlmICh0aGlzLiR0YXJnZXRNZW51LmlzKCc6aGlkZGVuJykpIHtcbiAgICAgICAgICBNb3Rpb24uYW5pbWF0ZUluKHRoaXMuJHRhcmdldE1lbnUsIHRoaXMuYW5pbWF0aW9uSW4sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgICAgICAgICB0aGlzLiR0YXJnZXRNZW51LmZpbmQoJ1tkYXRhLW11dGF0ZV0nKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIE1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJHRhcmdldE1lbnUsIHRoaXMuYW5pbWF0aW9uT3V0LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3RvZ2dsZWQuemYucmVzcG9uc2l2ZVRvZ2dsZScpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy4kdGFyZ2V0TWVudS50b2dnbGUoMCk7XG4gICAgICAgIHRoaXMuJHRhcmdldE1lbnUuZmluZCgnW2RhdGEtbXV0YXRlXScpLnRyaWdnZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgX2Rlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgdGhpcy4kdG9nZ2xlci5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nLFxuXG4gIC8qKlxuICAgKiBUbyBkZWNpZGUgaWYgdGhlIHRvZ2dsZSBzaG91bGQgYmUgYW5pbWF0ZWQgb3Igbm90LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZTogZmFsc2Vcbn07XG5cbmV4cG9ydCB7IFJlc3BvbnNpdmVUb2dnbGUgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgeyBydGwgYXMgUnRsIH0gZnJvbSBcIi4vZm91bmRhdGlvbi51dGlsLmNvcmVcIjtcblxudmFyIEJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgT3ZlcmxhcEFyZWE6IE92ZXJsYXBBcmVhLFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzLFxuICBHZXRFeHBsaWNpdE9mZnNldHM6IEdldEV4cGxpY2l0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHksIGlnbm9yZUJvdHRvbSkge1xuICByZXR1cm4gT3ZlcmxhcEFyZWEoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSwgaWdub3JlQm90dG9tKSA9PT0gMDtcbn07XG5cbmZ1bmN0aW9uIE92ZXJsYXBBcmVhKGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHksIGlnbm9yZUJvdHRvbSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gIHRvcE92ZXIsIGJvdHRvbU92ZXIsIGxlZnRPdmVyLCByaWdodE92ZXI7XG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbU92ZXIgPSAocGFyRGltcy5oZWlnaHQgKyBwYXJEaW1zLm9mZnNldC50b3ApIC0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0KTtcbiAgICB0b3BPdmVyICAgID0gZWxlRGltcy5vZmZzZXQudG9wIC0gcGFyRGltcy5vZmZzZXQudG9wO1xuICAgIGxlZnRPdmVyICAgPSBlbGVEaW1zLm9mZnNldC5sZWZ0IC0gcGFyRGltcy5vZmZzZXQubGVmdDtcbiAgICByaWdodE92ZXIgID0gKHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KSAtIChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgYm90dG9tT3ZlciA9IChlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0ICsgZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApIC0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0KTtcbiAgICB0b3BPdmVyICAgID0gZWxlRGltcy5vZmZzZXQudG9wIC0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3A7XG4gICAgbGVmdE92ZXIgICA9IGVsZURpbXMub2Zmc2V0LmxlZnQgLSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQ7XG4gICAgcmlnaHRPdmVyICA9IGVsZURpbXMud2luZG93RGltcy53aWR0aCAtIChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCk7XG4gIH1cblxuICBib3R0b21PdmVyID0gaWdub3JlQm90dG9tID8gMCA6IE1hdGgubWluKGJvdHRvbU92ZXIsIDApO1xuICB0b3BPdmVyICAgID0gTWF0aC5taW4odG9wT3ZlciwgMCk7XG4gIGxlZnRPdmVyICAgPSBNYXRoLm1pbihsZWZ0T3ZlciwgMCk7XG4gIHJpZ2h0T3ZlciAgPSBNYXRoLm1pbihyaWdodE92ZXIsIDApO1xuXG4gIGlmIChsck9ubHkpIHtcbiAgICByZXR1cm4gbGVmdE92ZXIgKyByaWdodE92ZXI7XG4gIH1cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3BPdmVyICsgYm90dG9tT3ZlcjtcbiAgfVxuXG4gIC8vIHVzZSBzdW0gb2Ygc3F1YXJlcyBiL2Mgd2UgY2FyZSBhYm91dCBvdmVybGFwIGFyZWEuXG4gIHJldHVybiBNYXRoLnNxcnQoKHRvcE92ZXIgKiB0b3BPdmVyKSArIChib3R0b21PdmVyICogYm90dG9tT3ZlcikgKyAobGVmdE92ZXIgKiBsZWZ0T3ZlcikgKyAocmlnaHRPdmVyICogcmlnaHRPdmVyKSk7XG59XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duLiBNYWludGFpbmVkIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgYW5kIHdoZXJlXG4gKiB5b3UgZG9uJ3Qga25vdyBhbGlnbm1lbnQsIGJ1dCBnZW5lcmFsbHkgZnJvbVxuICogNi40IGZvcndhcmQgeW91IHNob3VsZCB1c2UgR2V0RXhwbGljaXRPZmZzZXRzLCBhcyBHZXRPZmZzZXRzIGNvbmZsYXRlcyBwb3NpdGlvbiBhbmQgYWxpZ25tZW50LlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHBvc2l0aW9uZWQuXG4gKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBhIHN0cmluZyByZWxhdGluZyB0byB0aGUgZGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCwgcmVsYXRpdmUgdG8gaXQncyBhbmNob3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB2T2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIHZlcnRpY2FsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzT3ZlcmZsb3cgLSBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZCwgc2V0cyB0byB0cnVlIHRvIGRlZmF1bHQgdGhlIGVsZW1lbnQgdG8gZnVsbCB3aWR0aCAtIGFueSBkZXNpcmVkIG9mZnNldC5cbiAqIFRPRE8gYWx0ZXIvcmV3cml0ZSB0byB3b3JrIHdpdGggYGVtYCB2YWx1ZXMgYXMgd2VsbC9pbnN0ZWFkIG9mIHBpeGVsc1xuICovXG5mdW5jdGlvbiBHZXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIHtcbiAgY29uc29sZS5sb2coXCJOT1RFOiBHZXRPZmZzZXRzIGlzIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2YgR2V0RXhwbGljaXRPZmZzZXRzIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gNi41XCIpO1xuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSAndG9wJzpcbiAgICAgIHJldHVybiBSdGwoKSA/XG4gICAgICAgIEdldEV4cGxpY2l0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsICd0b3AnLCAnbGVmdCcsIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIDpcbiAgICAgICAgR2V0RXhwbGljaXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgJ3RvcCcsICdyaWdodCcsIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpO1xuICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICByZXR1cm4gUnRsKCkgP1xuICAgICAgICBHZXRFeHBsaWNpdE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCAnYm90dG9tJywgJ2xlZnQnLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KSA6XG4gICAgICAgIEdldEV4cGxpY2l0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsICdib3R0b20nLCAncmlnaHQnLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KTtcbiAgICBjYXNlICdjZW50ZXIgdG9wJzpcbiAgICAgIHJldHVybiBHZXRFeHBsaWNpdE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCAndG9wJywgJ2NlbnRlcicsIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpO1xuICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxuICAgICAgcmV0dXJuIEdldEV4cGxpY2l0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsICdib3R0b20nLCAnY2VudGVyJywgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdyk7XG4gICAgY2FzZSAnY2VudGVyIGxlZnQnOlxuICAgICAgcmV0dXJuIEdldEV4cGxpY2l0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsICdsZWZ0JywgJ2NlbnRlcicsIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpO1xuICAgIGNhc2UgJ2NlbnRlciByaWdodCc6XG4gICAgICByZXR1cm4gR2V0RXhwbGljaXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgJ3JpZ2h0JywgJ2NlbnRlcicsIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpO1xuICAgIGNhc2UgJ2xlZnQgYm90dG9tJzpcbiAgICAgIHJldHVybiBHZXRFeHBsaWNpdE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCAnYm90dG9tJywgJ2xlZnQnLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KTtcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIEdldEV4cGxpY2l0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsICdib3R0b20nLCAncmlnaHQnLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KTtcbiAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eS4uLiB0aGlzIGFsb25nIHdpdGggdGhlIHJldmVhbCBhbmQgcmV2ZWFsIGZ1bGxcbiAgICAvLyBjbGFzc2VzIGFyZSB0aGUgb25seSBvbmVzIHRoYXQgZGlkbid0IHJlZmVyZW5jZSBhbmNob3JcbiAgICBjYXNlICdjZW50ZXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQgKyAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpICsgaE9mZnNldCxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgIGNhc2UgJ3JldmVhbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICRlbGVEaW1zLndpZHRoKSAvIDIgKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChSdGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCAtIGhPZmZzZXQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cblxuICB9XG5cbn1cblxuZnVuY3Rpb24gR2V0RXhwbGljaXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIGFsaWdubWVudCwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gICAgICB2YXIgdG9wVmFsLCBsZWZ0VmFsO1xuXG4gIC8vIHNldCBwb3NpdGlvbiByZWxhdGVkIGF0dHJpYnV0ZVxuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgdG9wVmFsID0gJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICB0b3BWYWwgPSAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgbGVmdFZhbCA9ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCc6XG4gICAgICBsZWZ0VmFsID0gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQ7XG4gICAgICBicmVhaztcbiAgfVxuXG5cbiAgLy8gc2V0IGFsaWdubWVudCByZWxhdGVkIGF0dHJpYnV0ZVxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSAndG9wJzpcbiAgICBjYXNlICdib3R0b20nOlxuICAgICAgc3dpdGNoIChhbGlnbm1lbnQpIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgbGVmdFZhbCA9ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgaE9mZnNldDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGxlZnRWYWwgPSAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggLSBoT2Zmc2V0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgIGxlZnRWYWwgPSBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSkgKyBoT2Zmc2V0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmlnaHQnOlxuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgc3dpdGNoIChhbGlnbm1lbnQpIHtcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICB0b3BWYWwgPSAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gdk9mZnNldCArICRhbmNob3JEaW1zLmhlaWdodCAtICRlbGVEaW1zLmhlaWdodDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICB0b3BWYWwgPSAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgdk9mZnNldFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgIHRvcFZhbCA9ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgdk9mZnNldCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiB7dG9wOiB0b3BWYWwsIGxlZnQ6IGxlZnRWYWx9O1xufVxuXG5leHBvcnQge0JveH07XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgdXRpbCB3YXMgY3JlYXRlZCBieSBNYXJpdXMgT2xiZXJ0eiAqXG4gKiBQbGVhc2UgdGhhbmsgTWFyaXVzIG9uIEdpdEh1YiAvb3dsYmVydHogKlxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5pbXBvcnQgeyBydGwgYXMgUnRsIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwuY29yZSc7XG5cbmNvbnN0IGtleUNvZGVzID0ge1xuICA5OiAnVEFCJyxcbiAgMTM6ICdFTlRFUicsXG4gIDI3OiAnRVNDQVBFJyxcbiAgMzI6ICdTUEFDRScsXG4gIDM1OiAnRU5EJyxcbiAgMzY6ICdIT01FJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbi8vIEZ1bmN0aW9ucyBwdWxsZWQgb3V0IHRvIGJlIHJlZmVyZW5jZWFibGUgZnJvbSBpbnRlcm5hbHNcbmZ1bmN0aW9uIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcbiAgaWYoISRlbGVtZW50KSB7cmV0dXJuIGZhbHNlOyB9XG4gIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlS2V5KGV2ZW50KSB7XG4gIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuXG4gIC8vIFJlbW92ZSB1bi1wcmludGFibGUgY2hhcmFjdGVycywgZS5nLiBmb3IgYGZyb21DaGFyQ29kZWAgY2FsbHMgZm9yIENUUkwgb25seSBldmVudHNcbiAga2V5ID0ga2V5LnJlcGxhY2UoL1xcVysvLCAnJyk7XG5cbiAgaWYgKGV2ZW50LnNoaWZ0S2V5KSBrZXkgPSBgU0hJRlRfJHtrZXl9YDtcbiAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcblxuICAvLyBSZW1vdmUgdHJhaWxpbmcgdW5kZXJzY29yZSwgaW4gY2FzZSBvbmx5IG1vZGlmaWVycyB3ZXJlIHVzZWQgKGUuZy4gb25seSBgQ1RSTF9BTFRgKVxuICBrZXkgPSBrZXkucmVwbGFjZSgvXyQvLCAnJyk7XG5cbiAgcmV0dXJuIGtleTtcbn1cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleTogcGFyc2VLZXksXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKFJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZChyZXR1cm5WYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cblxuICBmaW5kRm9jdXNhYmxlOiBmaW5kRm9jdXNhYmxlLFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEByZXR1cm4gU3RyaW5nIGNvbXBvbmVudE5hbWVcbiAgICovXG5cbiAgcmVnaXN0ZXIoY29tcG9uZW50TmFtZSwgY21kcykge1xuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcbiAgfSxcblxuXG4gIC8vIFRPRE85NDM4OiBUaGVzZSByZWZlcmVuY2VzIHRvIEtleWJvYXJkIG5lZWQgdG8gbm90IHJlcXVpcmUgZ2xvYmFsLiBXaWxsICd0aGlzJyB3b3JrIGluIHRoaXMgY29udGV4dD9cbiAgLy9cbiAgLyoqXG4gICAqIFRyYXBzIHRoZSBmb2N1cyBpbiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byB0cmFwIHRoZSBmb3VjcyBpbnRvLlxuICAgKi9cbiAgdHJhcEZvY3VzKCRlbGVtZW50KSB7XG4gICAgdmFyICRmb2N1c2FibGUgPSBmaW5kRm9jdXNhYmxlKCRlbGVtZW50KSxcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlID0gJGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgJGxhc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKC0xKTtcblxuICAgICRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnRyYXBmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSAkbGFzdEZvY3VzYWJsZVswXSAmJiBwYXJzZUtleShldmVudCkgPT09ICdUQUInKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICRmaXJzdEZvY3VzYWJsZS5mb2N1cygpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZXZlbnQudGFyZ2V0ID09PSAkZmlyc3RGb2N1c2FibGVbMF0gJiYgcGFyc2VLZXkoZXZlbnQpID09PSAnU0hJRlRfVEFCJykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkbGFzdEZvY3VzYWJsZS5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogUmVsZWFzZXMgdGhlIHRyYXBwZWQgZm9jdXMgZnJvbSB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byByZWxlYXNlIHRoZSBmb2N1cyBmb3IuXG4gICAqL1xuICByZWxlYXNlRm9jdXMoJGVsZW1lbnQpIHtcbiAgICAkZWxlbWVudC5vZmYoJ2tleWRvd24uemYudHJhcGZvY3VzJyk7XG4gIH1cbn1cblxuLypcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICovXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcbiAgdmFyIGsgPSB7fTtcbiAgZm9yICh2YXIga2MgaW4ga2NzKSBrW2tjc1trY11dID0ga2NzW2tjXTtcbiAgcmV0dXJuIGs7XG59XG5cbmV4cG9ydCB7S2V5Ym9hcmR9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHsgdHJhbnNpdGlvbmVuZCB9IGZyb20gJy4vZm91bmRhdGlvbi51dGlsLmNvcmUnO1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG4gICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHRzO1xuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XG4gICAgcHJvZyA9IHRzIC0gc3RhcnQ7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG5cbiAgICBpZihwcm9nIDwgZHVyYXRpb24peyBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlLCBlbGVtKTsgfVxuICAgIGVsc2V7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XG4gICAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICB9XG4gIH1cbiAgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSk7XG59XG5cbi8qKlxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGFuaW1hdGlvbiAtIENTUyBjbGFzcyB0byB1c2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuXG4gIGVsZW1lbnRcbiAgICAuYWRkQ2xhc3MoYW5pbWF0aW9uKVxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudFxuICAgICAgLmNzcygndHJhbnNpdGlvbicsICcnKVxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKHRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5leHBvcnQge01vdmUsIE1vdGlvbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YCxcbiAgICAgICAgYXBwbHlBcmlhID0gKHR5cGUgIT09ICdhY2NvcmRpb24nKTsgLy8gQWNjb3JkaW9ucyBoYW5kbGUgdGhlaXIgb3duIEFSSUEgYXR0cml1dGVzLlxuXG4gICAgaXRlbXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuXG4gICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoaGFzU3ViQ2xhc3MpO1xuICAgICAgICAkc3ViLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApLmF0dHIoeydkYXRhLXN1Ym1lbnUnOiAnJ30pO1xuICAgICAgICBpZihhcHBseUFyaWEpIHtcbiAgICAgICAgICAkaXRlbS5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyBOb3RlOiAgRHJpbGxkb3ducyBiZWhhdmUgZGlmZmVyZW50bHkgaW4gaG93IHRoZXkgaGlkZSwgYW5kIHNvIG5lZWRcbiAgICAgICAgICAvLyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMuICBXZSBzaG91bGQgbG9vayBpZiB0aGlzIHBvc3NpYmx5IG92ZXItZ2VuZXJhbGl6ZWRcbiAgICAgICAgICAvLyB1dGlsaXR5IChOZXN0KSBpcyBhcHByb3ByaWF0ZSB3aGVuIHdlIHJld29yayBtZW51cyBpbiA2LjRcbiAgICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICAgJGl0ZW0uYXR0cih7J2FyaWEtZXhwYW5kZWQnOiBmYWxzZX0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkc3ViXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYodHlwZSA9PT0gJ2RyaWxsZG93bicpIHtcbiAgICAgICAgICAkc3ViLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciAvL2l0ZW1zID0gbWVudS5maW5kKCdsaScpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgfVxufVxuXG5leHBvcnQge05lc3R9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuaW1wb3J0IHsgTW90aW9uIH0gZnJvbSAnLi9mb3VuZGF0aW9uLnV0aWwubW90aW9uJztcblxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYCBpbiB3aW5kb3cpIHtcbiAgICAgIHJldHVybiB3aW5kb3dbYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59KCkpO1xuXG5jb25zdCB0cmlnZ2VycyA9IChlbCwgdHlwZSkgPT4ge1xuICBlbC5kYXRhKHR5cGUpLnNwbGl0KCcgJykuZm9yRWFjaChpZCA9PiB7XG4gICAgJChgIyR7aWR9YClbIHR5cGUgPT09ICdjbG9zZScgPyAndHJpZ2dlcicgOiAndHJpZ2dlckhhbmRsZXInXShgJHt0eXBlfS56Zi50cmlnZ2VyYCwgW2VsXSk7XG4gIH0pO1xufTtcblxudmFyIFRyaWdnZXJzID0ge1xuICBMaXN0ZW5lcnM6IHtcbiAgICBCYXNpYzoge30sXG4gICAgR2xvYmFsOiB7fVxuICB9LFxuICBJbml0aWFsaXplcnM6IHt9XG59XG5cblRyaWdnZXJzLkxpc3RlbmVycy5CYXNpYyAgPSB7XG4gIG9wZW5MaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbiAgfSxcbiAgY2xvc2VMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCdjbG9zZScpO1xuICAgIGlmIChpZCkge1xuICAgICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ2Nsb3NlJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZS56Zi50cmlnZ2VyJyk7XG4gICAgfVxuICB9LFxuICB0b2dnbGVMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUnKTtcbiAgICBpZiAoaWQpIHtcbiAgICAgIHRyaWdnZXJzKCQodGhpcyksICd0b2dnbGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCd0b2dnbGUuemYudHJpZ2dlcicpO1xuICAgIH1cbiAgfSxcbiAgY2xvc2VhYmxlTGlzdGVuZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgICBpZihhbmltYXRpb24gIT09ICcnKXtcbiAgICAgIE1vdGlvbi5hbmltYXRlT3V0KCQodGhpcyksIGFuaW1hdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gICAgICB9KTtcbiAgICB9ZWxzZXtcbiAgICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICAgIH1cbiAgfSxcbiAgdG9nZ2xlRm9jdXNMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUtZm9jdXMnKTtcbiAgICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xuICB9XG59O1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZE9wZW5MaXN0ZW5lciA9ICgkZWxlbSkgPT4ge1xuICAkZWxlbS5vZmYoJ2NsaWNrLnpmLnRyaWdnZXInLCBUcmlnZ2Vycy5MaXN0ZW5lcnMuQmFzaWMub3Blbkxpc3RlbmVyKTtcbiAgJGVsZW0ub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBUcmlnZ2Vycy5MaXN0ZW5lcnMuQmFzaWMub3Blbkxpc3RlbmVyKTtcbn1cblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zZV0gd2lsbCBjbG9zZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbi8vIElmIHVzZWQgd2l0aG91dCBhIHZhbHVlIG9uIFtkYXRhLWNsb3NlXSwgdGhlIGV2ZW50IHdpbGwgYnViYmxlLCBhbGxvd2luZyBpdCB0byBjbG9zZSBhIHBhcmVudCBjb21wb25lbnQuXG5UcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkQ2xvc2VMaXN0ZW5lciA9ICgkZWxlbSkgPT4ge1xuICAkZWxlbS5vZmYoJ2NsaWNrLnpmLnRyaWdnZXInLCBUcmlnZ2Vycy5MaXN0ZW5lcnMuQmFzaWMuY2xvc2VMaXN0ZW5lcik7XG4gICRlbGVtLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIFRyaWdnZXJzLkxpc3RlbmVycy5CYXNpYy5jbG9zZUxpc3RlbmVyKTtcbn1cblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZFRvZ2dsZUxpc3RlbmVyID0gKCRlbGVtKSA9PiB7XG4gICRlbGVtLm9mZignY2xpY2suemYudHJpZ2dlcicsIFRyaWdnZXJzLkxpc3RlbmVycy5CYXNpYy50b2dnbGVMaXN0ZW5lcik7XG4gICRlbGVtLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZV0nLCBUcmlnZ2Vycy5MaXN0ZW5lcnMuQmFzaWMudG9nZ2xlTGlzdGVuZXIpO1xufVxuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NhYmxlXSB3aWxsIHJlc3BvbmQgdG8gY2xvc2UuemYudHJpZ2dlciBldmVudHMuXG5UcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkQ2xvc2VhYmxlTGlzdGVuZXIgPSAoJGVsZW0pID0+IHtcbiAgJGVsZW0ub2ZmKCdjbG9zZS56Zi50cmlnZ2VyJywgVHJpZ2dlcnMuTGlzdGVuZXJzLkJhc2ljLmNsb3NlYWJsZUxpc3RlbmVyKTtcbiAgJGVsZW0ub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VhYmxlXSwgW2RhdGEtY2xvc2FibGVdJywgVHJpZ2dlcnMuTGlzdGVuZXJzLkJhc2ljLmNsb3NlYWJsZUxpc3RlbmVyKTtcbn1cblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGUtZm9jdXNdIHdpbGwgcmVzcG9uZCB0byBjb21pbmcgaW4gYW5kIG91dCBvZiBmb2N1c1xuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZFRvZ2dsZUZvY3VzTGlzdGVuZXIgPSAoJGVsZW0pID0+IHtcbiAgJGVsZW0ub2ZmKCdmb2N1cy56Zi50cmlnZ2VyIGJsdXIuemYudHJpZ2dlcicsIFRyaWdnZXJzLkxpc3RlbmVycy5CYXNpYy50b2dnbGVGb2N1c0xpc3RlbmVyKTtcbiAgJGVsZW0ub24oJ2ZvY3VzLnpmLnRyaWdnZXIgYmx1ci56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZS1mb2N1c10nLCBUcmlnZ2Vycy5MaXN0ZW5lcnMuQmFzaWMudG9nZ2xlRm9jdXNMaXN0ZW5lcik7XG59XG5cblxuXG4vLyBNb3JlIEdsb2JhbC9jb21wbGV4IGxpc3RlbmVycyBhbmQgdHJpZ2dlcnNcblRyaWdnZXJzLkxpc3RlbmVycy5HbG9iYWwgID0ge1xuICByZXNpemVMaXN0ZW5lcjogZnVuY3Rpb24oJG5vZGVzKSB7XG4gICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgcmVzaXplIGV2ZW50XG4gICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJyZXNpemVcIik7XG4gIH0sXG4gIHNjcm9sbExpc3RlbmVyOiBmdW5jdGlvbigkbm9kZXMpIHtcbiAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBzY3JvbGwgZXZlbnRcbiAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcbiAgfSxcbiAgY2xvc2VNZUxpc3RlbmVyOiBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XG4gICAgbGV0IHBsdWdpbiA9IGUubmFtZXNwYWNlLnNwbGl0KCcuJylbMF07XG4gICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIGxldCBfdGhpcyA9ICQodGhpcyk7XG4gICAgICBfdGhpcy50cmlnZ2VySGFuZGxlcignY2xvc2UuemYudHJpZ2dlcicsIFtfdGhpc10pO1xuICAgIH0pO1xuICB9XG59XG5cbi8vIEdsb2JhbCwgcGFyc2VzIHdob2xlIGRvY3VtZW50LlxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZENsb3NlbWVMaXN0ZW5lciA9IGZ1bmN0aW9uKHBsdWdpbk5hbWUpIHtcbiAgdmFyIHlldGlCb3hlcyA9ICQoJ1tkYXRhLXlldGktYm94XScpLFxuICAgICAgcGx1Z05hbWVzID0gWydkcm9wZG93bicsICd0b29sdGlwJywgJ3JldmVhbCddO1xuXG4gIGlmKHBsdWdpbk5hbWUpe1xuICAgIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZSBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHBsdWdpbk5hbWVbMF0gPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5jb25jYXQocGx1Z2luTmFtZSk7XG4gICAgfWVsc2V7XG4gICAgICBjb25zb2xlLmVycm9yKCdQbHVnaW4gbmFtZXMgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICB9XG4gIGlmKHlldGlCb3hlcy5sZW5ndGgpe1xuICAgIGxldCBsaXN0ZW5lcnMgPSBwbHVnTmFtZXMubWFwKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gYGNsb3NlbWUuemYuJHtuYW1lfWA7XG4gICAgfSkuam9pbignICcpO1xuXG4gICAgJCh3aW5kb3cpLm9mZihsaXN0ZW5lcnMpLm9uKGxpc3RlbmVycywgVHJpZ2dlcnMuTGlzdGVuZXJzLkdsb2JhbC5jbG9zZU1lTGlzdGVuZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlYm91bmNlR2xvYmFsTGlzdGVuZXIoZGVib3VuY2UsIHRyaWdnZXIsIGxpc3RlbmVyKSB7XG4gIGxldCB0aW1lciwgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMyk7XG4gICQod2luZG93KS5vZmYodHJpZ2dlcikub24odHJpZ2dlciwgZnVuY3Rpb24oZSkge1xuICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBsaXN0ZW5lci5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCBzY3JvbGwgZXZlbnRcbiAgfSk7XG59XG5cblRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRSZXNpemVMaXN0ZW5lciA9IGZ1bmN0aW9uKGRlYm91bmNlKXtcbiAgbGV0ICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgZGVib3VuY2VHbG9iYWxMaXN0ZW5lcihkZWJvdW5jZSwgJ3Jlc2l6ZS56Zi50cmlnZ2VyJywgVHJpZ2dlcnMuTGlzdGVuZXJzLkdsb2JhbC5yZXNpemVMaXN0ZW5lciwgJG5vZGVzKTtcbiAgfVxufVxuXG5UcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkU2Nyb2xsTGlzdGVuZXIgPSBmdW5jdGlvbihkZWJvdW5jZSl7XG4gIGxldCAkbm9kZXMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgIGRlYm91bmNlR2xvYmFsTGlzdGVuZXIoZGVib3VuY2UsICdzY3JvbGwuemYudHJpZ2dlcicsIFRyaWdnZXJzLkxpc3RlbmVycy5HbG9iYWwuc2Nyb2xsTGlzdGVuZXIsICRub2Rlcyk7XG4gIH1cbn1cblxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZE11dGF0aW9uRXZlbnRzTGlzdGVuZXIgPSBmdW5jdGlvbigkZWxlbSkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgJG5vZGVzID0gJGVsZW0uZmluZCgnW2RhdGEtcmVzaXplXSwgW2RhdGEtc2Nyb2xsXSwgW2RhdGEtbXV0YXRlXScpO1xuXG4gIC8vZWxlbWVudCBjYWxsYmFja1xuICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uIChtdXRhdGlvblJlY29yZHNMaXN0KSB7XG4gICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcblxuICAgIC8vdHJpZ2dlciB0aGUgZXZlbnQgaGFuZGxlciBmb3IgdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHR5cGVcbiAgICBzd2l0Y2ggKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udHlwZSkge1xuICAgICAgY2FzZSBcImF0dHJpYnV0ZXNcIjpcbiAgICAgICAgaWYgKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpID09PSBcInNjcm9sbFwiICYmIG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJkYXRhLWV2ZW50c1wiKSB7XG4gICAgICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwicmVzaXplXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcbiAgICAgICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcbiAgICAgICAgIH1cbiAgICAgICAgaWYgKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcbiAgICAgICAgICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIildKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImNoaWxkTGlzdFwiOlxuICAgICAgICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLmF0dHIoXCJkYXRhLWV2ZW50c1wiLFwibXV0YXRlXCIpO1xuICAgICAgICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIildKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vbm90aGluZ1xuICAgIH1cbiAgfTtcblxuICBpZiAoJG5vZGVzLmxlbmd0aCkge1xuICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgb3IgbXV0YXRpb24gYWRkIGEgc2luZ2xlIG9ic2VydmVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gJG5vZGVzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgdmFyIGVsZW1lbnRPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24pO1xuICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUoJG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUsIGF0dHJpYnV0ZUZpbHRlcjogW1wiZGF0YS1ldmVudHNcIiwgXCJzdHlsZVwiXSB9KTtcbiAgICB9XG4gIH1cbn1cblxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZFNpbXBsZUxpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cbiAgVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZE9wZW5MaXN0ZW5lcigkZG9jdW1lbnQpO1xuICBUcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkQ2xvc2VMaXN0ZW5lcigkZG9jdW1lbnQpO1xuICBUcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkVG9nZ2xlTGlzdGVuZXIoJGRvY3VtZW50KTtcbiAgVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZENsb3NlYWJsZUxpc3RlbmVyKCRkb2N1bWVudCk7XG4gIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRUb2dnbGVGb2N1c0xpc3RlbmVyKCRkb2N1bWVudCk7XG5cbn1cblxuVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZEdsb2JhbExpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG4gIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRNdXRhdGlvbkV2ZW50c0xpc3RlbmVyKCRkb2N1bWVudCk7XG4gIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRSZXNpemVMaXN0ZW5lcigpO1xuICBUcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkU2Nyb2xsTGlzdGVuZXIoKTtcbiAgVHJpZ2dlcnMuSW5pdGlhbGl6ZXJzLmFkZENsb3NlbWVMaXN0ZW5lcigpO1xufVxuXG5cblRyaWdnZXJzLmluaXQgPSBmdW5jdGlvbigkLCBGb3VuZGF0aW9uKSB7XG4gIGlmICh0eXBlb2YoJC50cmlnZ2Vyc0luaXRpYWxpemVkKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsZXQgJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cbiAgICBpZihkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRTaW1wbGVMaXN0ZW5lcnMoKTtcbiAgICAgIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRHbG9iYWxMaXN0ZW5lcnMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJCh3aW5kb3cpLm9uKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICBUcmlnZ2Vycy5Jbml0aWFsaXplcnMuYWRkU2ltcGxlTGlzdGVuZXJzKCk7XG4gICAgICAgIFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRHbG9iYWxMaXN0ZW5lcnMoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgJC50cmlnZ2Vyc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmKEZvdW5kYXRpb24pIHtcbiAgICBGb3VuZGF0aW9uLlRyaWdnZXJzID0gVHJpZ2dlcnM7XG4gICAgLy8gTGVnYWN5IGluY2x1ZGVkIHRvIGJlIGJhY2t3YXJkcyBjb21wYXRpYmxlIGZvciBub3cuXG4gICAgRm91bmRhdGlvbi5JSGVhcllvdSA9IFRyaWdnZXJzLkluaXRpYWxpemVycy5hZGRHbG9iYWxMaXN0ZW5lcnNcbiAgfVxufVxuXG5leHBvcnQge1RyaWdnZXJzfTtcbiIsIi8qKlxuICogRmlsZSBoZXJvLWNhcm91c2VsLmpzXG4gKlxuICogQ3JlYXRlIGEgY2Fyb3VzZWwgaWYgd2UgaGF2ZSBtb3JlIHRoYW4gb25lIGhlcm8gc2xpZGUuXG4gKi9cbndpbmRvdy53ZHNIZXJvQ2Fyb3VzZWwgPSB7fTtcbiggZnVuY3Rpb24oIHdpbmRvdywgJCwgYXBwICkge1xuXG5cdC8vIENvbnN0cnVjdG9yLlxuXHRhcHAuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC5jYWNoZSgpO1xuXG5cdFx0aWYgKCBhcHAubWVldHNSZXF1aXJlbWVudHMoKSApIHtcblx0XHRcdGFwcC5iaW5kRXZlbnRzKCk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIENhY2hlIGFsbCB0aGUgdGhpbmdzLlxuXHRhcHAuY2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuJGMgPSB7XG5cdFx0XHR3aW5kb3c6ICQoIHdpbmRvdyApLFxuXHRcdFx0aGVyb0Nhcm91c2VsOiAkKCAnLmNhcm91c2VsJyApXG5cdFx0fTtcblx0fTtcblxuXHQvLyBDb21iaW5lIGFsbCBldmVudHMuXG5cdGFwcC5iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjLndpbmRvdy5vbiggJ2xvYWQnLCBhcHAuZG9TbGljayApO1xuXHRcdGFwcC4kYy53aW5kb3cub24oICdsb2FkJywgYXBwLmRvRmlyc3RBbmltYXRpb24gKTtcblxuXHR9O1xuXG5cdC8vIERvIHdlIG1lZXQgdGhlIHJlcXVpcmVtZW50cz9cblx0YXBwLm1lZXRzUmVxdWlyZW1lbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGFwcC4kYy5oZXJvQ2Fyb3VzZWwubGVuZ3RoO1xuXHR9O1xuXG5cdC8vIEFuaW1hdGUgdGhlIGZpcnN0IHNsaWRlIG9uIHdpbmRvdyBsb2FkLlxuXHRhcHAuZG9GaXJzdEFuaW1hdGlvbiA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gR2V0IHRoZSBmaXJzdCBzbGlkZSBjb250ZW50IGFyZWEgYW5kIGFuaW1hdGlvbiBhdHRyaWJ1dGUuXG5cdFx0bGV0IGZpcnN0U2xpZGUgPSBhcHAuJGMuaGVyb0Nhcm91c2VsLmZpbmQoICdbZGF0YS1zbGljay1pbmRleD0wXScgKSxcblx0XHRcdGZpcnN0U2xpZGVDb250ZW50ID0gZmlyc3RTbGlkZS5maW5kKCAnLmhlcm8tY29udGVudCcgKSxcblx0XHRcdGZpcnN0QW5pbWF0aW9uID0gZmlyc3RTbGlkZUNvbnRlbnQuYXR0ciggJ2RhdGEtYW5pbWF0aW9uJyApO1xuXG5cdFx0Ly8gQWRkIHRoZSBhbmltYXRpb24gY2xhc3MgdG8gdGhlIGZpcnN0IHNsaWRlLlxuXHRcdGZpcnN0U2xpZGVDb250ZW50LmFkZENsYXNzKCBmaXJzdEFuaW1hdGlvbiApO1xuXHR9O1xuXG5cdC8vIEFuaW1hdGUgdGhlIHNsaWRlIGNvbnRlbnQuXG5cdGFwcC5kb0FuaW1hdGlvbiA9IGZ1bmN0aW9uKCBldmVudCwgc2xpY2sgKSB7XG5cblx0XHRsZXQgc2xpZGVzID0gJCggJy5zbGlkZScgKSxcblx0XHRcdGFjdGl2ZVNsaWRlID0gJCggJy5zbGljay1jdXJyZW50JyApLFxuXHRcdFx0YWN0aXZlQ29udGVudCA9IGFjdGl2ZVNsaWRlLmZpbmQoICcuaGVyby1jb250ZW50JyApLFxuXG5cdFx0XHQvLyBUaGlzIGlzIGEgc3RyaW5nIGxpa2Ugc286ICdhbmltYXRlZCBzb21lQ3NzQ2xhc3MnLlxuXHRcdFx0YW5pbWF0aW9uQ2xhc3MgPSBhY3RpdmVDb250ZW50LmF0dHIoICdkYXRhLWFuaW1hdGlvbicgKSxcblx0XHRcdHNwbGl0QW5pbWF0aW9uID0gYW5pbWF0aW9uQ2xhc3Muc3BsaXQoICcgJyApLFxuXG5cdFx0XHQvLyBUaGlzIGlzIHRoZSAnYW5pbWF0ZWQnIGNsYXNzLlxuXHRcdFx0YW5pbWF0aW9uVHJpZ2dlciA9IHNwbGl0QW5pbWF0aW9uWzBdLFxuXG5cdFx0Ly8gVGhpcyBpcyB0aGUgYW5pbWF0ZS5jc3MgY2xhc3MuXG5cdFx0YW5pbWF0ZUNzcyA9IHNwbGl0QW5pbWF0aW9uWzFdO1xuXG5cdFx0Ly8gR28gdGhyb3VnaCBlYWNoIHNsaWRlIHRvIHNlZSBpZiB3ZSd2ZSBhbHJlYWR5IHNldCBhbmltYXRpb24gY2xhc3Nlcy5cblx0XHRzbGlkZXMuZWFjaCggZnVuY3Rpb24oIGluZGV4LCBlbGVtZW50ICkge1xuXG5cdFx0XHRsZXQgc2xpZGVDb250ZW50ID0gJCggdGhpcyApLmZpbmQoICcuaGVyby1jb250ZW50JyApO1xuXG5cdFx0XHQvLyBJZiB3ZSd2ZSBzZXQgYW5pbWF0aW9uIGNsYXNzZXMgb24gYSBzbGlkZSwgcmVtb3ZlIHRoZW0uXG5cdFx0XHRpZiAoIHNsaWRlQ29udGVudC5oYXNDbGFzcyggJ2FuaW1hdGVkJyApICkge1xuXG5cdFx0XHRcdC8vIEdldCB0aGUgbGFzdCBjbGFzcywgd2hpY2ggaXMgdGhlIGFuaW1hdGUuY3NzIGNsYXNzLlxuXHRcdFx0XHRsZXQgbGFzdENsYXNzID0gc2xpZGVDb250ZW50LmF0dHIoICdjbGFzcycgKS5zcGxpdCggJyAnICkucG9wKCApO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSBib3RoIGFuaW1hdGlvbiBjbGFzc2VzLlxuXHRcdFx0XHRzbGlkZUNvbnRlbnQucmVtb3ZlQ2xhc3MoIGxhc3RDbGFzcyApLnJlbW92ZUNsYXNzKCBhbmltYXRpb25UcmlnZ2VyICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBBZGQgYW5pbWF0aW9uIGNsYXNzZXMgYWZ0ZXIgc2xpZGUgaXMgaW4gdmlldy5cblx0XHRhY3RpdmVDb250ZW50LmFkZENsYXNzKCBhbmltYXRpb25DbGFzcyApO1xuXHR9O1xuXG5cdC8vIEFsbG93IGJhY2tncm91bmQgdmlkZW9zIHRvIGF1dG9wbGF5LlxuXHRhcHAucGxheUJhY2tncm91bmRWaWRlb3MgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIEdldCBhbGwgdGhlIHZpZGVvcyBpbiBvdXIgc2xpZGVzIG9iamVjdC5cblx0XHQkKCAndmlkZW8nICkuZWFjaCggZnVuY3Rpb24oKSB7XG5cblx0XHRcdC8vIExldCB0aGVtIGF1dG9wbGF5LiBUT0RPOiBQb3NzaWJseSBjaGFuZ2UgdGhpcyBsYXRlciB0byBvbmx5IHBsYXkgdGhlIHZpc2libGUgc2xpZGUgdmlkZW8uXG5cdFx0XHR0aGlzLnBsYXkoKTtcblx0XHR9KTtcblx0fTtcblxuXHQvLyBLaWNrIG9mZiBTbGljay5cblx0YXBwLmRvU2xpY2sgPSBmdW5jdGlvbigpIHtcblxuXHRcdGFwcC4kYy5oZXJvQ2Fyb3VzZWwub24oICdpbml0JywgYXBwLnBsYXlCYWNrZ3JvdW5kVmlkZW9zICk7XG5cblx0XHRhcHAuJGMuaGVyb0Nhcm91c2VsLnNsaWNrKHtcblx0XHRcdGF1dG9wbGF5OiB0cnVlLFxuXHRcdFx0YXV0b3BsYXlTcGVlZDogNTAwMCxcblx0XHRcdGFycm93czogZmFsc2UsXG5cdFx0XHRkb3RzOiBmYWxzZSxcblx0XHRcdGZvY3VzT25TZWxlY3Q6IHRydWUsXG5cdFx0XHR3YWl0Rm9yQW5pbWF0ZTogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0YXBwLiRjLmhlcm9DYXJvdXNlbC5vbiggJ2FmdGVyQ2hhbmdlJywgYXBwLmRvQW5pbWF0aW9uICk7XG5cdH07XG5cblx0Ly8gRW5nYWdlIVxuXHQkKCBhcHAuaW5pdCApO1xuXG59KCB3aW5kb3csIGpRdWVyeSwgd2luZG93Lndkc0hlcm9DYXJvdXNlbCApICk7XG4iLCIvKipcbiAqIEZpbGUganMtZW5hYmxlZC5qc1xuICpcbiAqIElmIEphdmFzY3JpcHQgaXMgZW5hYmxlZCwgcmVwbGFjZSB0aGUgPGJvZHk+IGNsYXNzIFwibm8tanNcIi5cbiAqL1xuZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKCAnbm8tanMnLCAnanMnICk7XG4iLCIvKipcbiAqIEZpbGUgc2tpcC1saW5rLWZvY3VzLWZpeC5qcy5cbiAqXG4gKiBIZWxwcyB3aXRoIGFjY2Vzc2liaWxpdHkgZm9yIGtleWJvYXJkIG9ubHkgdXNlcnMuXG4gKlxuICogTGVhcm4gbW9yZTogaHR0cHM6Ly9naXQuaW8vdldkcjJcbiAqL1xuKCBmdW5jdGlvbigpIHtcblx0dmFyIGlzV2Via2l0ID0gLTEgPCBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggJ3dlYmtpdCcgKSxcblx0XHRpc09wZXJhID0gLTEgPCBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggJ29wZXJhJyApLFxuXHRcdGlzSWUgPSAtMSA8IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCAnbXNpZScgKTtcblxuXHRpZiAoICggaXNXZWJraXQgfHwgaXNPcGVyYSB8fCBpc0llICkgJiYgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKSB7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaWQgPSBsb2NhdGlvbi5oYXNoLnN1YnN0cmluZyggMSApLFxuXHRcdFx0XHRlbGVtZW50O1xuXG5cdFx0XHRpZiAoICEgKCAvXltBLXowLTlfLV0rJC8gKS50ZXN0KCBpZCApICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggaWQgKTtcblxuXHRcdFx0aWYgKCBlbGVtZW50ICkge1xuXHRcdFx0XHRpZiAoICEgKCAvXig/OmF8c2VsZWN0fGlucHV0fGJ1dHRvbnx0ZXh0YXJlYSkkL2kgKS50ZXN0KCBlbGVtZW50LnRhZ05hbWUgKSApIHtcblx0XHRcdFx0XHRlbGVtZW50LnRhYkluZGV4ID0gLTE7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlbGVtZW50LmZvY3VzKCk7XG5cdFx0XHR9XG5cdFx0fSwgZmFsc2UgKTtcblx0fVxufSgpICk7XG4iLCIvKipcbiAqIEZpbGU6IGZvdW5kYXRpb24taW5pdC5qc1xuICpcbiAqIFdlIG11c3Qgc2ltcGx5IGluaXRpYWxpemUgRm91bmRhdGlvbiBmb3IgRm91bmRhdGlvbiBKUyB0byBkbyBpdHMgdGhpbmcuXG4gKi9cbmpRdWVyeSggZG9jdW1lbnQgKS5mb3VuZGF0aW9uKCk7IiwiLyoqXG4gKiBGaWxlIHdpbmRvdy1yZWFkeS5qc1xuICpcbiAqIEFkZCBhIFwicmVhZHlcIiBjbGFzcyB0byA8Ym9keT4gd2hlbiB3aW5kb3cgaXMgcmVhZHkuXG4gKi9cbndpbmRvdy53ZHNXaW5kb3dSZWFkeSA9IHt9O1xuKCBmdW5jdGlvbiggd2luZG93LCAkLCBhcHAgKSB7XG5cblx0Ly8gQ29uc3RydWN0b3IuXG5cdGFwcC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLmNhY2hlKCk7XG5cdFx0YXBwLmJpbmRFdmVudHMoKTtcblx0fTtcblxuXHQvLyBDYWNoZSBkb2N1bWVudCBlbGVtZW50cy5cblx0YXBwLmNhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjID0ge1xuXHRcdFx0J3dpbmRvdyc6ICQoIHdpbmRvdyApLFxuXHRcdFx0J2JvZHknOiAkKCBkb2N1bWVudC5ib2R5IClcblx0XHR9O1xuXHR9O1xuXG5cdC8vIENvbWJpbmUgYWxsIGV2ZW50cy5cblx0YXBwLmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuJGMud2luZG93LmxvYWQoIGFwcC5hZGRCb2R5Q2xhc3MgKTtcblx0fTtcblxuXHQvLyBBZGQgYSBjbGFzcyB0byA8Ym9keT4uXG5cdGFwcC5hZGRCb2R5Q2xhc3MgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuJGMuYm9keS5hZGRDbGFzcyggJ3JlYWR5JyApO1xuXHR9O1xuXG5cdC8vIEVuZ2FnZSFcblx0JCggYXBwLmluaXQgKTtcbn0oIHdpbmRvdywgalF1ZXJ5LCB3aW5kb3cud2RzV2luZG93UmVhZHkgKSApO1xuIl19
