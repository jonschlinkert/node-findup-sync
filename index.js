'use strict';

/**
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var isGlob = require('is-glob');
var resolveDir = require('resolve-dir');
var mm = require('micromatch');

/**
 * @param  {String|Array} `pattern` Glob pattern or file path(s) to match against.
 * @param  {Object} `options` Options to pass to [micromatch]. Note that if you want to start in a different directory than the current working directory, specify the `options.cwd` property here.
 * @return {String} Returns the first matching file.
 * @api public
 */

module.exports = function(patterns, options) {
  if (typeof patterns === 'string') {
    return lookup(patterns, options);
  }

  if (!Array.isArray(patterns)) {
    throw new TypeError('findup-sync expects a string or array as the first argument.');
  }

  var len = patterns.length, i = -1;
  while (++i < len) {
    var res = lookup(patterns[i], options);
    if (res) {
      return res;
    }
  }

  return null;
};

function lookup(pattern, options) {
  options = options || {};
  var cwd = resolveDir(options.cwd || '');
  if (isGlob(pattern)) {
    return matchFile(cwd, pattern, options);
  } else {
    return findFile(cwd, pattern);
  }
}

function matchFile(cwd, pattern, opts) {
  var isMatch = mm.matcher(pattern, opts);
  var files = fs.readdirSync(cwd);
  var len = files.length, i = -1;

  while (++i < len) {
    var name = files[i];
    var fp = path.join(cwd, name);
    if (isMatch(name) || isMatch(fp)) {
      return fp;
    }
  }

  var dir = path.dirname(cwd);
  if (dir === cwd) {
    return null;
  }
  return matchFile(dir, pattern, opts);
}

function findFile(cwd, filename) {
  var fp = cwd ? (cwd + '/' + filename) : filename;
  if (fs.existsSync(fp)) {
    return fp;
  }

  var segs = cwd.split(path.sep);
  var len = segs.length;

  while (len--) {
    cwd = segs.slice(0, len).join('/');
    fp = cwd + '/' + filename;
    if (fs.existsSync(fp)) {
      return fp;
    }
  }
  return null;
}
