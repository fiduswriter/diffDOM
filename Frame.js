/**
 * iframe mirroring object. This lets us
 * keep a persistent reference to its content.
 */
(function(){
  /**
   * Constructor: bind the iframe's
   * window, document, head and body.
   */
  var Frame = function(iframe) {
    this.window = iframe.contentWindow;
    this.document = iframe.contentDocument;
    this.head = this.document.head;
    this.body = this.document.body;
  }

  /**
   * Prototype function definitions.
   */
  Frame.prototype = {

    /**
     * find an element in the DOM tree
     */
    find: function(treeRoute) {
      var e = this.body,
          route = snapshot(treeRoute),
          pos = route.splice(0,1)[0];
      while(pos!==-1) {
        e = e.childNodes[pos];
        pos = route.splice(0,1)[0];
      }
      return e;
    },

    /**
     * Does this frame already contain this
     * script (in the head)?
     */
    containsScript: function(script) {
      var set = snapshot(this.head.children),
          s, last=set.length;
      for(s=0; s<last; s++) {
        if(equal(script,set[s])===0) {
          this.mark(set[s]);
          return true; }}
      return false;
    },

    /**
     * Script loading inside the frame
     */
    loadScript: function(element) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      // load from source?
      if(element.getAttribute("src")) { script.src = element.getAttribute("src"); }
      // no, load from content.
      else { script.innerHTML = element.innerHTML; }
      // append to head, so that it triggers.
      this.head.appendChild(script);
    },

    /**
     * Override the DOM content with new content.
     */
    set: function(elementContainer) {
      this.body.innerHTML = "";
      var children = elementContainer.childNodes;
      while(children.length>0) {
        this.body.appendChild(children[0]);
      }
    }
  };

  // bind as a window-level thing
  window.Frame = Frame;
}());