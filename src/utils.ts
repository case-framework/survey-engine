/* TODO: export const pickRandomListItem = (items: Array<any>): any => {
  return items[Math.floor(Math.random() * items.length)];
}



export const printResponses = (responses: SurveySingleItemResponse[], prefix: string) => {
  responses.forEach((item => {
    console.log(prefix, item);
  }));
}
*/

/**
 * Shuffles an array of indices using the Fisher-Yates shuffle algorithm
 * @param length - The length of the array to create indices for
 * @returns A shuffled array of indices from 0 to length-1
 */
export function shuffleIndices(length: number): number[] {
  const shuffledIndices = Array.from({ length }, (_, i) => i);

  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }

  return shuffledIndices;
}

export function structuredCloneMethod<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // Fallback to JSON method
  return JSON.parse(JSON.stringify(obj));
}
