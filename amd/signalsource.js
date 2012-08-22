/*global define */
/*jslint nomen: true, plusplus: true, white: true, browser: true, node: true */

define([
	'dojo/_base/declare'
], function(
	declare
){
"use strict";
return declare([], {
	signals: null,
	_signals: null,			// Deprecated

	'-chains-': {
		destroy: 'before'
	},

	constructor: function(props) {
		declare.safeMixin(this, props);
		this.signals = {};
		this._signals = this.signals;
	},

	destroy: function() {
		var e;

		for (e in this.signals) {
			if (this.signals.hasOwnProperty(e)) {
				this.signals[e].destroy();
				delete this.signals[e];
			}
		}
	},

	signal_ref: function(name) {
		if (!this.signals[name]) {
			throw new Error('Signal '+name+' doesn\'t exist');
		}
		return this.signals[name];
	},

	signal_state: function(name) {
		if (!this.signals[name]) {
			throw new Error('Signal '+name+' doesn\'t exist');
		}
		return this.signals[name].state();
	},

	signals_available: function() {
		var e, res = [];

		for (e in this.signals) {
			if (this.signals.hasOwnProperty(e)) {
				res.push(e);
			}
		}

		return res;
	}
});
});
