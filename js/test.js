var sig1, sig2, hid1, hid2;

sig1 = new Signal;
sig2 = new Signal;

sig1.log('debug', 'before: '+sig1.state());
sig1.set_state(true);
sig1.log('debug', 'after: '+sig1.state());
sig1.toggle_state();
sig1.log('debug', 'toggle: '+sig1.state());
hid1 = sig1.attach_output(function(newstate) {
	sig1.log('debug', 'in attached handler1 for sig1: '+newstate);
}, function() {
	sig1.log('debug', 'in cleanup for handler1');
});
hid2 = sig1.attach_output(function(newstate) {
	sig1.log('debug', 'in attached handler2 for sig1: '+newstate);
}, function() {
	sig1.log('debug', 'in cleanup for handler2');
});
sig1.log('debug', 'setting state to 1...');
sig1.set_state(1);
sig1.log('debug', 'setting state to true...');
sig1.set_state(true);
sig1.log('debug', 'detaching handler...');
sig1.detach_output(hid1);
sig1.set_state(0);
sig1.set_state(1);
sig1.log('debug', 'toggling state...');
sig1.toggle_state();
sig1.log('debug', 'destroying sig1...');
sig1 = sig1.destroy();

// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
