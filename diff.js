var find = function(s) { return document.querySelector(s); },
    make = function(t,c) { var d = document.createElement(t); if(c) d.innerHTML = c; return d; },
    t1 = find("#one"),
    t2 = find("#two"),
    t3 = find("#three");

var parse = function() {
  // form DOM trees
  var d1 = make("div", t1.value),
      d2 = make("div", t2.value);

  var routes = getDiff(d1,d2), route,
      d, last = routes.length, v,
      textAreaContent="";
  for(d=0; d<last; d++) {
    // shortcuts
    if (routes[d] === 0) { textAreaContent += "no difference\n\n"; }
    else if (routes[d] === -1) { textAreaContent += "top level difference\n\n"; }
    // real work
    else {
      route = arrayCopy(routes[d]);
      var diffRoute = "difference route: " + route,
          e1 = d1, e2 = d2, e;
      while(route.length>0 && route[0]!==-1) {
        e = route.splice(0,1);
        e1 = e1.childNodes[e];
        e2 = e2.childNodes[e]; }

      textAreaContent += diffRoute + "\n" +
                         "e1: " + (e1? serialise(e1) : "<missing>") + "\n" +
                         "e2: " + (e2? serialise(e2) : "<missing>") + "\n" +
                         "\n";
    }
  }

  t3.value = textAreaContent;
};

// bind event handling and parse
t1.onkeyup = function() { log("(1) parsing..."); parse(); };
t2.onkeyup = function() { log("(2) parsing..."); parse(); };
parse();