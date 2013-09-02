var get = function(id) { return document.querySelector("#"+id); };

var arrayEqual = function(test, target) {
  // null values
  if(test==null && target!=null) return false;
  if(test!=null && target==null) return false;
  if(test==null && target==null) return true;

  var testType = test.constructor.name,
      targetType = target.constructor.name;
  
  // array equalities
  if(testType === "Array" && testType == targetType) {
    var i, last=test.length, result = true;
    for(i=0; i<last; i++) {
      result = result && arrayEqual(test[i], target[i]);
    }
    return result;
  }
  
  if(testType == "Text" && targetType == "String") {
    return test.textContent.trim() == target.trim();
  }

  // primitives
  if(typeof test != "object" && typeof target != "object") return test == target;

  // objects/arrays
  if(typeof test != "object" && typeof target == "object") return false;
  if(typeof test == "object" && typeof target != "object") return false;

  return false;
};

var getTestFile = function(testNumber) {
  var xhr = new XMLHttpRequest(),
      url = "test/tests/"+testNumber+".html";        
  xhr.open("GET",url,false);
  xhr.send(null);
  return xhr.responseText;
};

var getTestData = function(testNumber) {
  var test = getTestFile(testNumber).split("---"),
      d1 = make("div"),
      d2 = make("div");
  d1.innerHTML = test[1].trim();
  d2.innerHTML = test[0].trim();
  var elements = { e1: d1.childNodes[0], e2: d2.childNodes[0] };
  return elements;
};
