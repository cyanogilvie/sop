VER=1.0

TM_FILES=\
		 init.tcl \
		 scripts/domino.tcl \
		 scripts/signal.tcl \
		 scripts/gate.tcl \
		 scripts/signalsource.tcl

all: tm

tm: init.tcl scripts/*.tcl
	install -d tm
	cat $(TM_FILES) > tm/sop-$(VER).tm

install: tm
	rsync -avP tm/* ../tm

clean:
	-rm -rf tm
