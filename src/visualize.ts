import { Round } from './war'

export function asciiOrderedList(rounds:Array<Round>):string {
  return rounds.map(round => {
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
}
