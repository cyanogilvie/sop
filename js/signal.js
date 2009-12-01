//var g_update_output_depth = 0;

function Signal(params) { //<<<
	// Public
	if (typeof params == 'undefined') {
		console.log('Signal lameness');
		return;
	}
	Baselog.call(this, params);
	this.name = "";

	if (typeof params != 'undefined') {
		if (typeof params.name != 'undefined') {
			this.name = params.name;
		}
	}

	// Private
	this._outputs = new Hash();
	//console.log('Constructing new Signal: ('+this.name+')');
	this._cleanups = new Hash();
	this._o_state = false;
	this._handler_seq = 0;
}

//>>>
Signal.prototype = new Baselog();
Signal.prototype.constructor = Signal;

Signal.prototype.destroy = function() { //<<<
	//this.log('debug', 'in destructor');
	//console.log('in signal destructor');
	var i, keys;
	keys = this._outputs.keys();
	for (i=0; i<keys.length; i++) {
		//this.log('debug', 'destructor detaching output "'+keys[i]+'"');
		this.detach_output(keys[i]);
	}
};

//>>>
Signal.prototype.state = function() { //<<<
	return this._o_state;
};

//>>>
Signal.prototype.set_state = function(newstate) { //<<<
	var normstate;
	// Normalize to boolean
	if (newstate) {
		normstate = true;
	} else {
		normstate = false;
	}

	this._on_set_state(normstate);
	if (this._o_state === normstate) {
		return;
	}
	//this.log('debug', '"'+this.name+'" setting output to '+normstate+' from ('+this._o_state+')');
	this._o_state = normstate;
	//this.log('debug', '"'+this.name+'" updating outputs to '+this._o_state);
	this._update_outputs();
};

//>>>
Signal.prototype.toggle_state = function() { //<<<
	if (this._o_state) {
		this.set_state(false);
	} else {
		this.set_state(true);
	}
};

//>>>
Signal.prototype.attach_output = function(handler, cleanup) { //<<<
	var myseq;
	myseq = this._handler_seq++;
	this._outputs.setItem(myseq, {
		handler: handler,
		cleanup: cleanup
	});

	this._update_output(myseq);

	return myseq;
};

//>>>
Signal.prototype.detach_output = function(handler_id) { //<<<
	var cleanup;

	if (!this._outputs.hasItem(handler_id)) {
		return;
	}
	cleanup = this._outputs.getItem(handler_id).cleanup;
	if (cleanup) {
		cleanup();
	}
	this._outputs.removeItem(handler_id);
};

//>>>
Signal.prototype.name = function() { //<<<
	return this.name;
};

//>>>
Signal.prototype.explain_txt = function(depth) { //<<<
	var pad;
	if (typeof depth == 'undefined') {
		depth = 0;
	}
	pad = '';
	/*
	var i;
	for (i=0; i<depth; i++) {
		pad += '  ';
	}
	*/
	//this.log('debug', '"'+this.name+'" explain_txt: this._o_state: '+this._o_state);
	return pad+' "'+this.name+'": '+this._o_state+'\n';
};

//>>>
Signal.prototype._update_output = function(handler_id) { //<<<
	var self, statenow;
	self = this;
	statenow = this._o_state;

	/*
	setTimeout(function() {
		try {
			self._outputs.getItem(handler_id).handler(statenow);
		} catch(e) {
			log('error', '"'+self.name+'" error updating output ('+statenow+') handler_id: ('+handler_id+') '+e);
		}
	}, 0);
	*/
	/*
	try {
		self._outputs.getItem(handler_id).handler(statenow);
	} catch(e) {
		this.log('error', '"'+self.name+'" error updating output ('+statenow+') handler_id: ('+handler_id+') '+e);
	}
	*/
	/*
	g_update_output_depth++;
	self.log('debug', '-> "'+self.name+'" _update_output calling to update state ('+self._o_state+') '+g_update_output_depth);
	*/
	self._outputs.getItem(handler_id).handler(statenow);
	/*
	self.log('debug', '<- "'+self.name+'" _update_output calling to update state ('+self._o_state+') '+g_update_output_depth);
	g_update_output_depth--;
	*/
};

//>>>
Signal.prototype._update_outputs = function() { //<<<
	var keys, i;

	keys = this._outputs.keys();
	for (i=0; i<keys.length; i++) {
		//this.log('debug', '=> "'+this.name+'" _update_outputs '+i+' calling to update state ('+this._o_state+') '+ g_update_output_depth);
		this._update_output(keys[i]);
		//this.log('debug', '<= "'+this.name+'" _update_outputs '+i+' calling to update state ('+this._o_state+') '+ g_update_output_depth);
	}
};

//>>>
Signal.prototype._on_set_state = function(pending) { //<<<
	// Nothing
};

//>>>


// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
