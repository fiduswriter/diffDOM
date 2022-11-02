let diffDOM = (function (e) {

    function t(e, n, o) {
        let s
        return (
            e.nodeName === "#text"
                ? (s = o.document.createTextNode(e.data))
                : e.nodeName === "#comment"
                ? (s = o.document.createComment(e.data))
                : (n
                      ? (s = o.document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            e.nodeName
                        ))
                      : e.nodeName.toLowerCase() === "svg"
                      ? ((s = o.document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "svg"
                        )),
                        (n = !0))
                      : (s = o.document.createElement(e.nodeName)),
                  e.attributes &&
                      Object.entries(e.attributes).forEach(e => {
                          let t = e[0],
                              n = e[1]
                          return s.setAttribute(t, n)
                      }),
                  e.childNodes &&
                      e.childNodes.forEach(e => s.appendChild(t(e, n, o))),
                  o.valueDiffing &&
                      (e.value && (s.value = e.value),
                      e.checked && (s.checked = e.checked),
                      e.selected && (s.selected = e.selected))),
            s
        )
    }
    function n(e, t) {
        for (t = t.slice(); t.length > 0; ) {
            if (!e.childNodes) return !1
            let n = t.splice(0, 1)[0]
            e = e.childNodes[n]
        }
        return e
    }
    function o(e, o, s) {
        let i,
            a,
            l,
            c,
            r = n(e, o[s._const.route]),
            u = { diff: o, node: r }
        if (s.preDiffApply(u)) return !0
        switch (o[s._const.action]) {
            case s._const.addAttribute:
                if (!r || !r.setAttribute) return !1
                r.setAttribute(o[s._const.name], o[s._const.value])
                break
            case s._const.modifyAttribute:
                if (!r || !r.setAttribute) return !1
                r.setAttribute(o[s._const.name], o[s._const.newValue]),
                    r.nodeName === "INPUT" &&
                        o[s._const.name] === "value" &&
                        (r.value = o[s._const.newValue])
                break
            case s._const.removeAttribute:
                if (!r || !r.removeAttribute) return !1
                r.removeAttribute(o[s._const.name])
                break
            case s._const.modifyTextElement:
                if (!r || r.nodeType !== 3) return !1
                s.textDiff(
                    r,
                    r.data,
                    o[s._const.oldValue],
                    o[s._const.newValue]
                )
                break
            case s._const.modifyValue:
                if (!r || void 0 === r.value) return !1
                r.value = o[s._const.newValue]
                break
            case s._const.modifyComment:
                if (!r || void 0 === r.data) return !1
                s.textDiff(
                    r,
                    r.data,
                    o[s._const.oldValue],
                    o[s._const.newValue]
                )
                break
            case s._const.modifyChecked:
                if (!r || void 0 === r.checked) return !1
                r.checked = o[s._const.newValue]
                break
            case s._const.modifySelected:
                if (!r || void 0 === r.selected) return !1
                r.selected = o[s._const.newValue]
                break
            case s._const.replaceElement:
                r.parentNode.replaceChild(
                    t(
                        o[s._const.newValue],
                        o[s._const.newValue].nodeName.toLowerCase() === "svg",
                        s
                    ),
                    r
                )
                break
            case s._const.relocateGroup:
                Array.apply(void 0, new Array(o.groupLength))
                    .map(() => r.removeChild(r.childNodes[o[s._const.from]]))
                    .forEach((e, t) => {
                        t === 0 && (a = r.childNodes[o[s._const.to]]),
                            r.insertBefore(e, a || null)
                    })
                break
            case s._const.removeElement:
                r.parentNode.removeChild(r)
                break
            case s._const.addElement:
                ;(c = (l = o[s._const.route].slice()).splice(
                    l.length - 1,
                    1
                )[0]),
                    (r = n(e, l)).insertBefore(
                        t(
                            o[s._const.element],
                            r.namespaceURI === "http://www.w3.org/2000/svg",
                            s
                        ),
                        r.childNodes[c] || null
                    )
                break
            case s._const.removeTextElement:
                if (!r || r.nodeType !== 3) return !1
                r.parentNode.removeChild(r)
                break
            case s._const.addTextElement:
                if (
                    ((c = (l = o[s._const.route].slice()).splice(
                        l.length - 1,
                        1
                    )[0]),
                    (i = s.document.createTextNode(o[s._const.value])),
                    !(r = n(e, l)) || !r.childNodes)
                )
                    return !1
                r.insertBefore(i, r.childNodes[c] || null)
                break
            default:
                console.log("unknown action")
        }
        return (u.newNode = i), s.postDiffApply(u), !0
    }
    function s(e, t, n) {
        let o = e[t]
        ;(e[t] = e[n]), (e[n] = o)
    }
    function i(e, t, n) {
        t.length || (t = [t]),
            (t = t.slice()).reverse(),
            t.forEach(t => {
                !(function (e, t, n) {
                    switch (t[n._const.action]) {
                        case n._const.addAttribute:
                            ;(t[n._const.action] = n._const.removeAttribute),
                                o(e, t, n)
                            break
                        case n._const.modifyAttribute:
                            s(t, n._const.oldValue, n._const.newValue),
                                o(e, t, n)
                            break
                        case n._const.removeAttribute:
                            ;(t[n._const.action] = n._const.addAttribute),
                                o(e, t, n)
                            break
                        case n._const.modifyTextElement:
                        case n._const.modifyValue:
                        case n._const.modifyComment:
                        case n._const.modifyChecked:
                        case n._const.modifySelected:
                        case n._const.replaceElement:
                            s(t, n._const.oldValue, n._const.newValue),
                                o(e, t, n)
                            break
                        case n._const.relocateGroup:
                            s(t, n._const.from, n._const.to), o(e, t, n)
                            break
                        case n._const.removeElement:
                            ;(t[n._const.action] = n._const.addElement),
                                o(e, t, n)
                            break
                        case n._const.addElement:
                            ;(t[n._const.action] = n._const.removeElement),
                                o(e, t, n)
                            break
                        case n._const.removeTextElement:
                            ;(t[n._const.action] = n._const.addTextElement),
                                o(e, t, n)
                            break
                        case n._const.addTextElement:
                            ;(t[n._const.action] = n._const.removeTextElement),
                                o(e, t, n)
                            break
                        default:
                            console.log("unknown action")
                    }
                })(e, t, n)
            })
    }
    let a = function (e) {
        let t = this
        void 0 === e && (e = {}),
            Object.entries(e).forEach(e => {
                let n = e[0],
                    o = e[1]
                return (t[n] = o)
            })
    }
    function l(e) {
        let t = []
        return (
            t.push(e.nodeName),
            e.nodeName !== "#text" &&
                e.nodeName !== "#comment" &&
                e.attributes &&
                (e.attributes.class &&
                    t.push(
                        `${e.nodeName }.${ e.attributes.class.replace(/ /g, ".")}`
                    ),
                e.attributes.id && t.push(`${e.nodeName }#${ e.attributes.id}`)),
            t
        )
    }
    function c(e) {
        let t = {},
            n = {}
        return (
            e.forEach(e => {
                l(e).forEach(e => {
                    let o = e in t
                    o || e in n ? o && (delete t[e], (n[e] = !0)) : (t[e] = !0)
                })
            }),
            t
        )
    }
    function r(e, t) {
        let n = c(e),
            o = c(t),
            s = {}
        return (
            Object.keys(n).forEach(e => {
                o[e] && (s[e] = !0)
            }),
            s
        )
    }
    function u(e) {
        return (
            delete e.outerDone,
            delete e.innerDone,
            delete e.valueDone,
            !e.childNodes || e.childNodes.every(u)
        )
    }
    function d(e, t) {
        if (
            !["nodeName", "value", "checked", "selected", "data"].every((n) => e[n] === t[n]
        )
            return !1
        if (Boolean(e.attributes) !== Boolean(t.attributes)) return !1
        if (Boolean(e.childNodes) !== Boolean(t.childNodes)) return !1
        if (e.attributes) {
            let n = Object.keys(e.attributes),
                o = Object.keys(t.attributes)
            if (n.length !== o.length) return !1
            if (
                !n.every(n => e.attributes[n] === t.attributes[n])
            )
                return !1
        }
        if (e.childNodes) {
            if (e.childNodes.length !== t.childNodes.length) return !1
            if (
                !e.childNodes.every((e, n) => d(e, t.childNodes[n]))
            )
                return !1
        }
        return !0
    }
    function h(e, t, n, o, s) {
        if (!e || !t) return !1
        if (e.nodeName !== t.nodeName) return !1
        if (e.nodeName === "#text") return Boolean(s) || e.data === t.data
        if (e.nodeName in n) return !0
        if (e.attributes && t.attributes) {
            if (e.attributes.id) {
                if (e.attributes.id !== t.attributes.id) return !1
                if (`${e.nodeName }#${ e.attributes.id}` in n) return !0
            }
            if (e.attributes.class && e.attributes.class === t.attributes.class)
                if (
                    `${e.nodeName }.${ e.attributes.class.replace(/ /g, ".")}` in
                    n
                )
                    return !0
        }
        if (o) return !0
        let i = e.childNodes ? e.childNodes.slice().reverse() : [],
            a = t.childNodes ? t.childNodes.slice().reverse() : []
        if (i.length !== a.length) return !1
        if (s)
            return i.every((e, t) => e.nodeName === a[t].nodeName)
        let l = r(i, a)
        return i.every((e, t) => h(e, a[t], l, !0, !0))
    }
    function f(e) {
        return JSON.parse(JSON.stringify(e))
    }
    function p(e, t, n, o) {
        let s = 0,
            i = [],
            a = e.length,
            c = t.length,
            u = Array.apply(void 0, new Array(a + 1)).map(() => []),
            d = r(e, t),
            f = a === c
        f &&
            e.some((e, n) => {
                let o = l(e),
                    s = l(t[n])
                return o.length !== s.length
                    ? ((f = !1), !0)
                    : (o.some((e, t) => {
                          if (e !== s[t]) return (f = !1), !0
                      }),
                      !f || void 0)
            })
        for (let p = 0; p < a; p++)
            for (let m = e[p], _ = 0; _ < c; _++) {
                let V = t[_]
                n[p] || o[_] || !h(m, V, d, f)
                    ? (u[p + 1][_ + 1] = 0)
                    : ((u[p + 1][_ + 1] = u[p][_] ? u[p][_] + 1 : 1),
                      u[p + 1][_ + 1] >= s &&
                          ((s = u[p + 1][_ + 1]), (i = [p + 1, _ + 1])))
            }
        return s !== 0 && { oldValue: i[0] - s, newValue: i[1] - s, length: s }
    }
    function m(e, t) {
        return Array.apply(void 0, new Array(e)).map(() => t)
    }
    ;(a.prototype.toString = function () {
        return JSON.stringify(this)
    }),
        (a.prototype.setValue = function (e, t) {
            return (this[e] = t), this
        })
    let _ = function () {
        this.list = []
    }
    function V(e, t) {
        let n,
            o,
            s = e
        for (t = t.slice(); t.length > 0; ) {
            if (!s.childNodes) return !1
            ;(o = t.splice(0, 1)[0]), (n = s), (s = s.childNodes[o])
        }
        return { node: s, parentNode: n, nodeIndex: o }
    }
    function g(e, t, n) {
        return (
            t.forEach(t => {
                !(function (e, t, n) {
                    let o,
                        s,
                        i,
                        a = V(e, t[n._const.route]),
                        l = a.node,
                        c = a.parentNode,
                        r = a.nodeIndex,
                        u = [],
                        d = { diff: t, node: l }
                    if (n.preVirtualDiffApply(d)) return !0
                    switch (t[n._const.action]) {
                        case n._const.addAttribute:
                            l.attributes || (l.attributes = {}),
                                (l.attributes[t[n._const.name]] =
                                    t[n._const.value]),
                                t[n._const.name] === "checked"
                                    ? (l.checked = !0)
                                    : t[n._const.name] === "selected"
                                    ? (l.selected = !0)
                                    : l.nodeName === "INPUT" &&
                                      t[n._const.name] === "value" &&
                                      (l.value = t[n._const.value])
                            break
                        case n._const.modifyAttribute:
                            l.attributes[t[n._const.name]] =
                                t[n._const.newValue]
                            break
                        case n._const.removeAttribute:
                            delete l.attributes[t[n._const.name]],
                                Object.keys(l.attributes).length === 0 &&
                                    delete l.attributes,
                                t[n._const.name] === "checked"
                                    ? (l.checked = !1)
                                    : t[n._const.name] === "selected"
                                    ? delete l.selected
                                    : l.nodeName === "INPUT" &&
                                      t[n._const.name] === "value" &&
                                      delete l.value
                            break
                        case n._const.modifyTextElement:
                            l.data = t[n._const.newValue]
                            break
                        case n._const.modifyValue:
                            l.value = t[n._const.newValue]
                            break
                        case n._const.modifyComment:
                            l.data = t[n._const.newValue]
                            break
                        case n._const.modifyChecked:
                            l.checked = t[n._const.newValue]
                            break
                        case n._const.modifySelected:
                            l.selected = t[n._const.newValue]
                            break
                        case n._const.replaceElement:
                            ;((o = f(t[n._const.newValue])).outerDone = !0),
                                (o.innerDone = !0),
                                (o.valueDone = !0),
                                (c.childNodes[r] = o)
                            break
                        case n._const.relocateGroup:
                            l.childNodes
                                .splice(t[n._const.from], t.groupLength)
                                .reverse()
                                .forEach(e => l.childNodes.splice(
                                        t[n._const.to],
                                        0,
                                        e
                                    )),
                                l.subsets &&
                                    l.subsets.forEach(e => {
                                        if (
                                            t[n._const.from] < t[n._const.to] &&
                                            e.oldValue <= t[n._const.to] &&
                                            e.oldValue > t[n._const.from]
                                        ) {
                                            e.oldValue -= t.groupLength
                                            let o =
                                                e.oldValue +
                                                e.length -
                                                t[n._const.to]
                                            o > 0 &&
                                                (u.push({
                                                    oldValue:
                                                        t[n._const.to] +
                                                        t.groupLength,
                                                    newValue:
                                                        e.newValue +
                                                        e.length -
                                                        o,
                                                    length: o,
                                                }),
                                                (e.length -= o))
                                        } else if (
                                            t[n._const.from] > t[n._const.to] &&
                                            e.oldValue > t[n._const.to] &&
                                            e.oldValue < t[n._const.from]
                                        ) {
                                            e.oldValue += t.groupLength
                                            let s =
                                                e.oldValue +
                                                e.length -
                                                t[n._const.to]
                                            s > 0 &&
                                                (u.push({
                                                    oldValue:
                                                        t[n._const.to] +
                                                        t.groupLength,
                                                    newValue:
                                                        e.newValue +
                                                        e.length -
                                                        s,
                                                    length: s,
                                                }),
                                                (e.length -= s))
                                        } else
                                            e.oldValue === t[n._const.from] &&
                                                (e.oldValue = t[n._const.to])
                                    })
                            break
                        case n._const.removeElement:
                            c.childNodes.splice(r, 1),
                                c.subsets &&
                                    c.subsets.forEach(e => {
                                        e.oldValue > r
                                            ? (e.oldValue -= 1)
                                            : e.oldValue === r
                                            ? (e.delete = !0)
                                            : e.oldValue < r &&
                                              e.oldValue + e.length > r &&
                                              (e.oldValue + e.length - 1 === r
                                                  ? e.length--
                                                  : (u.push({
                                                        newValue:
                                                            e.newValue +
                                                            r -
                                                            e.oldValue,
                                                        oldValue: r,
                                                        length:
                                                            e.length -
                                                            r +
                                                            e.oldValue -
                                                            1,
                                                    }),
                                                    (e.length =
                                                        r - e.oldValue)))
                                    }),
                                (l = c)
                            break
                        case n._const.addElement:
                            ;(s = t[n._const.route].slice()),
                                (i = s.splice(s.length - 1, 1)[0]),
                                (l = V(e, s).node),
                                ((o = f(t[n._const.element])).outerDone = !0),
                                (o.innerDone = !0),
                                (o.valueDone = !0),
                                l.childNodes || (l.childNodes = []),
                                i >= l.childNodes.length
                                    ? l.childNodes.push(o)
                                    : l.childNodes.splice(i, 0, o),
                                l.subsets &&
                                    l.subsets.forEach(e => {
                                        if (e.oldValue >= i) e.oldValue += 1
                                        else if (
                                            e.oldValue < i &&
                                            e.oldValue + e.length > i
                                        ) {
                                            let t = e.oldValue + e.length - i
                                            u.push({
                                                newValue:
                                                    e.newValue + e.length - t,
                                                oldValue: i + 1,
                                                length: t,
                                            }),
                                                (e.length -= t)
                                        }
                                    })
                            break
                        case n._const.removeTextElement:
                            c.childNodes.splice(r, 1),
                                c.nodeName === "TEXTAREA" && delete c.value,
                                c.subsets &&
                                    c.subsets.forEach(e => {
                                        e.oldValue > r
                                            ? (e.oldValue -= 1)
                                            : e.oldValue === r
                                            ? (e.delete = !0)
                                            : e.oldValue < r &&
                                              e.oldValue + e.length > r &&
                                              (e.oldValue + e.length - 1 === r
                                                  ? e.length--
                                                  : (u.push({
                                                        newValue:
                                                            e.newValue +
                                                            r -
                                                            e.oldValue,
                                                        oldValue: r,
                                                        length:
                                                            e.length -
                                                            r +
                                                            e.oldValue -
                                                            1,
                                                    }),
                                                    (e.length =
                                                        r - e.oldValue)))
                                    }),
                                (l = c)
                            break
                        case n._const.addTextElement:
                            ;(s = t[n._const.route].slice()),
                                (i = s.splice(s.length - 1, 1)[0]),
                                ((o = {}).nodeName = "#text"),
                                (o.data = t[n._const.value]),
                                (l = V(e, s).node).childNodes ||
                                    (l.childNodes = []),
                                i >= l.childNodes.length
                                    ? l.childNodes.push(o)
                                    : l.childNodes.splice(i, 0, o),
                                l.nodeName === "TEXTAREA" &&
                                    (l.value = t[n._const.newValue]),
                                l.subsets &&
                                    l.subsets.forEach(e => {
                                        if (
                                            (e.oldValue >= i &&
                                                (e.oldValue += 1),
                                            e.oldValue < i &&
                                                e.oldValue + e.length > i)
                                        ) {
                                            let t = e.oldValue + e.length - i
                                            u.push({
                                                newValue:
                                                    e.newValue + e.length - t,
                                                oldValue: i + 1,
                                                length: t,
                                            }),
                                                (e.length -= t)
                                        }
                                    })
                            break
                        default:
                            console.log("unknown action")
                    }
                    l.subsets &&
                        ((l.subsets = l.subsets.filter(e => !e.delete && e.oldValue !== e.newValue)),
                        u.length && (l.subsets = l.subsets.concat(u))),
                        (d.newNode = o),
                        n.postVirtualDiffApply(d)
                })(e, t, n)
            }),
            !0
        )
    }
    function v(e, t) {
        void 0 === t && (t = {})
        let n = {}
        if (
            ((n.nodeName = e.nodeName),
            n.nodeName === "#text" || n.nodeName === "#comment")
        )
            n.data = e.data
        else {
            if (e.attributes && e.attributes.length > 0)
                (n.attributes = {}),
                    Array.prototype.slice.call(e.attributes).forEach(e => (n.attributes[e.name] = e.value))
            if (n.nodeName === "TEXTAREA") n.value = e.value
            else if (e.childNodes && e.childNodes.length > 0) {
                ;(n.childNodes = []),
                    Array.prototype.slice.call(e.childNodes).forEach(e => n.childNodes.push(v(e, t)))
            }
            t.valueDiffing &&
                (void 0 !== e.checked &&
                e.type &&
                ["radio", "checkbox"].includes(e.type.toLowerCase())
                    ? (n.checked = e.checked)
                    : void 0 !== e.value && (n.value = e.value),
                void 0 !== e.selected && (n.selected = e.selected))
        }
        return n
    }
    ;(_.prototype.add = function (e) {
        let t
        ;(t = this.list).push.apply(t, e)
    }),
        (_.prototype.forEach = function (e) {
            this.list.forEach(t => e(t))
        })
    let N = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,
        b = Object.create ? Object.create(null) : {},
        y = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g
    function w(e) {
        return e
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
    }
    let E = {
        area: !0,
        base: !0,
        br: !0,
        col: !0,
        embed: !0,
        hr: !0,
        img: !0,
        input: !0,
        keygen: !0,
        link: !0,
        menuItem: !0,
        meta: !0,
        param: !0,
        source: !0,
        track: !0,
        wbr: !0,
    }
    function k(e) {
        let t = { nodeName: "", attributes: {} },
            n = e.match(/<\/?([^\s]+?)[/\s>]/)
        if (
            n &&
            ((t.nodeName = n[1].toUpperCase()),
            (E[n[1]] || e.charAt(e.length - 2) === "/") && (t.voidElement = !0),
            t.nodeName.startsWith("!--"))
        ) {
            let o = e.indexOf("--\x3e")
            return { type: "comment", data: o !== -1 ? e.slice(4, o) : "" }
        }
        for (let s = new RegExp(y), i = null, a = !1; !a; )
            if ((i = s.exec(e)) === null) a = !0
            else if (i[0].trim())
                if (i[1]) {
                    let l = i[1].trim(),
                        c = [l, ""]
                    l.indexOf("=") > -1 && (c = l.split("=")),
                        (t.attributes[c[0]] = c[1]),
                        s.lastIndex--
                } else
                    i[2] &&
                        (t.attributes[i[2]] = i[3]
                            .trim()
                            .substring(1, i[3].length - 1))
        return t
    }
    function x(e) {
        return (
            delete e.voidElement,
            e.childNodes &&
                e.childNodes.forEach(e => x(e)),
            e
        )
    }
    function A(e) {
        return x(
            (function (e, t) {
                void 0 === t && (t = { components: b })
                let n,
                    o = [],
                    s = -1,
                    i = [],
                    a = !1
                if (e.indexOf("<") !== 0) {
                    let l = e.indexOf("<")
                    o.push({
                        nodeName: "#text",
                        data: l === -1 ? e : e.substring(0, l),
                    })
                }
                return (
                    e.replace(N, (l, c) => {
                        if (a) {
                            if (l !== `</${ n.nodeName }>`) return
                            a = !1
                        }
                        let r,
                            u = l.charAt(1) !== "/",
                            d = l.startsWith("\x3c!--"),
                            h = c + l.length,
                            f = e.charAt(h)
                        if (d) {
                            let p = k(l)
                            return s < 0
                                ? (o.push(p), o)
                                : ((r = i[s]) &&
                                      (r.childNodes || (r.childNodes = []),
                                      r.childNodes.push(p)),
                                  o)
                        }
                        if (
                            (u &&
                                ((n = k(l)),
                                s++,
                                n.type === "tag" &&
                                    t.components[n.nodeName] &&
                                    ((n.type = "component"), (a = !0)),
                                n.voidElement ||
                                    a ||
                                    !f ||
                                    f === "<" ||
                                    (n.childNodes || (n.childNodes = []),
                                    n.childNodes.push({
                                        nodeName: "#text",
                                        data: w(e.slice(h, e.indexOf("<", h))),
                                    })),
                                s === 0 && o.push(n),
                                (r = i[s - 1]) &&
                                    (r.childNodes || (r.childNodes = []),
                                    r.childNodes.push(n)),
                                (i[s] = n)),
                            (!u || n.voidElement) &&
                                (s > -1 &&
                                    (n.voidElement ||
                                        n.nodeName ===
                                            l.slice(2, -1).toUpperCase()) &&
                                    (s--, (n = s === -1 ? o : i[s])),
                                !a && f !== "<" && f))
                        ) {
                            r = s === -1 ? o : i[s].childNodes || []
                            let m = e.indexOf("<", h),
                                _ = w(e.slice(h, m === -1 ? void 0 : m))
                            r.push({ nodeName: "#text", data: _ })
                        }
                    }),
                    o[0]
                )
            })(e)
        )
    }
    let D = function (e, t, n) {
        ;(this.options = n),
            (this.t1 =
                typeof HTMLElement !== "undefined" && e instanceof HTMLElement
                    ? v(e, this.options)
                    : typeof e === "string"
                    ? A(e, this.options)
                    : JSON.parse(JSON.stringify(e))),
            (this.t2 =
                typeof HTMLElement !== "undefined" && t instanceof HTMLElement
                    ? v(t, this.options)
                    : typeof t === "string"
                    ? A(t, this.options)
                    : JSON.parse(JSON.stringify(t))),
            (this.diffcount = 0),
            (this.foundAll = !1),
            this.debug &&
                ((this.t1Orig = v(e, this.options)),
                (this.t2Orig = v(t, this.options))),
            (this.tracker = new _())
    }
    ;(D.prototype.init = function () {
        return this.findDiffs(this.t1, this.t2)
    }),
        (D.prototype.findDiffs = function (e, t) {
            let n
            do {
                if (
                    this.options.debug &&
                    ((this.diffcount += 1),
                    this.diffcount > this.options.diffcap)
                )
                    throw (
                        (new Error(
                            `surpassed diffcap:${JSON.stringify(
                                this.t1Orig
                            )} -> ${JSON.stringify(this.t2Orig)}`
                        )((n = this.findNextDiff(e, t, []))).length === 0 &&
                            (d(e, t) ||
                                (this.foundAll
                                    ? console.error(
                                          "Could not find remaining diffs!"
                                      )
                                    : ((this.foundAll = !0),
                                      u(e),
                                      (n = this.findNextDiff(e, t, []))))),
                        n.length > 0 &&
                            ((this.foundAll = !1),
                            this.tracker.add(n),
                            g(e, n, this.options)))
                    )
            } while (n.length > 0)
            return this.tracker.list
        }),
        (D.prototype.findNextDiff = function (e, t, n) {
            let o, s
            if (this.options.maxDepth && n.length > this.options.maxDepth)
                return []
            if (!e.outerDone) {
                if (
                    ((o = this.findOuterDiff(e, t, n)),
                    this.options.filterOuterDiff &&
                        (s = this.options.filterOuterDiff(e, t, o)) &&
                        (o = s),
                    o.length > 0)
                )
                    return (e.outerDone = !0), o
                e.outerDone = !0
            }
            if (!e.innerDone) {
                if ((o = this.findInnerDiff(e, t, n)).length > 0) return o
                e.innerDone = !0
            }
            if (this.options.valueDiffing && !e.valueDone) {
                if ((o = this.findValueDiff(e, t, n)).length > 0)
                    return (e.valueDone = !0), o
                e.valueDone = !0
            }
            return []
        }),
        (D.prototype.findOuterDiff = function (e, t, n) {
            let o,
                s,
                i,
                l,
                c,
                r,
                u = []
            if (e.nodeName !== t.nodeName) {
                if (!n.length)
                    throw new Error(
                        "Top level nodes have to be of the same kind."
                    )
                return [
                    new a()
                        .setValue(
                            this.options._const.action,
                            this.options._const.replaceElement
                        )
                        .setValue(this.options._const.oldValue, f(e))
                        .setValue(this.options._const.newValue, f(t))
                        .setValue(this.options._const.route, n),
                ]
            }
            if (
                n.length &&
                this.options.maxNodeDiffCount <
                    Math.abs(
                        (e.childNodes || []).length -
                            (t.childNodes || []).length
                    )
            )
                return [
                    new a()
                        .setValue(
                            this.options._const.action,
                            this.options._const.replaceElement
                        )
                        .setValue(this.options._const.oldValue, f(e))
                        .setValue(this.options._const.newValue, f(t))
                        .setValue(this.options._const.route, n),
                ]
            if (e.data !== t.data)
                return e.nodeName === "#text"
                    ? [
                          new a()
                              .setValue(
                                  this.options._const.action,
                                  this.options._const.modifyTextElement
                              )
                              .setValue(this.options._const.route, n)
                              .setValue(this.options._const.oldValue, e.data)
                              .setValue(this.options._const.newValue, t.data),
                      ]
                    : [
                          new a()
                              .setValue(
                                  this.options._const.action,
                                  this.options._const.modifyComment
                              )
                              .setValue(this.options._const.route, n)
                              .setValue(this.options._const.oldValue, e.data)
                              .setValue(this.options._const.newValue, t.data),
                      ]
            for (
                s = e.attributes ? Object.keys(e.attributes).sort() : [],
                    i = t.attributes ? Object.keys(t.attributes).sort() : [],
                    l = s.length,
                    r = 0;
                r < l;
                r++
            )
                (o = s[r]),
                    (c = i.indexOf(o)) === -1
                        ? u.push(
                              new a()
                                  .setValue(
                                      this.options._const.action,
                                      this.options._const.removeAttribute
                                  )
                                  .setValue(this.options._const.route, n)
                                  .setValue(this.options._const.name, o)
                                  .setValue(
                                      this.options._const.value,
                                      e.attributes[o]
                                  )
                          )
                        : (i.splice(c, 1),
                          e.attributes[o] !== t.attributes[o] &&
                              u.push(
                                  new a()
                                      .setValue(
                                          this.options._const.action,
                                          this.options._const.modifyAttribute
                                      )
                                      .setValue(this.options._const.route, n)
                                      .setValue(this.options._const.name, o)
                                      .setValue(
                                          this.options._const.oldValue,
                                          e.attributes[o]
                                      )
                                      .setValue(
                                          this.options._const.newValue,
                                          t.attributes[o]
                                      )
                              ))
            for (l = i.length, r = 0; r < l; r++)
                (o = i[r]),
                    u.push(
                        new a()
                            .setValue(
                                this.options._const.action,
                                this.options._const.addAttribute
                            )
                            .setValue(this.options._const.route, n)
                            .setValue(this.options._const.name, o)
                            .setValue(
                                this.options._const.value,
                                t.attributes[o]
                            )
                    )
            return u
        }),
        (D.prototype.findInnerDiff = function (e, t, n) {
            let o = e.childNodes ? e.childNodes.slice() : [],
                s = t.childNodes ? t.childNodes.slice() : [],
                i = Math.max(o.length, s.length),
                l = Math.abs(o.length - s.length),
                c = [],
                r = 0
            if (!this.options.maxChildCount || i < this.options.maxChildCount) {
                let u = e.subsets && e.subsetsAge--,
                    h = u
                        ? e.subsets
                        : e.childNodes && t.childNodes
                        ? (function (e, t) {
                              for (
                                  var n = e.childNodes ? e.childNodes : [],
                                      o = t.childNodes ? t.childNodes : [],
                                      s = m(n.length, !1),
                                      i = m(o.length, !1),
                                      a = [],
                                      l = !0,
                                      c = function () {
                                          return arguments[1]
                                      };
                                  l;

                              )
                                  (l = p(n, o, s, i)) &&
                                      (a.push(l),
                                      Array.apply(void 0, new Array(l.length))
                                          .map(c)
                                          .forEach(e => {
                                              return (
                                                  (t = e),
                                                  (s[l.oldValue + t] = !0),
                                                  void (i[l.newValue + t] = !0)
                                              )
                                              let t
                                          }))
                              return (e.subsets = a), (e.subsetsAge = 100), a
                          })(e, t)
                        : []
                if (
                    h.length > 0 &&
                    (c = this.attemptGroupRelocation(e, t, h, n, u)).length > 0
                )
                    return c
            }
            for (let _ = 0; _ < i; _ += 1) {
                let V = o[_],
                    g = s[_]
                l &&
                    (V && !g
                        ? V.nodeName === "#text"
                            ? (c.push(
                                  new a()
                                      .setValue(
                                          this.options._const.action,
                                          this.options._const.removeTextElement
                                      )
                                      .setValue(
                                          this.options._const.route,
                                          n.concat(r)
                                      )
                                      .setValue(
                                          this.options._const.value,
                                          V.data
                                      )
                              ),
                              (r -= 1))
                            : (c.push(
                                  new a()
                                      .setValue(
                                          this.options._const.action,
                                          this.options._const.removeElement
                                      )
                                      .setValue(
                                          this.options._const.route,
                                          n.concat(r)
                                      )
                                      .setValue(
                                          this.options._const.element,
                                          f(V)
                                      )
                              ),
                              (r -= 1))
                        : g &&
                          !V &&
                          (g.nodeName === "#text"
                              ? c.push(
                                    new a()
                                        .setValue(
                                            this.options._const.action,
                                            this.options._const.addTextElement
                                        )
                                        .setValue(
                                            this.options._const.route,
                                            n.concat(r)
                                        )
                                        .setValue(
                                            this.options._const.value,
                                            g.data
                                        )
                                )
                              : c.push(
                                    new a()
                                        .setValue(
                                            this.options._const.action,
                                            this.options._const.addElement
                                        )
                                        .setValue(
                                            this.options._const.route,
                                            n.concat(r)
                                        )
                                        .setValue(
                                            this.options._const.element,
                                            f(g)
                                        )
                                ))),
                    V &&
                        g &&
                        (!this.options.maxChildCount ||
                        i < this.options.maxChildCount
                            ? (c = c.concat(
                                  this.findNextDiff(V, g, n.concat(r))
                              ))
                            : d(V, g) ||
                              (o.length > s.length
                                  ? (V.nodeName === "#text"
                                        ? c.push(
                                              new a()
                                                  .setValue(
                                                      this.options._const
                                                          .action,
                                                      this.options._const
                                                          .removeTextElement
                                                  )
                                                  .setValue(
                                                      this.options._const.route,
                                                      n.concat(r)
                                                  )
                                                  .setValue(
                                                      this.options._const.value,
                                                      V.data
                                                  )
                                          )
                                        : c.push(
                                              new a()
                                                  .setValue(
                                                      this.options._const
                                                          .action,
                                                      this.options._const
                                                          .removeElement
                                                  )
                                                  .setValue(
                                                      this.options._const
                                                          .element,
                                                      f(V)
                                                  )
                                                  .setValue(
                                                      this.options._const.route,
                                                      n.concat(r)
                                                  )
                                          ),
                                    o.splice(_, 1),
                                    (_ -= 1),
                                    (r -= 1),
                                    (l -= 1))
                                  : o.length < s.length
                                  ? ((c = c.concat([
                                        new a()
                                            .setValue(
                                                this.options._const.action,
                                                this.options._const.addElement
                                            )
                                            .setValue(
                                                this.options._const.element,
                                                f(g)
                                            )
                                            .setValue(
                                                this.options._const.route,
                                                n.concat(r)
                                            ),
                                    ])),
                                    o.splice(_, 0, {}),
                                    (l -= 1))
                                  : (c = c.concat([
                                        new a()
                                            .setValue(
                                                this.options._const.action,
                                                this.options._const
                                                    .replaceElement
                                            )
                                            .setValue(
                                                this.options._const.oldValue,
                                                f(V)
                                            )
                                            .setValue(
                                                this.options._const.newValue,
                                                f(g)
                                            )
                                            .setValue(
                                                this.options._const.route,
                                                n.concat(r)
                                            ),
                                    ])))),
                    (r += 1)
            }
            return (e.innerDone = !0), c
        }),
        (D.prototype.attemptGroupRelocation = function (e, t, n, o, s) {
            for (
                var i,
                    l,
                    c,
                    r,
                    u,
                    d,
                    p = (function (e, t, n) {
                        let o = e.childNodes ? m(e.childNodes.length, !0) : [],
                            s = t.childNodes ? m(t.childNodes.length, !0) : [],
                            i = 0
                        return (
                            n.forEach(e => {
                                for (
                                    var t = e.oldValue + e.length,
                                        n = e.newValue + e.length,
                                        a = e.oldValue;
                                    a < t;
                                    a += 1
                                )
                                    o[a] = i
                                for (let l = e.newValue; l < n; l += 1) s[l] = i
                                i += 1
                            }),
                            { gaps1: o, gaps2: s }
                        )
                    })(e, t, n),
                    _ = p.gaps1,
                    V = p.gaps2,
                    g = Math.min(_.length, V.length),
                    v = [],
                    N = 0,
                    b = 0;
                N < g;
                b += 1, N += 1
            )
                if (!s || (!0 !== _[N] && !0 !== V[N])) {
                    if (!0 === _[N])
                        if ((r = e.childNodes[b]).nodeName === "#text")
                            if (t.childNodes[N].nodeName === "#text") {
                                if (r.data !== t.childNodes[N].data) {
                                    for (
                                        d = b;
                                        e.childNodes.length > d + 1 &&
                                        e.childNodes[d + 1].nodeName ===
                                            "#text";

                                    )
                                        if (
                                            ((d += 1),
                                            t.childNodes[N].data ===
                                                e.childNodes[d].data)
                                        ) {
                                            u = !0
                                            break
                                        }
                                    if (!u)
                                        return (
                                            v.push(
                                                new a()
                                                    .setValue(
                                                        this.options._const
                                                            .action,
                                                        this.options._const
                                                            .modifyTextElement
                                                    )
                                                    .setValue(
                                                        this.options._const
                                                            .route,
                                                        o.concat(N)
                                                    )
                                                    .setValue(
                                                        this.options._const
                                                            .oldValue,
                                                        r.data
                                                    )
                                                    .setValue(
                                                        this.options._const
                                                            .newValue,
                                                        t.childNodes[N].data
                                                    )
                                            ),
                                            v
                                        )
                                }
                            } else
                                v.push(
                                    new a()
                                        .setValue(
                                            this.options._const.action,
                                            this.options._const
                                                .removeTextElement
                                        )
                                        .setValue(
                                            this.options._const.route,
                                            o.concat(N)
                                        )
                                        .setValue(
                                            this.options._const.value,
                                            r.data
                                        )
                                ),
                                    _.splice(N, 1),
                                    (g = Math.min(_.length, V.length)),
                                    (N -= 1)
                        else
                            v.push(
                                new a()
                                    .setValue(
                                        this.options._const.action,
                                        this.options._const.removeElement
                                    )
                                    .setValue(
                                        this.options._const.route,
                                        o.concat(N)
                                    )
                                    .setValue(this.options._const.element, f(r))
                            ),
                                _.splice(N, 1),
                                (g = Math.min(_.length, V.length)),
                                (N -= 1)
                    else if (!0 === V[N])
                        (r = t.childNodes[N]).nodeName === "#text"
                            ? (v.push(
                                  new a()
                                      .setValue(
                                          this.options._const.action,
                                          this.options._const.addTextElement
                                      )
                                      .setValue(
                                          this.options._const.route,
                                          o.concat(N)
                                      )
                                      .setValue(
                                          this.options._const.value,
                                          r.data
                                      )
                              ),
                              _.splice(N, 0, !0),
                              (g = Math.min(_.length, V.length)),
                              (b -= 1))
                            : (v.push(
                                  new a()
                                      .setValue(
                                          this.options._const.action,
                                          this.options._const.addElement
                                      )
                                      .setValue(
                                          this.options._const.route,
                                          o.concat(N)
                                      )
                                      .setValue(
                                          this.options._const.element,
                                          f(r)
                                      )
                              ),
                              _.splice(N, 0, !0),
                              (g = Math.min(_.length, V.length)),
                              (b -= 1))
                    else if (_[N] !== V[N]) {
                        if (v.length > 0) return v
                        if (
                            ((c = n[_[N]]),
                            (l = Math.min(
                                c.newValue,
                                e.childNodes.length - c.length
                            )) !== c.oldValue)
                        ) {
                            i = !1
                            for (let y = 0; y < c.length; y += 1)
                                h(
                                    e.childNodes[l + y],
                                    e.childNodes[c.oldValue + y],
                                    [],
                                    !1,
                                    !0
                                ) || (i = !0)
                            if (i)
                                return [
                                    new a()
                                        .setValue(
                                            this.options._const.action,
                                            this.options._const.relocateGroup
                                        )
                                        .setValue("groupLength", c.length)
                                        .setValue(
                                            this.options._const.from,
                                            c.oldValue
                                        )
                                        .setValue(this.options._const.to, l)
                                        .setValue(this.options._const.route, o),
                                ]
                        }
                    }
                } else;
            return v
        }),
        (D.prototype.findValueDiff = function (e, t, n) {
            let o = []
            return (
                e.selected !== t.selected &&
                    o.push(
                        new a()
                            .setValue(
                                this.options._const.action,
                                this.options._const.modifySelected
                            )
                            .setValue(this.options._const.oldValue, e.selected)
                            .setValue(this.options._const.newValue, t.selected)
                            .setValue(this.options._const.route, n)
                    ),
                (e.value || t.value) &&
                    e.value !== t.value &&
                    e.nodeName !== "OPTION" &&
                    o.push(
                        new a()
                            .setValue(
                                this.options._const.action,
                                this.options._const.modifyValue
                            )
                            .setValue(
                                this.options._const.oldValue,
                                e.value || ""
                            )
                            .setValue(
                                this.options._const.newValue,
                                t.value || ""
                            )
                            .setValue(this.options._const.route, n)
                    ),
                e.checked !== t.checked &&
                    o.push(
                        new a()
                            .setValue(
                                this.options._const.action,
                                this.options._const.modifyChecked
                            )
                            .setValue(this.options._const.oldValue, e.checked)
                            .setValue(this.options._const.newValue, t.checked)
                            .setValue(this.options._const.route, n)
                    ),
                o
            )
        })
    let T = {
            debug: !1,
            diffcap: 10,
            maxDepth: !1,
            maxChildCount: 50,
            valueDiffing: !0,
            textDiff(e, t, n, o) {
                e.data = o
            },
            preVirtualDiffApply() {},
            postVirtualDiffApply() {},
            preDiffApply() {},
            postDiffApply() {},
            filterOuterDiff: null,
            compress: !1,
            _const: !1,
            document:
                !(typeof window === "undefined" || !window.document) &&
                window.document,
        },
        O = function (e) {
            let t = this
            if (
                (void 0 === e && (e = {}),
                (this.options = e),
                Object.entries(T).forEach(e => {
                    let n = e[0],
                        o = e[1]
                    Object.prototype.hasOwnProperty.call(t.options, n) ||
                        (t.options[n] = o)
                }),
                !this.options._const)
            ) {
                let n = [
                    "addAttribute",
                    "modifyAttribute",
                    "removeAttribute",
                    "modifyTextElement",
                    "relocateGroup",
                    "removeElement",
                    "addElement",
                    "removeTextElement",
                    "addTextElement",
                    "replaceElement",
                    "modifyValue",
                    "modifyChecked",
                    "modifySelected",
                    "modifyComment",
                    "action",
                    "route",
                    "oldValue",
                    "newValue",
                    "element",
                    "group",
                    "from",
                    "to",
                    "name",
                    "value",
                    "data",
                    "attributes",
                    "nodeName",
                    "childNodes",
                    "checked",
                    "selected",
                ];
(this.options._const = {}),
                    this.options.compress
                        ? n.forEach((e, n) => (t.options._const[e] = n))
                        : n.forEach(e => (t.options._const[e] = e))
            }
            this.DiffFinder = D
        }
    ;(O.prototype.apply = function (e, t) {
        return (function (e, t, n) {
            return t.every(t => o(e, t, n))
        })(e, t, this.options)
    }),
        (O.prototype.undo = function (e, t) {
            return i(e, t, this.options)
        }),
        (O.prototype.diff = function (e, t) {
            return new this.DiffFinder(e, t, this.options).init()
        })
    let C = function (e) {
        let t = this
        void 0 === e && (e = {}),
            (this.pad = "│   "),
            (this.padding = ""),
            (this.tick = 1),
            (this.messages = [])
        let n = function (e, n) {
            let o = e[n]
            e[n] = function () {
                for (var s = [], i = arguments.length; i--; )
                    s[i] = arguments[i]
                t.fin(n, Array.prototype.slice.call(s))
                let a = o.apply(e, s)
                return t.fout(n, a), a
            }
        }
        for (let o in e) typeof e[o] === "function" && n(e, o)
        this.log("┌ TRACELOG START")
    }
    return (
        (C.prototype.fin = function (e, t) {
            ;(this.padding += this.pad), this.log(`├─> entering ${ e}`, t)
        }),
        (C.prototype.fout = function (e, t) {
            this.log("│<──┘ generated return value", t),
                (this.padding = this.padding.substring(
                    0,
                    this.padding.length - this.pad.length
                ))
        }),
        (C.prototype.format = function (e, t) {
            return `${(function (e) {
                for (e = `${  e}`; e.length < 4;) e = `0${  e}`
                return e
            })(t)}> ${this.padding}${e}`
        }),
        (C.prototype.log = function () {
            var e = Array.prototype.slice.call(arguments),
                t = function (e) {
                    return e
                        ? typeof e === "string"
                            ? e
                            : e instanceof HTMLElement
                            ? e.outerHTML || "<empty>"
                            : e instanceof Array
                            ? `[${ e.map(t).join(",") }]`
                            : e.toString() || e.valueOf() || "<unknown>"
                        : "<falsey>"
                }
            ;(e = e.map(t).join(", ")),
                this.messages.push(this.format(e, this.tick++))
        }),
        (C.prototype.toString = function () {
            for (
                var e = "└───";
                e.length <= this.padding.length + this.pad.length;

            )
                e += "×   "
            let t = this.padding
            return (
                (this.padding = ""),
                (e = this.format(e, this.tick)),
                (this.padding = t),
                `${this.messages.join("\n") }\n${ e}`
            )
        }),
        (e.DiffDOM = O),
        (e.TraceLogger = C),
        (e.nodeToObj = v),
        (e.stringToObj = A),
        e
    )
})({})
//# sourceMappingURL=diffDOM.js.map
