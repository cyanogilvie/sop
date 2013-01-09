/*jslint white: true, nomen: true */
/*global define */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/registry',
	'./gate'
], function(
	declare,
	lang,
	registry,
	Gate
){
//'use strict';
return declare([Gate], {
	widget: null,
	toggles: null,

	postMixInProperties: function(){
		this.inherited(arguments);
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
		var e, idx = this._o_state ? 1 : 0, widgets, widget, i;

		widgets = this.widget instanceof Array ? this.widget : [this.widget];
		for (i=0; i<widgets.length; i++) {
			widget = widgets[i];
			if (lang.isObject(widget) && !widget._beingDestroyed && widget.set !== undefined) {
				for (e in this.toggles) {
					if (this.toggles.hasOwnProperty(e)) {
						widget.set(e, this.toggles[e][idx]);
					}
				}
			}
		}
	},

	// Deprecated - use attach_input
	attach_signal: function(/* args */) {
		return this.attach_input.apply(this, arguments);
	}
});
});
