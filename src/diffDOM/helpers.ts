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

    if (typeof window !== "undefined") {
        // For browser environment
        if (
            elementTypeNames.some((elementTypeName) => {
                if (typeof window[elementTypeName] === "function") {
                    if (
                        element instanceof window[elementTypeName] ||
                        (element.ownerDocument?.defaultView &&
                            element instanceof
                                element.ownerDocument.defaultView[
                                    elementTypeName
                                ])
                    ) {
                        return true
                    } else {
                        return false
                    }
                }
            })
        ) {
            return true
        } else {
            return false
        }
    } else {
        // For node.js
        return (
            typeof global !== "undefined" &&
            elementTypeNames.some(
                (elementTypeName) => element instanceof global[elementTypeName],
            )
        )
    }
}
