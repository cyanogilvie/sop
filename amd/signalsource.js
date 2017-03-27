/*global define */
/*jslint nomen: true, plusplus: true, white: true, browser: true, node: true */

define([
	'dojo/_base/declare',
	'cflib/log'
], function(
	declare,
	log
){
//"use strict";
return declare(null, {
	signals: null,
	_signals: null,			// Deprecated

	constructor: function(props) {
		this.signals = {};
		this._signals = this.signals;
	},

	destroy: function() {
		var e;

		for (e in this.signals) {
			if (this.signals.hasOwnProperty(e)) {
				if (!this.signals[e] || !this.signals[e].destroy) {
					log.error('Expecting to destroy signal '+e+', but it was already gone:',this.signals[e]);
				} else {
					this.signals[e].destroy();
				}
				delete this.signals[e];
			}
		}

		this.inherited(arguments);
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
