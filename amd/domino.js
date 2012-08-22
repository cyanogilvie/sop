/*global define */
/*jslint nomen: true, plusplus: true, white: true, browser: true, node: true */

define(['dojo/_base/declare', 'cflib/log'], function(declare, log){
	"use strict";
	return declare([], {
		name:			'',
		delay:			0,

		"-chains-": {
			destroy: 'before'
		},

		_after_id:		null,
		_handler_seq:	0,
		_outputs:		null,
		_lock:			0,

		constructor: function(props) {
			declare.safeMixin(this, props);
			this._outputs = {};
		},

		destroy: function() {
			this._cancel_after_id();
		},

		tip: function() {
			var delay, self;

			if (this._lock > 0) {
				return;
			}

			if (this._after_id !== null) {
				return;
			}

			if (this.delay === 'idle') {
				delay = 0;
			} else {
				delay = this.delay;
			}

			self = this;
			this._after_id = setTimeout(function(){
				self._tip_outputs();
			}, delay);
		},

		tip_now: function() {
			this._tip_outputs();
		},

		attach_output: function(handler) {
			var myseq;
			myseq = this._handler_seq++;
			this._outputs[myseq] = {
				handler: handler
			};

			return myseq;
		},

		detach_output: function(handler_id) {
			delete this._outputs[handler_id];
		},

		pending: function() {
			return this._after_id !== null;
		},

		force_if_pending: function() {
			if (this.pending()) {
				this.tip_now();
			}
		},

		lock: function() {
			this._lock++;
		},

		unlock: function() {
			this._lock--;
			if (this._lock < 0) {
				log.warn('domino lock went below 0');
				this._lock = 0;
			}
		},

		_cancel_after_id: function() {
			if (this._after_id) {
				clearTimeout(this._after_id);
				this._after_id = null;
			}
		},

		_tip_outputs: function() {
			var e;

			this._cancel_after_id();

			for (e in this._outputs) {
				if (this._outputs.hasOwnProperty(e)) {
					try {
						this._outputs[e].handler();
					} catch (err) {
						log.error('Error dispatching domino "'+this.name+'" output: '+err+'\n'+err.stack);
					}
				}
			}
		}
	});
});
