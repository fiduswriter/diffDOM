define(["Utils"], function(utils) {

  /**
   * Process a diff for a node.
   */
  var applyOperationToNode = function(operation, node) {
    var op = operation.action;

    // attribute diffs
    var attr = operation.attribute;

    if (op === "removed attribute") {
      return node.removeAttribute(attr.name);
    }

    if (op === "modified attribute") {
      return node.setAttribute(attr.name, attr.newValue);
    }

    if (op === "added attribute") {
      return node.setAttribute(attr.name, attr.value);
    }

    // element diffs
    var el = operation.element;

    if (op === "remove element") {
      return node.parentNode.removeChild(node);
    }

    if (op === "append element") {
      return node.parentNode.appendChild(utils.createChild(el));
    }

    if (op === "insert element") {
      var next = node.nextSibling;
      return next.parentNode.insertBefore(utils.createChild(el), next);
    }

    if (op === "move elements") {
      var from = operation.from,
          to = operation.to,
          len = operation.length,
          child, reference;
//  console.log("MOVING "+operation.length+" ELEMENTS", node, ": " + from + " => " + to);
      // slide elements down
      if(from > to) {
        for(var i=0; i<len; i++) {
          child = node.childNodes[from + i];
          reference = node.childNodes[to + i];
// console.log("moving ", child, " to before ", reference);
          node.insertBefore(child, reference);
        }
      }

      // slide elements up
      else {
        for(var i=len-1; i>=0; i--) {
          child = node.childNodes[from + i];
          reference = node.childNodes[to + 1 + i];
// console.log("moving ", child, "("+(from+i)+") to before ", reference, "("+(to+1+i)+")");
          node.insertBefore(child, reference);
        }
      }

      return;
    }

    if (op === "text modification") {
      return node.data = operation.newData;
    }

    if (op === "text to node") {
      return node.innerHTML = operation.newData;
    }

    if (op === "node to text") {
      return node.innerHTML = operation.newData;
    }

    throw new Error(op + " unsupported");
  }

  /**
   * Apply a single operation to its relevant node
   */
  var applyOperation = function(operation, tree) {
    var route = operation.route.slice();
        node = tree;
    try {
      while(route.length>0) {
      	node = node.childNodes[route.splice(0,1)[0]];
      }
    } catch (e) {
      console.error("Error caused by [" + operation.action + "]", operation);
      throw e;
    }
    applyOperationToNode(operation, node);
  }

  /**
   * Apply a sequence of operations, one by one
   */
  var applyDiff = function(operations, tree) {
    operations.forEach(function(operation) {
      applyOperation(operation, tree);
    });
  };

  return {
    applyOperationToNode: applyOperationToNode,
    applyOperation: applyOperation,
    applyDiff: applyDiff
  };

});
