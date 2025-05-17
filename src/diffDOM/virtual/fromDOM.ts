import { DiffDOMOptionsPartial, elementNodeType, textNodeType } from "../types"
import { checkElementType } from "../helpers"

export function nodeToObj(
    aNode: Element,
    options: DiffDOMOptionsPartial = {
        valueDiffing: true,
        simplifiedElementCheck: true,
    },
) {
    const objNode: elementNodeType | textNodeType = {
        nodeName: aNode.nodeName,
    }
    if (
        checkElementType(
            aNode,
            options.simplifiedElementCheck,
            "Text",
            "Comment",
        )
    ) {
        ;(objNode as unknown as textNodeType).data = (
            aNode as unknown as Text | Comment
        ).data
    } else {
        if (aNode.attributes && aNode.attributes.length > 0) {
            objNode.attributes = {}
            const nodeArray = Array.prototype.slice.call(aNode.attributes)
            nodeArray.forEach(
                (attribute) =>
                    (objNode.attributes[attribute.name] = attribute.value),
            )
        }
        if (aNode.childNodes && aNode.childNodes.length > 0) {
            objNode.childNodes = []
            const nodeArray = Array.prototype.slice.call(aNode.childNodes)
            nodeArray.forEach((childNode) =>
                objNode.childNodes.push(nodeToObj(childNode, options)),
            )
        }
        if (options.valueDiffing) {
            if (
                checkElementType(
                    aNode,
                    options.simplifiedElementCheck,
                    "HTMLTextAreaElement",
                )
            ) {
                objNode.value = (aNode as HTMLTextAreaElement).value
            }
            if (
                checkElementType(
                    aNode,
                    options.simplifiedElementCheck,
                    "HTMLInputElement",
                ) &&
                ["radio", "checkbox"].includes(
                    (aNode as HTMLInputElement).type.toLowerCase(),
                ) &&
                (aNode as HTMLInputElement).checked !== undefined
            ) {
                objNode.checked = (aNode as HTMLInputElement).checked
            } else if (
                checkElementType(
                    aNode,
                    options.simplifiedElementCheck,
                    "HTMLButtonElement",
                    "HTMLDataElement",
                    "HTMLInputElement",
                    "HTMLLIElement",
                    "HTMLMeterElement",
                    "HTMLOptionElement",
                    "HTMLProgressElement",
                    "HTMLParamElement",
                )
            ) {
                objNode.value = (
                    aNode as
                        | HTMLButtonElement
                        | HTMLDataElement
                        | HTMLInputElement
                        | HTMLLIElement
                        | HTMLMeterElement
                        | HTMLOptionElement
                        | HTMLProgressElement
                        | HTMLParamElement
                ).value
            }
            if (
                checkElementType(
                    aNode,
                    options.simplifiedElementCheck,
                    "HTMLOptionElement",
                )
            ) {
                objNode.selected = (aNode as HTMLOptionElement).selected
            }
        }
    }
    return objNode
}
