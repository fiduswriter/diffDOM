import { DiffDOMOptions, diffType } from "../types"
import { Diff } from "../helpers"
import { applyDiff } from "./apply"

// ===== Undo a diff =====

function swap(obj: object, p1: string | number, p2: string | number) {
    const tmp = obj[p1]
    obj[p1] = obj[p2]
    obj[p2] = tmp
}

function undoDiff(
    tree: Element,
    diff: diffType,
    options: DiffDOMOptions, // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            diff[options._const.action] = options._const.removeAttribute
            applyDiff(tree, diff, options)
            break
        case options._const.modifyAttribute:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.removeAttribute:
            diff[options._const.action] = options._const.addAttribute
            applyDiff(tree, diff, options)
            break
        case options._const.modifyTextElement:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.modifyValue:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.modifyComment:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.modifyChecked:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.modifySelected:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.replaceElement:
            swap(diff, options._const.oldValue, options._const.newValue)
            applyDiff(tree, diff, options)
            break
        case options._const.relocateGroup:
            swap(diff, options._const.from, options._const.to)
            applyDiff(tree, diff, options)
            break
        case options._const.removeElement:
            diff[options._const.action] = options._const.addElement
            applyDiff(tree, diff, options)
            break
        case options._const.addElement:
            diff[options._const.action] = options._const.removeElement
            applyDiff(tree, diff, options)
            break
        case options._const.removeTextElement:
            diff[options._const.action] = options._const.addTextElement
            applyDiff(tree, diff, options)
            break
        case options._const.addTextElement:
            diff[options._const.action] = options._const.removeTextElement
            applyDiff(tree, diff, options)
            break
        default:
            console.log("unknown action")
    }
}

export function undoDOM(
    tree: Element,
    diffs: (diffType | Diff)[],
    options: DiffDOMOptions,
) {
    diffs = diffs.slice()
    diffs.reverse()
    diffs.forEach((diff: diffType | Diff) => {
        undoDiff(tree, diff as diffType, options)
    })
}
