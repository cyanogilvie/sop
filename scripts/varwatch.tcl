# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4

# Signals:
#	onchange()					- Fired when a variable changes value
#	onchange_info(n1, n2, op)	- Fired when a variable changes value

::sop::pclass create ::sop::varwatch {
	superclass ::sop::signal

	pclass_config {
		constructor_auto_next	0
	}

	variable {*}{
		watchvars
		lock
		afterids
		dominos
	}

	constructor {accessvar args} { #<<<
		if {[llength [info commands log]] == 0} {
			proc log {lvl msg} {
				puts stderr "domino $lvl: $msg"
			}
		}
		set watchvars		{}
		set lock			0
		set afterids		{}
		array set dominos	{}

		::sop::domino new dominos(onchange) -name "[self] onchange"

		$dominos(onchange) attach_output [namespace code {my invoke_handlers onchange}]

		upvar 1 $accessvar scopevar
		next $accessvar

		my configure {*}$args
	}

	#>>>
	destructor { #<<<
		if {[info exists dominos(onchange)] && [info object isa object $dominos(onchange)]} {
			$dominos(onchange) destroy
			array unset dominos onchange
		}
		foreach var $watchvars {
			my detach_dirtyvar $var
		}
		foreach afterid $afterids {
			after cancel $afterid
		}
		set afterids	{}
		if {[self next] ne ""} next
	}

	#>>>

	method attach_dirtyvar varname { #<<<
		if {$varname ni $watchvars} {
			lappend watchvars	$varname
		}
		trace add variable $varname {write unset} [namespace code {my _var_update}]
	}

	#>>>
	method detach_dirtyvar varname { #<<<
		set watchvars	[lsearch -inline -all -not $watchvars $varname]
		trace remove variable $varname {write unset} [namespace code {my _var_update}]
	}

	#>>>
	method arm {} {incr lock -1}
	method disarm {} {incr lock}
	method is_armed {} {expr {$lock > 0}}
	method force_if_pending {} { #<<<
		set pending		$afterids
		set afterids	{}
		foreach afterid $pending {
			set script	[lindex [after info $afterid] 0]
			after cancel $afterid
			if {$script ne ""} {
				try {
					uplevel #0 $script
				} on error {errmsg options} {
					log error [dict get $options -errorinfo]
				}
			}
		}
		$dominos(onchange) force_if_pending
	}

	#>>>
	method _on_set_state pending { #<<<
		set pending		$afterids
		set afterids	{}
		foreach afterid $pending {
			after cancel $afterid
		}
	}

	#>>>
	method _var_update {n1 n2 op} { #<<<
		if {$lock > 0} return
		my set_state 1
		if {[my handlers_available onchange_info]} {
			lappend afterids	[after idle [namespace code [list my fire_onchange $n1 $n2 $op]]]
		}
		$dominos(onchange) tip
	}

	#>>>
	method _fire_onchange {n1 n2 op} { #<<<
		my invoke_handlers onchange_info $n1 $n2 $op
	}

	#>>>
}


