export interface SubmissionResult {
  isCorrect: boolean;
  pointsEarned: number;
  incorrectPositions: number[];
  message: string;
}
