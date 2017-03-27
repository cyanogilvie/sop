/*global define */
/*jslint nomen: true, plusplus: true, white: true, browser: true, node: true */

define([
	'dojo/_base/declare',
	'cflib/setters',
	'cflib/log'
], function(
	declare,
	_Setters,
	log
){
	"use strict";
	return declare([_Setters], {
		name: '',

		_outputs: null,
		_cleanups: null,
		_o_state: false,
		_handler_seq: 0,

		'-chains-': {
			postMixInProperties: 'after',
			destroy: 'before'
		},

		constructor: function(props) {
			this._outputs = {};
			this._cleanups = {};
		},

		destroy: function() {
			var e;

			for (e in this._outputs) {
				if (this._outputs.hasOwnProperty(e)) {
					this.detach_output(e);
				}
			}
		},

		state: function() {
			return this._o_state;
		},


		set_state: function(newstate) {
			var normstate = !!newstate;

			this._on_set_state(normstate);
			if (this._o_state === normstate) {
				return;
			}
			this._o_state = normstate;
			this._update_outputs();
		},

		toggle_state: function() {
			this.set_state(!this._o_state);
		},

		attach_output: function(handler, cleanup) {
			var myseq, self = this;
			myseq = this._handler_seq++;
			this._outputs[myseq] = {
				handler: handler,
				cleanup: cleanup
			};

			this._update_output(myseq);

			return {
				remove: function(){self.detach_output(myseq);},
				toString: function(){return String(myseq);}
			}
		},

		detach_output: function(handler_id) {
			var cleanup;

			if (!this._outputs[handler_id]) {
				return;
			}
			cleanup = this._outputs[handler_id].cleanup;
			if (cleanup) {
				cleanup();
			}
			delete this._outputs[handler_id];
		},

		explain_txt: function(depth) {
			var pad, i;
			if (depth === undefined) {
				depth = 0;
			}
			pad = '';
			for (i=0; i<depth; i++) {
				pad += '  ';
			}
			return pad+' "'+this.name+'": '+this._o_state+'\n';
		},

		_update_output: function(handler_id) {
			var handler_info;
			if (this._outputs[handler_id]) {
				handler_info = this._outputs[handler_id];
				if (handler_info.handler) {
					handler_info.handler(this._o_state);
				} else {
					log.error('Something went badly wrong with handler_info: ', handler_info);
				}
			} else {
				log.warn('Signal "'+this.name+'" output ('+handler_id+') has vanished');
			}
		},

		_update_outputs: function() {
			var e;
			for (e in this._outputs) {
				if (this._outputs.hasOwnProperty(e)) {
					this._update_output(e);
				}
			}
		},

		_on_set_state: function(pending) {}
	});
});
