'use strict';

/**
 * Formatters — pure presentation helpers shared by every view.
 * No state, no DOM. Namespace object rather than a class: there is
 * nothing to instantiate.
 */
var Formatters = {
  pad: function (n) {
    return String(n).padStart(2, '0');
  },

  /** Value for a datetime-local input, to the second. */
  fmtInput: function (ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate()) +
      'T' + this.pad(d.getHours()) + ':' + this.pad(d.getMinutes()) + ':' + this.pad(d.getSeconds());
  },

  /** Now, to the minute — the default for a datetime-local input. */
  nowValue: function () {
    return this.fmtInput(Date.now()).slice(0, 16);
  },

  /** Full readable timestamp: YYYY-MM-DD HH:MM:SS. */
  fmtDateTime: function (ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate()) +
      ' ' + this.pad(d.getHours()) + ':' + this.pad(d.getMinutes()) + ':' + this.pad(d.getSeconds());
  },

  /** Date only: YYYY-MM-DD (local), for the archive filter and Date column. */
  dateStr: function (ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + this.pad(d.getMonth() + 1) + '-' + this.pad(d.getDate());
  },

  /** Elapsed time as HH:MM:SS. */
  fmtDuration: function (ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return this.pad(h) + ':' + this.pad(m) + ':' + this.pad(s);
  },

  /** Collapse tabs/newlines so one value stays one Excel cell. */
  clean: function (text) {
    return String(text).replace(/[\t\r\n]+/g, ' ').trim();
  },

  /** Parse a datetime-local string to epoch ms (NaN when empty/invalid). */
  parseLocal: function (value) {
    return value ? new Date(value).getTime() : NaN;
  }
};
