import {
    DiffDOM
} from "../src/index"


// Add all divs to be compared here two by two
const html = `
<form>
  <textarea id="e1">Some text</textarea>
  <textarea id="e2"></textarea>

  <input id="e3" type="text" value="textinput">
  <input id="e4" type="text">

  <input id="e5" type="radio" name="radioset1">
  <input id="e6" type="radio" name="radioset1" checked="checked">

  <input id="e7" type="radio" name="radioset2">
  <input id="e8" type="radio" name="radioset2">

  <input id="e9" type="checkbox" name="checkboxset1">
  <input id="e10" type="checkbox" name="checkboxset1" checked="checked">

  <input id="e11" type="checkbox" name="checkboxset2">
  <input id="e12" type="checkbox" name="checkboxset2">

  <select>
      <option id="e13">Option 1</option>
      <option id="e14" selected="selected">Option 2</option>
  </select>

  <select>
      <option id="e15">Option 3</option>
      <option id="e16">Option 4</option>
  </select>

</form>
`
document.body.innerHTML = html
const dd = new DiffDOM({
    debug: true,
    diffcap: 500
})

describe('form', () => {

    it('can diff textareas', () => {
        const first = document.getElementById('e1')
        const second = document.getElementById('e2')

        first.removeAttribute('id')
        second.removeAttribute('id')

        const diff1 = dd.diff(first, second)
        expect(diff1).toHaveLength(1)

        first.value = 'Some changed text'
        const diff2 = dd.diff(first, second)
        expect(diff2).toHaveLength(1)

        const third = second.cloneNode(true)
        const diff3 = dd.diff(second, third)
        expect(diff3).toHaveLength(0)

        second.value = 'Some text'
        const diff4 = dd.diff(second, third)
        expect(diff4).toHaveLength(1)

        const diff5 = dd.diff(first, second)
        expect(diff5).toHaveLength(1)

        second.innerText = 'Some text'
        const diff6 = dd.diff(first, second)
        dd.apply(first, diff6)
        const diff7 = dd.diff(first, third)
        dd.apply(first, diff7)
        expect(first.value).toBe(third.value)

    })

    it('can diff input type = text', () => {
        const first = document.getElementById('e3')
        const second = document.getElementById('e4')
        first.removeAttribute('id')
        second.removeAttribute('id')

        const diff1 = dd.diff(first, second)
        expect(diff1).toHaveLength(1)

        first.value = 'textinput changed'
        const diff2 = dd.diff(first, second)
        expect(diff2).toHaveLength(1)

        second.value = 'new textinput'
        const diff3 = dd.diff(first, second)
        expect(diff3).toHaveLength(2)

        first.value = 'textinput'
        second.value = 'textinput'
        const diff4 = dd.diff(first, second)
        expect(diff4).toHaveLength(2)
    })

    it('can diff input type = radio', () => {
        const first = document.getElementById('e5')
        const second = document.getElementById('e6')
        const third = document.getElementById('e7')
        const fourth = document.getElementById('e8')
        first.removeAttribute('id')
        second.removeAttribute('id')
        third.removeAttribute('id')
        fourth.removeAttribute('id')

        const diff1 = dd.diff(first, second)
        expect(diff1).toHaveLength(1)

        first.checked = true
        const diff2 = dd.diff(first, second)
        expect(diff2).toHaveLength(2)

        const diff3 = dd.diff(first, third)
        expect(diff3).toHaveLength(2)

        third.checked = true
        const diff4 = dd.diff(first, third)
        expect(diff4).toHaveLength(1)

        const diff5 = dd.diff(second, fourth)
        expect(diff5).toHaveLength(2)

    })

    it('can diff input type = checkbox', () => {
        const first = document.getElementById('e9')
        const second = document.getElementById('e10')
        const third = document.getElementById('e11')
        const fourth = document.getElementById('e12')
        first.removeAttribute('id')
        second.removeAttribute('id')
        third.removeAttribute('id')
        fourth.removeAttribute('id')

        const diff1 = dd.diff(first, second)
        expect(diff1).toHaveLength(1)

        first.checked = true
        const diff2 = dd.diff(first, second)
        expect(diff2).toHaveLength(1)

        const diff3 = dd.diff(first, third)
        expect(diff3).toHaveLength(2)

        third.checked = true
        const diff4 = dd.diff(first, third)
        expect(diff4).toHaveLength(1)

        const diff5 = dd.diff(second, fourth)
        expect(diff5).toHaveLength(2)
    })

    it('can diff option', () => {
        const first = document.getElementById('e13')
        const second = document.getElementById('e14')
        const third = document.getElementById('e15')
        const fourth = document.getElementById('e16')
        first.removeAttribute('id')
        second.removeAttribute('id')
        third.removeAttribute('id')
        fourth.removeAttribute('id')

        const diff1 = dd.diff(first, second)
        expect(diff1).toHaveLength(2)

        first.selected = true
        const diff2 = dd.diff(first, second)
        expect(diff2).toHaveLength(3)

        const diff3 = dd.diff(first, third)
        expect(diff3).toHaveLength(1)

        fourth.selected = true // makes selection disappear from three
        const diff4 = dd.diff(first, third)
        expect(diff4).toHaveLength(2)

        const diff5 = dd.diff(second, fourth)
        expect(diff5).toHaveLength(3)

    })

})
