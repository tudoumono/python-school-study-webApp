const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];

export function calculateLevel(totalPoints: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getPointsToNextLevel(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[currentLevel] - totalPoints;
}

export function getLevelProgress(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 1;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  return (totalPoints - currentThreshold) / (nextThreshold - currentThreshold);
}
