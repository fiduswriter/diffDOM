/**
 * @jest-environment jsdom
 */

import { DiffDOM, nodeToObj, stringToObj } from "../dist/index"

const strings = [
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

describe("string", () => {
    it("can diff and patch case sensitive xml strings", () => {
        const dd = new DiffDOM({
            debug: true,
            diffcap: 500,
            caseSensitive: true,
        })

        for (let i = 0; i < strings.length; i += 2) {
            const el1Outer = document.createElement("div")
            const el2Outer = document.createElement("div")
            el1Outer.innerHTML = strings[i]
            el2Outer.innerHTML = strings[i + 1]
            const diffs = dd.diff(strings[i], strings[i + 1])
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
    })
})
