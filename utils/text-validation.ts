export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();

  if (normalized1 === normalized2) return 1;

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLength;
}

export function isTolerантMatch(userAnswer: string, correctAnswer: string, toleranceLevel: number = 0.85): boolean {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  console.log('[Tolerant Match]', {
    userAnswer,
    correctAnswer,
    similarity,
    toleranceLevel,
    match: similarity >= toleranceLevel,
  });

  return similarity >= toleranceLevel;
}

export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?"'()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkDyslexiaFriendlyMatch(
  userAnswer: string,
  correctAnswer: string,
  options?: {
    allowCharacterSwaps?: boolean;
    allowSimilarChars?: boolean;
    toleranceLevel?: number;
  }
): { isMatch: boolean; similarity: number; errors: string[] } {
  const {
    allowCharacterSwaps = true,
    allowSimilarChars = true,
    toleranceLevel = 0.85,
  } = options || {};

  const normalized1 = normalizeForComparison(userAnswer);
  const normalized2 = normalizeForComparison(correctAnswer);

  const errors: string[] = [];

  if (normalized1 === normalized2) {
    return { isMatch: true, similarity: 1, errors: [] };
  }

  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');

  if (Math.abs(words1.length - words2.length) > words2.length * 0.2) {
    errors.push('Nombre de mots très différent');
  }

  const similarity = calculateSimilarity(normalized1, normalized2);

  if (allowCharacterSwaps && similarity >= toleranceLevel) {
    return { isMatch: true, similarity, errors };
  }

  if (allowSimilarChars) {
    let matchCount = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    for (let i = 0; i < minLength; i++) {
      const wordSimilarity = calculateSimilarity(words1[i], words2[i]);
      if (wordSimilarity >= 0.75) {
        matchCount++;
      }
    }

    const wordMatchRatio = matchCount / words2.length;
    if (wordMatchRatio >= toleranceLevel) {
      return { isMatch: true, similarity: wordMatchRatio, errors };
    }
  }

  return { isMatch: similarity >= toleranceLevel, similarity, errors };
}
