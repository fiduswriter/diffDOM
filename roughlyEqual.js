/**
 * Rough equality check
 */
define(function() {
  var roughlyEqual = function roughlyEqual(e1, e2, preventRecursion) {
    if (!e1 || !e2) return false;
    if (e1.nodeType !== e2.nodeType) return false;
    if (e1.nodeType === 3) return e1.data === e2.data;
    if (e1.nodeName !== e2.nodeName) return false;
    if (e1.childNodes.length !== e2.childNodes.length) return false;
    var thesame = true;
    for (var i=e1.childNodes.length-1; i >= 0; i--) {
      if (preventRecursion) {
        thesame = thesame && (e1.childNodes[i].nodeName === e2.childNodes[i].nodeName);
      } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        //       was not set, we explicitly set it for child iterations.
        thesame = thesame && roughlyEqual(e1.childNodes[i], e2.childNodes[i], true);
      }
    }
    return thesame;
  };

  return roughlyEqual;
});
