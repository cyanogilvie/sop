::sop::pclass create ::sop::gate {
	superclass ::sop::signal

	pclass_config {
		constructor_auto_next	0
	}

	property mode		or	_mode_changed
	property default	0	_default_changed

	method _mode_changed {} { #<<<
		set valid_modes	{and nand nor or}
		if {$mode ni $valid_modes} {
			throw {PROPERTY INVALID} "-mode must be one of ([join $valid_modes {, }])"
		}
		my _calc_o_state
	}

	#>>>
	method _default_changed {} { #<<<
		my _calc_o_state
	}

	#>>>

	variable {*}{
		inputs
		sense
		isvar
		var_inputs
	}

	constructor {accessvar args} { #<<<
		if {[llength [info commands log]] == 0} {
			proc log {lvl msg} {
				puts stderr "domino $lvl: $msg"
			}
		}

		upvar 1 $accessvar scopevar
		next $accessvar

		set inputs		{}
		set sense		{}
		set isvar		{}
		set var_inputs	{}

		my configure {*}$args
	}

	#>>>
	destructor { #<<<
		foreach var_input $var_inputs {
			my detach_var_input $var_input
		}
		foreach input [dict keys $inputs] {
			try {
				if {[my _isa_signal $input]} {
					$input detach_output [my code _input_update $input]
				}
			} on error {errmsg options} {
				log error "Error detatching input ($input) during gate destructor: $errmsg\n[dict get $options -errorinfo]"
			}
		}
	}

	#>>>
	
	method attach_input {gate_obj {a_sense normal}} { #<<<
		if {![my _isa_signal $gate_obj]} {
			error "$gate_obj isn't a sop::signal"
		}

		dict set sense $gate_obj	[expr {$a_sense ne "normal"}]

		$gate_obj attach_output [my code _input_update $gate_obj] \
				[my code _cleanup $gate_obj]
	}

	#>>>
	method detach_input gate_obj { #<<<
		if {![my _isa_signal $gate_obj]} {
			error "$gate_obj isn't a sop::signal"
		}

		catch {unset inputs($gate_obj)}
		dict unset inputs $gate_obj
		
		$gate_obj detach_output [my code _input_update $gate_obj]

		my _calc_o_state
	}

	#>>>
	method detach_all_inputs {} { #<<<
		foreach vinput $var_inputs {
			my detach_var_input $vinput
		}
		foreach gate_obj [dict keys $inputs] {
			my detach_input $gate_obj
		}
	}

	#>>>
	method attach_var_input {varname {a_sense normal}} { #<<<
		if {$varname ni $var_inputs} {
			lappend var_inputs	$varname
		}
		dict set isvar [self]::$varname	$varname
		dict set sense [self]::$varname	[expr {$a_sense eq "inverted"}]
		trace add variable $varname {write unset} \
				[my code _var_input_update $varname]

		my _var_input_update $varname $varname "" write
	}

	#>>>
	method detach_var_input varname { #<<<
		set var_inputs	[lsearch -inline -all -not $var_inputs $varname]
		trace remove variable $varname {write unset} \
				[my code _var_input_update $varname]

		dict unset inputs [self]::$varname
		dict unset sense [self]::$varname
		dict unset isvar [self]::$varname

		my _calc_o_state
	}

	#>>>

	# Prevent the state from being explicitly set for gates
	method state {} next
	method set_state newstate {throw {SOP SET_STATE_ON_GATE} "Cannot call set_state on a gate"}

	method explain_state {} { #<<<
		set inputs
	}

	#>>>
	method explain_txt {{depth 0}} { #<<<
		set txt	""
		set firstdepth	[expr {$depth > 0 ? $depth-1 : 0}]
		append txt "[self] \"[[self] name]\": [[self] state]\[$default\] [string toupper $mode] (\n"
		foreach key [dict keys $inputs] {
			append txt [string repeat {  } $depth]
			append txt [dict get $inputs $key]
			append txt [expr {[dict get $sense $key] ? "i" : " "}]
			if {[dict exists $isvar $key]} {
				append txt "[self] var_input: [dict get $isvar $key] ([dict get $inputs $key])\n"
			} else {
				append txt [$key explain_txt [expr {$depth + 1}]]
			}
		}
		append txt "[string repeat {  } $depth])\n"

		set txt
	}

	#>>>

	method _calc_o_state {} { #<<<
		if {[dict size $inputs] == 0} {
			set new_o_state		$default
		} else {
			switch -nocase -- $mode {
				"and" - "nor"	{set assume	1}
				"nand" - "or"	{set assume	0}
			}

			dict for {input state} $inputs {
				switch -nocase -- $mode {
					"and" - "nand"	{
						if {!($state)} {
							set assume	[expr {!($assume)}]
							break
						}
					}

					"or" - "nor"	{
						if {$state} {
							set assume	[expr {!($assume)}]
							break
						}
					}
				}
			}

			set new_o_state		$assume
		}

		my _set_state $new_o_state
	}

	#>>>
	method _input_update {gate_obj state} { #<<<
		if {[dict get $sense $gate_obj]} {
			set state	[expr {!$state}]
		}
		dict set inputs $gate_obj	$state

		my _calc_o_state
	}

	#>>>
	method _var_input_update {varname n1 n2 op} { #<<<
		upvar 1 $varname value
		switch $op {
			write {
				if {![info exists value]} {
					error "var doesn't exist!  ($varname)"
				}
				set state	[expr {
					[string is boolean $value] && $value
				}]
				if {[dict get $sense [self]::$varname]} {
					set state	[expr {!($state)}]
				}
				dict set inputs [self]::$varname $state

				my _calc_o_state
			}

			unset {
				my detach_var_input $varname
			}
		}
	}

	#>>>
	method _cleanup gate_obj { #<<<
		my detach_input $gate_obj
	}

	#>>>
	method _isa_signal obj { #<<<
		info object isa typeof $obj ::sop::signal
	}

	#>>>
}

# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
