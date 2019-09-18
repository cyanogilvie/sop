::oo::class create ::sop::pclass {
	superclass ::oo::class

	constructor def { #<<<
		my variable superclass_seen
		my pclass_config {}		;# ensure defaults are set

		set superclass_seen	0

		foreach m {
			superclass
			property
			protected_property
			constructor
			method
			destructor
			pclass_config
		} {
			interp alias {} [self namespace]::$m {} [self] $m
		}
		foreach m {
			mixin
			filter
			unexport
			export
			variable
		} {
			interp alias {} [self namespace]::$m {} oo::define [self] $m
		}

		my eval $def

		if {!($superclass_seen)} {
			if {[self] ne "::sop::pclassbase"} {
				oo::define [self] superclass ::sop::pclassbase
			}
		}
	}

	#>>>
	method _get_prop_var {} { #<<<
		set othervar	[self]::_props
		if {![namespace exists [self]]} {
			namespace eval [self] {}
		}
		set othervar
	}

	#>>>
	method _provides_baseclass {baseclass class} { #<<<
		if {$class eq $baseclass} {return 1}
		foreach superclass [info class superclasses $class] {
			if {[my _provides_baseclass $baseclass $superclass]} {
				return 1
			}
		}
		return 0
	}

	#>>>
	method superclass args { #<<<
		my variable superclass_seen
		set superclass_seen	1
		set seenhere	0
		set baseclass	::sop::pclassbase
		foreach superclass $args {
			if {[my _provides_baseclass $baseclass $superclass]} {
				set seenhere	1
				break
			}
		}
		if {!($seenhere)} {
			set args	[concat [list $baseclass] $args]
		}
		oo::define [self] superclass {*}$args
	}

	#>>>
	method property {name args} { #<<<
		lassign $args initval change_handler
		set othervar	[my _get_prop_var]
		dict set $othervar $name	[dict create protection public]
		if {[llength $args] >= 1} {
			dict set $othervar $name initval $initval
		}
		if {[llength $args] >= 2} {
			dict set $othervar $name change_handler $change_handler
		}
	}

	#>>>
	method protected_property {name args} { #<<<
		lassign $args initval change_handler
		set othervar	[my _get_prop_var]
		dict set $othervar $name	[dict create protection protected]
		if {[llength $args] >= 1} {
			dict set $othervar $name initval $initval
		}
		if {[llength $args] >= 2} {
			dict set $othervar $name change_handler $change_handler
		}
	}

	#>>>
	method constructor {arglist body} { #<<<
		my variable cfg
		set othervar	[my _get_prop_var]
		upvar 1 $othervar props

		set newbody {}
		if {[dict get $cfg constructor_auto_next]} {
			append newbody {
				if {[self next] ne {}} {next}
			}
		}
		append newbody {
			if {[info exists [my varname _props]]} {
				dict for {k inf} [set [my varname _props]] {
					my variable $k
				}
				if {[info exists k]} {unset k}
				if {[info exists inf]} {unset inf}
			}
		}
		append newbody $body

		oo::define [self] constructor $arglist $newbody
	}

	#>>>
	method method {name args body} { #<<<
		set newbody	{
			if {[info exists [my varname _props]]} {
				dict for {k inf} [set [my varname _props]] {
					my variable $k
				}
				unset -nocomplain k inf
			}
		}
		append newbody $body
		oo::define [self] method $name $args $newbody
	}

	#>>>
	method destructor body { #<<<
		set newbody	{
			if {[info exists [my varname _props]]} {
				dict for {k inf} [set [my varname _props]] {
					my variable $k
				}
				unset -nocomplain k inf
			}
		}
		append newbody $body {
			if {[self next] ne {}} {next}
		}
		oo::define [self] destructor $newbody
	}

	#>>>
	method pclass_config config { #<<<
		my variable cfg
		if {![info exists cfg]} {
			set cfg	{}
		}
		set cfg [dict merge {
			constructor_auto_next	1
		} $cfg $config]
	}

	#>>>
}


::oo::class create ::sop::pclassbase {
	constructor {} { #<<<
		my variable _props
		if {![info exists _props]} {
			set _props	[dict create]
		}
		my _mixin_props	[info object class [self]]
		if {[info exists [my varname _props]]} {
			dict for {k inf} [set [my varname _props]] {
				my variable $k
				if {[dict exists $inf initval]} {
					set $k [dict get $inf initval]
				}
			}
			unset -nocomplain k inf
		}
	}

	#>>>
	method cget {_name args} { #<<<
		if {[llength $args] > 1} {
			error "Too many arguments, expecting name ?default_value?"
		}
		if {[string index $_name 0] eq "-"} {
			set _name	[string range $_name 1 end]
		}
		my variable _props
		if {[dict exists $_props $_name] && [dict get $_props $_name protection] eq "public"} {
			my variable $_name
			if {[info exists $_name]} {
				return [set $_name]
			} elseif {[llength $args] > 0} {
				return [lindex $args 0]
			}
		} else {
			error "Invalid property \"$_name\""
		}
	}

	#>>>
	method configure args { #<<<
		if {[llength $args] == 0} return
		my variable _props
		if {![info exists _props]} {
			error "Can't run configure on [self]: _props ([my varname _props]) is missing"
		}
		dict for {k v} $args {
			if {[string index $k 0] ne "-"} {
				throw {SYNTAX GENERAL} "Invalid property name \"$k\""
			}
			set k	[string range $k 1 end]
			if {![dict exists $_props $k]} {
				throw [list SYNTAX PROPERTY_NOTDEFINED -$k] \
						"Invalid property: \"$k\", expecting one of \"[join [dict keys $_props] \",\ \"]\""
			}
			if {[dict get $_props $k protection] ne "public"} {
				throw [list PROTECTION $k] "Property \"$k\" is not public"
			}
			set fqvar	[self namespace]::$k
			if {[info exists $fqvar]} {
				set oldval	[set $fqvar]
			}
			set $fqvar	$v
			if {[dict exists $_props $k change_handler]} {
				try {
					namespace inscope [self namespace] [list my [dict get $_props $k change_handler]]
				} trap {PROPERTY ABORT_CHANGE} {} {
					if {[info exists oldval]} {
						set $fqvar	$oldval
					}
				} on error {errmsg options} {
					if {[info exists oldval]} {
						set $fqvar	$oldval
					}
					dict incr options -level
					return -options $options $errmsg
				}
			}
		}
	}

	#>>>
	method _mixin_props fromclass { #<<<
		my variable _props
		if {![info exists _props]} {
			set _props	[dict create]
		}
		if {[info exists ${fromclass}::_props]} {
			dict for {k v} [set ${fromclass}::_props] {
				if {![dict exists $_props $k]} {
					dict set _props $k $v
				}
			}
		}
		set superclasses	[info class superclasses $fromclass]
		foreach superclass $superclasses {
			my _mixin_props $superclass
		}
	}

	#>>>

	# convenience methods
	method code args { #<<<
		namespace code [list my {*}$args]
	}
	unexport code

	#>>>
	method log {lvl msg} {}
}

# vim: ft=tcl foldmethod=marker foldmarker=<<<,>>> ts=4 shiftwidth=4
