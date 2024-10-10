import { EscalationLevel } from "./EscalationLevel";

export class EscalationPolicy {
  levels: EscalationLevel[];

  constructor(levels: EscalationLevel[]) {
    this.levels = levels;
  }

  getLevel(levelNumber: number): EscalationLevel | undefined {
    return this.levels[levelNumber];
  }

  isLastLevel(levelNumber: number): boolean {
    return levelNumber >= this.levels.length - 1;
  }
}
