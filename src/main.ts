import './style.css'
import { Deck } from './deck'
import War, { Shuffles, Round } from './war'

import * as Plot from '@observablehq/plot'

const time = (label:string, fn:Function):any => {
  performance.mark(label + '-s');
  const ret = fn();
  performance.mark(label + '-e');
  performance.measure(label, label + '-s', label + '-e');
  return ret;
}

function serialize(rounds:Array<Round>):string {
  const obj = time('war-serialize', () => rounds.map(r => r.serialize()));
  return time('war-stringify', () => JSON.stringify(obj));
}

const app = document.querySelector<HTMLDivElement>('#app')!

const deck = new Deck();
deck.shuffle();

let game;
for (let i = 0; i < 100; i++) {
  const war = new War(deck, 2, Shuffles.FisherYates);
  game = war.play();
  const str = serialize(game);
  time('war-parse', () => JSON.parse(str));
}

// const gameLog = game && game.map(round => {
//   const match = round.matches[0];
//   const tie = match.plays[0].activeCard.equalTo(match.plays[1].activeCard);
//   const playStrs = match.plays.map(p => {
//     return `<span class="${p.player === round.winner ? 'winner' : ''}">
//       ${'|'.repeat(p.handSize)} <span class="${p.activeCard.isRed ? 'red' : 'black' }">${p.activeCard.unicode} ${p.activeCard.shortLabel}</span>
//     </span>`;
//   });
//   return `<li class="${tie ? 'tie' : ''}">${playStrs.join(' v. ')}</li>`;
// }).join('\n');
const gameLog = '';

app.innerHTML = `
  <main>
    <h1>100 games of war</h1>
    <div id="graphs"></div>
    <ol>
      ${gameLog}
    </ol>
  </main>
`

const perfData = performance.getEntriesByType('measure')
const playHistogram = Plot.plot({
  grid: true,
  facet: {
    data: perfData,
    y: 'name',
  },
  fy: {
    domain: ['war-play', 'war-serialize', 'war-stringify', 'war-parse'],
  },
  y: {
    type: 'sqrt',
    height: 100,
  },
  marks: [
    Plot.rectY(
      perfData,
      Plot.binX(
        { y: 'count' },
        { x: 'duration', fill: 'name', thresholds: 'freedman-diaconis' },
      )
    ),
    Plot.ruleY([0]),
  ]
});

const graphs = document.querySelector('#graphs');
if (graphs) {
  graphs.appendChild(playHistogram);
}
