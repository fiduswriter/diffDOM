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

export const checkElementType = (element, ...elementTypeNames: string[]) => {
    if (typeof element === "undefined" || element === null) {
        return false
    }
    // Use by default the global scope from node.js, with a fallback on the node's parent window,
    // or the current window (for web browser environment).
    const scope = global || element?.ownerDocument?.defaultView || window
    return elementTypeNames.some(
        (elementTypeName) =>
            // We need to check if the specified type is defined in the given scope
            // because otherwise instanceof throws an exception.
            typeof scope?.[elementTypeName] === "function" &&
            element instanceof scope[elementTypeName],
    )
}
