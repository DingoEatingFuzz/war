import { Deck, Card } from './deck';

// A play represent the cards a player played for a round.
// A standard play is one card.
// In the event of a tie, a war is started which is played with 4 cards.
// When a war results in a tie, an additional war is started
class Play {
  public player:Player;
  public cards:Array<Card>;
  constructor(player:Player, cards:Card | Array<Card>) {
    this.player = player;
    this.cards = cards instanceof Card ? [cards] : cards;
  }

  get activeCard():Card {
    return this.cards[this.cards.length - 1];
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
}

class Round {
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
}

class Player {
  position:number;
  hand:Array<Card>;

  constructor(position:number, hand:Array<Card> = []) {
    this.position = position;
    this.hand = hand;
  }
}

export default class War {
  public deck:Deck;
  public playerCount:number;
  private players:Array<Player>;

  private remainingPlayers:Array<Player> = [];

  constructor(deck:Deck, playerCount = 2) {
    this.deck = deck;
    this.playerCount = playerCount;
    this.players = new Array(this.playerCount)
      .fill(null)
      .map((_, idx) => new Player(idx));
  }

  play():Array<Round> {
    // A game is played over a series of rounds. It ends when only one player has cards
    const rounds:Array<Round> = [];

    this.remainingPlayers = this.players.slice();
    this.deck.shuffle();
    this.deal();

    while (this.playersRemain() && rounds.length < 1000) {
      rounds.push(this.playRound());
    }

    return rounds;
  }

  private playRound():Round {
    const round = new Round();

    // First, play a normal round
    const plays:Array<Play> = this.remainingPlayers.map(player => {
      const card:Card = player.hand.pop() as Card;
      return new Play(player, card);
    });

    const match = new Match(plays);
    round.matches.push(match);
    const survivors:Array<Player> = this.evaluate(match);

    if (survivors.length === 1) {
      // Declare winner
      round.winner = survivors[0];
      round.winner.hand.push(...round.cards);
      return round;
    }

    // TODO: Start a war
    round.winner = survivors[0];
    round.winner.hand.push(...round.cards);
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
