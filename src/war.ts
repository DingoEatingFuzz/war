import { Deck, Card } from './deck';

// A play represent the cards a player played for a round.
// A standard play is one card.
// In the event of a tie, a war is started which is played with 4 cards.
// When a war results in a tie, an additional war is started
class Play {
  public player:Player;
  public cards:Array<Card>;

  public hand:Array<Card>;
  public handSize:number;


  constructor(player:Player, cards:Card | Array<Card>) {
    this.player = player;
    this.cards = cards instanceof Card ? [cards] : cards;

    this.hand = this.player.hand.slice();
    this.handSize = this.hand.length;
  }

  get activeCard():Card {
    return this.cards[this.cards.length - 1];
  }

  serialize():any {
    return {
      player: this.player.position,
      handSize: this.handSize,
      hand: this.hand.map(c => c.serialize()),
      cards: this.cards.map(c => c.serialize())
    }
  }
}

class Match {
  public plays:Array<Play>;
  constructor(plays:Array<Play>) {
    this.plays = plays;
  }

  get winners():Array<Play> {
    let winners:Array<Play> = [];
    this.plays.forEach(play => {
      if (!winners.length || play.activeCard.betterThan(winners[0].activeCard)) {
        winners = [play];
      } else if (play.activeCard.equalTo(winners[0].activeCard)) {
        winners.push(play);
      }
    });

    return winners;
  }

  serialize():any {
    return {
      plays: this.plays.map(p => p.serialize()),
    }
  }
}

export class Round {
  public winner:Player | null = null;
  public matches:Array<Match> = [];

  get cards():Array<Card> {
    const cards:Array<Card> = [];
    this.matches.forEach(match => {
      match.plays.forEach(play => {
        cards.push(...play.cards);
      });
    });
    return cards;
  }

  serialize():any {
    return {
      winner: this.winner && this.winner.position,
      matches: this.matches.map(m => m.serialize()),
    }
  }
}

class Player {
  position:number;
  hand:Array<Card>;

  constructor(position:number, hand:Array<Card> = []) {
    this.position = position;
    this.hand = hand;
  }

  public win(cards:Array<Card>) {
    this.hand.unshift(...cards);
  }

  public deal():Card {
    if (!this.hand.length) throw new Error('Cannot deal with an empty hand');
    return this.hand.pop() as Card;
  }
}

export class Shuffles {
  static None(list:Array<any>):Array<any> {
    return list.slice();
  }

  static FisherYates(list:Array<any>):Array<any> {
    const _list = list.slice();
    let len = _list.length;

    while (len) {
      len--;
      const idx = Math.floor(Math.random() * len);

      const dest = _list[len];
      _list[len] = _list[idx];
      _list[idx] = dest;
    }

    return _list;
  }

  static Smoosh(list:Array<any>):Array<any> {
    return list.slice().sort(() => Math.random() * 2 - 1);
  }
}

export default class War {
  public deck:Deck;
  public playerCount:number;
  private winShuffle:Function;
  private players:Array<Player>;

  private remainingPlayers:Array<Player> = [];

  constructor(deck:Deck, playerCount = 2, winShuffle = Shuffles.None) {
    this.deck = deck;
    this.playerCount = playerCount;
    this.winShuffle = winShuffle;
    this.players = new Array(this.playerCount)
      .fill(null)
      .map((_, idx) => new Player(idx));
  }

  play():Array<Round> {
    performance.mark('war-play-start');
    // A game is played over a series of rounds. It ends when only one player has cards
    const rounds:Array<Round> = [];

    this.remainingPlayers = this.players.slice();
    this.deck.shuffle();
    this.deal();

    while (this.playersRemain() && rounds.length < 10000) {
      rounds.push(this.playRound());
    }

    performance.mark('war-play-end');
    performance.measure('war-play', 'war-play-start', 'war-play-end');
    return rounds;
  }

  private playRound():Round {
    const round = new Round();

    // First, play a normal round
    const plays:Array<Play> = this.remainingPlayers.map(player => {
      const card:Card = player.deal() as Card;
      return new Play(player, card);
    });

    const match = new Match(plays);
    round.matches.push(match);
    let survivors:Array<Player> = this.evaluate(match);

    if (survivors.length === 1) {
      // Declare winner
      round.winner = survivors[0];
      round.winner.win(this.winShuffle(round.cards));
      return round;
    }

    while (!round.winner) {
      const plays:Array<Play> = survivors.filter(s => s.hand.length).map(player => {
        const cards:Array<Card> = [];

        // When playing a war, you play 3 face down cards and 1 face up card, unless
        // you don't have enough cards, in which case you play as many as you can.
        while (cards.length < 4 && player.hand.length) {
          cards.push(player.deal());
        }
        return new Play(player, cards);
      });

      const match = new Match(plays);
      round.matches.push(match);
      survivors = this.evaluate(match);
      if (survivors.length === 1) {
        round.winner = survivors[0];
      }
    }

    round.winner.win(this.winShuffle(round.cards));
    return round;
  }

  private evaluate(match:Match):Array<Player> {
    return match.winners.map(winner => winner.player);
  }

  private playersRemain():boolean {
    return this.players.filter(p => p.hand.length > 0).length > 1;
  }

  private deal():void {
    this.deck.cards.forEach((card, idx) => {
      this.players[idx % this.players.length].hand.push(card);
    });
  }
}
