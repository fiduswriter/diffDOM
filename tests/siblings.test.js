import {
    DiffDOM
} from "../src/index"

function objToNode(objNode, insideSvg) {
    var node, i;
    if (objNode.hasOwnProperty('t')) {
        node = document.createTextNode(objNode.t);
    } else if (objNode.hasOwnProperty('co')) {
        node = document.createComment(objNode.co);
    } else {
        if (objNode.nn === 'svg' || insideSvg) {
            node = document.createElementNS('http://www.w3.org/2000/svg', objNode.nn);
            insideSvg = true;
        } else {
            node = document.createElement(objNode.nn);
        }
        if (objNode.a) {
            for (i = 0; i < objNode.a.length; i++) {
                node.setAttribute(objNode.a[i][0], objNode.a[i][1]);
            }
        }
        if (objNode.c) {
            for (i = 0; i < objNode.c.length; i++) {
                node.appendChild(objToNode(objNode.c[i], insideSvg));
            }
        }
    }
    return node;
}



describe('siblings', () => {

    it('can diff and patch html with sibling text nodes', () => {

        let divs = []
        divs = divs.concat([
            objToNode(JSON.parse('{"nn":"DIV","a":[["id","document-editable"]],"c":[{"nn":"DIV","a":[["id","document-title"],["class","editable user-contents"],["title","The title of the document"],["contenteditable","true"]],"c":[{"t":"Hellofglalak"}]},{"nn":"DIV","a":[["id","document-metadata"],["class","user-contents"]]},{"nn":"DIV","a":[["id","document-contents"],["class","editable user-contents"],["contenteditable","true"]],"c":[{"nn":"P","c":[{"t":"I want a new Finisky is a German writer. Finish laundromats. French steel plants kate -- spiegel overrated. Howe"},{"t":"ver, the essential parts are good Danish roses. And Swedish steel. Bitcoin Claustrophobic Visions (BCC). Aftenposten regner, bicycle. It\'s really easy to do.  University finals are a discipline of their own. Bortsch ist something I would like to eat during winter. fellxDAGBBloneHONEZDzow. And so thdededeey went to M"},{"nn":"SPAN","a":[["class","comment"],["id","comment-0"],["data-id","0"],["data-user","1"],["data-user-name","johannes"],["data-user-avatar","/static/img/default_avatar.png"],["data-date","1388568971084"],["data-comment","test"]],"c":[{"t":"unichmel"}]},{"t":"lom "},{"nn":"SPAN","a":[["class","citation"],["data-bib-entry","1"],["data-bib-before",""],["data-bib-page","123"],["data-bib-format","autocite"]]},{"t":" jfllfrjc"},{"nn":"SPAN","a":[["class","equation"],["data-equation","\\frac{2}{3}"]]},{"t":" aftfellowen"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" deAftend"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" etigeren"}]},{"nn":"P","c":[{"t":"lalalalala"},{"nn":"SPAN","a":[["class","footnote"]],"c":[{"t":"a footnote "},{"nn":"BR"}]},{"t":"dsdfdsfllasdsBerchtesgardener Lichtspiele. Flensburger Nahverkehr.qwedw casdsdwqqw"}]}]}]}')),
            objToNode(JSON.parse('{"nn":"DIV","a":[["id","document-editable"]],"c":[{"nn":"DIV","a":[["id","document-title"],["class","editable user-contents"],["title","The title of the document"],["contenteditable","true"]],"c":[{"t":"Hellofglalak"}]},{"nn":"DIV","a":[["id","document-metadata"],["class","user-contents"]]},{"nn":"DIV","a":[["id","document-contents"],["class","editable user-contents"],["contenteditable","true"]],"c":[{"nn":"P","c":[{"t":"I want a new Finisky is a German writer. Finish laundromats. French steel plants kate -- spiegel overrated. Howe"},{"t":" "},{"t":"ver, the essential parts are good Danish roses. And Swedish steel. Bitcoin Claustrophobic Visions (BCC). Aftenposten regner, bicycle. It\'s really easy to do.  University finals are a discipline of their own. Bortsch ist something I would like to eat during winter. fellxDAGBBloneHONEZDzow. And so thdededeey went to M"},{"nn":"SPAN","a":[["class","comment"],["id","comment-0"],["data-id","0"],["data-user","1"],["data-user-name","johannes"],["data-user-avatar","/static/img/default_avatar.png"],["data-date","1388568971084"],["data-comment","test"]],"c":[{"t":"unichmel"}]},{"t":"lom "},{"nn":"SPAN","a":[["class","citation"],["data-bib-entry","1"],["data-bib-before",""],["data-bib-page","123"],["data-bib-format","autocite"]]},{"t":" jfllfrjc"},{"nn":"SPAN","a":[["class","equation"],["data-equation","\\frac{2}{3}"]]},{"t":" aftfellowen"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" deAftend"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" etigeren"}]},{"nn":"P","c":[{"t":"lalalalala"},{"nn":"SPAN","a":[["class","footnote"]],"c":[{"t":"a footnote "},{"nn":"BR"}]},{"t":"dsdfdsfllasdsBerchtesgardener Lichtspiele. Flensburger Nahverkehr.qwedw casdsdwqqw"}]}]}]}')),
        ])

        divs = divs.concat([
            objToNode(JSON.parse('{"nn":"DIV","a":[["id","document-editable"]],"c":[{"nn":"DIV","a":[["id","document-title"],["class","editable user-contents"],["title","The title of the document"],["contenteditable","true"]],"c":[{"t":"Hellofglalak"}]},{"nn":"DIV","a":[["id","document-metadata"],["class","user-contents"]]},{"nn":"DIV","a":[["id","document-contents"],["class","editable user-contents"],["contenteditable","true"]],"c":[{"nn":"P","c":[{"t":"I want a new Finisky is a German writer. Finish laundromats. French steel plants kate -- spiegel overrated. Howe"},{"t":" "},{"t":"ver, the essential parts are good Danish roses. And Swedish steel. Bitcoin Claustrophobic Visions (BCC). Aftenposten regner, bicycle. It\'s really easy to do.  University finals are a discipline of their own. Bortsch ist something I would like to eat during winter. fellxDAGBBloneHONEZDzow. And so thdededeey went to M"},{"nn":"SPAN","a":[["class","comment"],["id","comment-0"],["data-id","0"],["data-user","1"],["data-user-name","johannes"],["data-user-avatar","/static/img/default_avatar.png"],["data-date","1388568971084"],["data-comment","test"]],"c":[{"t":"unichmel"}]},{"t":"lom "},{"nn":"SPAN","a":[["class","citation"],["data-bib-entry","1"],["data-bib-before",""],["data-bib-page","123"],["data-bib-format","autocite"]]},{"t":" jfllfrjc"},{"nn":"SPAN","a":[["class","equation"],["data-equation","\\frac{2}{3}"]]},{"t":" aftfellowen"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" deAftend"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" etigeren"}]},{"nn":"P","c":[{"t":"lalalalala"},{"nn":"SPAN","a":[["class","footnote"]],"c":[{"t":"a footnote "},{"nn":"BR"}]},{"t":"dsdfdsfllasdsBerchtesgardener Lichtspiele. Flensburger Nahverkehr.qwedw casdsdwqqw"}]}]}]}')),
            objToNode(JSON.parse('{"nn":"DIV","a":[["id","document-editable"]],"c":[{"nn":"DIV","a":[["id","document-title"],["class","editable user-contents"],["title","The title of the document"],["contenteditable","true"]],"c":[{"t":"Hellofglalak"}]},{"nn":"DIV","a":[["id","document-metadata"],["class","user-contents"]]},{"nn":"DIV","a":[["id","document-contents"],["class","editable user-contents"],["contenteditable","true"]],"c":[{"nn":"P","c":[{"t":"I want a new Finisky is a German writer. Finish laundromats. French steel plants kate -- spiegel overrated. Howe"},{"t":"ver, the essential parts are good Danish roses. And Swedish steel. Bitcoin Claustrophobic Visions (BCC). Aftenposten regner, bicycle. It\'s really easy to do.  University finals are a discipline of their own. Bortsch ist something I would like to eat during winter. fellxDAGBBloneHONEZDzow. And so thdededeey went to M"},{"nn":"SPAN","a":[["class","comment"],["id","comment-0"],["data-id","0"],["data-user","1"],["data-user-name","johannes"],["data-user-avatar","/static/img/default_avatar.png"],["data-date","1388568971084"],["data-comment","test"]],"c":[{"t":"unichmel"}]},{"t":"lom "},{"nn":"SPAN","a":[["class","citation"],["data-bib-entry","1"],["data-bib-before",""],["data-bib-page","123"],["data-bib-format","autocite"]]},{"t":" jfllfrjc"},{"nn":"SPAN","a":[["class","equation"],["data-equation","\\frac{2}{3}"]]},{"t":" aftfellowen"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" deAftend"},{"nn":"SPAN","a":[["class","equation"],["data-equation","x=2*y"]]},{"t":" etigeren"}]},{"nn":"P","c":[{"t":"lalalalala"},{"nn":"SPAN","a":[["class","footnote"]],"c":[{"t":"a footnote "},{"nn":"BR"}]},{"t":"dsdfdsfllasdsBerchtesgardener Lichtspiele. Flensburger Nahverkehr.qwedw casdsdwqqw"}]}]}]}')),
        ])

        divs = divs.concat([
            objToNode(JSON.parse('{"nn":"DIV","c":[{"nn":"B"},{"nn":"I"},{"nn":"I"},{"t":"1"}]}')),
            objToNode(JSON.parse('{"nn":"DIV","c":[{"nn":"B"},{"nn":"I"},{"t":"1"},{"t":"2"}]}')),
        ])

        divs = divs.concat([
            objToNode(JSON.parse('{"nn":"DIV","a":[["data-id","gAt"]],"c":[{"nn":"P","a":[["data-test","3ttAmk"]],"c":[{"nn":"P","a":[["data-fisher","63"],["class","VmApr"]],"c":[{"nn":"SPAN","a":[["data-fisher","ZnGp7vp"],["class","BbS"],["data-id","ON3d"]]}]},{"nn":"IMG"},{"nn":"B"}]},{"nn":"B","a":[["data-fisher","c91"]],"c":[{"nn":"I","a":[["data-test","1"]]},{"nn":"B","a":[["data-fisher","L7IMPg6"]],"c":[{"nn":"I","a":[["data-fisher","57"],["data-test","4QjWEV"]],"c":[{"nn":"B","c":[{"nn":"IMG"},{"nn":"IMG"}]}]},{"nn":"P","a":[["data-id","SHGK"],["data-test","UyJ"]]},{"t":"f3YsY"}]}]},{"nn":"IMG"},{"nn":"SPAN","a":[["class","jD9"]]},{"nn":"SPAN","a":[["class","HpZ2KsY"],["data-id","WY"]]},{"t":""}]}')),
            objToNode(JSON.parse('{"nn":"DIV","a":[["class","Pe0"],["data-fisher","LQ"]],"c":[{"nn":"P","a":[["data-fisher","KEkVN"]],"c":[{"nn":"I","a":[["data-id","0eS"],["data-fisher","YV"],["class","1y"]],"c":[{"nn":"B","a":[["data-fisher","lZR0Zbs"],["data-test","E"]],"c":[{"nn":"I","a":[["data-test","tS"],["data-id","HEY"]]}]}]},{"nn":"P","a":[["data-test","RhB"],["data-fisher","sALzSq0bZ"]],"c":[{"nn":"SPAN","c":[{"nn":"P","c":[{"nn":"SPAN","a":[["class","WbJLr1"],["data-id","xACUb"],["data-fisher","MlfVRw"]]}]},{"nn":"IMG"}]},{"nn":"IMG"}]},{"t":""}]},{"t":""},{"t":"j"}]}')),
        ])

        const dd = new DiffDOM({
            debug: true,
            diffcap: 500
        })

        for (let i = 0; i < divs.length; i = i + 2) {
            const diffs = dd.diff(divs[i], divs[i + 1])
            expect(diffs).not.toHaveLength(0)
            const t1 = divs[i].cloneNode(true)
            dd.apply(t1, diffs)
            expect(t1.isEqualNode(divs[i + 1]) || t1.innerHTML === divs[i + 1].innerHTML).toBe(true)
            dd.undo(t1, diffs)
            expect(t1.isEqualNode(divs[i]) || t1.innerHTML === divs[i].innerHTML).toBe(true)
        }
    })
})
