define(function() {

  var DiffTracker = function() {
    this.diffInformation = [];
  }

  DiffTracker.prototype = {
    track: function(diff) {
      this.diffInformation.push(diff);
    },
    reset: function() {
      this.diffInformation = [];
    },
    toString: function() {
      return this.diffInformation;
    }
  };

  return DiffTracker;
});
