import { Round, Play, Player, Match } from './war'
import { Card } from './deck'
import * as d3 from 'd3'

export function aceTrace(rounds:Array<Round>, elem:SVGElement):void {
  const viz = d3.select(elem);

  const deckCardWidth = 3;
  const roundHeight = 15;
  const roundGap = 2;
  const faceupCardWidth = 20;

  // const reds = d3.quantize(d3.interpolateLab('#cc7050', '#c90000'), 14);
  // const blacks = d3.quantize(d3.interpolateLab('#3a6266', '#07090c'), 14);
  // const aceColor = '#f8ff21';

  const reds = d3.quantize(d3.interpolateLab('#d871ae', '#c60606'), 14);
  const blacks = d3.quantize(d3.interpolateLab('#b3c5c6', '#5c5e60'), 14);
  const aceColor = '#e8c638';

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

  const $players = $rounds
    .selectAll('.player')
    .data((d:Round) => roundByPlayers(d))
    .enter()
      .append('g')
      .attr('class', 'player')
      .attr('transform', (_:any, i:number) => `scale(${i === 0 ? '-1' : '1'} 1) translate(${i === 1 ? roundGap : 0} 0)`);

  // Each round has the following components:
  // 1. the deck of each player
  const $deck = $players
    .append('g')
    .attr('class', 'deck')

  $deck
    .selectAll('.deck-card')
    .data((d:any) => d.deck.map((card:Card) => ({ card, won: d.won })))
    .enter()
      .append('rect')
      .attr('class', 'deck-card')
      .attr('x', (_:any, i:number) => i * deckCardWidth)
      .attr('width', deckCardWidth)
      .attr('height', roundHeight)
      .attr('title', (d:any) => d.label)
      .style('fill', (d:any) => d.card.rank === 1 ? aceColor : d.won ? reds[d.card.rank] : blacks[d.card.rank]);

  // 2. all the plays
  const $plays = $players
    .selectAll('.plays')
    .data((d:any) => d.plays.map((play:Play) => ({ play, round: d })))
    .enter()
      .append('g')
      .attr('class', 'plays')
      .attr('transform', (d:any) => `translate(${d.play.offset * deckCardWidth + d.play.playIndex * roundGap + roundGap} 0)`)

  // Each match has the following components:

  // 1. the face down cards (in the event of a war)
  $plays
    .selectAll('.play-card')
    .data((d:any) => d.play.cards ? d.play.cards.map((card:Card) => ({ card, round: d })) : [])
    .enter()
      .append('rect')
      .attr('class', 'play-card')
      .attr('x', (d:any, i:number) => i * deckCardWidth + d.round.play.playIndex * (faceupCardWidth + deckCardWidth))
      .attr('width', deckCardWidth)
      .attr('height', roundHeight)
      .attr('title', (d:any) => d.card.label)
      .style('fill', (d:any) => d.card.rank === 1 ? aceColor : d.round.round.won ? reds[d.card.rank] : blacks[d.card.rank]);

  // 2. the face up card of each player
  $plays
    .selectAll('.faceup-card')
    .data((d:any) => [{ card: d.play.cards[d.play.cards.length - 1], round: d, position: d.play.cards.length + 1 }])
    .enter()
      .append('text')
      .attr('class', (d:any) => `faceup-card ${d.round.round.won ? 'winner' : 'loser'}`)
      .attr('x', (d:any) => (d.position * deckCardWidth + d.round.play.playIndex * (faceupCardWidth + deckCardWidth) + faceupCardWidth / 2) * (d.round.round.player.position === 0 ? -1 : 1))
      .attr('y', roundHeight / 2)
      .attr('transform', (d:any) => `scale(${d.round.round.player.position === 0 ? '-1' : '1'} 1)`)
      .text((d:any) => d.card.shortTextLabel);
}

// A round is organized as a set of matches, but we want to visualize
// things by player. To make things easier in d3, this transforms the set
// of matches into a set of players.
function roundByPlayers(round:Round):any {
  const players:Array<Player> = round.matches[0].plays.map(p => p.player);
  return players.map((p:Player) => {
    const lastPlay = round.lastMatch.forPlayer(p);
    return new PlayerRound(
      p,
      p === round.winner,
      lastPlay ? lastPlay.hand : [],
      round.matches.map((m:Match) => m.forPlayer(p))
    );
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

class PlayerRound {
  public player:Player;
  public won:boolean;
  public deck:Array<Card>;
  public plays:Array<any>;

  constructor(player:Player, won:boolean, deck:Array<Card>, plays:Array<Play|undefined>) {
    this.player = player;
    this.won = won;
    this.deck = deck;
    this.plays = this.reduce(plays);
  }

  reduce(plays:Array<Play|undefined>):Array<any> {
    let offset = this.deck.length;
    return plays.map((p:any, i:number) => {
      const pPrime = { ...p, offset, playIndex: i };
      offset += p ? p.cards.length : 0;
      return pPrime;
    });
  }
}
