//var g_update_output_depth = 0;

function Signal(params) { //<<<
	// Public
	if (typeof params == 'undefined') {
		return;
	}
	this.name = '';

	if (typeof params != 'undefined') {
		if (typeof params.name != 'undefined') {
			this.name = params.name;
		}
	}

	// Private
	this._outputs = new Hash();
	//log.debug('Constructing new Signal: ('+this.name+')');
	this._cleanups = new Hash();
	this._o_state = false;
	this._handler_seq = 0;
}

//>>>

Signal.prototype.destroy = function() { //<<<
	//log.debug('in destructor');
	//log.debug('in signal destructor');
	var i, keys;
	keys = this._outputs.keys();
	for (i=0; i<keys.length; i++) {
		//log.debug('destructor detaching output "'+keys[i]+'"');
		this.detach_output(keys[i]);
	}
	return null;
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
	this._o_state = normstate;
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
	//log.debug('"'+this.name+'" explain_txt: this._o_state: '+this._o_state);
	return pad+' "'+this.name+'": '+this._o_state+'\n';
};

//>>>
Signal.prototype._update_output = function(handler_id) { //<<<
	var handler_info;
	if (this._outputs.hasItem(handler_id)) {
		handler_info = this._outputs.getItem(handler_id);
		if (handler_info.handler) {
			handler_info.handler(this._o_state);
		} else {
			log.error('Something went badly wrong with handler_info: ', handler_info);
		}
	} else {
		log.warn('Signal "'+this.name+'" output ('+handler_id+') has vanished');
	}
};

//>>>
Signal.prototype._update_outputs = function() { //<<<
	var keys, i;

	keys = this._outputs.keys();
	for (i=0; i<keys.length; i++) {
		this._update_output(keys[i]);
	}
};

//>>>
Signal.prototype._on_set_state = function(pending) { //<<<
	// Nothing
};

//>>>


// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
