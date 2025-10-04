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
        const simplifiedResult = elementTypeNames.some((elementTypeName) => {
            // Special case for basic element types
            if (elementTypeName === "Element") {
                // Enhanced check that handles both virtual DOM objects and real DOM elements
                return (
                    element.nodeType === 1 ||
                    (typeof element.nodeName === "string" &&
                        element.nodeName !== "#text" &&
                        element.nodeName !== "#comment") ||
                    // Additional check for real DOM elements that might not have nodeType
                    (element.tagName && typeof element.tagName === "string") ||
                    // Check if it has DOM element-like properties (fallback)
                    (element.setAttribute &&
                        typeof element.setAttribute === "function")
                )
            }
            if (elementTypeName === "Text") {
                return element.nodeType === 3 || element.nodeName === "#text"
            }
            if (elementTypeName === "Comment") {
                return element.nodeType === 8 || element.nodeName === "#comment"
            }

            // For HTML element types, check nodeName or tagName
            if (
                elementTypeName.startsWith("HTML") &&
                elementTypeName.endsWith("Element")
            ) {
                const tagName = elementTypeName.slice(4, -7).toLowerCase()
                return (
                    (element.nodeName &&
                        element.nodeName.toLowerCase() === tagName) ||
                    (element.tagName &&
                        element.tagName.toLowerCase() === tagName)
                )
            }

            return false
        })

        // If simplified check succeeds, return true
        if (simplifiedResult) {
            return true
        }

        // Fallback to DOM-based check if simplified check fails and element has ownerDocument
        if (element.ownerDocument) {
            return elementTypeNames.some(
                (elementTypeName) =>
                    typeof element?.ownerDocument?.defaultView?.[
                        elementTypeName
                    ] === "function" &&
                    element instanceof
                        element.ownerDocument.defaultView[elementTypeName],
            )
        }

        return false
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
