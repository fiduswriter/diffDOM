import {
    DiffDOM,
    nodeToObj,
    stringToObj
} from "../src/index"

const strings = [
    '<div>Elephant &gt; Fish</div>',
    '<div>Fish &lt; Elephant</div>',
    '<div>Elephant &amp; Fish</div>',
    '<div>Fish &amp; Elephant</div>',
]

describe('special chars', () => {

    it('can diff and patch html strings with special chars', () => {
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

    it('can diff and patch dom elements with special chars', () => {
        const dd = new DiffDOM({
            debug: true,
            diffcap: 500
        })

        for (let i = 0; i < strings.length; i = i + 2) {
            const el1Outer = document.createElement('div')
            const el2Outer = document.createElement('div')
            el1Outer.innerHTML = strings[i]
            el2Outer.innerHTML = strings[i + 1]
            const diffs = dd.diff(el1Outer.firstElementChild, el2Outer.firstElementChild)
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
