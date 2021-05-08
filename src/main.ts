import './style.css'
import { Deck } from './deck'

const app = document.querySelector<HTMLDivElement>('#app')!

const deck = new Deck();
deck.shuffle();
deck.print();

app.innerHTML = `
  <h1>Hello Vite!</h1>
  <p>
    ${deck.cards.map(c => `<span class="${c.isRed ? 'red' : 'black'}">${c.unicode}</span>`).join('\n')}
  </p>
`
