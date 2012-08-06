/*global define */
/*jslint nomen: true, plusplus: true, white: true, browser: true, node: true */

define(['dojo/_base/declare', './signal'], function(declare, signal){
	"use strict";
	return declare([signal], {
		mode: 'or',
		defaultval: false,
		_inputs: null,
		_sense: null,
		_inputseq: 0,

		constructor: function() {
			this._inputs = {};
			this._sense = {};
		},

		destructor: function() {
			var e;
			for (e in this._inputs) {
				if (this._inputs.hasOwnProperty(e)) {
					this._inputs[e].signal.detach_output(this._inputs[e].hid);
					delete this._inputs[e];
					delete this._sense[e];
				}
			}
		},

		setMode: function(newmode) {
			switch (newmode) {
				case 'and':
				case 'nand':
				case 'or':
				case 'nor':
					break;
				default:
					throw new Error('Invalid mode: "'+newmode+'": must be one of (and, nand, or, nor)');
			}
			this.mode = newmode;
			this._calc_o_state();
		},

		setDefault: function(newdefault) {
			this.defaultval = newdefault;
			this._calc_o_state();
		},

		attach_input: function(signal, sense) {
			var self, inputid;
			self = this;
			inputid = this._inputseq++;

			if (sense === undefined) {
				sense = 'normal';
			}

			if (sense === 'normal') {
				this._sense[inputid] = false;
			} else {
				this._sense[inputid] = true;
			}

			this._inputs[inputid] = {
				signal: signal,
				state: null
			};

			this._inputs[inputid].hid = signal.attach_output(function(newstate){
				self._input_update(inputid, newstate);
			}, function() {
				self._cleanup(inputid);
			});

			return inputid;
		},

		detach_input: function(inputid) {
			var input;

			delete this._sense[inputid];
			if (this._inputs[inputid]) {
				input = this._inputs[inputid];
				delete this._inputs[inputid];
				input.signal.detach_output(input.signal.hid);
			}

			this._calc_o_state();
		},

		detach_all_inputs: function() {
			var e;
			for (e in this._inputs) {
				if (this._inputs.hasOwnProperty(e)) {
					this.detach_input(this._inputs[e].hid);
				}
			}
		},

		explain_state: function() {
			return this._inputs;
		},

		explain_txt: function(depth) {
			var e, j, pad, firstdepth, txt;

			if (depth === undefined) {
				depth = 0;
			}
			firstdepth = (depth > 0) ? depth-1 : 0;

			txt = '"'+this.name+'": '+this._o_state+'['+this.defaultval+'] '+this.mode.toUpperCase()+' (\n';

			for (e in this._inputs) {
				if (this._inputs.hasOwnProperty(e)) {
					pad = '';
					for (j=0; j<depth+1; j++) {
						pad += '  ';
					}
					txt += pad;
					txt += '|'+(this._inputs[e].state ? 'T' : 'F')+'|';
					txt += this._sense[e] ? 'i' : ' ';
					txt += this._inputs[e].signal.explain_txt(depth+1);
				}
			}

			pad = '';
			for (j=0; j<depth; j++) {
				pad += '  ';
			}
			txt += pad + ')\n';

			return txt;
		},

		_calc_o_state: function() {
			var input, input_count, e, assume, mode, cont;

			mode = this.mode.toLowerCase();
			switch (mode) {
				case 'and':
				case 'nor':
					assume = true;
					break;
				case 'nand':
				case 'or':
					assume = false;
					break;
			}

			input_count = 0;
			for (e in this._inputs) {
				if (this._inputs.hasOwnProperty(e)) {
					input = this._inputs[e];
					if (input.state === null) {
						continue;
					}

					input_count++;

					cont = true;
					switch (mode) {
						case 'and':
						case 'nand':
							if (!input.state) {
								if (assume) {
									assume = false;
								} else {
									assume = true;
								}
								cont = false;
							}
							break;

						case 'or':
						case 'nor':
							if (input.state) {
								if (assume) {
									assume = false;
								} else {
									assume = true;
								}
								cont = false;
							}
							break;
					}

					if (!cont) {
						break;
					}
				}
			}

			if (input_count === 0) {
				this.set_state(this.defaultval);
			} else {
				this.set_state(assume);
			}
		},

		_input_update: function(inputid, newstate) {
			var e, keys;

			if (this._sense[inputid]) {
				newstate = !newstate;
			}

			if (!this._inputs[inputid]) {
				if (Object.keys) {
					keys = Object.keys(this._inputs);
				} else {
					keys = [];
					for (e in this._inputs) {
						if (this._inputs.hasOwnProperty(e)) {
							keys.push(e);
						}
					}
				}
				throw new Error('No input with id: "'+inputid+'", have: ('+keys.join(', ')+')');
			}
			this._inputs[inputid].state = newstate;

			this._calc_o_state();
		},

		_cleanup: function(inputid) {
			this.detach_input(inputid);
		}
	});
});
