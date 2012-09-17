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
   */
  window.equal = function equal(e1, e2, after) {

    // first: if this element is a previous route's problem
    // point, we're going to TOTALLY ignore it and pretend it's
    // fine, so that we can find further problems.
    var soffset = (after && after.length!==0 ? after.splice(0,1)[0] : 0);
    if(soffset === -1) {
log("route found. pretending it's fine.");
      return 0;
    }

    // different element (1)?
    if(e1.nodeType !== e2.nodeType) {
log("type difference",e1.nodeName,e2.nodeName);
      return -1;
    }

    // shortcut handling for text?
    if(e1.nodeType===3 && e2.nodeType===3) {
      if(e1.textContent.trim() != e2.textContent.trim()) {
log("text content difference",e1.textContent,e2.textContent);
        return -1;
      }
      return 0;
    }

    // different element (2)?
    if(e1.nodeName !== e2.nodeName) {
log("tag difference",e1.nodeName,e2.nodeName);
      return -1;
    }

    // different content?
    if(e1.childNodes.length !== e2.childNodes.length) {
log("child list difference",e1.childNodes.length,e2.childNodes.length);
      return -1;
    }

    // different child node list?
    var i, last = e1.childNodes.length, eq, ret;

    // iterate and check
    for(i=soffset; i<last; i++) {
      eq = equal(e1.childNodes[i], e2.childNodes[i], after);
      if(eq !== 0) {
log("child difference", i, e1.childNodes[i], e2.childNodes[i]);
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
                 "__more__attributes__here"],
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

    // Some of these routes may be incomplete,
    // as they will be for insertion/removal.
    var r, last=routes.length-1, i, len,
        d1, d2, // dom elements
        s1, s2, // element.childNodes snapshots
        l1, l2; // element.childNodes.length
    for(r=0; r<last; r++) {
      route = routes[r];
      d1 = e1;
      d2 = e2;
      len = route.length-1;
      for(i=0; i<len; i++) {
        d1 = d1.childNodes[route[i]];
        d2 = d2.childNodes[route[i]]; }
      s1 = snapshot(d1.childNodes);
      s2 = snapshot(d2.childNodes);
      l1 = s1.length;
      l2 = s2.length;
      if(l1!==0 || l2!==0) {
        // do "real" diff checking here
        if(l1>l2) {
log("insertion", d1, d2);
          // find the elements in d1 that are not in d2
          for(var pos=0; pos<l1; pos++) {
            if(s2.contains(s1[pos]) === -1) {
log("element "+pos+" from fragment 1 is missing (or an update on a fragment) in fragment 2");

              // special case: <tag>[text]</tag> -> <tag>[text]<element>...</element>[text]</tag>
              if(s2[pos] && s2[pos].nodeType===3 && s1[pos].nodeType===3 && s1[pos+2].nodeType===3)
              {
                console.log("text -> text <element> text");
                console.log("not processed yet (it will now simply see two inserts, and miss out on an update)");
              }

              // not a special case
              else {
                // but, where should it be inserted?
                var elementPos = pos+1, insertPos = -1, e1;
                while(insertPos === -1 && elementPos<s1.length) {
                  e1 = s1[elementPos++];
                  // skip over token text nodes
                  if(e1.nodeType === 3 && e1.textContent.trim()==="") {
                    continue;
                  }
                  // if not a token text node, do a containment check
                  insertPos = s2.contains(e1);
                }

log("next extant s1 element: "+(elementPos-1)+", which has position s2["+insertPos+"]");

                // If insertPos is still -1, we should append.
                // Otherwise, we should insert at insertPos.
                var diffRoute = arrayCopy(route);
                diffRoute.splice(len,4,pos,-1,"insertion", insertPos);
                var idx = routes.indexOf(route);
                if(idx>-1) { routes[idx] = diffRoute } else { routes.push(diffRoute); }
              }


            }
          }
        }

        else {
log("removal", d1, d2);
          // find the elements in d2 that are not in d1
          for(var pos=0; pos<l2; pos++) {
            if(s1.contains(s2[pos]) === -1) {
log("element "+pos+" from fragment 2 is missing in fragment 1");
              // FIXME: pushing for testing purposes only!
              var diffRoute = arrayCopy(route);
              diffRoute.splice(len,3,pos,-1,"removal");
              var idx = routes.indexOf(route);
              if(idx>-1) { routes[idx] = diffRoute } else { routes.push(diffRoute); }
            }
          }
        }
      }
    }

    // Remove "0" from routes if length > 1, since
    // the last attempt will find no differences, but
    // will do so because it's "deemed safe".
    if(routes.length>1) { routes.splice(routes.indexOf(0), 1); }

    console.log(routes);

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