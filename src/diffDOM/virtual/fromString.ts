import { DiffDOMOptionsPartial, nodeType } from "../types"

// from html-parse-stringify (MIT)

const tagRE =
    /<\s*\/*[a-zA-Z:_][a-zA-Z0-9:_\-.]*\s*(?:"[^"]*"['"]*|'[^']*'['"]*|[^'"/>])*\/*\s*>|<!--(?:.|\n|\r)*?-->/g

const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g

function unescape(string: string) {
    return string
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
}

// create optimized lookup object for
// void elements as listed here:
// https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
const lookup = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    menuItem: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true,
}

const parseTag = (tag: string, caseSensitive: boolean) => {
    const res = {
        nodeName: "",
        attributes: {},
    }
    let voidElement = false
    let type = "tag"

    let tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/)
    if (tagMatch) {
        res.nodeName =
            caseSensitive || tagMatch[1] === "svg"
                ? tagMatch[1]
                : tagMatch[1].toUpperCase()
        if (lookup[tagMatch[1]] || tag.charAt(tag.length - 2) === "/") {
            voidElement = true
        }

        // handle comment tag
        if (res.nodeName.startsWith("!--")) {
            const endIndex = tag.indexOf("-->")
            return {
                type: "comment",
                node: {
                    nodeName: "#comment",
                    data: endIndex !== -1 ? tag.slice(4, endIndex) : "",
                },
                voidElement,
            }
        }
    }

    let reg = new RegExp(attrRE)
    let result = null
    let done = false
    while (!done) {
        result = reg.exec(tag)

        if (result === null) {
            done = true
        } else if (result[0].trim()) {
            if (result[1]) {
                let attr = result[1].trim()
                let arr = [attr, ""]

                if (attr.indexOf("=") > -1) arr = attr.split("=")
                res.attributes[arr[0]] = arr[1]
                reg.lastIndex--
            } else if (result[2])
                res.attributes[result[2]] = result[3]
                    .trim()
                    .substring(1, result[3].length - 1)
        }
    }

    return {
        type,
        node: res,
        voidElement,
    }
}

export const stringToObj = (
    html: string,
    options: DiffDOMOptionsPartial = {
        valueDiffing: true,
        caseSensitive: false,
    },
) => {
    const result: nodeType[] = []
    let current: { type: string; node: nodeType; voidElement: boolean }
    let level = -1
    const arr: { type: string; node: nodeType; voidElement: boolean }[] = []
    let inComponent = false,
        insideSvg = false

    // handle text at top level
    if (html.indexOf("<") !== 0) {
        const end = html.indexOf("<")
        result.push({
            nodeName: "#text",
            data: end === -1 ? html : html.substring(0, end),
        })
    }

    html.replace(tagRE, (tag: string, index: number) => {
        if (inComponent) {
            if (tag !== `</${current.node.nodeName}>`) {
                return ""
            } else {
                inComponent = false
            }
        }
        const isOpen = tag.charAt(1) !== "/"
        const isComment = tag.startsWith("<!--")
        const start = index + tag.length
        const nextChar = html.charAt(start)

        if (isComment) {
            const comment = parseTag(tag, options.caseSensitive).node

            // if we're at root, push new base node
            if (level < 0) {
                result.push(comment)
                return ""
            }
            const parent = arr[level]
            if (parent && comment.nodeName) {
                if (!parent.node.childNodes) {
                    parent.node.childNodes = []
                }
                parent.node.childNodes.push(comment)
            }
            return ""
        }

        if (isOpen) {
            current = parseTag(tag, options.caseSensitive || insideSvg)
            if (current.node.nodeName === "svg") {
                insideSvg = true
            }
            level++
            if (
                !current.voidElement &&
                !inComponent &&
                nextChar &&
                nextChar !== "<"
            ) {
                if (!current.node.childNodes) {
                    current.node.childNodes = []
                }
                const data = unescape(
                    html.slice(start, html.indexOf("<", start)),
                )
                current.node.childNodes.push({
                    nodeName: "#text",
                    data,
                })
                if (
                    options.valueDiffing &&
                    current.node.nodeName === "TEXTAREA"
                ) {
                    current.node.value = data
                }
            }
            // if we're at root, push new base node
            if (level === 0 && current.node.nodeName) {
                result.push(current.node)
            }

            const parent = arr[level - 1]
            if (parent && current.node.nodeName) {
                if (!parent.node.childNodes) {
                    parent.node.childNodes = []
                }
                parent.node.childNodes.push(current.node)
            }
            arr[level] = current
        }
        if (!isOpen || current.voidElement) {
            if (
                level > -1 &&
                (current.voidElement ||
                    (options.caseSensitive &&
                        current.node.nodeName === tag.slice(2, -1)) ||
                    (!options.caseSensitive &&
                        current.node.nodeName.toUpperCase() ===
                            tag.slice(2, -1).toUpperCase()))
            ) {
                level--
                // move current up a level to match the end tag
                if (level > -1) {
                    if (current.node.nodeName === "svg") {
                        insideSvg = false
                    }
                    current = arr[level]
                }
            }
            if (!inComponent && nextChar !== "<" && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                const childNodes =
                    level === -1 ? result : arr[level].node.childNodes || []

                // calculate correct end of the data slice in case there's
                // no tag after the text node.
                const end = html.indexOf("<", start)
                let data = unescape(
                    html.slice(start, end === -1 ? undefined : end),
                )
                childNodes.push({
                    nodeName: "#text",
                    data,
                })
            }
        }
        return ""
    })
    return result[0]
}
