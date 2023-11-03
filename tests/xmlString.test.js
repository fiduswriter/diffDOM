/**
 * @jest-environment jsdom
 */

import { DiffDOM, nodeToObj, stringToObj } from "../dist/index"

const stringsIncludingSVGs = [
    `<svg height=50 width=50>
        <defs>
            <clipPath id="clipPath">
                <rect x="15" y="15" width="40" height="40" />
            </clipPath>
        </defs>

        <circle cx=25 cy=25 r=20
            style="fill: #0000ff; clip-path: url(#clipPath);"
        />
    </svg>`,
    `<svg></svg>`,

    `<svg></svg>`,
    `<svg height=50 width=50>
        <defs>
            <clipPath id="clipPath">
                <rect x="15" y="15" width="40" height="40" />
            </clipPath>
        </defs>

        <circle cx=25 cy=25 r=20
            style="fill: #0000ff; clip-path: url(#clipPath);"
        />
    </svg>`,
]

const stringsInsideSVGs = [
    `<defs><clipPath id="clipPath"><rect x="15" y="15" width="40" height="40" /></clipPath></defs>`,
    `<defs></defs>`,

    `<defs></defs>`,
    `<defs><clipPath id="clipPath"><rect x="15" y="15" width="40" height="40" /></clipPath></defs>`,
]

describe("string", () => {
    it("can diff and patch case sensitive xml strings", () => {
        const dd = new DiffDOM({
            debug: true,
            diffcap: 500,
            caseSensitive: false,
        })

        for (let i = 0; i < stringsIncludingSVGs.length; i += 2) {
            const el1Outer = document.createElement("div")
            const el2Outer = document.createElement("div")
            el1Outer.innerHTML = stringsIncludingSVGs[i]
            el2Outer.innerHTML = stringsIncludingSVGs[i + 1]
            const diffs = dd.diff(stringsIncludingSVGs[i], stringsIncludingSVGs[i + 1])
            expect(diffs).not.toHaveLength(0)
            const el1 = el1Outer.firstElementChild
            const el2 = el2Outer.firstElementChild
            const el1a = el1.cloneNode(true)
            dd.apply(el1a, diffs)
            expect(
                el1a.innerHTML
            ).toEqual(el2.innerHTML)
            dd.undo(el1a, diffs)
            expect(
                el1a.innerHTML
            ).toEqual(el1.innerHTML)
        }

        const ddCaseSensitive = new DiffDOM({
            debug: true,
            diffcap: 500,
            caseSensitive: true,
        })

        for (let i = 0; i < stringsInsideSVGs.length; i += 2) {
            const el1Outer = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            const el2Outer = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            el1Outer.innerHTML = stringsInsideSVGs[i]
            el2Outer.innerHTML = stringsInsideSVGs[i + 1]
            const diffsCaseSensitive = ddCaseSensitive.diff(stringsInsideSVGs[i], stringsInsideSVGs[i + 1])
            const diffs = dd.diff(stringsInsideSVGs[i], stringsInsideSVGs[i + 1])
            expect(diffsCaseSensitive).not.toHaveLength(0)
            expect(diffs).not.toHaveLength(0)
            const el1 = el1Outer.firstElementChild
            const el2 = el2Outer.firstElementChild
            const el1a = el1.cloneNode(true)
            const el1b = el1.cloneNode(true)
            ddCaseSensitive.apply(el1a, diffsCaseSensitive)
            expect(
                el1a.innerHTML
            ).toEqual(el2.innerHTML)
            // Trying to do the same without case sensitivity should not work.
            dd.apply(el1b, diffs)
            if (el1b.innerHTML.length || el2.innerHTML.length) {
                expect(
                    el1b.innerHTML
                ).not.toEqual(el2.innerHTML)
            }
            ddCaseSensitive.undo(el1a, diffsCaseSensitive)
            expect(
                el1a.innerHTML
            ).toEqual(el1.innerHTML)
            // Trying to do the same without case sensitivity should not work.
            dd.undo(el1b, diffs)
            if (el1b.innerHTML.length || el1.innerHTML.length) {
                expect(
                    el1b.innerHTML
                ).not.toEqual(el1.innerHTML)
            }
        }
    })
})
