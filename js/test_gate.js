var sig1, sig2, gate1, hid1, hid2, gid1, gid2;

sig1 = new Signal;
sig1.name = 'sig1';
sig2 = new Signal;
sig2.name = 'sig2';
gate1 = new Gate({
	name: 'Test gate1',
	mode: 'and',
	default: 0
});
sig1.log('debug', 'attaching sig1');
gid1 = gate1.attach_input(sig1);
sig1.log('debug', 'attaching sig2 inverted');
gid2 = gate1.attach_input(sig2, 'inverted');

sig1.log('debug', 'before: '+sig1.state());
sig1.set_state(true);
sig1.log('debug', 'after: '+sig1.state());
sig1.toggle_state();
sig1.log('debug', 'toggle: '+sig1.state());
hid1 = gate1.attach_output(function(newstate) {
	sig1.log('debug', 'in attached handler1 for gate1: '+newstate);
	sig1.log('debug', gate1.explain_txt());
}, function() {
	sig1.log('debug', 'in cleanup for handler1');
});
sig1.log('debug', 'debug output handler hid: '+hid1);
sig1.log('debug', 'setting state to 1...');
sig1.set_state(1);
sig1.log('debug', 'setting state to true...');
sig1.set_state(true);
//sig1.log('debug', 'detaching handler...');
//sig1.detach_output(hid1);
sig1.set_state(0);
sig1.set_state(1);
sig1.log('debug', 'toggling state...');
sig1.toggle_state();
sig1.log('debug', 'destroying sig1...');
sig1 = sig1.destroy();

// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
