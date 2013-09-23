/*	True false testing
	Test for values returned from functions
*/
test( "true/False Test", function() {.
	//ok( truthy [, message ] )
	ok(true , "True passes Test");
	ok(1, "Any number but 0 passes test");
	ok(false, "False fails test");
	ok(undefined, "undefined fails test");
	}
)