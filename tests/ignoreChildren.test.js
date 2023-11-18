/**
 * @jest-environment jsdom
 */

import { DiffDOM } from "../dist/index"

// Add all divs to be compared here two by two
const html = `
<div><img><span class="ignore-children"><img><img><img></span></div>
<div><img><span class="ignore-children"><b>fish</b></span></div>

<div><img><span class="ignore-children"><img><img><img></span></div>
<div><img><span></span></div>

<div><img><span><img><img><img></span></div>
<div><img><span class="ignore-children"><b>fish</b></span></div>
`
// Note: if ignoring the children of only the source or target, you may end up with unexpected results.
// In the third case above, the class "ignore-children" will be added but the span will be empty:
// <div><img><span class="ignore-children"></span></div>
const caps = [
    0, 1, 4,
]

describe("basic", () => {
    it("can diff and patch while ignoring children", () => {
        document.body.innerHTML = html
        const dd = new DiffDOM({
                debug: true,
                diffcap: 1000,
                ignoreChildrenClass: "ignore-children"
            }),
            divs = document.querySelectorAll("div")
        let totalDiffs = 0
        for (let i = 0; i < divs.length; i += 2) {
            const diffs = dd.diff(divs[i], divs[i + 1])
            expect(diffs.length).toBe(caps[i / 2])
            dd.apply(divs[i], diffs)
        }
    })
})
