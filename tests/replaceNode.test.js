/**
 * @jest-environment jsdom
 */


import {DiffDOM} from "../src/index"

const strings = [
    '<div><div><div><img><span>hello</span></div></div><img></div>',
    '<div></div>',

    `<span><ul><li><a><svg role="img"
        width='16'
        height='16'
        aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 9.5L12 14.5L18.5 9.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
    </svg></a></li></ul><span>`,
    '<span><ul><li><a><span data-tau="refinements_option_name">Find</span></a></li></ul><span>'
]

describe('replaceNode.test', () => {

    it('can diff and replace nodes without damaging tags', () => {
        const dd = new DiffDOM({
            debug: true,
            diffcap: 500
        })

        for (let i = 0; i < strings.length; i += 2) {
            const oldNodeOuter = document.createElement('div')
            const newNodeOuter = document.createElement('div')
            oldNodeOuter.innerHTML = strings[i]
            newNodeOuter.innerHTML = strings[i + 1]
            const diffs = dd.diff(oldNodeOuter.innerHTML, newNodeOuter.innerHTML)
            expect(diffs).not.toHaveLength(0)

            const oldNode = oldNodeOuter.firstElementChild
            const newNode = newNodeOuter.firstElementChild
            const oldNodePatched = oldNode.cloneNode(true)
            dd.apply(oldNodePatched, diffs)
            expect(oldNodePatched.isEqualNode(newNode)).toBe(true)
        }
    })

})
