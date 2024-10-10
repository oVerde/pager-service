import { Target } from "../targets/Target";

export class EscalationLevel {
  levelNumber: number;
  targets: Target[];

  constructor(levelNumber: number, targets: Target[]) {
    this.levelNumber = levelNumber;
    this.targets = targets;
  }
}
