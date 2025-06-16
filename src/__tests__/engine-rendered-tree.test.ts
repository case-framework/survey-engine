import { SurveyEngineCore } from '../engine/engine';
import { Survey } from '../survey/survey';
import { GroupItem, DisplayItem, SurveyEndItem, SurveyItemType, SurveyItem } from '../survey/items/survey-item';
import { DisplayComponent, ItemComponentType } from '../survey/components/survey-item-component';
import { PageBreakItem } from '../survey/items/survey-item';

describe('SurveyEngineCore - ShuffleItems Rendering', () => {
  describe('Sequential Rendering (shuffleItems: false/undefined)', () => {
    test('should render items in fixed order when shuffleItems is false', () => {
      const survey = new Survey('test-survey');

      // Create multiple items
      const displayItem1 = new DisplayItem('test-survey.display1');
      displayItem1.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display1', 'test-survey.display1')
      ];

      const displayItem2 = new DisplayItem('test-survey.display2');
      displayItem2.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display2', 'test-survey.display2')
      ];

      const displayItem3 = new DisplayItem('test-survey.display3');
      displayItem3.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display3', 'test-survey.display3')
      ];

      survey.surveyItems['test-survey.display1'] = displayItem1;
      survey.surveyItems['test-survey.display2'] = displayItem2;
      survey.surveyItems['test-survey.display3'] = displayItem3;

      // Get the root item and set shuffleItems to false explicitly
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.shuffleItems = false;
      rootItem.items = ['test-survey.display1', 'test-survey.display2', 'test-survey.display3'];

      const engine = new SurveyEngineCore(survey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderedTree = (engine as any).renderedSurveyTree;

      expect(renderedTree.items).toHaveLength(3);
      expect(renderedTree.items[0].key.fullKey).toBe('test-survey.display1');
      expect(renderedTree.items[1].key.fullKey).toBe('test-survey.display2');
      expect(renderedTree.items[2].key.fullKey).toBe('test-survey.display3');
    });

    test('should render items in fixed order when shuffleItems is undefined', () => {
      const survey = new Survey('test-survey');

      // Create multiple items
      const displayItem1 = new DisplayItem('test-survey.display1');
      displayItem1.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display1', 'test-survey.display1')
      ];

      const displayItem2 = new DisplayItem('test-survey.display2');
      displayItem2.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display2', 'test-survey.display2')
      ];

      const displayItem3 = new DisplayItem('test-survey.display3');
      displayItem3.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display3', 'test-survey.display3')
      ];

      survey.surveyItems['test-survey.display1'] = displayItem1;
      survey.surveyItems['test-survey.display2'] = displayItem2;
      survey.surveyItems['test-survey.display3'] = displayItem3;

      // shuffleItems is undefined by default
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.display1', 'test-survey.display2', 'test-survey.display3'];

      const engine = new SurveyEngineCore(survey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderedTree = (engine as any).renderedSurveyTree;

      expect(renderedTree.items).toHaveLength(3);
      expect(renderedTree.items[0].key.fullKey).toBe('test-survey.display1');
      expect(renderedTree.items[1].key.fullKey).toBe('test-survey.display2');
      expect(renderedTree.items[2].key.fullKey).toBe('test-survey.display3');
    });
  });

  describe('Randomized Rendering (shuffleItems: true)', () => {
    test('should potentially render items in different order when shuffleItems is true', () => {
      const survey = new Survey('test-survey');

      // Create multiple items
      const displayItem1 = new DisplayItem('test-survey.display1');
      displayItem1.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display1', 'test-survey.display1')
      ];

      const displayItem2 = new DisplayItem('test-survey.display2');
      displayItem2.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display2', 'test-survey.display2')
      ];

      const displayItem3 = new DisplayItem('test-survey.display3');
      displayItem3.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display3', 'test-survey.display3')
      ];

      survey.surveyItems['test-survey.display1'] = displayItem1;
      survey.surveyItems['test-survey.display2'] = displayItem2;
      survey.surveyItems['test-survey.display3'] = displayItem3;

      // Set shuffleItems to true
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.shuffleItems = true;
      rootItem.items = ['test-survey.display1', 'test-survey.display2', 'test-survey.display3'];

      const engine = new SurveyEngineCore(survey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderedTree = (engine as any).renderedSurveyTree;

      expect(renderedTree.items).toHaveLength(3);

      // All original items should be present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderedKeys = renderedTree.items.map((item: any) => item.key.fullKey);
      expect(renderedKeys).toContain('test-survey.display1');
      expect(renderedKeys).toContain('test-survey.display2');
      expect(renderedKeys).toContain('test-survey.display3');

      // Note: Since shuffling is randomized, we can't test for a specific order
      // but we can test that all items are present and the shuffle functionality is used
    });

    test('should test randomization behavior over multiple initializations', () => {
      const survey = new Survey('test-survey');

      // Create multiple items
      const displayItem1 = new DisplayItem('test-survey.display1');
      displayItem1.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display1', 'test-survey.display1')
      ];

      const displayItem2 = new DisplayItem('test-survey.display2');
      displayItem2.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display2', 'test-survey.display2')
      ];

      const displayItem3 = new DisplayItem('test-survey.display3');
      displayItem3.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display3', 'test-survey.display3')
      ];

      const displayItem4 = new DisplayItem('test-survey.display4');
      displayItem4.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display4', 'test-survey.display4')
      ];

      survey.surveyItems['test-survey.display1'] = displayItem1;
      survey.surveyItems['test-survey.display2'] = displayItem2;
      survey.surveyItems['test-survey.display3'] = displayItem3;
      survey.surveyItems['test-survey.display4'] = displayItem4;

      // Set shuffleItems to true
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.shuffleItems = true;
      rootItem.items = ['test-survey.display1', 'test-survey.display2', 'test-survey.display3', 'test-survey.display4'];

      // Test multiple times to see if order varies (though this is probabilistic)
      const orders: string[][] = [];
      for (let i = 0; i < 10; i++) {
        const engine = new SurveyEngineCore(survey);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderedTree = (engine as any).renderedSurveyTree;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order = renderedTree.items.map((item: any) => item.key.fullKey);
        orders.push(order);
      }

      // All orders should contain all items
      orders.forEach(order => {
        expect(order).toHaveLength(4);
        expect(order).toContain('test-survey.display1');
        expect(order).toContain('test-survey.display2');
        expect(order).toContain('test-survey.display3');
        expect(order).toContain('test-survey.display4');
      });

      // At least some variance should occur in ordering (though this is probabilistic)
      const uniqueOrders = new Set(orders.map(order => order.join(',')));
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });
  });

  describe('Nested Groups with ShuffleItems', () => {
    test('should handle nested groups with different shuffle settings', () => {
      const survey = new Survey('test-survey');

      // Create nested structure
      const outerGroup = new GroupItem('test-survey.outer');
      outerGroup.shuffleItems = false; // Fixed order for outer group

      const innerGroup1 = new GroupItem('test-survey.outer.inner1');
      innerGroup1.shuffleItems = true; // Shuffled inner group

      const innerGroup2 = new GroupItem('test-survey.outer.inner2');
      innerGroup2.shuffleItems = false; // Fixed order inner group

      // Items for inner1 (will be shuffled)
      const display1 = new DisplayItem('test-survey.outer.inner1.display1');
      display1.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.outer.inner1.display1', 'test-survey.outer.inner1.display1')
      ];

      const display2 = new DisplayItem('test-survey.outer.inner1.display2');
      display2.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.outer.inner1.display2', 'test-survey.outer.inner1.display2')
      ];

      // Items for inner2 (fixed order)
      const display3 = new DisplayItem('test-survey.outer.inner2.display3');
      display3.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.outer.inner2.display3', 'test-survey.outer.inner2.display3')
      ];

      const display4 = new DisplayItem('test-survey.outer.inner2.display4');
      display4.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.outer.inner2.display4', 'test-survey.outer.inner2.display4')
      ];

      // Set up hierarchy
      outerGroup.items = ['test-survey.outer.inner1', 'test-survey.outer.inner2'];
      innerGroup1.items = ['test-survey.outer.inner1.display1', 'test-survey.outer.inner1.display2'];
      innerGroup2.items = ['test-survey.outer.inner2.display3', 'test-survey.outer.inner2.display4'];

      survey.surveyItems['test-survey.outer'] = outerGroup;
      survey.surveyItems['test-survey.outer.inner1'] = innerGroup1;
      survey.surveyItems['test-survey.outer.inner2'] = innerGroup2;
      survey.surveyItems['test-survey.outer.inner1.display1'] = display1;
      survey.surveyItems['test-survey.outer.inner1.display2'] = display2;
      survey.surveyItems['test-survey.outer.inner2.display3'] = display3;
      survey.surveyItems['test-survey.outer.inner2.display4'] = display4;

      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.outer'];

      const engine = new SurveyEngineCore(survey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderedTree = (engine as any).renderedSurveyTree;

      expect(renderedTree.items).toHaveLength(1);

      const outerRenderedGroup = renderedTree.items[0];
      expect(outerRenderedGroup.key.fullKey).toBe('test-survey.outer');
      expect(outerRenderedGroup.items).toHaveLength(2);

      // Outer group should maintain fixed order
      expect(outerRenderedGroup.items[0].key.fullKey).toBe('test-survey.outer.inner1');
      expect(outerRenderedGroup.items[1].key.fullKey).toBe('test-survey.outer.inner2');

      // Inner groups should contain their items
      const inner1 = outerRenderedGroup.items[0];
      const inner2 = outerRenderedGroup.items[1];

      expect(inner1.items).toHaveLength(2);
      expect(inner2.items).toHaveLength(2);

      // inner1 has shuffled items (verify all are present)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner1Keys = inner1.items.map((item: any) => item.key.fullKey);
      expect(inner1Keys).toContain('test-survey.outer.inner1.display1');
      expect(inner1Keys).toContain('test-survey.outer.inner1.display2');

      // inner2 has fixed order
      expect(inner2.items[0].key.fullKey).toBe('test-survey.outer.inner2.display3');
      expect(inner2.items[1].key.fullKey).toBe('test-survey.outer.inner2.display4');
    });
  });

  describe('Survey End Item', () => {
    test('should return survey end item when it exists in the survey', () => {
      const survey = new Survey('test-survey');

      // Create a survey end item
      const surveyEndItem = new SurveyEndItem('test-survey.end');
      survey.surveyItems['test-survey.end'] = surveyEndItem;

      // Add the survey end item to the root group
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.end'];

      const engine = new SurveyEngineCore(survey);
      const endItem = engine.surveyEndItem;

      expect(endItem).toBeDefined();
      expect(endItem?.key.fullKey).toBe('test-survey.end');
      expect(endItem?.itemType).toBe(SurveyItemType.SurveyEnd);
    });

    test('should return undefined when no survey end item exists', () => {
      const survey = new Survey('test-survey');

      // Create some other items but no survey end item
      const displayItem = new DisplayItem('test-survey.display1');
      displayItem.components = [
        new DisplayComponent(ItemComponentType.Text, 'title', 'test-survey.display1', 'test-survey.display1')
      ];

      survey.surveyItems['test-survey.display1'] = displayItem;

      // Add the display item to the root group
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.display1'];

      const engine = new SurveyEngineCore(survey);
      const endItem = engine.surveyEndItem;

      expect(endItem).toBeUndefined();
    });

    test('should return the first survey end item when multiple exist', () => {
      const survey = new Survey('test-survey');

      // Create multiple survey end items
      const surveyEndItem1 = new SurveyEndItem('test-survey.end1');
      const surveyEndItem2 = new SurveyEndItem('test-survey.end2');

      survey.surveyItems['test-survey.end1'] = surveyEndItem1;
      survey.surveyItems['test-survey.end2'] = surveyEndItem2;

      // Add both survey end items to the root group
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.end1', 'test-survey.end2'];

      const engine = new SurveyEngineCore(survey);
      const endItem = engine.surveyEndItem;

      expect(endItem).toBeDefined();
      // Should return the first one found (end1 since it comes first in the items array)
      expect(endItem?.key.fullKey).toBe('test-survey.end1');
      expect(endItem?.itemType).toBe(SurveyItemType.SurveyEnd);
    });

    test('should return survey end item from nested groups', () => {
      const survey = new Survey('test-survey');

      // Create a nested group structure
      const nestedGroup = new GroupItem('test-survey.nested');
      const surveyEndItem = new SurveyEndItem('test-survey.nested.end');

      survey.surveyItems['test-survey.nested'] = nestedGroup;
      survey.surveyItems['test-survey.nested.end'] = surveyEndItem;

      // Set up the nested structure
      nestedGroup.items = ['test-survey.nested.end'];
      const rootItem = survey.surveyItems['test-survey'] as GroupItem;
      rootItem.items = ['test-survey.nested'];

      const engine = new SurveyEngineCore(survey);
      const endItem = engine.surveyEndItem;

      expect(endItem).toBeDefined();
      expect(endItem?.key.fullKey).toBe('test-survey.nested.end');
      expect(endItem?.itemType).toBe(SurveyItemType.SurveyEnd);
    });
  });
});

describe('SurveyEngineCore.getSurveyPages', () => {
  function makeSurvey(items: SurveyItem[], maxItemsPerPage?: { large: number, small: number }) {
    const rootKey = 'test-survey';
    const survey = new Survey(rootKey);
    const root = survey.surveyItems[rootKey] as GroupItem;
    root.items = items.map(item => item.key.fullKey);
    for (const item of items) {
      survey.surveyItems[item.key.fullKey] = item;
    }
    if (maxItemsPerPage) {
      survey.maxItemsPerPage = maxItemsPerPage;
    }
    return survey;
  }

  it('returns all items in one page if no maxItemsPerPage and no page breaks', () => {
    const items = [
      new DisplayItem('test-survey.q1'),
      new DisplayItem('test-survey.q2'),
      new DisplayItem('test-survey.q3'),
    ];
    const survey = makeSurvey(items);
    const engine = new SurveyEngineCore(survey);
    const pages = engine.getSurveyPages();
    expect(pages).toHaveLength(1);
    expect(pages[0].length).toBe(3);
  });

  it('splits items into pages according to maxItemsPerPage', () => {
    const items = [
      new DisplayItem('test-survey.q1'),
      new DisplayItem('test-survey.q2'),
      new DisplayItem('test-survey.q3'),
      new DisplayItem('test-survey.q4'),
      new DisplayItem('test-survey.q5'),
    ];
    const survey = makeSurvey(items, { large: 2, small: 3 });
    const engine = new SurveyEngineCore(survey);
    const pagesLarge = engine.getSurveyPages('large');
    expect(pagesLarge).toHaveLength(3);
    expect(pagesLarge[0].length).toBe(2);
    expect(pagesLarge[1].length).toBe(2);
    expect(pagesLarge[2].length).toBe(1);
    const pagesSmall = engine.getSurveyPages('small');
    expect(pagesSmall).toHaveLength(2);
    expect(pagesSmall[0].length).toBe(3);
    expect(pagesSmall[1].length).toBe(2);
  });

  it('splits pages at page breaks', () => {
    const items = [
      new DisplayItem('test-survey.q1'),
      new PageBreakItem('test-survey.pb1'),
      new DisplayItem('test-survey.q2'),
      new PageBreakItem('test-survey.pb2'),
      new DisplayItem('test-survey.q3'),
    ];
    const survey = makeSurvey(items);
    const engine = new SurveyEngineCore(survey);
    const pages = engine.getSurveyPages();
    expect(pages).toHaveLength(3);
    expect(pages[0].length).toBe(1);
    expect(pages[1].length).toBe(1);
    expect(pages[2].length).toBe(1);
  });

  it('splits at both page breaks and maxItemsPerPage', () => {
    const items = [
      new DisplayItem('test-survey.q1'),
      new DisplayItem('test-survey.q2'),
      new PageBreakItem('test-survey.pb1'),
      new DisplayItem('test-survey.q3'),
      new DisplayItem('test-survey.q4'),
      new DisplayItem('test-survey.q5'),
      new DisplayItem('test-survey.q6'),
      new DisplayItem('test-survey.q7'),
      new DisplayItem('test-survey.q8'),
    ];
    const survey = makeSurvey(items, { large: 4, small: 4 });
    const engine = new SurveyEngineCore(survey);
    const pagesLarge = engine.getSurveyPages('large');
    expect(pagesLarge).toHaveLength(3);
    expect(pagesLarge[0].length).toBe(2);
    expect(pagesLarge[1].length).toBe(4);
    expect(pagesLarge[2].length).toBe(2);
  });

  it('returns empty if only page breaks', () => {
    const items = [
      new PageBreakItem('test-survey.pb1'),
      new PageBreakItem('test-survey.pb2'),
    ];
    const survey = makeSurvey(items);
    const engine = new SurveyEngineCore(survey);
    const pages = engine.getSurveyPages();
    expect(pages).toHaveLength(0);
  });
});
