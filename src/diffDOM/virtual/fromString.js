// from html-parse-stringify (MIT)

const tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g
// re-used obj for quick lookups of components
const empty = Object.create ? Object.create(null) : {}
const attrRE = /([\w-:]+)|(['"])(.*?)\2/g

// create optimized lookup object for
// void elements as listed here:
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
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
    wbr: true
}

function parseTag(tag) {
    let i = 0
    let key
    const res = {
        nodeName: ''
    }

    tag.replace(attrRE, match => {
        if (i % 2) {
            key = match
        } else if (i === 0) {
                if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
                    res.voidElement = true
                }
                res.nodeName = match.toUpperCase()
            } else {
                if (!res.attributes) {
                    res.attributes = {}
                }
                res.attributes[key] = match.replace(/^['"]|['"]$/g, '')
            }
        i++
    })

    return res
}


function parse(
    html,
    options = {components: empty}
) {
    const result = []
    let current
    let level = -1
    const arr = []
    const byTag = {}
    let inComponent = false

    html.replace(tagRE, (tag, index) => {
        if (inComponent) {
            if (tag !== (`</${current.nodeName}>`)) {
                return
            } else {
                inComponent = false
            }
        }
        const isOpen = tag.charAt(1) !== '/'
        const start = index + tag.length
        const nextChar = html.charAt(start)
        let parent

        if (isOpen) {
            level++

            current = parseTag(tag)
            if (current.type === 'tag' && options.components[current.nodeName]) {
                current.type = 'component'
                inComponent = true
            }

            if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
                if (!current.childNodes) {
                    current.childNodes = []
                }
                current.childNodes.push({
                    nodeName: '#text',
                    data: html.slice(start, html.indexOf('<', start))
                })
            }

            byTag[current.tagName] = current

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current)
            }

            parent = arr[level - 1]

            if (parent) {
                if (!parent.childNodes) {
                    parent.childNodes = []
                }
                parent.childNodes.push(current)
            }

            arr[level] = current
        }

        if (!isOpen || current.voidElement) {
            level--
            if (!inComponent && nextChar !== '<' && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                parent = level === -1 ? result : arr[level].childNodes || []

                // calculate correct end of the data slice in case there's
                // no tag after the text node.
                const end = html.indexOf('<', start)
                const data = html.slice(start, end === -1 ? undefined : end)
                parent.push({
                    nodeName: '#text',
                    data
                })
            }
        }
    })

    return result[0]
}

function cleanObj(obj) {
    delete obj.voidElement
    if (obj.childNodes) {
        obj.childNodes.forEach(child => cleanObj(child))
    }
    return obj
}

export function stringToObj(string) {
   return cleanObj(parse(string))
}
