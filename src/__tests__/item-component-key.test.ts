import { SurveyItemKey, ItemComponentKey } from '../data_types/item-component-key';

describe('SurveyItemKey', () => {
  describe('constructor', () => {
    it('should create a root item key when no parent is provided', () => {
      const itemKey = new SurveyItemKey('item1');

      expect(itemKey.itemKey).toBe('item1');
      expect(itemKey.fullKey).toBe('item1');
      expect(itemKey.isRoot).toBe(true);
      expect(itemKey.parentFullKey).toBeUndefined();
      expect(itemKey.parentKey).toBeUndefined();
      expect(itemKey.keyParts).toEqual(['item1']);
    });

    it('should create a nested item key when parent is provided', () => {
      const itemKey = new SurveyItemKey('item2', 'group1');

      expect(itemKey.itemKey).toBe('item2');
      expect(itemKey.fullKey).toBe('group1.item2');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('group1');
      expect(itemKey.parentKey).toBe('group1');
      expect(itemKey.keyParts).toEqual(['group1', 'item2']);
    });

    it('should create a deeply nested item key', () => {
      const itemKey = new SurveyItemKey('item3', 'group1.subgroup1');

      expect(itemKey.itemKey).toBe('item3');
      expect(itemKey.fullKey).toBe('group1.subgroup1.item3');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('group1.subgroup1');
      expect(itemKey.parentKey).toBe('subgroup1');
      expect(itemKey.keyParts).toEqual(['group1', 'subgroup1', 'item3']);
    });

    it('should handle empty parent key', () => {
      const itemKey = new SurveyItemKey('item1', '');

      expect(itemKey.itemKey).toBe('item1');
      expect(itemKey.fullKey).toBe('item1');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('');
      expect(itemKey.parentKey).toBeUndefined();
      expect(itemKey.keyParts).toEqual(['item1']);
    });

    it('should throw error when item key contains a dot', () => {
      expect(() => {
        new SurveyItemKey('item.with.dot');
      }).toThrow('Item key must not contain a dot (.)');
    });

    it('should throw error when item key contains a dot with parent', () => {
      expect(() => {
        new SurveyItemKey('item.with.dot', 'parent');
      }).toThrow('Item key must not contain a dot (.)');
    });

    it('should throw error when item key contains single dot', () => {
      expect(() => {
        new SurveyItemKey('item.key', 'group1.subgroup1');
      }).toThrow('Item key must not contain a dot (.)');
    });
  });

  describe('fromFullKey', () => {
    it('should create item key from simple full key', () => {
      const itemKey = SurveyItemKey.fromFullKey('item1');

      expect(itemKey.itemKey).toBe('item1');
      expect(itemKey.fullKey).toBe('item1');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('');
      expect(itemKey.parentKey).toBeUndefined();
    });

    it('should create item key from nested full key', () => {
      const itemKey = SurveyItemKey.fromFullKey('group1.item2');

      expect(itemKey.itemKey).toBe('item2');
      expect(itemKey.fullKey).toBe('group1.item2');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('group1');
      expect(itemKey.parentKey).toBe('group1');
    });

    it('should create item key from deeply nested full key', () => {
      const itemKey = SurveyItemKey.fromFullKey('group1.subgroup1.subgroup2.item3');

      expect(itemKey.itemKey).toBe('item3');
      expect(itemKey.fullKey).toBe('group1.subgroup1.subgroup2.item3');
      expect(itemKey.isRoot).toBe(false);
      expect(itemKey.parentFullKey).toBe('group1.subgroup1.subgroup2');
      expect(itemKey.parentKey).toBe('subgroup2');
      expect(itemKey.keyParts).toEqual(['group1', 'subgroup1', 'subgroup2', 'item3']);
    });

    it('should handle keys with dots in the name', () => {
      const itemKey = SurveyItemKey.fromFullKey('group.with.dots.item.with.dots');

      expect(itemKey.itemKey).toBe('dots');
      expect(itemKey.fullKey).toBe('group.with.dots.item.with.dots');
      expect(itemKey.parentFullKey).toBe('group.with.dots.item.with');
      expect(itemKey.parentKey).toBe('with');
    });
  });
});

describe('ItemComponentKey', () => {
  describe('constructor', () => {
    it('should create a root component key', () => {
      const componentKey = new ItemComponentKey('rg', undefined, 'item1');

      expect(componentKey.componentKey).toBe('rg');
      expect(componentKey.fullKey).toBe('rg');
      expect(componentKey.isRoot).toBe(true);
      expect(componentKey.parentFullKey).toBeUndefined();
      expect(componentKey.parentKey).toBeUndefined();
      expect(componentKey.keyParts).toEqual(['rg']);
      expect(componentKey.parentItemKey.itemKey).toBe('item1');
      expect(componentKey.parentItemKey.fullKey).toBe('item1');
    });

    it('should create a nested component key', () => {
      const componentKey = new ItemComponentKey('input', 'rg', 'item1');

      expect(componentKey.componentKey).toBe('input');
      expect(componentKey.fullKey).toBe('rg.input');
      expect(componentKey.isRoot).toBe(false);
      expect(componentKey.parentFullKey).toBe('rg');
      expect(componentKey.parentKey).toBe('rg');
      expect(componentKey.keyParts).toEqual(['rg', 'input']);
      expect(componentKey.parentItemKey.itemKey).toBe('item1');
      expect(componentKey.parentItemKey.fullKey).toBe('item1');
    });

    it('should create a deeply nested component key', () => {
      const componentKey = new ItemComponentKey('option1', 'rg.scg', 'group1.item2');

      expect(componentKey.componentKey).toBe('option1');
      expect(componentKey.fullKey).toBe('rg.scg.option1');
      expect(componentKey.isRoot).toBe(false);
      expect(componentKey.parentFullKey).toBe('rg.scg');
      expect(componentKey.parentKey).toBe('scg');
      expect(componentKey.keyParts).toEqual(['rg', 'scg', 'option1']);
      expect(componentKey.parentItemKey.itemKey).toBe('item2');
      expect(componentKey.parentItemKey.fullKey).toBe('group1.item2');
      expect(componentKey.parentItemKey.parentFullKey).toBe('group1');
    });

    it('should handle nested item keys correctly', () => {
      const componentKey = new ItemComponentKey('textarea', 'rg', 'group1.subgroup1.item3');

      expect(componentKey.componentKey).toBe('textarea');
      expect(componentKey.fullKey).toBe('rg.textarea');
      expect(componentKey.parentItemKey.itemKey).toBe('item3');
      expect(componentKey.parentItemKey.fullKey).toBe('group1.subgroup1.item3');
      expect(componentKey.parentItemKey.parentFullKey).toBe('group1.subgroup1');
      expect(componentKey.parentItemKey.parentKey).toBe('subgroup1');
      expect(componentKey.parentItemKey.keyParts).toEqual(['group1', 'subgroup1', 'item3']);
    });

    it('should handle empty parent component key', () => {
      const componentKey = new ItemComponentKey('rg', '', 'item1');

      expect(componentKey.componentKey).toBe('rg');
      expect(componentKey.fullKey).toBe('rg');
      expect(componentKey.isRoot).toBe(false);
      expect(componentKey.parentFullKey).toBe('');
      expect(componentKey.parentKey).toBeUndefined();
      expect(componentKey.parentItemKey.itemKey).toBe('item1');
    });

    it('should throw error when component key contains a dot', () => {
      expect(() => {
        new ItemComponentKey('comp.with.dot', 'parent', 'item1');
      }).toThrow('Component key must not contain a dot (.)');
    });

    it('should throw error when component key contains a dot without parent', () => {
      expect(() => {
        new ItemComponentKey('comp.key', undefined, 'item1');
      }).toThrow('Component key must not contain a dot (.)');
    });

    it('should throw error when component key contains single dot', () => {
      expect(() => {
        new ItemComponentKey('comp.key', 'rg', 'group1.item1');
      }).toThrow('Component key must not contain a dot (.)');
    });
  });

  describe('integration with SurveyItemKey', () => {
    it('should correctly reference parent item key with complex structure', () => {
      const componentKey = new ItemComponentKey(
        'option2',
        'rg.scg.mc',
        'survey.page1.group1.question1'
      );

      expect(componentKey.componentKey).toBe('option2');
      expect(componentKey.fullKey).toBe('rg.scg.mc.option2');
      expect(componentKey.parentItemKey.itemKey).toBe('question1');
      expect(componentKey.parentItemKey.fullKey).toBe('survey.page1.group1.question1');
      expect(componentKey.parentItemKey.parentFullKey).toBe('survey.page1.group1');
      expect(componentKey.parentItemKey.parentKey).toBe('group1');
      expect(componentKey.parentItemKey.isRoot).toBe(false);
    });

    it('should handle single-level item keys', () => {
      const componentKey = new ItemComponentKey('input', 'rg', 'Q1');

      expect(componentKey.parentItemKey.itemKey).toBe('Q1');
      expect(componentKey.parentItemKey.fullKey).toBe('Q1');
      expect(componentKey.parentItemKey.parentFullKey).toBe('');
      expect(componentKey.parentItemKey.isRoot).toBe(false);
    });
  });
});

describe('Edge cases and error handling', () => {
  it('should handle keys with special characters', () => {
    const itemKey = new SurveyItemKey('item-with_special$chars', 'parent-key');

    expect(itemKey.itemKey).toBe('item-with_special$chars');
    expect(itemKey.fullKey).toBe('parent-key.item-with_special$chars');
  });

  it('should handle very long key names', () => {
    const longKey = 'a'.repeat(100);
    const itemKey = new SurveyItemKey(longKey);

    expect(itemKey.itemKey).toBe(longKey);
    expect(itemKey.fullKey).toBe(longKey);
  });

  it('should handle keys with numbers', () => {
    const itemKey = new SurveyItemKey('item123', 'group456');

    expect(itemKey.itemKey).toBe('item123');
    expect(itemKey.fullKey).toBe('group456.item123');
  });

  it('should handle component keys with complex parent item structures', () => {
    const componentKey = new ItemComponentKey(
      'comp123',
      'parent.comp',
      'level1.level2.level3.level4.item'
    );

    expect(componentKey.componentKey).toBe('comp123');
    expect(componentKey.parentItemKey.itemKey).toBe('item');
    expect(componentKey.parentItemKey.keyParts).toHaveLength(5);
  });
});

describe('Key validation', () => {
  describe('SurveyItemKey validation', () => {
    it('should allow keys with valid characters', () => {
      expect(() => new SurveyItemKey('validKey123_-$')).not.toThrow();
      expect(() => new SurveyItemKey('item', 'parent.group')).not.toThrow();
    });

    it('should throw detailed error message for item key with dot', () => {
      expect(() => new SurveyItemKey('invalid.key')).toThrow('Item key must not contain a dot (.)');
    });

    it('should throw error when parent key starts with a dot', () => {
      expect(() => {
        new SurveyItemKey('item1', '.parent');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent key ends with a dot', () => {
      expect(() => {
        new SurveyItemKey('item1', 'parent.');
      }).toThrow('Parent key must not end with a dot (.)');
    });

    it('should throw error when parent key starts and ends with dots', () => {
      expect(() => {
        new SurveyItemKey('item1', '.parent.');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent key starts with dot in nested structure', () => {
      expect(() => {
        new SurveyItemKey('item1', '.group.subgroup');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent key ends with dot in nested structure', () => {
      expect(() => {
        new SurveyItemKey('item1', 'group.subgroup.');
      }).toThrow('Parent key must not end with a dot (.)');
    });

    it('should allow empty parent key', () => {
      expect(() => new SurveyItemKey('item1', '')).not.toThrow();
    });
  });

  describe('ItemComponentKey validation', () => {
    it('should allow component keys with valid characters', () => {
      expect(() => new ItemComponentKey('validComponent123_-$', 'parent', 'item1')).not.toThrow();
      expect(() => new ItemComponentKey('rg', 'parent.component', 'group.item')).not.toThrow();
    });

    it('should throw detailed error message for component key with dot', () => {
      expect(() => new ItemComponentKey('invalid.component', 'parent', 'item1')).toThrow('Component key must not contain a dot (.)');
    });

    it('should throw error when parent component key starts with a dot', () => {
      expect(() => {
        new ItemComponentKey('comp1', '.parent', 'item1');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent component key ends with a dot', () => {
      expect(() => {
        new ItemComponentKey('comp1', 'parent.', 'item1');
      }).toThrow('Parent key must not end with a dot (.)');
    });

    it('should throw error when parent component key starts and ends with dots', () => {
      expect(() => {
        new ItemComponentKey('comp1', '.parent.', 'item1');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent component key starts with dot in nested structure', () => {
      expect(() => {
        new ItemComponentKey('comp1', '.rg.scg', 'item1');
      }).toThrow('Parent key must not start with a dot (.)');
    });

    it('should throw error when parent component key ends with dot in nested structure', () => {
      expect(() => {
        new ItemComponentKey('comp1', 'rg.scg.', 'item1');
      }).toThrow('Parent key must not end with a dot (.)');
    });

    it('should allow empty parent component key', () => {
      expect(() => new ItemComponentKey('comp1', '', 'item1')).not.toThrow();
    });
  });
});
