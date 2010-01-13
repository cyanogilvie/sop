// vim: ft=javascript foldmethod=marker foldmarker=<<<<,>>>> ts=4 shiftwidth=4

function Domino(params) {
	if (typeof params == 'undefined') {
		return;
	}

	this.name = '';
	this.delay = 0;

	this._after_id = null;
	this._handler_seq = 0;
	this._outputs = new Hash();
	this._lock = 0;

	if (typeof params.name != 'undefined') {
		this.name = params.name;
	}
	if (typeof params.delay != 'undefined') {
		this.delay = params.delay;
	}
}

Domino.prototype = new Baselog();
Domino.prototype.constructor = Domino;

Domino.prototype.destructor = function() { //<<<<
	this._cancel_after_id();
	return null;
};

//>>>>
Domino.prototype.tip = function() { //<<<<
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
};

//>>>>
Domino.prototype.tip_now = function() { //<<<<
	this._tip_outputs();
};

//>>>>
Domino.prototype.attach_output = function(handler) { //<<<<
	var myseq;
	myseq = this._handler_seq++;
	this._outputs.setItem(myseq, {
		handler: handler
	});

	return myseq;
};

//>>>>
Domino.prototype.detach_output = function(handler_id) { //<<<<
	if (!this._outputs.hasItem(handler_id)) {
		return;
	}

	this._outputs.removeItem(handler_id);
};

//>>>>
Domino.prototype.pending = function() { //<<<<
	if (this._after_id !== null) {
		return true;
	} else {
		return false;
	}
};

//>>>>
Domino.prototype.force_if_pending = function() { //<<<<
	if (this.pending()) {
		this.tip_now();
	}
};

//>>>>
Domino.prototype.lock = function() { //<<<<
	this._lock++;
};

//>>>>
Domino.prototype.unlock = function() { //<<<<
	this._lock--;
	if (this._lock < 0) {
		this.log('warning', 'domino lock went below 0');
		this._lock = 0;
	}
};

//>>>>

Domino.prototype._cancel_after_id = function() { //<<<<
	if (this._after_id !== null) {
		clearTimeout(this._after_id);
		this._after_id = null;
	}
};

//>>>>
Domino.prototype._tip_outputs = function() { //<<<<
	var keys, i;

	this._cancel_after_id();

	keys = this._outputs.keys();
	for (i=0; i<keys.length; i++) {
		try {
			this._outputs.getItem(keys[i]).handler();
		} catch (e) {
			this.log('error', 'Error dispatching domino "'+this.name+'" output: '+e);
		}
	}
};

//>>>>
