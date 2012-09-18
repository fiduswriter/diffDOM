/**
 * A simple tree implementation for 
 * diff routing. Each node indicates
 * its diff route value, and may contain
 * a key/value object for properties.
 */
var Node = function(value, properties, undef) {
  this.value = (value===undef ? -1 : value);
  this.properties = (properties===undef ? {} : properties);
  this.children = [];
}

Node.prototype = {
  value: -1,
  properties: {},
  children: [],
  get: function(route) {
    // end point
    if(route.length===0) { return this; }
    // mid route
    else {
      var val = route.splice(0,1)[0], child, c, last;
      for(c=0, last=this.children.length; c<last; c++) {
        child = this.children[c];
        if(child instanceof Node && child.value==val) {
          return child.get(route);
        }
      }
    }
  },
  insert: function(route, node) {
    // end point
    if(route.length===0) { this.children.push(node); }
    // mid-route
    else {
      var val = route.splice(0,1)[0], child, c, last;
      // cascading insert
      for(c=0, last=this.children.length; c<last; c++) {
        child = this.children[c];
        if(child instanceof Node && child.value==val) {
          child.insert(route, node);
          return;
        }
      }
      // tree-building insert
      var interstitial = new Node(val);
      interstitial.insert(route, node);
      this.children.push(interstitial);
    }
  },
  getProperty: function(name) {
    return this.properties[name];
  },
  toString: function() {
    var str = "value: "+this.value+", properties: "+this.getPropertyString()+", children: ",
        cds = [], child, c, last;
    for(c=0, last=this.children.length; c<last; c++) {
      child = this.children[c];
      if(child instanceof Node) {
        cds.push(child.toString());
      }
    }
    return str + "[" + cds.join(", ")+"]";
  },
  getPropertyString: function() {
    var prop, props = [], tp = this.properties;
    for(prop in tp) {
      if(Object.hasOwnProperty(tp,prop)) continue;
      props.push(prop+': "'+tp[prop]+'"');
    }
    return "{" + props.join(",") + "}";
  }
};
Node.prototype.constructor = Node;