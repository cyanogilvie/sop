function Baselog() {
	this.log = null;

	if (typeof window != 'undefined' && typeof window.console != 'undefined') {
		this.log = function(lvl, msg) {
			if (typeof msg == 'undefined') {
				console.warn('Missing lvl parameter, '+lvl);
				return;
			}
			switch (lvl) {
				case 'debug':
					console.log(msg);
					break;

				case 'info':
					console.log(msg);
					break;

				case 'warn':
					console.warn(msg);
					break;

				case 'error':
					console.error(msg);
					break;

				default:
					console.log(msg);
					break;
			}
		}
	} else if (typeof print != 'undefined') {
		this.log = function(lvl, msg) {
			print(msg);
		}
	} else if (typeof dump != 'undefined') {
		this.log = function(lvl, msg) {
			dump(msg);
		}
	}
}


// vim: ft=javascript foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4

