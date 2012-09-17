/**
 * Several JavaScript functions that should exist, but don't.
 */
(function(){

  /**
   * Hard array copy. No idea why JavaScript
   * doesn't have this baked in.
   */
  window.arrayCopy = function arrayCopy(arr) {
    var narr = [], a, l=arr.length;
    for(a=0; a<l; a++) { narr[a] = arr[a]; }
    return narr;
  }

}());