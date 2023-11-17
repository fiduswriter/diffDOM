import {
    ConstNames,
    ConstNamesPartial,
    DiffDOMOptions,
    DiffDOMOptionsPartial,
    diffType,
    elementNodeType,
    textNodeType,
} from "./types"
import { applyDOM, undoDOM } from "./dom/index"
import { Diff } from "./helpers"
import { DiffFinder } from "./virtual/index"
export { nodeToObj, stringToObj } from "./virtual/index"

const DEFAULT_OPTIONS = {
    debug: false,
    diffcap: 10, // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
    maxDepth: false, // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
    maxChildCount: 50, // False or a numeral. If set to a numeral, only does a simplified form of diffing of contents so that the number of diffs cannot be higher than the number of child nodes.
    valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
    // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
    textDiff(
        node: textNodeType,
        currentValue: string,
        expectedValue: string,
        newValue: string,
    ) {
        node.data = newValue
        return
    },
    // empty functions were benchmarked as running faster than both
    // `f && f()` and `if (f) { f(); }`
    preVirtualDiffApply() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    postVirtualDiffApply() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    preDiffApply() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    postDiffApply() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    filterOuterDiff: null,
    compress: false, // Whether to work with compressed diffs
    _const: false, // object with strings for every change types to be used in diffs.
    document:
        typeof window !== "undefined" && window.document
            ? window.document
            : false,
    components: [], // list of components used for converting from string
}

export class DiffDOM {
    options: DiffDOMOptions
    constructor(options: DiffDOMOptionsPartial = {}) {
        // IE11 doesn't have Object.assign and buble doesn't translate object spreaders
        // by default, so this is the safest way of doing it currently.
        Object.entries(DEFAULT_OPTIONS).forEach(([key, value]) => {
            if (!Object.prototype.hasOwnProperty.call(options, key)) {
                options[key] = value
            }
        })

        if (!options._const) {
            const varNames = [
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
                "groupLength",
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
            ]
            const constNames: ConstNamesPartial = {}
            if (options.compress) {
                varNames.forEach(
                    (varName, index) => (constNames[varName] = index),
                )
            } else {
                varNames.forEach((varName) => (constNames[varName] = varName))
            }
            options._const = constNames as ConstNames
        }

        this.options = options as DiffDOMOptions
    }

    apply(tree: Element, diffs: (Diff | diffType)[]) {
        return applyDOM(tree, diffs, this.options)
    }

    undo(tree: Element, diffs: (Diff | diffType)[]) {
        return undoDOM(tree, diffs, this.options)
    }

    diff(
        t1Node: string | elementNodeType | Element,
        t2Node: string | elementNodeType | Element,
    ) {
        const finder = new DiffFinder(t1Node, t2Node, this.options)
        return finder.init()
    }
}
