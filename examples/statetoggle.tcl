#!/usr/bin/env cfkit8.6

package require platform

foreach platform [platform::patterns [platform::identify]] {
	set tm_path		[file join $env(HOME) .tbuild repo tm $platform]
	set pkg_path	[file join $env(HOME) .tbuild repo pkg $platform]
	if {[file exists $tm_path]} {
		tcl::tm::path add $tm_path
	}
	if {[file exists $pkg_path]} {
		lappend auto_path $pkg_path
	}
}


package require sop
package require Tk

array set signals	{}
sop::signal new signals(enabled) -name "enabled"

proc e_changed {} {
	global e signals

	$signals(enabled) set_state $e
}


pack [button .b -text "Go" -command exit]
pack [checkbutton .c -text "Enabled" -variable e -command e_changed]

sop::statetoggle new toggles(enabled) .b \
		-state {disabled normal}

$toggles(enabled) attach_input $signals(enabled)
#$toggles(enabled) attach_signal $signals(enabled)

$signals(enabled) attach_output [list apply {
	{newstate} {
		puts "Enabled signal: $newstate"
	}
}]
