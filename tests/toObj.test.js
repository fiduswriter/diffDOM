/**
 * @jest-environment jsdom
 */

import { nodeToObj } from "../dist/index"

const h1TextContent = "Section"

const htmlString = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Node To Obj Test</title>
  </head>

  <body>
    <div>
      <main>
        <h1>${h1TextContent}</h1>
        <h3>more stuff</h3>
      </main>
    </div>
  </body>
</html>
`

describe("parsing", () => {
    it("Can parse obj correctly", () => {
        const htmlDocument = new DOMParser().parseFromString(
            htmlString,
            "text/html",
        )

        const h1TextContentInParsedDocument =
            htmlDocument.body.childNodes[1].childNodes[1].childNodes[1]
                .textContent

        console.log(h1TextContentInParsedDocument)

        const documentObject = nodeToObj(htmlDocument.body)
        const h1Object =
            documentObject.childNodes[1].childNodes[1].childNodes[1]
                .childNodes[0]

        console.log(h1Object)

        expect(h1Object.data).toEqual(h1TextContent)
    })
})
