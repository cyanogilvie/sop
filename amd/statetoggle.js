/*jslint white: true, nomen: true */
/*global define */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/registry',
	'cflib/setters',
	'./gate'
], function(
	declare,
	lang,
	registry,
	Setters,
	Gate
){
'use strict';
return declare([Setters, Gate], {
	widget: null,
	toggles: null,

	constructor: function(){
		this.attach_output(lang.hitch(this, '_apply_toggles'));
	},

	_setWidgetAttr: function(value) {
		if (typeof value === 'string') {
			this._set('widget', registry.byId(value));
		} else {
			this._set('widget', value);
		}
	},

	_setTogglesAttr: function(value) {
		var e;
		for (e in this.toggles) {
			if (this.toggles.hasOwnProperty(e)) {
				if (e[0] === '-') {
					// Normalize toggles to not have leading -
					this.toggles[e.substr(1)] = this.toggles[e];
					delete this.toggles[e];
				}
			}
		}
		this._set('toggles', value);
	},

	_apply_toggles: function() {
		var e, idx = this._o_state ? 1 : 0;
		if (!lang.isObject(this.widget) || this.widget.set === undefined) {
			return;
		}
		for (e in this.toggles) {
			if (this.toggles.hasOwnProperty(e)) {
				this.widget.set(e, this.toggles[e][idx]);
			}
		}
	},

	// Deprecated - use attach_input
	attach_signal: function(/* args */) {
		this.attach_input.apply(this, arguments);
	}
});
});
