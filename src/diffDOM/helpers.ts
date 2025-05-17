import { elementNodeType } from "./types"

export class Diff {
    constructor(options = {}) {
        Object.entries(options).forEach(([key, value]) => (this[key] = value))
    }

    toString() {
        return JSON.stringify(this)
    }

    setValue(
        aKey: string | number,
        aValue:
            | string
            | number
            | boolean
            | number[]
            | { [key: string]: string | { [key: string]: string } }
            | elementNodeType,
    ) {
        this[aKey] = aValue
        return this
    }
}

/**
 * Checks if an element is of a certain type using direct property checking or DOM instanceof
 *
 * @param element The element to check
 * @param elementTypeNames The element type names to check against
 * @param simplifiedCheck If true, uses simplified checking based on nodeName/nodeType
 * @returns boolean indicating if the element matches any of the specified types
 */
export function checkElementType(
    element,
    simplifiedCheck = false,
    ...elementTypeNames: string[]
) {
    if (typeof element === "undefined" || element === null) {
        return false
    }

    // Simplified check for primitive virtual DOMs without ownerDocument
    if (simplifiedCheck) {
        return elementTypeNames.some((elementTypeName) => {
            // Special case for basic element types
            if (elementTypeName === "Element") {
                return (
                    element.nodeType === 1 ||
                    (typeof element.nodeName === "string" &&
                        element.nodeName !== "#text" &&
                        element.nodeName !== "#comment")
                )
            }
            if (elementTypeName === "Text") {
                return element.nodeType === 3 || element.nodeName === "#text"
            }
            if (elementTypeName === "Comment") {
                return element.nodeType === 8 || element.nodeName === "#comment"
            }

            // For HTML element types, check nodeName
            if (
                elementTypeName.startsWith("HTML") &&
                elementTypeName.endsWith("Element")
            ) {
                const tagName = elementTypeName.slice(4, -7).toLowerCase()
                return (
                    element.nodeName &&
                    element.nodeName.toLowerCase() === tagName
                )
            }

            return false
        })
    }

    // DOM-based check
    return elementTypeNames.some(
        (elementTypeName) =>
            // We need to check if the specified type is defined
            // because otherwise instanceof throws an exception.
            typeof element?.ownerDocument?.defaultView?.[elementTypeName] ===
                "function" &&
            element instanceof
                element.ownerDocument.defaultView[elementTypeName],
    )
}
