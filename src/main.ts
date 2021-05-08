import './style.css'
import { Deck } from './deck'
import War from './war'

const app = document.querySelector<HTMLDivElement>('#app')!

const deck = new Deck();
deck.print();
deck.shuffle();

const war = new War(deck, 2);
const game = war.play();
console.log(game);

const gameLog = game.map(round => {
  const match = round.matches[0];
  const tie = match.plays[0].activeCard.equalTo(match.plays[1].activeCard);
  const playStrs = match.plays.map(p => {
    return `<span class="${p.player === round.winner ? 'winner' : ''}">
      ${'|'.repeat(p.handSize)} <span class="${p.activeCard.isRed ? 'red' : 'black' }">${p.activeCard.unicode} ${p.activeCard.shortLabel}</span>
    </span>`;
  });
  return `<li class="${tie ? 'tie' : ''}">${playStrs.join(' v. ')}</li>`;
}).join('\n');

app.innerHTML = `
  <main>
    <ol>
      ${gameLog}
    </ol>
  </main>
`
