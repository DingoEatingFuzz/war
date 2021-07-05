import './style.css'
import { Deck } from './deck'
import War, { Shuffles, Round } from './war'
import { stats, zip } from './utils'
import { asciiOrderedList, aceTrace } from './visualize';

import * as Plot from '@observablehq/plot'

enum Mode {
  Stats,
  Viz
}

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

const app = document.querySelector<HTMLDivElement>('#app');

const mode = Mode.Viz;

const games:Array<Array<Round>> = [];
let game:Array<Round> = [];

const deck = new Deck();
deck.shuffle();

if (mode === Mode.Stats) {
  for (let i = 0; i < 100; i++) {
    const war = new War(deck, 2, Shuffles.FisherYates);
    games.push(war.play());
    const str = serialize(games[0]);
    time('war-parse', () => JSON.parse(str));
  }
} else if (mode === Mode.Viz) {
  const war = new War(deck, 2, Shuffles.FisherYates);
  game = war.play();
}

const statsPage = `
  <main>
    <h1>100 games of war</h1>

    <p>The game of war can take any number of rounds. In fact, without any entropy while collecting cards,
    the game can have cycles resulting in an infinite number of rounds.</p>

    <p>This implementation uses a Fisher-Yates shuffle on the cards collected from a "war" event which breaks
    cycles, but can still result in incredibly long games. The max number of rounds before calling it a draw is
    10,000.</p>

    <p>This naturally has an impact on how long the simulation takes to run.</p>

    <figure id="timeByMetric"></figure>

    <h2>Computation time as a function of number of rounds</h2>

    <p>All of our graphs skew left. This is because typically games of War are finished within 500 rounds. However,
    the extreme cases can go on up to 20x that number, which results in more computation of the simulation and more
    data that needs to be serialized and deserialized if we want to save it and use it elsewhere.</p>

    <figure id="timeByRounds"></figure>
  </main>
`

const vizPage = `<main><div id='warViz'>${asciiOrderedList(game)}</div></main>`;
const vizPage2 = `<main><svg id='warViz'></svg></main>`;

if (app) {
  app.innerHTML = mode === Mode.Stats ? statsPage : vizPage2
}

if (mode === Mode.Stats) {
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
    },
    marks: [
      Plot.rectY(
        perfData,
        Plot.binX(
          { y: 'count' },
          { x: 'duration', fill: 'name', thresholds: 75 },
        )
      ),
      Plot.ruleY([0]),
    ]
  });

  const plotData = zip({
    game: games.map(g => stats(g)),
    play: performance.getEntriesByName('war-play'),
    serialize: performance.getEntriesByName('war-serialize'),
    stringify: performance.getEntriesByName('war-stringify'),
    parse: performance.getEntriesByName('war-parse'),
  })

  const scatterPoints = expandPlotData(plotData);

  const playPlot = Plot.plot({
    marks: [
      Plot.dot(
        scatterPoints,
        { x: 'rounds', y: 'duration', fill: 'series', fillOpacity: 0.7 }
      )
    ]
  });

  const byMetric = document.querySelector('#timeByMetric');
  if (byMetric) byMetric.appendChild(playHistogram);

  const timeByRounds = document.querySelector('#timeByRounds');
  if (timeByRounds) timeByRounds.appendChild(playPlot);

  // Turn the table of objects into a single set of data points with a series label
  function expandPlotData(data:Array<any>) {
    const points:Array<any> = [];
    data.forEach(d => {
      points.push({ rounds: d.game.count, duration: d.play.duration, series: 'war-play' });
      points.push({ rounds: d.game.count, duration: d.serialize.duration, series: 'war-serialize' });
      points.push({ rounds: d.game.count, duration: d.stringify.duration, series: 'war-stringify' });
      points.push({ rounds: d.game.count, duration: d.parse.duration, series: 'war-parse' });
    });

    return points;
  }
}

const warViz:SVGElement|null = document.querySelector('#warViz');
if (warViz) aceTrace(game, warViz);
