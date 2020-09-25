// from html-parse-stringify (MIT)

const tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g
// re-used obj for quick lookups of components
const empty = Object.create ? Object.create(null) : {}
const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g


function unescape(string) {
    return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
.replace(/&amp;/g, '&')
}

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

const endTagObmissions = {
    li: ['li'],
    p: ['address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'],
    dt: ['dt', 'dd'],
    dd: ['dt', 'dd'],
    tr: ['tr'],
    td: ['td', 'th'],
    th: ['td', 'th'],
    tfoot: ['tbody'],
    tbody: ['tbody', 'tfoot'],
    thead: ['tbody', 'tfoot'],
    option: ['option', 'optgroup'],
    optgroup: ['optgroup'],
    rb: ['rb', 'rt', 'rtc', 'rp'],
    rt: ['rb', 'rt', 'rtc', 'rp'],
    rtc: ['rb', 'rtc', 'rp'],
    rp: ['rb', 'rt', 'rtc', 'rp']
}


function parseTag(tag) {
    const res = {
        nodeName: '',
        attributes: {}
    }

    let tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/)
    if (tagMatch) {
        res.nodeName = tagMatch[1].toUpperCase()
        if (lookup[tagMatch[1].toLowerCase()] || tag.charAt(tag.length - 2) === '/') {
            res.voidElement = true
        }

        // handle comment tag
        if (res.nodeName.startsWith('!--')) {
            const endIndex = tag.indexOf('-->')
            return {
                type: 'comment',
                data: endIndex !== -1 ? tag.slice(4, endIndex) : '',
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
            } else if (result[2]) res.attributes[result[2]] = result[3].trim().substring(1, result[3].length - 1)
        }
    }

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
        const isComment = tag.startsWith('<!--')
        const start = index + tag.length
        const nextChar = html.charAt(start)
        let parent

        if (isComment) {
            const comment = parseTag(tag)

            // if we're at root, push new base node
            if (level < 0) {
                result.push(comment)
                return result
            }
            parent = arr[level]
            if (parent) {
                if (!parent.childNodes) {
                    parent.childNodes = []
                }
                parent.childNodes.push(comment)
            }

            return result
        }

        if (isOpen) {
            const previous = current
            current = parseTag(tag)
            if (!previous || !(endTagObmissions[previous.nodeName.toLowerCase()]) || !(endTagObmissions[previous.nodeName.toLowerCase()].includes(current.nodeName.toLowerCase()))) {
            level++
            }
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
                    data: unescape(html.slice(start, html.indexOf('<', start)))
                })
            }

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

        if (!isOpen) {
            current = undefined
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
                const data = unescape(html.slice(start, end === -1 ? undefined : end))
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
