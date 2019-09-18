all:
	tbuild build all

clean:
	tbuild clean

install:
	tbuild install

test: all
	tclsh tests/all.tcl $(TESTFLAGS)
