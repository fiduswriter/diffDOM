var diffDOM=function(e){"use strict";var t=function(){function e(e){var t=this;void 0===e&&(e={}),Object.entries(e).forEach((function(e){var n=e[0],o=e[1];return t[n]=o}))}return e.prototype.toString=function(){return JSON.stringify(this)},e.prototype.setValue=function(e,t){return this[e]=t,this},e}(),n=function(e){for(var t=arguments,n=[],o=1;o<arguments.length;o++)n[o-1]=t[o];return null!=e&&n.some((function(t){var n,o;return"function"==typeof(null===(o=null===(n=null==e?void 0:e.ownerDocument)||void 0===n?void 0:n.defaultView)||void 0===o?void 0:o[t])&&e instanceof e.ownerDocument.defaultView[t]}))};function o(e,t,s){var i;return"#text"===e.nodeName?i=s.document.createTextNode(e.data):"#comment"===e.nodeName?i=s.document.createComment(e.data):(t?i=s.document.createElementNS("http://www.w3.org/2000/svg",e.nodeName):"svg"===e.nodeName.toLowerCase()?(i=s.document.createElementNS("http://www.w3.org/2000/svg","svg"),t=!0):i=s.document.createElement(e.nodeName),e.attributes&&Object.entries(e.attributes).forEach((function(e){var t=e[0],n=e[1];return i.setAttribute(t,n)})),e.childNodes&&e.childNodes.forEach((function(e){return i.appendChild(o(e,t,s))})),s.valueDiffing&&(e.value&&n(i,"HTMLButtonElement","HTMLDataElement","HTMLInputElement","HTMLLIElement","HTMLMeterElement","HTMLOptionElement","HTMLProgressElement","HTMLParamElement")&&(i.value=e.value),e.checked&&n(i,"HTMLInputElement")&&(i.checked=e.checked),e.selected&&n(i,"HTMLOptionElement")&&(i.selected=e.selected))),i}var s=function(e,t){for(t=t.slice();t.length>0;){var n=t.splice(0,1)[0];e=e.childNodes[n]}return e};function i(e,t,i){var a,l,c,r=t[i._const.action],u=t[i._const.route];[i._const.addElement,i._const.addTextElement].includes(r)||(a=s(e,u));var d={diff:t,node:a};if(i.preDiffApply(d))return!0;switch(r){case i._const.addAttribute:if(!a||!n(a,"Element"))return!1;a.setAttribute(t[i._const.name],t[i._const.value]);break;case i._const.modifyAttribute:if(!a||!n(a,"Element"))return!1;a.setAttribute(t[i._const.name],t[i._const.newValue]),n(a,"HTMLInputElement")&&"value"===t[i._const.name]&&(a.value=t[i._const.newValue]);break;case i._const.removeAttribute:if(!a||!n(a,"Element"))return!1;a.removeAttribute(t[i._const.name]);break;case i._const.modifyTextElement:if(!a||!n(a,"Text"))return!1;i.textDiff(a,a.data,t[i._const.oldValue],t[i._const.newValue]),n(a.parentNode,"HTMLTextAreaElement")&&(a.parentNode.value=t[i._const.newValue]);break;case i._const.modifyValue:if(!a||void 0===a.value)return!1;a.value=t[i._const.newValue];break;case i._const.modifyComment:if(!a||!n(a,"Comment"))return!1;i.textDiff(a,a.data,t[i._const.oldValue],t[i._const.newValue]);break;case i._const.modifyChecked:if(!a||void 0===a.checked)return!1;a.checked=t[i._const.newValue];break;case i._const.modifySelected:if(!a||void 0===a.selected)return!1;a.selected=t[i._const.newValue];break;case i._const.replaceElement:var h="svg"===t[i._const.newValue].nodeName.toLowerCase()||"http://www.w3.org/2000/svg"===a.parentNode.namespaceURI;a.parentNode.replaceChild(o(t[i._const.newValue],h,i),a);break;case i._const.relocateGroup:Array.apply(void 0,new Array(t[i._const.groupLength])).map((function(){return a.removeChild(a.childNodes[t[i._const.from]])})).forEach((function(e,n){0===n&&(c=a.childNodes[t[i._const.to]]),a.insertBefore(e,c||null)}));break;case i._const.removeElement:a.parentNode.removeChild(a);break;case i._const.addElement:var p=(m=u.slice()).splice(m.length-1,1)[0];if(a=s(e,m),!n(a,"Element"))return!1;a.insertBefore(o(t[i._const.element],"http://www.w3.org/2000/svg"===a.namespaceURI,i),a.childNodes[p]||null);break;case i._const.removeTextElement:if(!a||3!==a.nodeType)return!1;var f=a.parentNode;f.removeChild(a),n(f,"HTMLTextAreaElement")&&(f.value="");break;case i._const.addTextElement:var m;p=(m=u.slice()).splice(m.length-1,1)[0];if(l=i.document.createTextNode(t[i._const.value]),!(a=s(e,m)).childNodes)return!1;a.insertBefore(l,a.childNodes[p]||null),n(a.parentNode,"HTMLTextAreaElement")&&(a.parentNode.value=t[i._const.value]);break;default:console.log("unknown action")}return i.postDiffApply({diff:d.diff,node:d.node,newNode:l}),!0}function a(e,t,n){var o=e[t];e[t]=e[n],e[n]=o}function l(e,t,n){(t=t.slice()).reverse(),t.forEach((function(t){!function(e,t,n){switch(t[n._const.action]){case n._const.addAttribute:t[n._const.action]=n._const.removeAttribute,i(e,t,n);break;case n._const.modifyAttribute:a(t,n._const.oldValue,n._const.newValue),i(e,t,n);break;case n._const.removeAttribute:t[n._const.action]=n._const.addAttribute,i(e,t,n);break;case n._const.modifyTextElement:case n._const.modifyValue:case n._const.modifyComment:case n._const.modifyChecked:case n._const.modifySelected:case n._const.replaceElement:a(t,n._const.oldValue,n._const.newValue),i(e,t,n);break;case n._const.relocateGroup:a(t,n._const.from,n._const.to),i(e,t,n);break;case n._const.removeElement:t[n._const.action]=n._const.addElement,i(e,t,n);break;case n._const.addElement:t[n._const.action]=n._const.removeElement,i(e,t,n);break;case n._const.removeTextElement:t[n._const.action]=n._const.addTextElement,i(e,t,n);break;case n._const.addTextElement:t[n._const.action]=n._const.removeTextElement,i(e,t,n);break;default:console.log("unknown action")}}(e,t,n)}))}var c=function(){return c=Object.assign||function(e){for(var t,n=arguments,o=1,s=arguments.length;o<s;o++)for(var i in t=n[o])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},c.apply(this,arguments)};"function"==typeof SuppressedError&&SuppressedError;var r=function(e){var t=[];return t.push(e.nodeName),"#text"!==e.nodeName&&"#comment"!==e.nodeName&&e.attributes&&(e.attributes.class&&t.push("".concat(e.nodeName,".").concat(e.attributes.class.replace(/ /g,"."))),e.attributes.id&&t.push("".concat(e.nodeName,"#").concat(e.attributes.id))),t},u=function(e){var t={},n={};return e.forEach((function(e){r(e).forEach((function(e){var o=e in t;o||e in n?o&&(delete t[e],n[e]=!0):t[e]=!0}))})),t},d=function(e,t){var n=u(e),o=u(t),s={};return Object.keys(n).forEach((function(e){o[e]&&(s[e]=!0)})),s},h=function(e){return delete e.outerDone,delete e.innerDone,delete e.valueDone,!e.childNodes||e.childNodes.every(h)},p=function(e){if(Object.prototype.hasOwnProperty.call(e,"data"))return{nodeName:"#text"===e.nodeName?"#text":"#comment",data:e.data};var t={nodeName:e.nodeName};return Object.prototype.hasOwnProperty.call(e,"attributes")&&(t.attributes=c({},e.attributes)),Object.prototype.hasOwnProperty.call(e,"checked")&&(t.checked=e.checked),Object.prototype.hasOwnProperty.call(e,"value")&&(t.value=e.value),Object.prototype.hasOwnProperty.call(e,"selected")&&(t.selected=e.selected),Object.prototype.hasOwnProperty.call(e,"childNodes")&&(t.childNodes=e.childNodes.map((function(e){return p(e)}))),t},f=function(e,t){if(!["nodeName","value","checked","selected","data"].every((function(n){return e[n]===t[n]})))return!1;if(Object.prototype.hasOwnProperty.call(e,"data"))return!0;if(Boolean(e.attributes)!==Boolean(t.attributes))return!1;if(Boolean(e.childNodes)!==Boolean(t.childNodes))return!1;if(e.attributes){var n=Object.keys(e.attributes),o=Object.keys(t.attributes);if(n.length!==o.length)return!1;if(!n.every((function(n){return e.attributes[n]===t.attributes[n]})))return!1}if(e.childNodes){if(e.childNodes.length!==t.childNodes.length)return!1;if(!e.childNodes.every((function(e,n){return f(e,t.childNodes[n])})))return!1}return!0},m=function(e,t,n,o,s){if(void 0===s&&(s=!1),!e||!t)return!1;if(e.nodeName!==t.nodeName)return!1;if(["#text","#comment"].includes(e.nodeName))return!!s||e.data===t.data;if(e.nodeName in n)return!0;if(e.attributes&&t.attributes){if(e.attributes.id){if(e.attributes.id!==t.attributes.id)return!1;if("".concat(e.nodeName,"#").concat(e.attributes.id)in n)return!0}if(e.attributes.class&&e.attributes.class===t.attributes.class)if("".concat(e.nodeName,".").concat(e.attributes.class.replace(/ /g,"."))in n)return!0}if(o)return!0;var i=e.childNodes?e.childNodes.slice().reverse():[],a=t.childNodes?t.childNodes.slice().reverse():[];if(i.length!==a.length)return!1;if(s)return i.every((function(e,t){return e.nodeName===a[t].nodeName}));var l=d(i,a);return i.every((function(e,t){return m(e,a[t],l,!0,!0)}))},_=function(e,t){return Array.apply(void 0,new Array(e)).map((function(){return t}))},v=function(e,t){for(var n=e.childNodes?e.childNodes:[],o=t.childNodes?t.childNodes:[],s=_(n.length,!1),i=_(o.length,!1),a=[],l=function(){return arguments[1]},c=!1,u=function(){var e=function(e,t,n,o){var s=0,i=[],a=e.length,l=t.length,c=Array.apply(void 0,new Array(a+1)).map((function(){return[]})),u=d(e,t),h=a===l;h&&e.some((function(e,n){var o=r(e),s=r(t[n]);return o.length!==s.length?(h=!1,!0):(o.some((function(e,t){if(e!==s[t])return h=!1,!0})),!h||void 0)}));for(var p=0;p<a;p++)for(var f=e[p],_=0;_<l;_++){var v=t[_];n[p]||o[_]||!m(f,v,u,h)?c[p+1][_+1]=0:(c[p+1][_+1]=c[p][_]?c[p][_]+1:1,c[p+1][_+1]>=s&&(s=c[p+1][_+1],i=[p+1,_+1]))}return 0!==s&&{oldValue:i[0]-s,newValue:i[1]-s,length:s}}(n,o,s,i);e?(a.push(e),Array.apply(void 0,new Array(e.length)).map(l).forEach((function(t){return function(e,t,n,o){e[n.oldValue+o]=!0,t[n.newValue+o]=!0}(s,i,e,t)}))):c=!0};!c;)u();return e.subsets=a,e.subsetsAge=100,a},g=function(){function e(){this.list=[]}return e.prototype.add=function(e){var t;(t=this.list).push.apply(t,e)},e.prototype.forEach=function(e){this.list.forEach((function(t){return e(t)}))},e}(),V=function(e,t){var n;(null===(n=e.attributes)||void 0===n?void 0:n.class)&&t.test(e.attributes.class)?e.childNodes=[]:e.childNodes&&e.childNodes.forEach((function(e){return V(e,t)}))},b=function(e,t){var n=new RegExp("\\b".concat(t,"\\b"));V(e,n)};function N(e,t){var n,o,s=e;for(t=t.slice();t.length>0;)o=t.splice(0,1)[0],n=s,s=s.childNodes?s.childNodes[o]:void 0;return{node:s,parentNode:n,nodeIndex:o}}function y(e,t,n){return t.forEach((function(t){!function(e,t,n){var o,s,i,a;if(![n._const.addElement,n._const.addTextElement].includes(t[n._const.action])){var l=N(e,t[n._const.route]);s=l.node,i=l.parentNode,a=l.nodeIndex}var c,r,u=[],d={diff:t,node:s};if(n.preVirtualDiffApply(d))return!0;switch(t[n._const.action]){case n._const.addAttribute:s.attributes||(s.attributes={}),s.attributes[t[n._const.name]]=t[n._const.value],"checked"===t[n._const.name]?s.checked=!0:"selected"===t[n._const.name]?s.selected=!0:"INPUT"===s.nodeName&&"value"===t[n._const.name]&&(s.value=t[n._const.value]);break;case n._const.modifyAttribute:s.attributes[t[n._const.name]]=t[n._const.newValue];break;case n._const.removeAttribute:delete s.attributes[t[n._const.name]],0===Object.keys(s.attributes).length&&delete s.attributes,"checked"===t[n._const.name]?s.checked=!1:"selected"===t[n._const.name]?delete s.selected:"INPUT"===s.nodeName&&"value"===t[n._const.name]&&delete s.value;break;case n._const.modifyTextElement:s.data=t[n._const.newValue],"TEXTAREA"===i.nodeName&&(i.value=t[n._const.newValue]);break;case n._const.modifyValue:s.value=t[n._const.newValue];break;case n._const.modifyComment:s.data=t[n._const.newValue];break;case n._const.modifyChecked:s.checked=t[n._const.newValue];break;case n._const.modifySelected:s.selected=t[n._const.newValue];break;case n._const.replaceElement:c=p(t[n._const.newValue]),i.childNodes[a]=c;break;case n._const.relocateGroup:s.childNodes.splice(t[n._const.from],t[n._const.groupLength]).reverse().forEach((function(e){return s.childNodes.splice(t[n._const.to],0,e)})),s.subsets&&s.subsets.forEach((function(e){if(t[n._const.from]<t[n._const.to]&&e.oldValue<=t[n._const.to]&&e.oldValue>t[n._const.from])e.oldValue-=t[n._const.groupLength],(o=e.oldValue+e.length-t[n._const.to])>0&&(u.push({oldValue:t[n._const.to]+t[n._const.groupLength],newValue:e.newValue+e.length-o,length:o}),e.length-=o);else if(t[n._const.from]>t[n._const.to]&&e.oldValue>t[n._const.to]&&e.oldValue<t[n._const.from]){var o;e.oldValue+=t[n._const.groupLength],(o=e.oldValue+e.length-t[n._const.to])>0&&(u.push({oldValue:t[n._const.to]+t[n._const.groupLength],newValue:e.newValue+e.length-o,length:o}),e.length-=o)}else e.oldValue===t[n._const.from]&&(e.oldValue=t[n._const.to])}));break;case n._const.removeElement:i.childNodes.splice(a,1),i.subsets&&i.subsets.forEach((function(e){e.oldValue>a?e.oldValue-=1:e.oldValue===a?e.delete=!0:e.oldValue<a&&e.oldValue+e.length>a&&(e.oldValue+e.length-1===a?e.length--:(u.push({newValue:e.newValue+a-e.oldValue,oldValue:a,length:e.length-a+e.oldValue-1}),e.length=a-e.oldValue))})),s=i;break;case n._const.addElement:var h=(r=t[n._const.route].slice()).splice(r.length-1,1)[0];s=null===(o=N(e,r))||void 0===o?void 0:o.node,c=p(t[n._const.element]),s.childNodes||(s.childNodes=[]),h>=s.childNodes.length?s.childNodes.push(c):s.childNodes.splice(h,0,c),s.subsets&&s.subsets.forEach((function(e){if(e.oldValue>=h)e.oldValue+=1;else if(e.oldValue<h&&e.oldValue+e.length>h){var t=e.oldValue+e.length-h;u.push({newValue:e.newValue+e.length-t,oldValue:h+1,length:t}),e.length-=t}}));break;case n._const.removeTextElement:i.childNodes.splice(a,1),"TEXTAREA"===i.nodeName&&delete i.value,i.subsets&&i.subsets.forEach((function(e){e.oldValue>a?e.oldValue-=1:e.oldValue===a?e.delete=!0:e.oldValue<a&&e.oldValue+e.length>a&&(e.oldValue+e.length-1===a?e.length--:(u.push({newValue:e.newValue+a-e.oldValue,oldValue:a,length:e.length-a+e.oldValue-1}),e.length=a-e.oldValue))})),s=i;break;case n._const.addTextElement:var f=(r=t[n._const.route].slice()).splice(r.length-1,1)[0];c={nodeName:"#text",data:t[n._const.value]},(s=N(e,r).node).childNodes||(s.childNodes=[]),f>=s.childNodes.length?s.childNodes.push(c):s.childNodes.splice(f,0,c),"TEXTAREA"===s.nodeName&&(s.value=t[n._const.newValue]),s.subsets&&s.subsets.forEach((function(e){if(e.oldValue>=f&&(e.oldValue+=1),e.oldValue<f&&e.oldValue+e.length>f){var t=e.oldValue+e.length-f;u.push({newValue:e.newValue+e.length-t,oldValue:f+1,length:t}),e.length-=t}}));break;default:console.log("unknown action")}s.subsets&&(s.subsets=s.subsets.filter((function(e){return!e.delete&&e.oldValue!==e.newValue})),u.length&&(s.subsets=s.subsets.concat(u))),n.postVirtualDiffApply({node:d.node,diff:d.diff,newNode:c})}(e,t,n)})),!0}function w(e,t){void 0===t&&(t={valueDiffing:!0});var o={nodeName:e.nodeName};if(n(e,"Text","Comment"))o.data=e.data;else{if(e.attributes&&e.attributes.length>0)o.attributes={},Array.prototype.slice.call(e.attributes).forEach((function(e){return o.attributes[e.name]=e.value}));if(e.childNodes&&e.childNodes.length>0)o.childNodes=[],Array.prototype.slice.call(e.childNodes).forEach((function(e){return o.childNodes.push(w(e,t))}));t.valueDiffing&&(n(e,"HTMLTextAreaElement")&&(o.value=e.value),n(e,"HTMLInputElement")&&["radio","checkbox"].includes(e.type.toLowerCase())&&void 0!==e.checked?o.checked=e.checked:n(e,"HTMLButtonElement","HTMLDataElement","HTMLInputElement","HTMLLIElement","HTMLMeterElement","HTMLOptionElement","HTMLProgressElement","HTMLParamElement")&&(o.value=e.value),n(e,"HTMLOptionElement")&&(o.selected=e.selected))}return o}var E=/<\s*\/*[a-zA-Z:_][a-zA-Z0-9:_\-.]*\s*(?:"[^"]*"['"]*|'[^']*'['"]*|[^'"/>])*\/*\s*>|<!--(?:.|\n|\r)*?-->/g,k=/\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;function x(e){return e.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}var T={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,menuItem:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0},O=function(e,t){var n={nodeName:"",attributes:{}},o=!1,s=e.match(/<\/?([^\s]+?)[/\s>]/);if(s&&(n.nodeName=t||"svg"===s[1]?s[1]:s[1].toUpperCase(),(T[s[1]]||"/"===e.charAt(e.length-2))&&(o=!0),n.nodeName.startsWith("!--"))){var i=e.indexOf("--\x3e");return{type:"comment",node:{nodeName:"#comment",data:-1!==i?e.slice(4,i):""},voidElement:o}}for(var a=new RegExp(k),l=null,c=!1;!c;)if(null===(l=a.exec(e)))c=!0;else if(l[0].trim())if(l[1]){var r=l[1].trim(),u=[r,""];r.indexOf("=")>-1&&(u=r.split("=")),n.attributes[u[0]]=u[1],a.lastIndex--}else l[2]&&(n.attributes[l[2]]=l[3].trim().substring(1,l[3].length-1));return{type:"tag",node:n,voidElement:o}},A=function(e,t){void 0===t&&(t={valueDiffing:!0,caseSensitive:!1});var n,o=[],s=-1,i=[],a=!1;if(0!==e.indexOf("<")){var l=e.indexOf("<");o.push({nodeName:"#text",data:-1===l?e:e.substring(0,l)})}return e.replace(E,(function(l,c){var r="/"!==l.charAt(1),u=l.startsWith("\x3c!--"),d=c+l.length,h=e.charAt(d);if(u){var p=O(l,t.caseSensitive).node;if(s<0)return o.push(p),"";var f=i[s];return f&&p.nodeName&&(f.node.childNodes||(f.node.childNodes=[]),f.node.childNodes.push(p)),""}if(r){if("svg"===(n=O(l,t.caseSensitive||a)).node.nodeName&&(a=!0),s++,!n.voidElement&&h&&"<"!==h){n.node.childNodes||(n.node.childNodes=[]);var m=x(e.slice(d,e.indexOf("<",d)));n.node.childNodes.push({nodeName:"#text",data:m}),t.valueDiffing&&"TEXTAREA"===n.node.nodeName&&(n.node.value=m)}0===s&&n.node.nodeName&&o.push(n.node);var _=i[s-1];_&&n.node.nodeName&&(_.node.childNodes||(_.node.childNodes=[]),_.node.childNodes.push(n.node)),i[s]=n}if((!r||n.voidElement)&&(s>-1&&(n.voidElement||t.caseSensitive&&n.node.nodeName===l.slice(2,-1)||!t.caseSensitive&&n.node.nodeName.toUpperCase()===l.slice(2,-1).toUpperCase())&&--s>-1&&("svg"===n.node.nodeName&&(a=!1),n=i[s]),"<"!==h&&h)){var v=-1===s?o:i[s].node.childNodes||[],g=e.indexOf("<",d);m=x(e.slice(d,-1===g?void 0:g));v.push({nodeName:"#text",data:m})}return""})),o[0]},D=function(){function e(e,t,o){this.options=o,this.t1="undefined"!=typeof Element&&n(e,"Element")?w(e,this.options):"string"==typeof e?A(e,this.options):JSON.parse(JSON.stringify(e)),this.t2="undefined"!=typeof Element&&n(t,"Element")?w(t,this.options):"string"==typeof t?A(t,this.options):JSON.parse(JSON.stringify(t)),this.options.ignoreChildrenClass&&(b(this.t1,this.options.ignoreChildrenClass),b(this.t2,this.options.ignoreChildrenClass)),this.diffcount=0,this.foundAll=!1,this.debug&&(this.t1Orig="undefined"!=typeof Element&&n(e,"Element")?w(e,this.options):"string"==typeof e?A(e,this.options):JSON.parse(JSON.stringify(e)),this.t2Orig="undefined"!=typeof Element&&n(t,"Element")?w(t,this.options):"string"==typeof t?A(t,this.options):JSON.parse(JSON.stringify(t))),this.tracker=new g}return e.prototype.init=function(){return this.findDiffs(this.t1,this.t2)},e.prototype.findDiffs=function(e,t){var n;do{if(this.options.debug&&(this.diffcount+=1,this.diffcount>this.options.diffcap))throw new Error("surpassed diffcap:".concat(JSON.stringify(this.t1Orig)," -> ").concat(JSON.stringify(this.t2Orig)));0===(n=this.findNextDiff(e,t,[])).length&&(f(e,t)||(this.foundAll?console.error("Could not find remaining diffs!"):(this.foundAll=!0,h(e),n=this.findNextDiff(e,t,[])))),n.length>0&&(this.foundAll=!1,this.tracker.add(n),y(e,n,this.options))}while(n.length>0);return this.tracker.list},e.prototype.findNextDiff=function(e,t,n){var o,s;if(this.options.maxDepth&&n.length>this.options.maxDepth)return[];if(!e.outerDone){if(o=this.findOuterDiff(e,t,n),this.options.filterOuterDiff&&(s=this.options.filterOuterDiff(e,t,o))&&(o=s),o.length>0)return e.outerDone=!0,o;e.outerDone=!0}if(Object.prototype.hasOwnProperty.call(e,"data"))return[];if(!e.innerDone){if((o=this.findInnerDiff(e,t,n)).length>0)return o;e.innerDone=!0}if(this.options.valueDiffing&&!e.valueDone){if((o=this.findValueDiff(e,t,n)).length>0)return e.valueDone=!0,o;e.valueDone=!0}return[]},e.prototype.findOuterDiff=function(e,n,o){var s,i,a,l,c,r,u=[];if(e.nodeName!==n.nodeName){if(!o.length)throw new Error("Top level nodes have to be of the same kind.");return[(new t).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,p(e)).setValue(this.options._const.newValue,p(n)).setValue(this.options._const.route,o)]}if(o.length&&this.options.diffcap<Math.abs((e.childNodes||[]).length-(n.childNodes||[]).length))return[(new t).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,p(e)).setValue(this.options._const.newValue,p(n)).setValue(this.options._const.route,o)];if(Object.prototype.hasOwnProperty.call(e,"data")&&e.data!==n.data)return"#text"===e.nodeName?[(new t).setValue(this.options._const.action,this.options._const.modifyTextElement).setValue(this.options._const.route,o).setValue(this.options._const.oldValue,e.data).setValue(this.options._const.newValue,n.data)]:[(new t).setValue(this.options._const.action,this.options._const.modifyComment).setValue(this.options._const.route,o).setValue(this.options._const.oldValue,e.data).setValue(this.options._const.newValue,n.data)];for(i=e.attributes?Object.keys(e.attributes).sort():[],a=n.attributes?Object.keys(n.attributes).sort():[],l=i.length,r=0;r<l;r++)s=i[r],-1===(c=a.indexOf(s))?u.push((new t).setValue(this.options._const.action,this.options._const.removeAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,s).setValue(this.options._const.value,e.attributes[s])):(a.splice(c,1),e.attributes[s]!==n.attributes[s]&&u.push((new t).setValue(this.options._const.action,this.options._const.modifyAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,s).setValue(this.options._const.oldValue,e.attributes[s]).setValue(this.options._const.newValue,n.attributes[s])));for(l=a.length,r=0;r<l;r++)s=a[r],u.push((new t).setValue(this.options._const.action,this.options._const.addAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,s).setValue(this.options._const.value,n.attributes[s]));return u},e.prototype.findInnerDiff=function(e,n,o){var s=e.childNodes?e.childNodes.slice():[],i=n.childNodes?n.childNodes.slice():[],a=Math.max(s.length,i.length),l=Math.abs(s.length-i.length),c=[],r=0;if(!this.options.maxChildCount||a<this.options.maxChildCount){var u=Boolean(e.subsets&&e.subsetsAge--),d=u?e.subsets:e.childNodes&&n.childNodes?v(e,n):[];if(d.length>0&&(c=this.attemptGroupRelocation(e,n,d,o,u)).length>0)return c}for(var h=0;h<a;h+=1){var m=s[h],_=i[h];l&&(m&&!_?"#text"===m.nodeName?(c.push((new t).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,m.data)),r-=1):(c.push((new t).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.element,p(m))),r-=1):_&&!m&&("#text"===_.nodeName?c.push((new t).setValue(this.options._const.action,this.options._const.addTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,_.data)):c.push((new t).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.element,p(_))))),m&&_&&(!this.options.maxChildCount||a<this.options.maxChildCount?c=c.concat(this.findNextDiff(m,_,o.concat(r))):f(m,_)||(s.length>i.length?("#text"===m.nodeName?c.push((new t).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,m.data)):c.push((new t).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.element,p(m)).setValue(this.options._const.route,o.concat(r))),s.splice(h,1),h-=1,r-=1,l-=1):s.length<i.length?(c=c.concat([(new t).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.element,p(_)).setValue(this.options._const.route,o.concat(r))]),s.splice(h,0,p(_)),l-=1):c=c.concat([(new t).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,p(m)).setValue(this.options._const.newValue,p(_)).setValue(this.options._const.route,o.concat(r))]))),r+=1}return e.innerDone=!0,c},e.prototype.attemptGroupRelocation=function(e,n,o,s,i){for(var a,l,c,r,u,d=function(e,t,n){var o=e.childNodes?_(e.childNodes.length,!0):[],s=t.childNodes?_(t.childNodes.length,!0):[],i=0;return n.forEach((function(e){for(var t=e.oldValue+e.length,n=e.newValue+e.length,a=e.oldValue;a<t;a+=1)o[a]=i;for(a=e.newValue;a<n;a+=1)s[a]=i;i+=1})),{gaps1:o,gaps2:s}}(e,n,o),h=d.gaps1,f=d.gaps2,v=e.childNodes.slice(),g=n.childNodes.slice(),V=Math.min(h.length,f.length),b=[],N=0,y=0;N<V;y+=1,N+=1)if(!i||!0!==h[N]&&!0!==f[N]){if(!0===h[y])if("#text"===(r=v[y]).nodeName)if("#text"===g[N].nodeName){if(r.data!==g[N].data){for(var w=y;v.length>w+1&&"#text"===v[w+1].nodeName;)if(w+=1,g[N].data===v[w].data){u=!0;break}u||b.push((new t).setValue(this.options._const.action,this.options._const.modifyTextElement).setValue(this.options._const.route,s.concat(y)).setValue(this.options._const.oldValue,r.data).setValue(this.options._const.newValue,g[N].data))}}else b.push((new t).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,s.concat(y)).setValue(this.options._const.value,r.data)),h.splice(y,1),v.splice(y,1),V=Math.min(h.length,f.length),y-=1,N-=1;else!0===f[N]?b.push((new t).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,p(r)).setValue(this.options._const.newValue,p(g[N])).setValue(this.options._const.route,s.concat(y))):(b.push((new t).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.route,s.concat(y)).setValue(this.options._const.element,p(r))),h.splice(y,1),v.splice(y,1),V=Math.min(h.length,f.length),y-=1,N-=1);else if(!0===f[N])"#text"===(r=g[N]).nodeName?(b.push((new t).setValue(this.options._const.action,this.options._const.addTextElement).setValue(this.options._const.route,s.concat(y)).setValue(this.options._const.value,r.data)),h.splice(y,0,!0),v.splice(y,0,{nodeName:"#text",data:r.data}),V=Math.min(h.length,f.length)):(b.push((new t).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.route,s.concat(y)).setValue(this.options._const.element,p(r))),h.splice(y,0,!0),v.splice(y,0,p(r)),V=Math.min(h.length,f.length));else if(h[y]!==f[N]){if(b.length>0)return b;if(c=o[h[y]],(l=Math.min(c.newValue,v.length-c.length))!==c.oldValue){a=!1;for(var E=0;E<c.length;E+=1)m(v[l+E],v[c.oldValue+E],{},!1,!0)||(a=!0);if(a)return[(new t).setValue(this.options._const.action,this.options._const.relocateGroup).setValue(this.options._const.groupLength,c.length).setValue(this.options._const.from,c.oldValue).setValue(this.options._const.to,l).setValue(this.options._const.route,s)]}}}else;return b},e.prototype.findValueDiff=function(e,n,o){var s=[];return e.selected!==n.selected&&s.push((new t).setValue(this.options._const.action,this.options._const.modifySelected).setValue(this.options._const.oldValue,e.selected).setValue(this.options._const.newValue,n.selected).setValue(this.options._const.route,o)),(e.value||n.value)&&e.value!==n.value&&"OPTION"!==e.nodeName&&s.push((new t).setValue(this.options._const.action,this.options._const.modifyValue).setValue(this.options._const.oldValue,e.value||"").setValue(this.options._const.newValue,n.value||"").setValue(this.options._const.route,o)),e.checked!==n.checked&&s.push((new t).setValue(this.options._const.action,this.options._const.modifyChecked).setValue(this.options._const.oldValue,e.checked).setValue(this.options._const.newValue,n.checked).setValue(this.options._const.route,o)),s},e}(),C={debug:!1,diffcap:10,maxDepth:!1,maxChildCount:50,valueDiffing:!0,ignoreChildrenClass:!1,textDiff:function(e,t,n,o){e.data=o},preVirtualDiffApply:function(){},postVirtualDiffApply:function(){},preDiffApply:function(){},postDiffApply:function(){},filterOuterDiff:null,compress:!1,_const:!1,document:!("undefined"==typeof window||!window.document)&&window.document,components:[]},L=function(){function e(e){if(void 0===e&&(e={}),Object.entries(C).forEach((function(t){var n=t[0],o=t[1];Object.prototype.hasOwnProperty.call(e,n)||(e[n]=o)})),!e._const){var t=["addAttribute","modifyAttribute","removeAttribute","modifyTextElement","relocateGroup","removeElement","addElement","removeTextElement","addTextElement","replaceElement","modifyValue","modifyChecked","modifySelected","modifyComment","action","route","oldValue","newValue","element","group","groupLength","from","to","name","value","data","attributes","nodeName","childNodes","checked","selected"],n={};e.compress?t.forEach((function(e,t){return n[e]=t})):t.forEach((function(e){return n[e]=e})),e._const=n}this.options=e}return e.prototype.apply=function(e,t){return function(e,t,n){return t.every((function(t){return i(e,t,n)}))}(e,t,this.options)},e.prototype.undo=function(e,t){return l(e,t,this.options)},e.prototype.diff=function(e,t){return new D(e,t,this.options).init()},e}(),M=function(){function e(e){var t=this;void 0===e&&(e={}),this.pad="│   ",this.padding="",this.tick=1,this.messages=[];var n=function(e,n){var o=e[n];e[n]=function(){for(var s=arguments,i=[],a=0;a<arguments.length;a++)i[a]=s[a];t.fin(n,Array.prototype.slice.call(i));var l=o.apply(e,i);return t.fout(n,l),l}};for(var o in e)"function"==typeof e[o]&&n(e,o);this.log("┌ TRACELOG START")}return e.prototype.fin=function(e,t){this.padding+=this.pad,this.log("├─> entering ".concat(e),t)},e.prototype.fout=function(e,t){this.log("│<──┘ generated return value",t),this.padding=this.padding.substring(0,this.padding.length-this.pad.length)},e.prototype.format=function(e,t){return"".concat(function(e){for(var t="".concat(e);t.length<4;)t="0".concat(e);return t}(t),"> ").concat(this.padding).concat(e)},e.prototype.log=function(){for(var e=arguments,t=[],o=0;o<arguments.length;o++)t[o]=e[o];var s=function(e){return e?"string"==typeof e?e:n(e,"HTMLElement")?e.outerHTML||"<empty>":e instanceof Array?"[".concat(e.map(s).join(","),"]"):e.toString()||e.valueOf()||"<unknown>":"<falsey>"},i=t.map(s).join(", ");this.messages.push(this.format(i,this.tick++))},e.prototype.toString=function(){for(var e="└───";e.length<=this.padding.length+this.pad.length;)e+="×   ";var t=this.padding;return this.padding="",e=this.format(e,this.tick),this.padding=t,"".concat(this.messages.join("\n"),"\n").concat(e)},e}();return e.DiffDOM=L,e.TraceLogger=M,e.nodeToObj=w,e.stringToObj=A,e}({});
//# sourceMappingURL=diffDOM.js.map
