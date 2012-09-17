// global reference to the iframe (during debug)
var frame;

/**
 * This module allows source code previewing into an iframe,
 * where any changes to the source code will update the preview.
 * Only changed elements are updated, so that state for other
 * elements is preserved.
 *
 */
(function(){

  // iframe model.
  var Frame = function(iframe) {
    this.window = iframe.contentWindow;
    this.document = iframe.contentDocument;
    this.head = this.document.head;
    this.body = this.document.body;
  }

  Frame.prototype = {
    // script loading inside the frame
    loadIntoHead: function(element) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      if(element.getAttribute("src")) { script.src = element.getAttribute("src"); }
      else { script.innerHTML = element.innerHTML; }
      this.head.appendChild(script);
    },
    
    // mark an element as "not changed during this parse run"
    mark: function(element) {
      element["marked"] = true;
    },
    
    // get all unmarked elements in this iframe
    getUnmarked: function() {
      var retset =[],
          set = snapshot(this.body.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(!set[s]["marked"]) {
          retset.push(set[s]);
        }
      }
      return retset;
    },

    // unmark all elements in this iframe
    clearMarks: function(element) {
      var set = snapshot(this.body.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        set[s]["marked"] = false;
      }
    },

    // does this frame already contain this element?
    contains: function(element) {
      var set = snapshot(this.body.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(equal(element,set[s])===0) {
          this.mark(set[s]);
          return true; }}
      return false;
    },

    // does this frame already contain this script?
    containsScript: function(script) {
      var set = snapshot(this.head.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(equal(script,set[s])===0) {
          this.mark(set[s]);
          return true; }}
      return false;
    },

    // replace one DOM node with another
    replace: function(n1,n2) {
      this.body.replaceChild(n2,n1);
    },

    // update the DOM
    update: function(elements) {
      var s, last = elements.length, element;
      for(s=0; s<last; s++) {
        element = elements[s];
        if(this.contains(element)) { continue; }
        else { this.body.appendChild(element); }
      }

      var set = this.getUnmarked(), pos;

      // switch, except with if/else, because switch
      // fall-through is incredible. In that it's still
      // used. It's also incredibly annoying.
      if(set.length===0) {
        // trivial non-change
      }

      // element insertion or removal
      else if(set.length==1) {
        pos = elements.contains(set[0]);
        // element is to be inserted:
        if(pos > -1) {
          // if the last element, simple append
          if(pos==elements.length-1) {
            this.body.appendChild(set[0]);
          }
          // otherwise, we'll need to find the
          // correct insertion spot first...
          else {
            pos = snapshot(this.body.children).contains(elements[pos+1]);
            this.body.insertBefore(set[0], this.body.children[pos]);
          }
        }
        // element is to be removed:
        else { this.body.removeChild(set[0]); }
      }

      // existing element update
      else if(set.length==2) {
        this.body.replaceChild(set[1],set[0]);
      }

      // I've not analysed the other cases yet!
      else {
        console.log("not a simple removal/update/insert. Not handled yet =)");
        console.log(set);
      }
    },

    // update the head's script set
    updateScripts: function(elements) {
      var s, last = elements.length, script;
      for(s=0; s<last; s++) {
        script = elements[s];
        if(this.containsScript(script)) { continue; }
        else { this.loadIntoHead(script); }
      }
    }
  };

  // shortcut variable.
  var oldcontent = false;

  /**
   * parse the textarea for changes.
   * If there are content-changing changes,
   * push them into the iframe.
   */
  function parse(event, frame) {
    var content = event.target.value;

    // Shortcut on stale data.
    if(oldcontent==content) return;

    // Also shortcut on illegal HTML, based on slowparse.
    var ret = Slowparse.HTML(frame.document, content);
    if(ret.error) { return; }

    // Do real processing
    oldcontent = content;

    // turn content into a dom tree.
    var div = document.createElement("div");
    div.innerHTML = content;

    // extract all javascript <script> elements
    var scriptSet_tmp = div.querySelectorAll("script"),
        scriptSet = snapshot(scriptSet_tmp),
        scripts = document.createElement("div"),
        script, s, last;
    for(s=0, last=scriptSet.length; s<last; s++) {
      script = scriptSet[s];
      type = script.getAttribute("type");
      if(!type || (type && type==="text/javascript")) {
        scripts.appendChild(script); }}

    // update iframe <body>
    frame.update(snapshot(div.children));

    // update iframe <head>
    frame.updateScripts(snapshot(scripts.children));
    
    // end of parse: clear all processing marks
    frame.clearMarks();
  }

  /**
   * on-time page load function
   */
  function init() {
    document.removeEventListener("DOMContentLoaded",init,false);
    var ta = document.querySelector("textarea"),
        fr = document.querySelector("iframe");
    // persistently bind iframe
    frame = new Frame(fr);
    // set up onChange handling
    ta.onkeyup = (function(frame){ return function(event) { parse(event, frame); }; }(frame));
    // initial parse
    parse({target: ta}, frame);
  }

  // kickstarter
  document.addEventListener("DOMContentLoaded",init,false);
}());