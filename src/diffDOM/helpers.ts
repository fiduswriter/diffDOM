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
    return elementTypeNames.some((elementTypeName) => {
        const typeIsDefined = typeof window[elementTypeName] === "function"
        const elementIsThisType = element instanceof window[elementTypeName]

        return typeIsDefined && elementIsThisType
    })
}
