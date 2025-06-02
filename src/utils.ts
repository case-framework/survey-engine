import { SurveyItem, isSurveyGroupItem, SurveyGroupItem, SurveySingleItem, SurveySingleItemResponse } from "./data_types";

export const pickRandomListItem = (items: Array<any>): any => {
  return items[Math.floor(Math.random() * items.length)];
}

export const removeItemByKey = (items: Array<any>, key: string): Array<any> => {
  return items.filter(item => item.key !== key);
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
}
