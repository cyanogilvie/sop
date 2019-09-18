::sop::pclass create ::sop::domino {
	property name	""
	property delay	"idle"

	protected_property after_id	""
	protected_property outputs	{}
	protected_property inputs	[dict create]
	protected_property lock		0

	constructor {accessvar args} { #<<<
		my configure {*}$args

		if {$name eq ""} {
			my configure -name $accessvar
		}

		upvar 1 $accessvar scopevar
		set scopevar [self]
		trace variable scopevar u [my code _scopevar_unset]
	}

	#>>>

	destructor { #<<<
		after cancel $after_id
		foreach dom_obj [dict keys $inputs] {
			my detach_input $dom_obj
		}
	}

	#>>>

	method tip args { #<<<
		if {$lock > 0} return

		if {$after_id ne ""} return
		set after_id	[after $delay [my code _tip_outputs]]
	}

	#>>>
	method tip_now args { #<<<
		my _tip_outputs
	}

	#>>>
	method attach_output handler { #<<<
		if {$handler ni $outputs} {
			lappend outputs $handler
			return 1
		} else {
			return 0
		}
	}

	#>>>
	method detach_output handler { #<<<
		set outputs	[lsearch -inline -all -not $outputs $handler]
	}

	#>>>
	method attach_input dom_obj { #<<<
		if {![info object isa typeof $dom_obj sop::domino]} {
			error "$dom_obj isn't a sop::domino"
		}

		dict set inputs $dom_obj	1

		$dom_obj attach_output [my code tip]
	}

	#>>>
	method detach_input dom_obj { #<<<
		if {![info object isa typeof $dom_obj sop::domino]} {
			error "$dom_obj isn't a Domino"
		}

		dict unset inputs $dom_obj

		$dom_obj detach_output [my code tip]
	}

	#>>>
	method pending {} { #<<<
		expr {$after_id ne ""}
	}

	#>>>
	method force_if_pending {} { #<<<
		if {$after_id ne ""} {my tip_now}
	}

	#>>>
	method cancel_if_pending {} { #<<<
		if {$after_id ne ""} {
			after cancel $after_id
			set after_id	""
		}
	}

	#>>>
	method lock {} { #<<<
		incr lock
	}

	#>>>
	method unlock {} { #<<<
		incr lock -1
		if {$lock < 0} {
			my log error "[self] lock went below zero!: $lock"
		}
	}

	#>>>

	method _tip_outputs {} { #<<<
		after cancel $after_id
		set after_id	""
		foreach output $outputs {
			try {
				coroutine coro_domino_output_[incr ::coro_seq] {*}$output
			} on error {errmsg options} {
				my log error "\nerror updating output ($output):\n\t$errmsg\n[dict get $options -errorinfo]"
			}
		}
	}

	#>>>
	method _scopevar_unset {args} { #<<<
		delete object [self]
	}

	#>>>
}

# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
