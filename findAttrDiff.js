define(function() {

  /**
   * Attribute map difference
   */
  var findAttrDiff = function findAttrDiff(t1, t2, route, tracker) {
    if (t1.nodeType===3) return;
    var slice = Array.prototype.slice,
        byName = function(a,b) { return a.name > b.name; },
        attr1 = slice.call(t1.attributes).sort(byName),
        attr2 = slice.call(t2.attributes).sort(byName),
        find = function(attr, list) {
          for(var i=0, last=list.length; i<last; i++) {
            if(list[i].name === attr.name)
              return i;
          }
          return -1;
        };

    // Check all differences based on the attributes in t1.
    attr1.forEach(function(attr) {
      var pos = find(attr, attr2);
      if(pos === -1) {
        console.log("attribute removed", attr.name, route);
        tracker.track({
          action: "removed attribute",
          route: route,
          attribute: {
            name: attr.name,
            value: attr.nodeValue
          }
        });
        return;
      }
      // attribute found both: get the attribute (removing it from the
      // 'to process from t2' list), and compare the values between the two.
      var a2 = attr2.splice(pos,1)[0];
      if(attr.nodeValue !== a2.nodeValue) {
        console.log("attribute changed", attr.nodeValue, a2.nodeValue, route);
        tracker.track({
          action: "modified attribute",
          route: route,
          attribute: {
            name: attr.name,
            oldValue: attr.nodeValue,
            newValue: a2.nodeValue
          }
        });
      }
    });

    // Anything left in attr2 was not in attr1, and is a new attribute
    attr2.forEach(function(attr) {
      console.log("attribute added", attr.name, attr.nodeValue, route);
      tracker.track({
        action: "added attribute",
        route: route,
        attribute: {
          name: attr.name,
          value: attr.nodeValue
        }
      });
    });
  }

  return findAttrDiff;
});
