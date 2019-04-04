import {
    DiffDOM,
    nodeToObj,
    stringToObj
} from "../src/index"

const strings = [
    '<div><div><div><img><span>hello</span></div></div><img></div>',
    '<div></div>',

    '<div><p>first paragraph</p><img><p>Another paragraph</p><p>A third paragraph</p><p>A fourth paragraph</p><p>A fifth paragraph</p></div>',
    '<div><img><p>Another paragraph</p><p>A third paragraph</p><p>A fourth paragraph</p><p>A fifth paragraph</p></div>',
    '<div><h1>Foo</h1><h2>Bar</h2><h3>Baz</h3></div>',
    '<div><h1>Foo</h1><h2>Bar</h2></div>',

    '<div><p><b>Foo</b> Bar <b>Baz</b></p></div>',
    '<div><p><b>Foo</b> Car <b>Baz</b></p></div>',

    '<div data-fisher="K7hI" data-test="u6" class="y"><i class="zCLG"><img><b class="78q0" data-fisher="fpn"><img>zSK</b><i class="H" data-id="GGQkeN1p" data-fisher="EcM"><span data-id="r3" data-test="MZDE"><img><span class="aUR2AC" data-id="psHs" data-fisher="DJF">xl</span></span><p data-test="dzBl"></p>X</i><span class="v28"></span>LuLrHE</i><span class="DP">F3gw</span><img><b data-test="xDlb" class="uLuSt" data-id="zJJW"><img></b><span data-test="Rrmt"><img>5GCo</span><img>nzt</div>',
    '<div data-fisher="87EDX" class="I1RIevCe" data-id="gsDiU"><span data-id="qRvl" data-test="Bd2Jx" class="Fme"><p class="Q3b" data-fisher="ejS"><span data-id="p"></span><img><i><i class="lK9">hjGWF</i>DvXS</i><b class="l8y3" data-test="kb" data-fisher="3iHP"></b><b data-id="1hBIDR" data-test="iPEF" data-fisher="J"></b></p><p data-id="Y" data-test="XV"></p><p class="Tl"><b data-test="v6lT" class="tSi" data-fisher="DG"><b class="SS"><b data-test="Qhm"><img>jtH1</b></b><img><i data-fisher="4d" class="ZXxT2"><i data-test="Fpvw" data-id="itc"></i>Z5FN</i></b><img><img></p><span data-fisher="Y1Ynt" class="Di"><i data-id="p7Xz" data-test="PUaR" class="mwuE3"><span></span><img>UqzVsH</i></span><p></p><b data-fisher="ZlPA"><span class="gmjEL"><p data-fisher="Fdxh" data-id="t"><i data-id="0y3a"></i></p></span>TeQ</b><p></p><span data-id="zMRoXQU" class="eE2R"><img></span></span><i data-test="bPl" data-fisher="AZBctZN"><b data-fisher="XDZNp"><p data-fisher="wz4d"><img></p><p data-fisher="SJb" data-test="8odH" class="yABhu0"></p></b><span data-fisher="Z1PHn" class="r" data-test="jj"><img><img></span><p></p>3nG</i><img>I3mrG</div>',

    '<div><img><p></p><i></i><img></div>',
    '<div><img><p>a</p><i></i><img><p></p></div>',

    '<div><p></p><i></i><img></div>',
    '<div><img><p>a</p><i></i><img><p></p></div>',

    '<div><img><img><p></p><i></i><canvas></div>',
    '<div><p></p><img><img><canvas></div>',

    '<div><img><img><i></i></div>',
    '<div><i></i><img><img></div>',

    '<div><span><b></b><img></span><img><span class="a"></span></div>',
    '<div><i></i><p id="a"></p><p class="a"></p><img><span class="a"></span></div>',

    '<div><img><i></i><img></div>',
    '<div><i></i><img><img></div>',

    '<div class="TBXm2"><p data-id="KVMfZ" class="Isz"></p><b data-id="5c" class="3" data-fisher="7WKUUC5"></b></div>',
    '<div data-fisher="qXQ" data-test="KD"><img><b data-id="tuKDPH6" data-test="mEHEJ0">OYVPhua9JA1ZE</b><b class="2pM" data-id="POh">b4Q</b>Qf61yc</div>',

    '<div><i><p></p><i></i>a</i><p></p><img></div>',
    '<div><i><p></p></i><i><p class="a"></p>a</i><img></div>',

    '<div><span><b></b><img></span><img><span class="a"></span></div>',
    '<div><i></i><p id="a"></p><p class="a"></p><img><span class="a"></span></div>',

    '<div><span></span><b class="a"></b><b class="a"><img></b></div>',
    '<div><b class="a"><img></b><b data-id="a" class="b"></b></div>',

    '<div><b class="a" data-one="a"></b><b class="a"></b><img></div>',
    '<div><img><b class="a"></b></div>',

    '<div><img><span></span><p></p><p class="a">b</p></div>',
    '<div><img><span></span><p></p><p class="a"><span class="a"><span></span></span>c</p><p class="a"><span class="a"></span></p></div>',

    '<div><b>a</b><img><span></span><p>b</p></div>',
    '<div><img><span></span><p></p><p class="a"><span class="a"><span></span></span>c</p><p class="a"><span class="a"></span></p></div>',

    '<div><img><span></span><p></p><p class="a"><span class="a"><span></span></span>c</p><p class="a"><span class="a"><span></span</span></p></div>',
    '<div><img><span></span><p></p><p class="a"><span class="a"><span></span></span>c</p><p class="a"><span class="a"></span></p></div>',

    '<div><i class="a"></i></div>',
    '<div><i></i><span></span>b</div>',

    '<div><b></b><span></span><b class="a"></b></div>',
    '<div><b></b><span></span><b><img></b><b class="b"><img></b></div>',

    '<div><i></i><b></b><b class="a"></b></div>',
    '<div><b></b><span></span><b><img></b><b class="b"><img></b></div>',

    '<div><b></b><span></span><b><img></b><b><img></b></div>',
    '<div><b></b><span></span><b><img></b><b class="b"><img></b></div>',

    '<div><p></p><p></p><img></div>',
    '<div><img><p></p></div>',


    '<div><i></i><i><img></i><img>1</div>',
    '<div><img><i></i><b></b>1</div>',

    `<div>lol<span>ydew<i>hey</i>de</span>
    </div>`,
    `<div>lol
      <p>ydew<b>hey</b>de</p>
    </div>`,

    `<div>
      <p>hello <span>finger</span></p>
    </div>`,
    `<div>
      <p>hello <span>fingers</span>. Welcome!</p>
    </div>`,


    `<div><span><p>tello</p><p></p></span>
    </div>`,
    `<div><span><p>fello</p><p></p></span>
    </div>`,

    `<div><img></div>`,
    `<div><i><i><img><p></p></i><span><p><p></p></p></span></i><b></b></div>`,

    `<div><b></b></div>`,
    `<div><i><i><b></b><p></p></i><span><p><p></p></p></span></i><b></b></div>`,

    `<div><span>hello</span></div>`,
    `<div><p>hello</p></div>`,

    `<div>
      <img>
      <p></p>
    </div>`,
    `<div>
      <img>
      <p></p>
      <p></p>
    </div>`,

    `<div><b><p></p><b><img><p><span></span></p>XW</b><span>Jl</span><b></b></b>h5QnXX</b>
    </div>`,
    `<div><span><span><b><i></i></b><img><i><span></span>
      </i>
      </span>
      </span><b><p></p>z</b><span><b></b><img></span>2
      <img>
    </div>`,

    '<div><i><p><span>j0zF<b></b></span><i><span></span></i>LS</p>scKvb</i><b>vO8</b>G</div>',
    `<div>
      <img><span></span>
    </div>`,

    `<div>sSp<span></span>
    </div>`,
    `<div>
      <p>
        <p><span><i>eq</i>okfHoePCoqFZ4<img></span>
          <p></p>YT</p>
        <p>bdMa</p>R</p>
      <img>gv
      <img>
    </div>`,


    `<div>
      <p></p>
      <p><span>j</span><span>Ukoy</span><b>x4KwW</b>
        <img>hWQ</p><b><img><b></b></b>d2HPWS4</div>`,
    `<div>
      <p>
        <p></p>
      </p>
      <p><span>j</span><span>Ukoy</span><b>x4KwW</b>
        <img>hWQ</p><b><img><b></b></b>d2HPWS4</div>`,

    `<div><i><img></i>iXMXSe4nqp</div>`,
    `<div><i><b></b><b><b></b><i><i>Lrjl1pP</i>Y0B</i>xN</b><i></i><span>gwcD4Bj</span><i>A</i>QW6awpo</i>
      <img>
      <p>Z</p>b
      <p></p>7f9</div>`,

    `<div><span><b><p></p></b>pGy<p></p></span><span><span><span></span></span><i></i><i></i>
      </span><span></span>
      <img>
    </div>`,
    `<div><i></i>
      <img>
      <img><i><i><b></b></i>
      <p></p>
      </i><b></b>
      <p></p>
      <p></p><span></span>
    </div>`,


    `<div>
      <img><i></i><b></b><i></i><font></font>
      <p></p>
      <p></p><span></span>
    </div>`,
    `<div>
      <p></p>
      <p></p><span></span>
      <img><i></i><b></b><i></i><font></font>
    </div>`,


    `<div>
      <img><i></i>
      <p><span><span><b></b></span></span>
      </p>
      <p></p><b><img><span></span></b>
      <p><b></b>
      </p>
      <p></p>
      <p></p>
      <p>wg</p><i><p></p></i>2nJ<i><img></i>
      <p></p><i><img></i>
    </div>`,
    `<div>
      <img><i></i>
      <p><span><span><b></b></span></span>
      </p>
      <p></p><b><img><span></span></b>
      <p><b></b>
      </p>
      <p></p>
      <p></p>
      <p>wg</p><i><p></p></i>2nJ<i><img></i>
      <p></p><i><img></i>zV87J1UU3Ex</div>`,

    `<div id="t1">lol<span>ydew<i>hey</i>de</span>
    </div>`,
    `<div id="t2">lol
      <p>ydew<b>hey</b>de</p>
    </div>`,


    `<div>
      <p><b><i><b><i>ya</i></b><i>f</i></i><span><i></i></span>
        </b>
      </p>
      <p></p>
      <p></p>
      <p></p><span><p><i></i></p>w7U0Ah4<i></i></span><b><p><span></span><img></p></b>
      <p></p>
      <img><i></i><span></span>
    </div>`,
    `<div>
      <img><span><i></i><span></span></span>
      <img><span></span><i></i>
      <p></p>
    </div>`,

    `<div>
      <p></p>
      <img>
      <p></p>
      <p></p>
      <p></p><i></i><span></span>
    </div>`,
    `<div>
      <img><span><i></i><span></span></span>
      <img><span></span><i></i>
      <p></p>
    </div>`,

    `<div>
      <img>
      <p></p>
      <p></p>
      <p></p>
      <p></p><i></i><span></span>
    </div>`,
    `<div>
      <img><span><i></i><span></span></span>
      <img><span></span><i></i>
      <p></p>
    </div>`,

    `<div>
      <img><span><i></i><span></span></span>
      <img>
      <p></p>
      <p></p>
      <p></p>
      <p></p><i></i><span></span>
    </div>`,
    `<div>
      <img><span><i></i><span></span></span>
      <img><span></span><i></i>
      <p></p>
    </div>`,


    `<div>
      <p></p><i></i><span></span>
    </div>`,
    `<div><span></span><i></i>
      <p></p>
    </div>`,

    `<div><span></span><i></i>
      <p></p>
    </div>`,
    `<div><i></i>
      <p></p><span></span>
    </div>`,

    `<div><i></i>
      <p></p><span></span>
    </div>`,
    `<div><span></span><i></i>
      <p></p>
    </div>`,


    `<div><i></i><span></span>
      <p></p>
    </div>`,
    `<div><span></span><i></i>
      <p></p>
    </div>`,


    `<div><b><span><p></p><p><img><b></b>
      </p><b><p></p></b><i></i>
      <p></p>
      <p><b></b><i>YgXxj0</i>
      </p>
      <p><i><span></span></i>
      </p><i><b><span><img></span><p></p><img></b><b>11w</b>ymd</i>
      <p></p>
      <p><span></span><span></span>
      </p>
      <p></p>
      <p></p>
      <p></p>
      <p>gU</p><span></span></span>Jbrr7</b>
    </div>`,
    `<div><span><span><p>UPG</p><img><img></span><span></span><span></span></span>
      <p>vZR6</p>
      <p><b><span><img></span>JvrBR</b>
      </p>
      <p></p>
      <p></p>
      <p>WB6Y</p>
      <img>
      <img><i></i>
      <p></p>
      <p>
        <img>
        <img><b></b>
      </p>
      <p><b>dh62z</b>
      </p>
      <p></p>
      <p></p><b><img></b>YD
      <p></p>
    </div>`,

    '<div>7</div>',
    `<div><i><img><i><p></p><span></span></i><span>uW<span class="dd-sep"></span>Dc</span>
      <img>
      <img>
      <p>
        <img><i></i><i></i>
      </p>
      <p></p><i></i><span>SC<span class="dd-sep"></span>vEq<span class="dd-sep"></span>M1VRx<span class="dd-sep"></span>c81B</span>T
      <p></p><span><p><img><b></b>FW</p></span>taV</i><i><p></p>6k<span class="dd-sep"></span>Mycc</i>
      <img>
      <img>9JI</div>`,

    `<div><span><img><b><p></p><span class="dd-sep"></span>b</b>82</span><b><b><p><b></b>
      </p>
      <p></p>
      <p></p><b>XO<i></i></b></b>2</b>
    </div>`,
    `<div><span><p><b></b><b></b><i></i></p><b></b><i></i>dsL</span><span><span></span>2z</span>
      <img>
      <p>J</p>
      <p><b></b>Hmr<span class="dd-sep"></span>p4</p><span></span>
      <p>
        <img>I</p><span></span>
      <p></p>
      <img>
      <img>
    </div>`,

    `<div id="document-contents" class="editable user-contents" contenteditable="true">
      <p>Andd here some contents<span class="equation" data-equation="x=2*y"><span class="MathJax_Preview"></span>
        <script type="math/tex" id="MathJax-Element-1">
          x = 2 * y
        </script>
        </span>᠎ wewe <span class="equation" data-equation="x=2*y"><span class="MathJax_Preview"></span><span class="MathJax_SVG" id="MathJax-Element-2-Frame" role="textbox" aria-readonly="true" style="font-size: 120%; display: inline-block;"><svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -676 3872 891" style="width: 8.993ex; height: 2.069ex; vertical-align: -0.575ex; margin: 1px 0px;"><g stroke="black" fill="black" stroke-thickness="0" transform="matrix(1 0 0 -1 0 0)"><use xlink:href="#MJMATHI-78"></use><use x="854" y="0" xlink:href="#MJMAIN-3D"></use><use x="1915" y="0" xlink:href="#MJMAIN-32"></use><use x="2642" y="0" xlink:href="#MJMAIN-2217"></use><use x="3370" y="0" xlink:href="#MJMATHI-79"></use></g></svg></span>
        <script type="math/tex" id="MathJax-Element-2">
          x = 2 * y
        </script>
        </span>᠎ and tdedherdeefore we went skiing that year. That's quite a new thing for us though. sdasdasddsadd</p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>desadsad</p>
    </div>`,
    `<div id="document-contents" class="editable user-contents" contenteditable="true">
      <p>Andd here some contents<span class="equation" data-equation="x=2*y"><span class="MathJax_Preview"></span><span class="MathJax_SVG" id="MathJax-Element-1-Frame" role="textbox" aria-readonly="true" style="font-size: 120%; display: inline-block;"><svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -676 3872 891" style="width: 8.993ex; height: 2.069ex; vertical-align: -0.575ex; margin: 1px 0px;"><g stroke="black" fill="black" stroke-thickness="0" transform="matrix(1 0 0 -1 0 0)"><use xlink:href="#MJMATHI-78"></use><use x="854" y="0" xlink:href="#MJMAIN-3D"></use><use x="1915" y="0" xlink:href="#MJMAIN-32"></use><use x="2642" y="0" xlink:href="#MJMAIN-2217"></use><use x="3370" y="0" xlink:href="#MJMATHI-79"></use></g></svg></span>
        <script type="math/tex" id="MathJax-Element-1">
          x = 2 * y
        </script>
        </span>᠎ wewe <span class="equation" data-equation="x=2*y"><span class="MathJax_Preview"></span><span class="MathJax_SVG" id="MathJax-Element-2-Frame" role="textbox" aria-readonly="true" style="font-size: 120%; display: inline-block;"><svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -676 3872 891" style="width: 8.993ex; height: 2.069ex; vertical-align: -0.575ex; margin: 1px 0px;"><g stroke="black" fill="black" stroke-thickness="0" transform="matrix(1 0 0 -1 0 0)"><use xlink:href="#MJMATHI-78"></use><use x="854" y="0" xlink:href="#MJMAIN-3D"></use><use x="1915" y="0" xlink:href="#MJMAIN-32"></use><use x="2642" y="0" xlink:href="#MJMAIN-2217"></use><use x="3370" y="0" xlink:href="#MJMATHI-79"></use></g></svg></span>
        <script type="math/tex" id="MathJax-Element-2">
          x = 2 * y
        </script>
        </span>᠎ and tdedherdeefore we went skiing that year. That's quite a new thing for us though. sdasdasddsadd</p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>
        <br>
      </p>
      <p>desadsad</p>
    </div>`,



    `<div><span></span>hall<span></span></div>`,
    `<div><span></span>hallo<span></span></div>`,

    '<div><select><option></option><option>A</option></select></div>',
    '<div><select><option>A</option><option></option></select></div>'
]

describe('string', () => {

    it('can diff and patch html strings', () => {
        const dd = new DiffDOM({
            debug: true,
            diffcap: 500
        })

        for (let i = 0; i < strings.length; i = i + 2) {
            const el1Outer = document.createElement('div')
            const el2Outer = document.createElement('div')
            el1Outer.innerHTML = strings[i]
            el2Outer.innerHTML = strings[i + 1]
            const diffs = dd.diff(el1Outer.innerHTML, el2Outer.innerHTML)
            expect(diffs).not.toHaveLength(0)
            const el1 = el1Outer.firstElementChild
            const el2 = el2Outer.firstElementChild
            const el1a = el1.cloneNode(true)
            dd.apply(el1a, diffs)
            el1a.innerHTML = el1a.innerHTML
            expect(
                el1a.isEqualNode(el2) ||
                el1a.innerHTML === el2.innerHTML ||
                JSON.stringify(nodeToObj(el1a)) === JSON.stringify(nodeToObj(el2))
            ).toBe(true)
            dd.undo(el1a, diffs)
            el1a.innerHTML = el1a.innerHTML
            expect(
                el1a.isEqualNode(el1) ||
                el1a.innerHTML === el1.innerHTML ||
                JSON.stringify(nodeToObj(el1a)) === JSON.stringify(nodeToObj(el1))
            ).toBe(true)
        }
    })

})
