/**
 * Perform a difference check between two DOM elements
 *
 * (c) Mike "Pomax" Kamermans, but you can freely use it.
 */
var DOMdiff = (function() {

  var diffObject = {};

  var debug = false;
  var log = function() {
    if(debug) {
      console.log.apply(console, arguments)
    }
  };


  /**
   * create element shortcut
   */
  var make = function(tagName, content) {
    var e = document.createElement(tagName);
    if(content) e.innerHTML = content;
    return e;
  };
  window.make = make;


  /**
   * A JavaScript implementation of the Java hashCode() method.
   */
  function hashCode(str,undef) {
    if(str===null || str===undef) return 0;

    var hash = 0, i, last = str.length;
    for (i = 0; i < last; ++i) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash;
  }


  /**
   * Form a hash code for elements.
   * Note that this function not only returns the
   * hash code, but also binds it to the element
   * it belongs to, because caching helps the other code.
   *
   * @return a numerical digest hash code
   */
  function hashAll(element, undef) {
    var child,
        last = (element.childNodes === undef ? 0 : element.childNodes.length),
        hash = 0,
        hashString = element.nodeName;

    // HTML element?
    if(element.getAttribute) {
      var attr,
          a,
          len = HTMLattributes.length;
      for (a=0; a<len; a++) {
        attr = HTMLattributes[a];
        hashString += attr+":"+element.getAttribute(attr);
      }
    }

    // update the hash
    hash = hashCode( (hashString+element.textContent).replace(/\s+/g,''));
    
    // if children, work in their hash, too.
    for(child = last-1; child >=0; child--) {
      hash = (hash * 31 + hashAll(element.childNodes[child])) & 0xFFFFFFFF;
    }
    
    // okay, we're done. Set and return
    element["hashCode"] = hash;
    return hash;
  }


  /**
   * "Hard" (primitive) array copy. No idea why
   * JavaScript doesn't have this baked in...
   */
  var arrayCopy = function arrayCopy(arr) {
    var narr = [], a, l=arr.length;
    for(a=0; a<l; a++) { narr[a] = arr[a]; }
    return narr;
  };
  window.arrayCopy = arrayCopy;
    

  /**
   * Take a snapshot of a NodeSet, and return
   * it as a normal array, becaue NodeSets are
   * views on the DOM, and change when it does.
   */
  var snapshot = function snapshot(list) {
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
  };
  window.snapshot = snapshot;
  


  // HTML attributes that count towards outer equality
  var HTMLattributes = ["id", "class", "style", "type", "src", "href", "value", "rel", "width", "height"];

  /**
   * Do these elements agree on their HTML attributes?
   *
   * @return array of [differing attribute, value in e1, value in e2] triplets
   */
  function outerEquality(e1, e2) {
    var diff = [];
    // TODO: add tagname changes (i.e. "div" -> "span")
    if(e1.getAttribute && e2.getAttribute) {
      var attr,
          a, a1, a2,
          len = HTMLattributes.length;
      for (a=0; a<len; a++) {
        attr = HTMLattributes[a];
        a1 = e1.getAttribute(attr);
        a2 = e2.getAttribute(attr);
        if(a1==a2) continue;
        diff.push([attr,a1, a2]);
      }
    }
    return diff;
  };
  diffObject.outerEquality = outerEquality;


  /**
   * Do these elements agree on their content,
   * based on the .childNodes NodeSet?
   *
   * @return a diff tree between the two elements
   */
  var innerEquality = function(e1, e2) {
    hashAll(e1);
    hashAll(e2);
    c1 = snapshot(e1.childNodes);
    c2 = snapshot(e2.childNodes);
    var localdiff = childDiff(c1,c2);
    return (localdiff.insertions.length > 0 || localdiff.removals.length > 0 ?  localdiff : false);
  };
  diffObject.innerEquality = innerEquality;


  /**
   * Does a nodeset snapshot of an element's
   * .childNodes contain an element that has
   * <hash> as hashing number?
   *
   * @return -1 if not contained, or the
   *         position in the snapshot if
   *         it is contained.
   */
  function getPositions(list, reference) {
    var hash = reference.hashCode,
        c, last = list.length, child,
        result = [];
    for(c=0; c<last; c++) {
      child = list[c];
      if(child.hashCode === hash) {
        result.push(c);
      }
    }
    return result;
  }


  /**
   * Create a diff between .childNode
   * snapshots c1 and c2.
   *
   * @return a local content diff
   */
  function childDiff(c1, c2) {
    var relocations = [],
        insertions = [],
        removals = [];

    // First, find all elements that have
    // either not changed, or were simply
    // moved around rather than changed.
    var c, last=c1.length, child, hash, positions, pos;
    for(c=0; c<last; c++) {
      child = c1[c];
      positions = getPositions(c2, child);

      // not found in list c2
      if(positions.length===0) continue;

      // found more than once in list c2
      if(positions.length>1) continue;

      // This element might be moved. However, we only
      // record this for unique elements, to avoid ambiguity.
      pos = positions[0];
      if(c!==pos && getPositions(c1, child).length <= 1) {
        relocations.push([c, pos]);
        child["marked"] = true;
        c2[pos]["marked"] = true;
      }

      else if(c===pos) {
        child["marked"] = true;
        c2[pos]["marked"] = true;
      }
    }

    // Then we check all removals, based on unmarked c2 elements
    last = c2.length;
    for(c=0; c<last; c++) {
      child = c2[c];
      if(!child["marked"]) {
        removals.push([c, child]);
      }
    }
    
    // and then insertions, based on unmarked c1 elements
    last = c1.length;
    for(c=0; c<last; c++) {
      child = c1[c];
      if(!child["marked"]) {
        insertions.push([c, child]);
      }
    }

    // form result object and return
    var localdiff = {
      c1: snapshot(c1),
      c2: snapshot(c2),
      relocations: relocations,
      insertions: insertions,
      removals: removals
    };
    return localdiff;
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
  var equal = function equal(e1, e2, after) {

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
  };


  /**
   * Generate an annotated diff between
   * two DOM fragments. Particularly useful
   * for live render updating.
   *
   * "after" indicates a route that is already
   * known to fail, causing equal() to check
   * only elements that come after this route.
   */
  var getDiff = function getDiff(e1, e2) {
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
  };
  diffObject.getDiff = getDiff;

  /**
   * Serialise a DOM element properly.
   */
  var serialise = function serialise(e) {
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
  };
  window.serialise = serialise;
  
  return diffObject;
}());