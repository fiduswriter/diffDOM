import { Diff } from "./virtual/helpers"

interface subset {
    oldValue: number
    newValue: number
    length: number
}

interface nodeType {
    nodeName: string
    attributes?: { [key: string]: string }
    childNodes?: anyNodeType[] // eslint-disable-line no-use-before-define
    data?: string
    checked?: boolean
    value?: string | number
    selected?: boolean
    // The following are only used durign diffing.
    subsets?: subset[]
    subsetsAge?: number
    outerDone?: boolean
    innerDone?: boolean
    valueDone?: boolean
}

interface textNodeType {
    nodeName: "#text" | "#comment"
    data: string
    childNodes?: never
}

type anyNodeType = nodeType | textNodeType

interface Document {
    createElement: (arg: string) => Element
    createElementNS: (namespaceURI: string, qualifiedName: string) => Element
    createTextNode: (arg: string) => Text
    createComment: (arg: string) => Comment
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PreDiffApplyOptions {
    diff: Diff
    node: anyNodeType
}

type PreDiffApply = (PreDiffApplyOptions) => boolean

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PostDiffApplyOptions {
    diff: Diff
    node: anyNodeType
    newNode: anyNodeType
}

type PostDiffApply = (PostDiffApplyOptions) => void

interface ConstNames {
    addAttribute: string | number
    modifyAttribute: string | number
    removeAttribute: string | number
    modifyTextElement: string | number
    relocateGroup: string | number
    removeElement: string | number
    addElement: string | number
    removeTextElement: string | number
    addTextElement: string | number
    replaceElement: string | number
    modifyValue: string | number
    modifyChecked: string | number
    modifySelected: string | number
    modifyComment: string | number
    action: string | number
    route: string | number
    oldValue: string | number
    newValue: string | number
    element: string | number
    group: string | number
    from: string | number
    to: string | number
    name: string | number
    value: string | number
    data: string | number
    attributes: string | number
    nodeName: string | number
    childNodes: string | number
    checked: string | number
    selected: string | number
}

interface DiffDOMOptions {
    debug: boolean
    diffcap: number // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
    maxDepth: boolean // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
    maxChildCount: number // False or a numeral. If set to a numeral, only does a simplified form of diffing of contents so that the number of diffs cannot be higher than the number of child nodes.
    valueDiffing: boolean // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
    // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
    textDiff: (
        node: textNodeType | Text | Comment,
        currentValue: string,
        expectedValue: string,
        newValue: string
    ) => void
    preVirtualDiffApply: PreDiffApply
    postVirtualDiffApply: PostDiffApply
    preDiffApply: PreDiffApply
    postDiffApply: PostDiffApply
    filterOuterDiff: null | ((t1, t2, diffs: Diff[]) => void | Diff[])
    compress: boolean // Whether to work with compressed diffs
    _const: ConstNames // object with strings for every change types to be used in diffs.
    document: Document
    components: string[]
}

type DiffDOMOptionsPartial = Partial<DiffDOMOptions>

type ConstNamesPartial = Partial<ConstNames>

export {
    anyNodeType,
    ConstNames,
    ConstNamesPartial,
    DiffDOMOptions,
    DiffDOMOptionsPartial,
    nodeType,
    textNodeType,
}
