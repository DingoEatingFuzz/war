export enum Suites {
  Spades,
  Hearts,
  Diamonds,
  Clubs,
}

export class Card {
  public suite:Suites;
  public rank:number;

  constructor(suite:Suites, rank:number) {
    this.suite = suite
    this.rank = rank
  }

  get id():number {
    return this.suite * 13 + this.rank;
  }

  get isRed():boolean {
    return this.suite === Suites.Hearts || this.suite === Suites.Diamonds;
  }

  get isBlack():boolean {
    return this.suite === Suites.Spades || this.suite === Suites.Clubs;
  }

  get rankLabel():string {
    if (this.rank === 1) return 'A';
    if (this.rank > 10) return 'JQK'[this.rank - 11];
    return this.rank.toString();
  }

  get suiteLabel():string {
    return ['Spades', 'Hearts', 'Diamonds', 'Clubs'][this.suite];
  }

  get suiteEmoji():string {
    return ['♠️', '♥️', '♦️', '♣️'][this.suite];
  }

  get label():string {
    return `${this.rankLabel} of ${this.suiteLabel}`;
  }

  get shortLabel():string {
    return `${this.suiteEmoji} ${this.rankLabel}`;
  }

  get unicode():string {
    // All playing cards are represented in unicode with the following scheme:
    // a: base number
    // b: suite digit, starting at A and ordered like the suites enum
    // c: rank digit, starting at 1 and ordered like this class (Ace to King)
    // NOTE: The 'knight' rank comes between Jack and Queen.
    //
    //                    a  bc
    const base:number = 0x1F000;
    let pt:number = base + (this.suite + 10) * 16 + this.rank;
    if (this.rank === 12 || this.rank == 13) pt++;
    return String.fromCodePoint(pt);
  }

  public betterThan(card:Card):boolean {
    // Ace cards win
    if (this.rank === 1) return true;
    if (card.rank === 1) return false;

    // Otherwise, it's numeric
    return card.rank < this.rank;
  }

  public equalTo(card:Card):boolean {
    return this.rank === card.rank;
  }
}

export class Deck {
  public cards:Array<Card>;

  constructor() {
    this.cards = new Array(52).fill(null).map((_, idx) => {
      const suite = Math.floor(idx / 13);
      const rank = idx % 13 + 1;
      return new Card(suite, rank);
    });
  }

  shuffle():void {
    const len = this.cards.length - 2;
    for (let i = 0; i < len; i++) {
      const idx = Math.round(Math.random() * (len - i) + i);

      const dest = this.cards[idx];
      this.cards[idx] = this.cards[i];
      this.cards[i] = dest;
    }
  }

  print():void {
    this.cards.forEach(card => console.log(card.shortLabel));
    console.log(this.cards.map(c => c.unicode).join(' '));
  }

  get str():string {
    return this.cards.map(c => c.unicode).join(' ');
  }
}
