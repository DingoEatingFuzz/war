import './style.css'
import { Deck } from './deck'
import War from './war'

const app = document.querySelector<HTMLDivElement>('#app')!

const deck = new Deck();
deck.shuffle();
deck.print();

const war = new War(deck, 2);
console.log(war.play());

app.innerHTML = `
  <h1>Hello Vite!</h1>
  <p>
    ${deck.cards.map(c => `<span class="${c.isRed ? 'red' : 'black'}">${c.unicode}</span>`).join('\n')}
  </p>
`
