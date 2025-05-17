import { checkElementType } from "./diffDOM/helpers"

/**
 * Use TraceLogger to figure out function calls inside
 * JS objects by wrapping an object with a TraceLogger
 * instance.
 *
 * Pretty-prints the call trace (using unicode box code)
 * when tracelogger.toString() is called.
 */

/**
 * Wrap an object by calling new TraceLogger(obj)
 *
 * If you're familiar with Python decorators, this
 * does roughly the same thing, adding pre/post
 * call hook logging calls so that you can see
 * what's going on.
 */
export class TraceLogger {
    messages: string[]
    pad: string
    padding: string
    tick: number
    constructor(obj = {}) {
        this.pad = "│   "
        this.padding = ""
        this.tick = 1
        this.messages = []
        const wrapkey = (obj: object, key: string) => {
            // trace this function
            const oldfn = obj[key]
            obj[key] = (
                ...args: ((
                    ...args: (
                        | string
                        | HTMLElement
                        | number
                        | boolean
                        | false
                        | (string | HTMLElement | number | boolean | false)[]
                    )[]
                ) => void)[]
            ) => {
                this.fin(key, Array.prototype.slice.call(args))
                const result = oldfn.apply(obj, args)
                this.fout(key, result)
                return result
            }
        }
        // can't use Object.keys for prototype walking
        for (let key in obj) {
            if (typeof obj[key] === "function") {
                wrapkey(obj, key)
            }
        }
        this.log("┌ TRACELOG START")
    }
    // called when entering a function
    fin(
        fn: string,
        args:
            | string
            | HTMLElement
            | number
            | boolean
            | false
            | (string | HTMLElement | number | boolean | false)[],
    ) {
        this.padding += this.pad
        this.log(`├─> entering ${fn}`, args)
    }
    // called when exiting a function
    fout(
        fn: string,
        result:
            | string
            | HTMLElement
            | number
            | boolean
            | false
            | (string | HTMLElement | number | boolean | false)[],
    ) {
        this.log("│<──┘ generated return value", result)
        this.padding = this.padding.substring(
            0,
            this.padding.length - this.pad.length,
        )
    }
    // log message formatting
    format(s: string, tick: number) {
        let nf = function (t: number) {
            let tStr = `${t}`
            while (tStr.length < 4) {
                tStr = `0${t}`
            }
            return tStr
        }
        return `${nf(tick)}> ${this.padding}${s}`
    }
    // log a trace message
    log(...args) {
        const stringCollapse = function (
            v:
                | string
                | HTMLElement
                | number
                | boolean
                | false
                | (string | HTMLElement | number | boolean | false)[],
        ) {
            if (!v) {
                return "<falsey>"
            }
            if (typeof v === "string") {
                return v
            }
            // Use simplified check for HTMLElement since this is outside the main diff process
            if (checkElementType(v, true, "HTMLElement")) {
                return (v as HTMLElement).outerHTML || "<empty>"
            }
            if (v instanceof Array) {
                return `[${v.map(stringCollapse).join(",")}]`
            }
            return v.toString() || v.valueOf() || "<unknown>"
        }
        const s = args.map(stringCollapse).join(", ")
        this.messages.push(this.format(s, this.tick++))
    }
    // turn the log into a structured string with
    // unicode box codes to make it a sensible trace.
    toString() {
        let cap = "×   "
        let terminator = "└───"
        while (terminator.length <= this.padding.length + this.pad.length) {
            terminator += cap
        }
        let _ = this.padding
        this.padding = ""
        terminator = this.format(terminator, this.tick)
        this.padding = _
        return `${this.messages.join("\n")}\n${terminator}`
    }
}
