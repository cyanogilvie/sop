::sop::pclass create ::sop::signal {
	property name		""
	property debugmode	0
	property output_handler_warntime	3000

	variable {*}{
		outputs
		cleanups
		o_state
		afterids
		changewait
		seq
	}

	constructor {accessvar args} { #<<<
		set name		""
		set outputs		{}
		set o_state		0
		set seq			0

		if {[llength [info commands log]] == 0} {
			proc log {lvl msg} {
				puts stderr "Signal $lvl: $msg"
			}
		}
		set cleanups	[dict create]
		set afterids	[dict create]
		array set changewait	{}

		my configure {*}$args

		upvar 1 $accessvar scopevar
		set scopevar	[self]
		trace variable scopevar u [namespace code {my _scopevar_unset}]
	}

	#>>>
	destructor { #<<<
		if {$debugmode} {
			dict for {tag afterid} $afterids {
				after cancel $afterid
				dict unset afterids $tag
			}
		}
		foreach output $outputs {
			my detach_output $output
		}

		foreach {key info} [array get changewait] {
			set rest	[lassign $info type state]
			if {$state ne "waiting"} continue
			switch -- $type {
				coro {
					set coro	[lindex $rest 0]
					set changewait($key)	[list $type "source_died"]
					after idle [list $coro source_died]
				}

				vwait {
					set changewait($key)	[list $type "source_died"]
				}

				default {
					#my _debug error "Invalid changewait type ($type) when trying to signal source death"
				}
			}
		}
		if {[self next] ne {}} next
	}

	#>>>

	method state args { #<<<
		switch -exact -- [llength $args] {
			0		{set o_state}
			default	{tailcall my set_state {*}$args}
		}
	}

	#>>>

	method set_state newstate { #<<<
		my _set_state $newstate
	}

	#>>>
	method toggle_state {} { #<<<
		my set_state [expr {!$o_state}]
	}

	#>>>

	method attach_output {handler {cleanup {}}} { #<<<
		if {$handler in $outputs} {
			return 0
		}

		lappend outputs $handler
		
		if {$cleanup ne {}} {
			dict set cleanups $handler	$cleanup
		}
		my _update_output $handler
		
		return 1
	}

	#>>>
	method detach_output handler { #<<<
		if {$handler ni $outputs} {
			return 0
		}

		set outputs		[lsearch -inline -all -not $outputs $handler]

		if {[dict exists $cleanups $handler]} {
			coroutine coro_handler_cleanup_[incr ::coro_seq] \
				{*}[dict get $cleanups $handler]
			dict unset cleanups $handler
		}
		
		return 1
	}

	#>>>

	method name {} { #<<<
		set name
	}

	#>>>
	method explain_txt {{depth 0}} { #<<<
		return "[string repeat {  } $depth][self] \"[[self] name]\": [[self] state]\n"
	}

	#>>>

	method waitfor {sense {timeout 0}} { #<<<
		if {$sense} {
			if {[my state]} return
			set normsense	1
		} else {
			if {![my state]} return
			set normsense	0
		}

		set signame	[my name]
		set myseq	[incr seq]

		if {$timeout != 0} {
			set afterid	[after $timeout [namespace code [list my _changewait_timeout $myseq]]]
			dict set afterids waitfor_$myseq	$afterid
		}

		set resolved	0
		while {!($resolved)} {
			if {[info coroutine] ne ""} {
				set changewait($myseq)	[list coro "waiting" [info coroutine]]
				set res	[yield]
			} else {
				# Blegh
				set changewait($myseq)	[list vwait "waiting"]
				vwait [namespace which -variable changewait]($myseq)
				set res	[lindex $changewait($myseq) 1]
			}
			if {[string is boolean $res] && [my state] != $normsense} {
				set resolved	0
			} else {
				set resolved	1
			}
		}

		if {[info exists afterid]} {
			after cancel $afterid
			unset afterid
		}

		if {$res ne "source_died"} {
			# in the case where we have died, these data members have
			# disappeared, and to try to access them (like unsetting them)
			# causes a segfault

			dict unset afterids waitfor_$myseq
			array unset changewait $myseq
		}

		switch -- $res {
			1 -
			0 {
				return
			}

			timeout {
				throw [list SOP TIMEOUT $signame] \
						"Timeout waiting for signal \"$signame\""
			}

			source_died {
				throw [list SOP SOURCE_DIED $signame] \
						"Source died while waiting for signal \"$signame\""
			}

			default {
				error "Unexpected result waiting for signal \"$signame\": ($res)"
			}
		}
	}

	#>>>

	method _update_output handler { #<<<
		if {$handler ni $outputs} {
			# This can happen if a previously updated output removed this one, but
			# we're still working through the list
			return
		}

		if {$debugmode} {
			set pending_afterid	[after $output_handler_warntime \
					[namespace code [list my _warn_slow $handler]]]
			dict set afterids update_output_$handler	$pending_afterid
		}
		try {
			coroutine coro_update_output_[incr ::coro_seq] \
					{*}$handler $o_state
		} on error {errmsg options} {
			log error "\n\"$name\" error updating output ($o_state) handler: ($handler) $name ([self]): $errmsg\n[dict get $options -errorinfo]"
		}
		if {$debugmode} {
			after cancel $pending_afterid
			dict unset afterids	update_output_$handler
		}
	}

	#>>>
	method _update_outputs {} { #<<<
		foreach output $outputs {
			my _update_output $output
		}
		foreach {key info} [array get changewait] {
			set rest	[lassign $info type state]
			if {$state ne "waiting"} continue
			switch -- $type {
				coro {
					set coro	[lindex $rest 0]
					set changewait($key)	[list coro $o_state]
					after idle [list $coro $o_state]
				}

				vwait {
					set changewait($key)	[list vwait $o_state]
				}

				default {
					log error "Invalid changewait type: ($type)"
				}
			}
		}
	}

	#>>>
	method _on_set_state pending { #<<<
	}

	#>>>
	method _warn_slow handler { #<<<
		log warning "name: ($name) obj: ([self]) taking way too long to update output for handler: ($handler)"
	}

	#>>>
	method _scopevar_unset args { #<<<
		my destroy
	}

	#>>>
	method _changewait_timeout {myseq} { #<<<
		if {![info exists changewait($myseq)]} return
		set rest	[lassign $changewait($myseq) type state]
		if {$state ne "waiting"} return
		switch -- $type {
			coro {
				set coro	[lindex $rest 0]
				set changewait($myseq)	{coro timeout}
				after idle [list $coro timeout]
			}

			vwait {
				set changewait($myseq)	{vwait timeout}
			}

			default {
				log error "Invalid changewait type: ($type)"
			}
		}
	}

	#>>>
	method _set_state newstate { #<<<
		if {![string is boolean -strict $newstate]} {
			throw [list SOP INVALID_SIGNAL_VALUE $newstate] \
					"newstate must be a valid boolean"
		}
		if {$newstate} {
			set normstate	1
		} else {
			set normstate	0
		}
		my _on_set_state $normstate
		if {$o_state == $normstate} return
		set o_state	$normstate
		my _update_outputs
	}

	#>>>
}

# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
