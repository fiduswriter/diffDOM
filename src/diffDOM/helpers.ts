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

export function checkElementType(element, ...elementTypeNames: string[]) {
    if (typeof element === "undefined" || element === null) {
        return false
    }
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
