
/* TODO: export const pickRandomListItem = (items: Array<any>): any => {
  return items[Math.floor(Math.random() * items.length)];
}



export const printResponses = (responses: SurveySingleItemResponse[], prefix: string) => {
  responses.forEach((item => {
    console.log(prefix, item);
  }));
}


export const flattenSurveyItemTree = (itemTree: SurveyGroupItem): SurveySingleItem[] => {
  const flatTree = new Array<SurveySingleItem>();

  itemTree.items.forEach(item => {
    if (isSurveyGroupItem(item)) {
      flatTree.push(...flattenSurveyItemTree(item));
    } else {
      if (!item.type && !item.components) {
        console.debug('Item without type or components - ignored: ' + JSON.stringify(item));
        return;
      }
      flatTree.push({ ...item });
    }
  });
  return flatTree;
} */

export function structuredCloneMethod<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // Fallback to JSON method
  return JSON.parse(JSON.stringify(obj));
}