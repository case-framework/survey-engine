
/* TODO: export const pickRandomListItem = (items: Array<any>): any => {
  return items[Math.floor(Math.random() * items.length)];
}



export const printResponses = (responses: SurveySingleItemResponse[], prefix: string) => {
  responses.forEach((item => {
    console.log(prefix, item);
  }));
}
*/


export function structuredCloneMethod<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // Fallback to JSON method
  return JSON.parse(JSON.stringify(obj));
}