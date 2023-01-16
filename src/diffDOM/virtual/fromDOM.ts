export function nodeToObj(aNode: any, options = {}) {
    const objNode = {}
    // @ts-expect-error TS(2339): Property 'nodeName' does not exist on type '{}'.
    objNode.nodeName = aNode.nodeName
    // @ts-expect-error TS(2339): Property 'nodeName' does not exist on type '{}'.
    if (objNode.nodeName === "#text" || objNode.nodeName === "#comment") {
        // @ts-expect-error TS(2339): Property 'data' does not exist on type '{}'.
        objNode.data = aNode.data
    } else {
        if (aNode.attributes && aNode.attributes.length > 0) {
            // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{}'.
            objNode.attributes = {}
            const nodeArray = Array.prototype.slice.call(aNode.attributes)
            nodeArray.forEach(
                (attribute) =>
                    // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{}'.
                    (objNode.attributes[attribute.name] = attribute.value)
            )
        }
        // @ts-expect-error TS(2339): Property 'nodeName' does not exist on type '{}'.
        if (objNode.nodeName === "TEXTAREA") {
            // @ts-expect-error TS(2339): Property 'value' does not exist on type '{}'.
            objNode.value = aNode.value
        } else if (aNode.childNodes && aNode.childNodes.length > 0) {
            // @ts-expect-error TS(2339): Property 'childNodes' does not exist on type '{}'.
            objNode.childNodes = []
            const nodeArray = Array.prototype.slice.call(aNode.childNodes)
            nodeArray.forEach((childNode) =>
                // @ts-expect-error TS(2339): Property 'childNodes' does not exist on type '{}'.
                objNode.childNodes.push(nodeToObj(childNode, options))
            )
        }
        // @ts-expect-error TS(2339): Property 'valueDiffing' does not exist on type '{}... Remove this comment to see the full error message
        if (options.valueDiffing) {
            if (
                aNode.checked !== undefined &&
                aNode.type &&
                ["radio", "checkbox"].includes(aNode.type.toLowerCase())
            ) {
                // @ts-expect-error TS(2339): Property 'checked' does not exist on type '{}'.
                objNode.checked = aNode.checked
            } else if (aNode.value !== undefined) {
                // @ts-expect-error TS(2339): Property 'value' does not exist on type '{}'.
                objNode.value = aNode.value
            }
            if (aNode.selected !== undefined) {
                // @ts-expect-error TS(2339): Property 'selected' does not exist on type '{}'.
                objNode.selected = aNode.selected
            }
        }
    }
    return objNode
}
