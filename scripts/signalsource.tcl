::sop::pclass create ::sop::signalsource {
	constructor {} { #<<<
		if {[self next] ne {}} next
		array set signals	{}
		array set dominos	{}
	}

	#>>>
	destructor { #<<<
		array unset signals
		if {[self next] ne {}} next
	}

	#>>>

	protected_property signals
	protected_property dominos

	method signal_ref signal { #<<<
		if {![info exists signals($signal)]} {
			throw [list SOP INVALID_SIGNAL $signal] "Invalid signal ($signal)"
		}
		set signals($signal)
	}

	#>>>
	method domino_ref domino { #<<<
		if {![info exists dominos($domino)]} {
			throw [list SOP INVALID_DOMINO $domino] "Invalid domino ($domino)"
		}
		set dominos($domino)
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
	method dominos_available {} { #<<<
		lsort -dictoinary -stride 2 -index 0 [array get dominos]
	}

	#>>>
}


# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
