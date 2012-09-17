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

    // does this frame contain this element?
    contains: function(element) {
      var set = snapshot(this.body.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(equal(element,set[s])===0) {
          this.mark(set[s]);
          return true; }}
      return false;
    },

    // does this frame contain this script?
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
/*
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
*/
      var d1 = make("div"), d2 = make("div"),
          d, l1 = elements.length,
          elements2 = arrayCopy(this.body.childNodes),
          l2=elements2.length;

      for(d=0; d<l1; d++) { d1.appendChild(elements[d]); }
      for(d=0; d<l2; d++) { d2.appendChild(elements2[d]); }
      var diffs = getDiff(d1, d2);
      while(d2.childNodes.length > 0) {
        this.body.appendChild(d2.childNodes[0]);
      }
      
      if (diffs.length===1 && diffs[0]===-1) {
        // injection
        for(d=0; d<l1; d++) {
          this.body.appendChild(elements[d]);
        }
      }
      else if(diffs.length===1 && diffs[0]===0) {
        // no change
      }
      else {
        var diff, len=diffs.length,
            e1 = d1, e2 = this.body,
            pos;

        for(d=0; d<len; d++) {
          diff = diffs[d];

          // insertion?
          if (diff.indexOf("insertion") > -1) {
            console.log("insertion found", arrayCopy(diff));

            while(diff[0] !== -1) {
              console.log(e1);
              pos = diff.splice(0,1);
              console.log("accessing child node "+pos);
              e1 = e1.childNodes[pos];
              if(e2.childNodes && e2.childNodes.length>pos) {
                e2 = e2.childNodes[pos];
              }
            }

            console.log(e1);
            console.log(e2);

            pos = diff[diff.indexOf("insertion") + 1];
            console.log("insertion pos: "+pos);
            if(pos === -1 || pos >= e2.childNodes.length) {
              console.log("appending to e2");
              e2.appendChild(e1);
            }
          }

          // special insertion case: text -> text<element>text?
          else if(diff.indexOf("special t->tet") > -1) {
            // we need to handle this rule, and the two
            // associated insertion rules.
            var offset = diff[diff.indexOf("special t->tet") + 1];
            len -= 2; // adjust the loop termination threshold
            var r1 = diffs[offset], r2 = diffs[offset+1];

            // first do the replacement
            while(diff[0] !== -1) {
              pos = diff.splice(0,1);
              e1 = e1.childNodes[pos];
              e2 = e2.childNodes[pos];
            }

            var parent1 = e1.parentNode,
                parent2 = e2.parentNode;

            parent2.replaceChild(e1,e2);
            
            var pos1 = r1[r1.indexOf(-1)-1]-1,
                pos2 = r2[r2.indexOf(-1)-1]-2;

            console.log(pos1);
            console.log(parent1.childNodes[pos1]);
            parent2.appendChild(parent1.childNodes[pos1]);

            console.log(pos2);
            console.log(parent1.childNodes[pos2]);
            console.log(parent2);
            parent2.appendChild(parent1.childNodes[pos2]);
          }

          // removal?
          else if (diff.indexOf("removal") > -1) {
            console.log("removal found", arrayCopy(diff));
            while(diff[0] !== -1) {
              pos = diff.splice(0,1);
              e2 = e2.childNodes[pos];
            }
            e2.parentNode.removeChild(e2);
          }

          // none of these: normal, in-place update.
          else {

            // traverse route
            while(diff.length>1) {
              pos = diff.splice(0,1);
              e1 = e1.childNodes[pos];
              e2 = e2.childNodes[pos];
            }
            // perform replacement
            e2.parentNode.replaceChild(e1,e2);

          }
        }
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
    var ta = event.target,
        content = ta.value;

    // Shortcut on stale data.
    if(oldcontent==content) return;

    // Also shortcut on illegal HTML, based on slowparse!
    var ret = Slowparse.HTML(frame.document, content);
    if(ret.error) {
      ta.style.backgroundColor = "rgba(255,0,0,0.2)";
      return; 
    }
    ta.style.backgroundColor = "inherit";

    // Do real processing
    oldcontent = content;

    // turn content into a dom tree.
    var div = document.createElement("div");
    div.innerHTML = content;

/*
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
*/

    frame.update(snapshot(div.childNodes));
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