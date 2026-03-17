import { html } from 'lit-html'
import { definePage } from '../../../lib/Plugin.js'

export default definePage({
  mainEntity: 'about',
  body: () => html`<h1>About</h1>`,
})
