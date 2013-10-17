define(function() {

  var Utils = {
    /**
     * This should really be a predefined function in Array...
     */
    makeArray: function(n, v) {
      var deepcopy = function(v) {
        v.slice();
        for(var i=0,last=v.length; i<last; i++){
          if(v[i] instanceof Array) {
            v[i] = deepcopy(v[i]); }}};
      if(v instanceof Array) { v = deepcopy(v); }
      var set = function() { return v; };
      return (new Array(n)).join('.').split('.').map(set);
    },

    /**
     * Render a (multidimensional) array
     */
    renderArray: function(arr) {
      rendered = [];
      arr.forEach(function(row) {
        rendered.push(row.join(" "));
      });
      return rendered.join("\n");
    },


    /**
     * HTML serialization
     */
    toHTML: function(element) {
      var div = document.createElement("div");
      div.appendChild(element.cloneNode(true));
      return div.innerHTML;
    },

    /**
     * grow an array by one element, returning a new array
     * representing the union of the array and element. It's
     * really just .push, but as a new array.
     */
    grow: function grow(array, element) {
      array = array.slice();
      if(!(element instanceof Array)) {
        element = [element];
      }
      element.forEach(function(e) {
        array.push(e);
      });
      return array;
    },

    /**
     * Generate arrays that indicate which node belongs to which subset,
     * or whether it's actually an orphan node, existing in only one
     * of the two trees, rather than somewhere in both.
     */
    getGapInformation: function(t1, t2, stable) {
      // [true, true, ...] arrays
      var set = function(v) { return function() { return v; }},
          gaps1 = this.makeArray(t1.childNodes.length, true),
          gaps2 = this.makeArray(t2.childNodes.length, true),
          group = 0;

      // give elements from the same subset the same group number
      stable.forEach(function(subset) {
        var i, end;
        for(i = subset["old"], end = i + subset.length; i < end; i++) {
          gaps1[i] = group;
        }
        for(i = subset["new"], end = i + subset.length; i < end; i++) {
          gaps2[i] = group;
        }
        group++;
      });

      return { gaps1: gaps1, gaps2: gaps2 };
    },

    /**
     * create an element
     */
    createChild: function(childHTML) {
      var div = document.createElement("div");
      div.innerHTML = childHTML;
      return div.childNodes[0];
    },

    /**
     * Get a downstream element
     */
    getFromRoute: function(base, route) {
      var node = base;
      while(route.length > 0) {
        node = node.childNodes[route.splice(0,1)[0]];
      }
      return node;
    }
  };

  return Utils;
});