/**
 * Several DOM functions that should exist, but don't.
 */
(function(){

  var debug = false;
  window.log = function() {
    if(debug) {
      console.log.apply(console, arguments)
    }
  };

  /**
   * create element shortcut
   */
  window.make = function(tagName, content) {
    var e = document.createElement(tagName);
    if(content) e.innerHTML = content;
    return e;
  }

  /**
   * Take a snapshot of a NodeSet, and return
   * it as a normal array, becaue NodeSets are
   * views on the DOM, and change when it does.
   */
  window.snapshot = function snapshot(list) {
    var newlist = [], i=0, last=list.length;
    for(;i<last;i++) { newlist.push(list[i]); }

    // extend the array with a more lenient
    // "contains" function, relying on the
    // equal(e1,e2) function instead.
    newlist.contains = (function(last, i) {
      return function(e) {
        for(i=0;i<last;i++) {
          if(equal(e, this[i])===0) {
            return i; }}
        return -1; }; }(last));

    // ideally at this point we would make
    // the array immutable, since it is not
    // a plain array but a NodeSet snapshot.

    // Return this extended array.
    return newlist;
  }


  /**
   * DOM element comparator.
   *
   * The fact that JavaScript doesn't have this
   * built into the DOM API is lamentable.
   *
   * return -1 if "plain" not equal,
   *         0 if equal,
   *        or a <number>[] representing the
   *        route in this element to a diff.
   *
   * FIXME: as long as the tagname stays the same, outerchange (class, etc) should be a modification, not top diff.
   *
   */
  window.equal = function equal(e1, e2, after) {

    // first: if this element is a previous route's problem
    // point, we're going to TOTALLY ignore it and pretend it's
    // fine, so that we can find further problems.
    var soffset = (after && after.length!==0 ? after.splice(0,1)[0] : 0);
    if(soffset === -1) {
      return 0;
    }

    // different element (1)?
    if(e1.nodeType !== e2.nodeType) {
      return -1;
    }

    // shortcut handling for text?
    if(e1.nodeType===3 && e2.nodeType===3) {
      if(e1.textContent.trim() != e2.textContent.trim()) {
        return -1;
      }
      return 0;
    }

    // different element (2)?
    if(e1.nodeName !== e2.nodeName) {
      return -1;
    }

    // different content?
    if(e1.childNodes.length !== e2.childNodes.length) {
      return -1;
    }

    // Different child node list?
    // Find where the first difference is
    var i, last = e1.childNodes.length, eq, ret;
    for(i=soffset; i<last; i++) {
      // recurse to see if these children differ
      eq = equal(e1.childNodes[i], e2.childNodes[i], after);
      if(eq !== 0)
      {
        // (first) difference found. "eq" will indicate
        // which childNodes position the diff is found at.
        return [i].concat(eq);
      }
    }

    // different attributes?
    var attrs = ["id",     // ids MUST be identical, nice and simple
                 "style",  // this one's tricky, and I don't want to write a full CSS parser right now. FIXME: later
                 "class",  // this one's less tricky, but still requires split/sort comparison. FIXME: later
                 "type",
                 "value",
                 "href",
                 "src",
                 "rel",
                 "__more__attributes__here__"],
        a, last = attrs.length,
        attr, a1, a2;

    for(a=0; a<last; a++) {
      attr = attrs[a];
      a1 = e1.getAttribute(attr);
      a2 = e2.getAttribute(attr);
      if(a1==a2 || (!a1 && a2=="") || (!a2 && a1=="")) continue;
      return -1;
    }

    // nothing left to fail on - consider
    // these two elements equal.
    return 0;
  }


  /**
   * Generate an annotated diff between
   * two DOM fragments. Particularly useful
   * for live render updating.
   *
   * "after" indicates a route that is already
   * known to fail, causing equal() to check
   * only elements that come after this route.
   */
  window.getDiff = function getDiff(e1, e2) {
    var route = equal(e1,e2),
        routes = [route],
        newRoute;

    while(typeof route === "object") {
      newRoute = equal(e1,e2,arrayCopy(route));
      routes.push(newRoute);
      route = newRoute;
    }

    // Remove "0" from routes if length > 1, since
    // the last attempt will find no differences, but
    // will do so because it's "deemed safe".
    if(routes.length>1) { routes.splice(routes.indexOf(0), 1); }
    return routes;
  }


  /**
   * Serialise a DOM element properly.
   */
  window.serialise = function serialise(e) {
    // text node
    if(e.nodeType===3) {
      return "{ nodeType: 'text', text: '"+e.textContent.trim()+"'}";
    }

    // DOM node (assumed!)
    var ret = ['nodeName: "'+e.nodeName+'"'],
        attrs = ['id', 'style', 'class', 'value' /* more non-object attributes here */],
        attr, a, val;

    for(a=attrs.length-1; a>=0; a--) {
      attr = attrs[a];
      if(!attr || Object.hasOwnProperty(e,attr) || !e.getAttribute) continue;
      val = e.getAttribute(attr);
      if(val === undefined || val === null || typeof val === "function") { continue; }
      else { ret.push(attr + ': "' + val + '"'); }
    }

    var last = e.childNodes.length, child, children;
    if(last>0) {
      children = [];
      for(a=0; a<last; a++) {
        child = e.childNodes[a];
        children.push(serialise(child));
      }
      ret.push("children: [" + children.join(", ") + "]");
    }

    return "{" + ret.join(", ") + "}";
  }

}());