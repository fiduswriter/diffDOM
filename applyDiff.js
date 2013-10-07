define(["Utils"], function(utils) {

  var applyOperation = function(operation, tree) {
    var op = operation.action,
        route = operation.route;
        node = tree;

    route = route.slice();

    while(route.length>0) {
    	node = node.childNodes[route.splice(0,1)[0]];
    }

    // attribute diffs

    var attr = operation.attribute;

    if (op === "removed attribute") {
      return node.removeAttribute(attr.name);
    }

    else if (op === "modified attribute") {
      return node.setAttribute(attr.name, attr.newValue);
    }

    else if (op === "added attribute") {
      return node.setAttribute(attr.name, attr.value);
    }

    // element diffs

    var el = operation.element;

    if (op === "remove element") {
      node.parentNode.removeChild(node);
    }

    else if (op === "append element") {
      node.parentNode.appendChild(utils.createChild(el));
    }

    else if (op === "insert element") {
      var next = node.nextSibling;
      next.parentNode.insertBefore(utils.createChild(el), next);
    }

    else if (op === "inner modification") {
      console.log(op, node, el);
      throw new Error(op + "unsupported");
    }

    else if (op === "text modification") {
      console.log(op, node, el);
      throw new Error(op + "unsupported");
    }

    else if (op === "unknown modification") {
      throw new Error(op + "unsupported");
    }
  }

  var applyDiff = function(operations, tree) {
    operations.forEach(function(operation) {
      applyOperation(operation, tree);
    });
  };

  return applyDiff;
});
