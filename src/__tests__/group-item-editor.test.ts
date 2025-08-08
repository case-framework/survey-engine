import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { GroupItemEditor } from '../survey-editor/survey-item-editors';
import { GroupItem, SurveyItemType, SingleChoiceQuestionItem } from '../survey/items';
import { SurveyItemTranslations } from '../survey/utils';

describe('GroupItemEditor', () => {
  let survey: Survey;
  let editor: SurveyEditor;
  let groupEditor: GroupItemEditor;
  let rootGroupKey: string;

  beforeEach(() => {
    // Create a simple survey with a root group and some child items
    const rootGroup = new GroupItem('root');
    rootGroup.items = ['root.item1', 'root.item2', 'root.item3'];

    const item1 = new SingleChoiceQuestionItem('root.item1');
    const item2 = new SingleChoiceQuestionItem('root.item2');
    const item3 = new SingleChoiceQuestionItem('root.item3');

    survey = new Survey('root');
    survey.surveyItems = {
      'root': rootGroup,
      'root.item1': item1,
      'root.item2': item2,
      'root.item3': item3
    };

    editor = new SurveyEditor(survey);
    rootGroupKey = 'root';
    groupEditor = new GroupItemEditor(editor, rootGroupKey);
  });

  describe('constructor', () => {
    it('should create a GroupItemEditor for a valid group item', () => {
      expect(groupEditor).toBeInstanceOf(GroupItemEditor);
      expect(groupEditor.childItemKeys).toEqual(['root.item1', 'root.item2', 'root.item3']);
    });

    it('should throw error for non-group item', () => {
      expect(() => {
        new GroupItemEditor(editor, 'root.item1');
      }).toThrow('Item root.item1 is not a group');
    });

    it('should throw error for non-existent item', () => {
      expect(() => {
        new GroupItemEditor(editor, 'nonexistent');
      }).toThrow('Item nonexistent not found in survey');
    });
  });

  describe('childItemKeys and childItems', () => {
    it('should return correct child item keys', () => {
      expect(groupEditor.childItemKeys).toEqual(['root.item1', 'root.item2', 'root.item3']);
    });

    it('should return correct child items', () => {
      const childItems = groupEditor.childItems;
      expect(childItems).toHaveLength(3);
      expect(childItems[0].key.fullKey).toBe('root.item1');
      expect(childItems[1].key.fullKey).toBe('root.item2');
      expect(childItems[2].key.fullKey).toBe('root.item3');
    });

    it('should handle empty group', () => {
      const emptyGroup = new GroupItem('empty');
      survey.surveyItems['empty'] = emptyGroup;
      const emptyGroupEditor = new GroupItemEditor(editor, 'empty');

      expect(emptyGroupEditor.childItemKeys).toEqual([]);
      expect(emptyGroupEditor.childItems).toEqual([]);
    });
  });

  describe('updateItemOrdering', () => {
    it('should reorder items correctly', () => {
      const newOrder = ['root.item3', 'root.item1', 'root.item2'];
      groupEditor.updateItemOrdering(newOrder);

      expect(groupEditor.childItemKeys).toEqual(newOrder);
    });

    it('should throw error for invalid new order', () => {
      expect(() => {
        groupEditor.updateItemOrdering(['root.item1', 'root.item2']); // Missing item3
      }).toThrow('New order must contain exactly the same items as current children');

      expect(() => {
        groupEditor.updateItemOrdering(['root.item1', 'root.item2', 'root.nonexistent']);
      }).toThrow('New order must contain exactly the same items as current children');
    });
  });

  describe('swapItemsByIndex', () => {
    it('should swap items at given indices', () => {
      groupEditor.swapItemsByIndex(0, 2);
      expect(groupEditor.childItemKeys).toEqual(['root.item3', 'root.item2', 'root.item1']);
    });

    it('should handle same index (no operation)', () => {
      const originalOrder = [...groupEditor.childItemKeys];
      groupEditor.swapItemsByIndex(1, 1);
      expect(groupEditor.childItemKeys).toEqual(originalOrder);
    });

    it('should throw error for out of bounds indices', () => {
      expect(() => {
        groupEditor.swapItemsByIndex(-1, 1);
      }).toThrow('Index out of bounds');

      expect(() => {
        groupEditor.swapItemsByIndex(0, 5);
      }).toThrow('Index out of bounds');
    });
  });

  describe('swapItemsByKey', () => {
    it('should swap items by their keys', () => {
      groupEditor.swapItemsByKey('root.item1', 'root.item3');
      expect(groupEditor.childItemKeys).toEqual(['root.item3', 'root.item2', 'root.item1']);
    });

    it('should throw error for non-existent keys', () => {
      expect(() => {
        groupEditor.swapItemsByKey('root.item1', 'root.nonexistent');
      }).toThrow("Item 'root.nonexistent' not found in group 'root'");
    });
  });

  describe('moveItem', () => {
    it('should move item from one position to another', () => {
      groupEditor.moveItem(0, 2); // Move first item to last position
      expect(groupEditor.childItemKeys).toEqual(['root.item2', 'root.item3', 'root.item1']);
    });

    it('should move item backwards', () => {
      groupEditor.moveItem(2, 0); // Move last item to first position
      expect(groupEditor.childItemKeys).toEqual(['root.item3', 'root.item1', 'root.item2']);
    });

    it('should handle same position (no operation)', () => {
      const originalOrder = [...groupEditor.childItemKeys];
      groupEditor.moveItem(1, 1);
      expect(groupEditor.childItemKeys).toEqual(originalOrder);
    });
  });

  describe('moveItemByKey', () => {
    it('should move item by key to specified position', () => {
      groupEditor.moveItemByKey('root.item1', 2);
      expect(groupEditor.childItemKeys).toEqual(['root.item2', 'root.item3', 'root.item1']);
    });

    it('should throw error for non-existent key', () => {
      expect(() => {
        groupEditor.moveItemByKey('root.nonexistent', 1);
      }).toThrow("Item 'root.nonexistent' not found in group 'root'");
    });
  });

  describe('utility methods', () => {
    it('should get item index correctly', () => {
      expect(groupEditor.getItemIndex('root.item1')).toBe(0);
      expect(groupEditor.getItemIndex('root.item2')).toBe(1);
      expect(groupEditor.getItemIndex('root.item3')).toBe(2);
      expect(groupEditor.getItemIndex('root.nonexistent')).toBe(-1);
    });

    it('should check if item is child correctly', () => {
      expect(groupEditor.hasChildItem('root.item1')).toBe(true);
      expect(groupEditor.hasChildItem('root.item2')).toBe(true);
      expect(groupEditor.hasChildItem('root.nonexistent')).toBe(false);
    });
  });

  describe('shuffleItems', () => {
    it('should set and get shuffle items correctly', () => {
      expect(groupEditor.getShuffleItems()).toBe(false);

      groupEditor.setShuffleItems(true);
      expect(groupEditor.getShuffleItems()).toBe(true);

      groupEditor.setShuffleItems(false);
      expect(groupEditor.getShuffleItems()).toBe(false);
    });
  });

  describe('addChildItem and removeChildItem', () => {
    it('should add child item at specified position', () => {
      const newItem = new SingleChoiceQuestionItem('root.item4');
      const translations = new SurveyItemTranslations();

      groupEditor.addChildItem(newItem, translations, 1);
      expect(groupEditor.childItemKeys).toEqual(['root.item1', 'root.item4', 'root.item2', 'root.item3']);
    });

    it('should add child item at end if no position specified', () => {
      const newItem = new SingleChoiceQuestionItem('root.item4');
      const translations = new SurveyItemTranslations();

      groupEditor.addChildItem(newItem, translations);
      expect(groupEditor.childItemKeys).toEqual(['root.item1', 'root.item2', 'root.item3', 'root.item4']);
    });

    it('should remove child item', () => {
      const removed = groupEditor.removeChildItem('root.item2');
      expect(removed).toBe(true);
      expect(groupEditor.childItemKeys).toEqual(['root.item1', 'root.item3']);
    });

    it('should return false when removing non-existent child', () => {
      const removed = groupEditor.removeChildItem('root.nonexistent');
      expect(removed).toBe(false);
    });

    it('should add duplicate entry when adding item with duplicate key', () => {
      const duplicateItem = new SingleChoiceQuestionItem('root.item1'); // Same key as existing item
      const translations = new SurveyItemTranslations();

      // Adding a duplicate item (same key as existing child) should throw an error
      expect(() => {
        groupEditor.addChildItem(duplicateItem, translations);
      }).toThrow('Item root.item1 already in this group');
    });

    it('should successfully add new item with unique key', () => {
      const newItem = new SingleChoiceQuestionItem('root.uniqueItem');
      const translations = new SurveyItemTranslations();

      groupEditor.addChildItem(newItem, translations);
      expect(groupEditor.hasChildItem('root.uniqueItem')).toBe(true);
    });
  });
});
