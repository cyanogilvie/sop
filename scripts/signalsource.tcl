::sop::pclass create ::sop::signalsource {
	constructor {} { #<<<
		if {[self next] ne {}} next
		array set signals	{}
	}

	#>>>
	destructor { #<<<
		array unset signals
		if {[self next] ne {}} next
	}

	#>>>

	protected_property signals

	method signal_ref signal { #<<<
		if {![info exists signals($signal)]} {
			throw [list SOP INVALID_SIGNAL $signal] "Invalid signal ($signal)"
		}
		set signals($signal)
	}

	#>>>
	method signal_state signal { #<<<
		if {![info exists signals($signal)]} {
			throw [list SOP INVALID_SIGNAL $signal] "Invalid signal ($signal)"
		}
		$signals($signal) state
	}

	#>>>
	method waitfor {signal {timeout 0}} { #<<<
		if {![info exists signals($signal)]} {
			throw [list SOP INVALID_SIGNAL $signal] "Invalid signal ($signal)"
		}
		$signals($signal) waitfor true $timeout
	}

	#>>>
	method signals_available {} { #<<<
		lsort -dictionary -stride 2 -index 0 [array get signals]
	}

	#>>>
}


# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
