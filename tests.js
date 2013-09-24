/*	True false testing
	Test for values returned from functions
*/
test( "true/False Test examples", function() {
	//ok( truthy [, message ] )
	ok(true , "True passes Test");
	ok(1, "Any number but 0 passes test");
	ok(false, "False fails test");
	ok(undefined, "undefined fails test");
	}
);

/* 	Assertion testing (Comparison)
	Tests for actual and expected arguments
*/
test( "Assertion Test examples", function() {
	//equal( actual, expected [, message ] )
 	equal( 5, 5, "Numbers are equal, test passed" );
  	equal( "", 0, "Empty, Zero; equal succeeds" );
  	equal( "<ol><li>1</li><ol>", "<ol><li>1</li><ol>" , "Are equal, test passed");
  	equal( "<ol><li>1</li><ol>", "<ol><li>2</li><ol>" , "Are not equal, test failed");
  
});

/* 

Add additional test cases here 

*/
