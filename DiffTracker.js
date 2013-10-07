define(function() {

  var DiffTracker = function() {
    this.diffInformation = [];
  }

  DiffTracker.prototype = {
    last: false,
    track: function(diff) {
      this.diffInformation.push(diff);
      this.last = diff;
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
