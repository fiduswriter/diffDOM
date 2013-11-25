/**
 * Use TraceLogger to figure out function calls inside
 * JS objects by wrapping an object with a TraceLogger
 * instance.
 *
 * Pretty-prints the call trace (using unicode box code)
 * when tracelogger.toString() is called.
 */
(function TraceLogger(context) {
  "use strict";

  /**
   * Wrap an object by calling new TraceLogger(obj)
   *
   * If you're familiar with Python decorators, this
   * does roughly the same thing, adding pre/post
   * call hook logging calls so that you can see
   * what's going on.
   */
  var TraceLogger = function(obj) {
    this.padding = "";
    this.tick = 1;
    this.messages = [];
    var tl = this;
    var wrapkey = function(obj, key) {
      if(typeof obj[key] === "function") {
        // trace this function
        var oldfn = obj[key];
        obj[key] = function() {
          tl.fin(key, Array.prototype.slice.call(arguments));
          var result = oldfn.apply(obj, arguments);
          tl.fout(key, result);
          return result;
        };
      }
    };
    // can't use Object.keys for prototype walking
    for (var key in obj) {
      wrapkey(obj, key);
    }
    this.log("┌ TRACELOG START");
  };

  /**
   *
   */
  TraceLogger.prototype = {
    pad: "│   ",
    // called when entering a function
    fin: function(fn, args) {
      this.padding += this.pad;
      this.log("├─> entering "+fn, args);
    },
    // called when exiting a function
    fout: function(fn, result) {
      this.log("│<──┘ generated return value", result);
      this.padding = this.padding.substring(0,this.padding.length-this.pad.length);
    },
    // log message formatting
    format: function(s, tick) {
      var nf = function(t) {
        t = "" + t;
        while(t.length<4) { t = "0" + t; }
        return t;
      }
      return nf(tick) + "> " + this.padding + s;
    },
    // log a trace message
    log: function() {
      var s = Array.prototype.slice.call(arguments);
      var stringCollapse = function(v) {
        if(!v) {
          return "<falsey>";
        }
        if(typeof v === "string") {
          return v;
        }
        if(v instanceof HTMLElement) {
          return v.outerHTML || "<empty>";
        }
        if(v instanceof Array) {
          return "["+v.map(stringCollapse).join(",")+"]";
        }
        return v.toString() || v.valueOf() || "<unknown>";
      };
      s = s.map(stringCollapse).join(", ");
      this.messages.push(this.format(s, this.tick++));
    },
    // turn the log into a structured string with
    // unicode box codes to make it a sensible trace.
    toString: function() {
      var cap = "×   ";
      var terminator = "└───";
      while(terminator.length <= this.padding.length + this.pad.length) { terminator += cap; }
      var _ = this.padding;
      this.padding = "";
      terminator = this.format(terminator, this.tick);
      this.padding = _;
      return this.messages.join("\n") + "\n" + terminator;
    }
  };

  /**
   * AMD object-generating function return
   */
  if(context.define) {
    return function() {
      return TraceLogger;
    };
  }

  /**
   * Node.js require as module
   */
  if(context.require) {
    return TraceLogger;
  }

  /**
   * None of the above implies we're in the browser,
   * in a plain old JS context.
   */
  context.TraceLogger = TraceLogger;
}(this));
