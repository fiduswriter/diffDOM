define(function() {

  var resolveOuterDiff = function(node, outerdiff) {
    var applied = node.cloneNode(true);

    outerdiff.forEach(function(operation) {
      var op = operation.action,
          attr = operation.attribute;

      if (op === "removed attribute") {
        applied.removeAttribute(attr.name);
      }
      else if (op === "modified attribute") {
        applied.setAttribute(attr.name, attr.newValue);
      }
      else if (op === "added attribute") {
        applied.setAttribute(attr.name, attr.value);
      }
    });

    return applied;
  };

  return resolveOuterDiff;
});
