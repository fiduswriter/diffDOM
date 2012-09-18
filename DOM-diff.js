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


// HTML attributes that count towards outer equality
var HTMLattributes = ["id", "class", "style", "type", "src", "href", "value", "rel", "width", "height"];


/**
 * Do these elements agree on their HTML attributes?
 *
 * @return array of [differing attribute, value in e1, value in e2] triplets
 */
function outerEquality(e1, e2) {
  var diff = [];
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
}


/**
 * Do these elements agree on their content,
 * based on the .childNodes NodeSet?
 *
 * @return a diff tree between the two elements
 */
function innerEquality(e1, e2) {
  hashAll(e1);
  hashAll(e2);
  c1 = snapshot(e1.childNodes);
  c2 = snapshot(e2.childNodes);
  var localdiff = childDiff(c1,c2);
  if(localdiff.positions.length > 0 ||
     localdiff.insertions.length > 0 ||
     localdiff.removals.length > 0) { return localdiff; }
  return false;
}


/**
 * Does a nodeset snapshot of an element's
 * .childNodes contain an element that has
 * <hash> as hashing number?
 *
 * @return -1 if not contained, or the
 *         position in the snapshot if
 *         it is contained.
 */
function contained(list, hash, start) {
  var c, last=list.length, child;
  for(c=start; c<last; c++) {
    child = list[c];
    if(child.hashCode === hash) {
      return c;
    }
  }
  return -1;
}


/**
 * Create a diff between .childNode
 * snapshots c1 and c2.
 *
 * @return a local content diff
 */
function childDiff(c1, c2) {
  var positions = [], insertions = [], removals = [];

  // First, find all elements that have
  // either not changed, or were simply
  // moved around rather than changed.
  var c, last=c1.length, child, pos;
  for(c=0; c<last; c++) {
    child = c1[c];
    pos = contained(c2, child.hashCode, 0);
    while(pos > -1 && c2[pos]["marked"]) {
      pos = contained(c2, child.hashCode, pos+1);
    }
    if(pos===-1) continue;
    // if relocated, chronicle
    if(c!==pos) { positions.push([c,pos]); }
    child["marked"] = true;
    c2[pos]["marked"] = true;
  }

  // Then we mark all insertions, based on C1
  for(c=0; c<last; c++) {
    child = c1[c];
    if(!child["marked"]) {
      insertions.push([c, child]);
    }
  }
  
  // and then again for c2
  last = c2.length;
  for(c=0; c<last; c++) {
    child = c2[c];
    if(!child["marked"]) {
      removals.push([c, child]);
    }
  }

  var localdiff = {positions:positions, insertions:insertions, removals:removals};
  //console.log(localdiff);
  return localdiff;
}


/*
function getDiff(e1, e2) {
  hashAll(e1);
  hashAll(e2);

  boolean outerDiff = outerEquality(e1,e2);
  LIST childDiff = innerEquality(e1,e2);  
}
*/