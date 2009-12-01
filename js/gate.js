
function Gate(params) { //<<<
	Signal.call(this, params);

	this.mode = "or";
	this.defaultval = false;
	this._inputs = new Hash();
	this._sense = new Hash();
	this._inputseq = 0;

	if (typeof params != 'undefined') {
		if (typeof params.name != 'undefined') {
			this.name = params.name;
		}
		if (typeof params.mode != 'undefined') {
			this.mode = params.mode;
		}
		if (typeof params.defaultval != 'undefined') {
			if (params.defaultval) {
				this.defaultval = true;
			} else {
				this.defaultval = false;
			}
		}
	}
}

//>>>

Gate.prototype = new Signal();
Gate.prototype.constructor = Gate;

Gate.prototype.destroy = function() { //<<<
	var keys, i, input;
	keys = this._inputs.keys();
	for (i=0; i<keys.length; i++) {
		input = this._inputs.getItem(keys[i]);
		input.signal.detach_output(input.hid);
		this._inputs.removeItem(keys[i]);
		this._sense.removeItem(keys[i]);
	}

	return Signal.call(this);
};

//>>>
Gate.prototype.setMode = function(newmode) { //<<<
	switch (newmode) {
		case 'and':
		case 'nand':
		case 'or':
		case 'nor':
			break;
		default:
			throw('Invalid mode: "'+newmode+'": must be one of (and, nand, or, nor)');
	}
	this.mode = newmode;
	this._calc_o_state();
};

//>>>
Gate.prototype.setDefault = function(newdefault) { //<<<
	this.defaultval = newdefault;
	this._calc_o_state();
};

//>>>
Gate.prototype.attach_input = function(signal, sense) { //<<<
	var hid, self, inputid;
	self = this;
	inputid = this._inputseq++;

	if (typeof sense == 'undefined') {
		sense = 'normal';
	}

	if (sense == 'normal') {
		this._sense.setItem(inputid, false);
	} else {
		this._sense.setItem(inputid, true);
	}

	this._inputs.setItem(inputid, {
		signal: signal,
		state: null
	});

	hid = signal.attach_output(function(newstate) {
		self._input_update(inputid, newstate);
	}, function() {
		self._cleanup(inputid);
	});

	this._inputs.getItem(inputid).hid = hid;

	return inputid;
};

//>>>
Gate.prototype.detach_input = function(inputid) { //<<<
	var input;

	if (this._sense.hasItem(inputid)) {
		this._sense.removeItem(inputid);
	}
	if (this._inputs.hasItem(inputid)) {
		input = this._inputs.getItem(inputid);
		this._inputs.removeItem(inputid);
		input.signal.detach_output(input.signal.hid);
	}

	this._calc_o_state();
};

//>>>
Gate.prototype.detach_all_inputs = function() { //<<<
	var keys, i, input;

	keys = this._inputs.keys();
	for (i=0; i<keys.length; i++) {
		input = this._inputs.getInput(keys[i]);
		this.detach_input(input.hid);
	}
};

//>>>
Gate.prototype.explain_state = function() { //<<<
	return this._inputs;
};

//>>>
Gate.prototype.explain_txt = function(depth) { //<<<
	var i, j, pad, firstdepth, txt, keys, input;

	if (typeof depth == 'undefined') {
		depth = 0;
	}
	firstdepth = (depth > 0) ? depth-1 : 0;

	txt = '"'+this.name+'": '+this._o_state+'['+this.defaultval+'] '+this.mode.toUpperCase()+' (\n';

	keys = this._inputs.keys();
	for (i=0; i<keys.length; i++) {
		input = this._inputs.getItem(keys[i]);
		pad = '';
		for (j=0; j<depth+1; j++) {
			pad += '  ';
		}
		txt += pad;
		txt += '|'+(input.state ? 'T' : 'F')+'|';
		txt += this._sense.getItem(keys[i]) ? 'i' : ' ';
		txt += input.signal.explain_txt(depth+1);
	}

	pad = '';
	for (j=0; j<depth; j++) {
		pad += '  ';
	}
	txt += pad + ')\n';

	return txt;
};

//>>>
Gate.prototype._calc_o_state = function() { //<<<
	var i, keys, input, assume, new_o_state, mode, cont;

	mode = this.mode.toLowerCase();
	keys = this._inputs.keys();
	if (keys.length === 0) {
		new_o_state = this.defaultval;
	} else {
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

		for (i=0; i<keys.length; i++) {
			input = this._inputs.getItem(keys[i]);
			if (input.state === null) {
				continue;
			}

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

		new_o_state = assume;

		this.set_state(new_o_state);
	}
};

//>>>
Gate.prototype._input_update = function(inputid, newstate) { //<<<
	if (this._sense.getItem(inputid)) {
		if (newstate) {
			newstate = false;
		} else {
			newstate = true;
		}
	}

	if (!this._inputs.hasItem(inputid)) {
		throw('No input with id: "'+inputid+'", have: ('+this._inputs.keys().join(',')+')');
	}
	this._inputs.getItem(inputid).state = newstate;

	this._calc_o_state();
};

//>>>
Gate.prototype._cleanup = function(inputid) { //<<<
	this.detach_input(inputid);
};

//>>>

// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
