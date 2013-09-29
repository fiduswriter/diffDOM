/**
 * Simple mapping object - wrapped in a closure
 */
define(function() {

  var SubsetMapping = function SubsetMapping(a, b) {
    this["old"] = a;
    this["new"] = b;
  };

  SubsetMapping.prototype = {
    contains: function contains(subset) {
      if(subset.length < this.length) {
        return subset["new"] >= this["new"] && subset["new"] < this["new"] + this.length;
      }
      return false;
    },
    toString: function toString() {
      return this.length + " element subset, first mapping: old " + this["old"] + " → new " + this["new"];
    }
  };

  return SubsetMapping;

});
