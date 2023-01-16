type textNodeType = {
    nodeName: "#text";
    data: string;
    childNodes?: never
}

type nodeType = {
    nodeName: string;
    attributes?: { [key: string]: string};
    childNodes?: (nodeType | textNodeType)[];
    data?: never;
}

export {
    nodeType,
    textNodeType
}
