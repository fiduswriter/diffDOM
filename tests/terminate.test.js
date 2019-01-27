import {
    DiffDOM
} from "../src/index"


// Add all divs to be compared here two by two
const html = `
<div>
  <span class="subclass">
    <h2>Test</h2>
  </span>
</div>
<div>
  <span class="subclass">
    <h2>Different</h2>
    <p>Added!</p>
  </span>
</div>

<div>
  <h2>this is a paragraph \`ha\`&nbsp;</h2>
  <ul><li>some stuff</li></ul>
</div>
<div>
  <h2 class="foo">this is another <code>ha</code>&nbsp;</h2>
  <ul><li>some stuff</li></ul>
</div>

<div>
  <h2>this is a paragraph <code>ha</code>&nbsp;</h2>
  <h2>this is another\`h\`&nbsp;</h2>
  <ul><li>some stuff</li></ul>
</div>
<div>
  <h2>this is a paragraph <code>ha</code>&nbsp;</h2>
  <h2>this is another<code>h</code>&nbsp;</h2>
  <ul><li>some stuff</li></ul>
</div>

<div>
  <span>
    <h2>Different</h2>
    <p>Added!</p>
    <p>Woah!</p>
  </span>
</div>

<div>
  <span>
    <h2>Different</h2>
    <p>Added!</p>
    <p>Crazy!</p>
    <p>Another!</p>
  </span>
</div>
`
document.body.innerHTML = html

describe('terminate', () => {

    it('can diff and patch html that tended to create loops', () => {
        const dd = new DiffDOM({
                debug: true,
                diffcap: 500
            }),
            divs = document.querySelectorAll('div')

        for (let i = 0; i < divs.length; i = i + 2) {
            const diffs = dd.diff(divs[i], divs[i + 1])
            expect(diffs).not.toHaveLength(0)
            const t1 = divs[i].cloneNode(true)
            dd.apply(t1, diffs)
            expect(t1.isEqualNode(divs[i + 1]) || t1.innerHTML === divs[i + 1].innerHTML).toBe(true)
            dd.undo(t1, diffs)
            expect(t1.isEqualNode(divs[i]) || t1.innerHTML === divs[i].innerHTML).toBe(true)
        }
    })
})
