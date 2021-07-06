import { Round, Play, Player, Match } from './war'
import { Card } from './deck'
import * as d3 from 'd3'

export function aceTrace(rounds:Array<Round>, elem:SVGElement):void {
  const viz = d3.select(elem);

  rounds.forEach(r => {
    if (r.matches.length > 1) console.log(roundByPlayers(r));
  });

  const deckCardWidth = 3;
  const roundHeight = 15;
  const roundGap = 2;

  const reds = d3.quantize(d3.interpolateLab('#cc7050', '#c90000'), 14);
  const blacks = d3.quantize(d3.interpolateLab('#3a6266', '#07090c'), 14);
  const aceColor = '#f8ff21';

  viz
    .attr('class', 'war-viz')
    .attr('height', rounds.length * (roundHeight + roundGap))
    .attr('width', 1);

  // Each round gets a row
  const $rounds = viz.selectAll('.round')
    .data(rounds)
    .enter()
      .append('g')
      .attr('class', 'round')
      .attr('transform', (_:Round, i:number) => `translate(0, ${i * (roundHeight + roundGap)})`);

  const $decks = $rounds
    .selectAll('.deck')
    .data((d:Round) => d.lastMatch.plays.map((play:Play) => ({ play, won: d.winner === play.player })))
    .enter()
      .append('g')
      .attr('class', 'deck')
      .attr('transform', (_:any, i:number) => `scale(${i === 0 ? '-1' : '1'} 1) translate(${i === 1 ? roundGap : 0} 0)`);

  $decks
    .selectAll('.deck-card')
    .data((d:any) => (d.play ? d.play.hand : []).map((card:Card) => ({ card, won: d.won })))
    .enter()
      .append('rect')
      .attr('class', 'deck-card')
      .attr('x', (_:any, i:number) => i * deckCardWidth)
      .attr('width', deckCardWidth)
      .attr('height', roundHeight)
      .style('fill', (d:any) => d.card.rank === 1 ? aceColor : d.won ? reds[d.card.rank] : blacks[d.card.rank]);

  // Each round has the following components:
  // 1. the deck of each player
  // 2. all the matches

  // Each match has the following components:
  // 1. the face up card of each player
  // 2. the face down cards (in the event of a war)
}

function normalizeDecks(plays:Array<Play>): Array<Play|null> {
  console.log(plays.map(p => p.player.position));
  const highPlayer:number = plays.reduce((high:number, p:Play) => Math.max(high, p.player.position), 0);
  return new Array(highPlayer).fill(null).map((_:any, i:number) => {
    return plays.find(p => p.player.position === i) || null;
  });
}

// A round is organized as a set of matches, but we want to visualize
// things by player. To make things easier in d3, this transforms the set
// of matches into a set of players.
function roundByPlayers(round:Round):any {
  const players:Array<Player> = round.matches[0].plays.map(p => p.player);
  return players.map((p:Player) => {
    const lastPlay = round.lastMatch.forPlayer(p);
    return {
      player: p,
      won: p === round.winner,
      deck: lastPlay ? lastPlay.hand : [],
      matches: round.matches.map((m:Match) => m.forPlayer(p)),
    }
  });
}

export function asciiOrderedList(rounds:Array<Round>):string {
  const lis = rounds.map(round => {
    const match = round.matches[0]
    const tie = match.plays[0].activeCard.equalTo(match.plays[1].activeCard)
    const playStrs = match.plays.map(p => {
      return `<span class="${p.player === round.winner ? 'winner' : ''}">
        ${'|'.repeat(p.handSize)}
        <span class="${p.activeCard.isRed ? 'red' : 'black' }">
          ${p.activeCard.unicode} ${p.activeCard.shortLabel}
        </span>
      </span>`
    })
    return `<li class="${tie ? 'tie' : ''}">${playStrs.join(' v. ')}</li>`
  }).join('\n')
  return `<ol>${lis}</ol>`;
}
