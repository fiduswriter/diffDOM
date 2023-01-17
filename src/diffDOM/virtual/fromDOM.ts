import {
    nodeType,
    textNodeType
} from "../types"

export function nodeToObj(aNode: Element, options = {}) {
    const objNode : (nodeType | textNodeType) = {
        nodeName: aNode.nodeName
    }
    if (
        aNode instanceof Text ||
        aNode instanceof Comment
    ) {
        ((objNode as unknown) as textNodeType).data = aNode.data
    } else {
        if (aNode.attributes && aNode.attributes.length > 0) {
            objNode.attributes = {}
            const nodeArray = Array.prototype.slice.call(aNode.attributes)
            nodeArray.forEach(
                (attribute) =>
                    (objNode.attributes[attribute.name] = attribute.value)
            )
        }
        if (aNode instanceof HTMLTextAreaElement) {
            objNode.value = aNode.value
        } else if (aNode.childNodes && aNode.childNodes.length > 0) {
            objNode.childNodes = []
            const nodeArray = Array.prototype.slice.call(aNode.childNodes)
            nodeArray.forEach((childNode) =>
                objNode.childNodes.push(nodeToObj(childNode, options))
            )
        }
        // @ts-expect-error TS(2339): Property 'valueDiffing' does not exist on type '{}... Remove this comment to see the full error message
        if (options.valueDiffing) {
            if (
                (aNode instanceof HTMLInputElement) &&
                ["radio", "checkbox"].includes(aNode.type.toLowerCase()) &&
                aNode.checked !== undefined
            ) {
                objNode.checked = aNode.checked
            } else if (
                aNode instanceof HTMLButtonElement ||
                aNode instanceof HTMLDataElement ||
                aNode instanceof HTMLInputElement ||
                aNode instanceof HTMLLIElement ||
                aNode instanceof HTMLMeterElement ||
                aNode instanceof HTMLOptionElement ||
                aNode instanceof HTMLProgressElement ||
                aNode instanceof HTMLParamElement
            ) {
                objNode.value = aNode.value
            }
            if (aNode instanceof HTMLOptionElement) {
                objNode.selected = aNode.selected
            }
        }
    }
    return objNode
}
