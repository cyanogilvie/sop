# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4

cflib::pclass create sop::statetoggle {
	superclass sop::gate
	mixin cflib::baselog

	pclass_config {
		constructor_auto_next	0
	}

	property explain	0

	variable {*}{
		name
		target
		toggles
		deleting
		lasterror
	}

	constructor {accessvar args} { #<<<
		set deleting	0

		upvar $accessvar scopevar
		next $accessvar

		if {"oo::Helpers::cflib" ni [namespace path]} {
			namespace path [concat [namespace path] {
				::oo::Helpers::cflib
			}]
		}

		set configureargs	{}
		# Process in-line configure arguments
		while {[string index [lindex $args 0] 0] eq "-"} {
			set args	[lassign $args opt val]
			lappend configureargs	$opt $val
		}
		set toggles	[lassign $args target]
		if {![winfo exists $target]} {
			error "Widget: ($target) is not valid"
		}

		#bind $target <Destroy> +[format {
		#	if {[info object isa object %1$s]} {
		#		try {
		#			%2$s
		#		} on error {errmsg options} {
		#			puts stderr "Error destroying (%1$s): [dict get $options -errorinfo]"
		#		}
		#	}
		#} [list [self]] [code destroy]]
		bind $target <Destroy> +[list apply {
			{obj} {
				if {[info object isa object $obj]} {$obj destroy}
			}
		} [self]]

		my configure -mode "and" {*}$configureargs
		my configure -name "tlc::StateToggle internal [self] \"$name\""

		my attach_output [code _stategate_update]
	}

	#>>>
	destructor { #<<<
		set deleting		1
		my log debug "tlc::StateToggle ($target) ([self]) going away"
		my detach_output [code _stategate_update]
		if {[winfo exists $target]} {
			#catch {
			#	trace remove command $target delete [list [self] destroy]
			#}
		}
	}

	#>>>

	method attach_signal {signal {a_sense normal}} {my attach_input $signal $a_sense}
	method detach_signal {signal} {my detach_input $signal}
	method force_update {} {my _stategate_update [my state]}
	method target {} {set target}
	method deleting {} {set deleting}
	method explain {} { #<<<
		set build	""
		if {[info exists lasterror]} {
			append build	"Last error configuring target: $lasterror" \n
		}
		append build [explain_txt]
		return $build
	}

	#>>>

	method _stategate_update {{newstate ""}} { #<<<
		if {[info exists lasterror]} {unset lasterror}
		if {$newstate ne ""} {
			set stategate_state	$newstate
		}
		if {$explain} {
			my log debug [my explain_txt]
		}
		set switchlist	{}
		dict for {key values} $toggles {
			lappend switchlist	$key [lindex $values $stategate_state]
		}
		if {$debugmode} {
			my log debug "[self] Updating $target: ([state]) ($switchlist)"
		}
		try {
			$target configure {*}$switchlist
		} on error {errmsg options} {
			set lasterror	$errmsg
			my log error "\nError configuring $target: $errmsg\n[dict get $options -errorinfo]"
		}
	}

	#>>>
}


