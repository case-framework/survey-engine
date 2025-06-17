import { SurveyEditorUndoRedo } from '../survey-editor/undo-redo';
import { JsonSurvey, CURRENT_SURVEY_SCHEMA } from '../survey/survey-file-schema';
import { GroupItem, SurveyItemType } from '../survey/items';

// Helper function to create a minimal valid JsonSurvey
const createSurvey = (id: string = 'survey', title: string = 'Test Survey'): JsonSurvey => ({
  $schema: CURRENT_SURVEY_SCHEMA,
  surveyItems: {
    [id]: {
      itemType: SurveyItemType.Group,
      items: [`${id}.question1`]
    },
    [`${id}.question1`]: {
      itemType: SurveyItemType.Display,
      components: [
        {
          key: 'title',
          type: 'text',
          properties: {
            content: title
          }
        }
      ]
    }
  }
});

// Helper function to create a large survey for memory testing
const createLargeSurvey = (itemCount: number): JsonSurvey => {
  const survey: JsonSurvey = {
    $schema: CURRENT_SURVEY_SCHEMA,
    surveyItems: {
      survey: {
        itemType: SurveyItemType.Group,
        items: []
      }
    }
  };

  const rootGroup = survey.surveyItems.survey as GroupItem;

  for (let i = 0; i < itemCount; i++) {
    const itemKey = `survey.item${i}`;
    rootGroup.items?.push(itemKey);

    survey.surveyItems[itemKey] = {
      itemType: SurveyItemType.Display,
      components: [
        {
          key: 'content',
          type: 'text',
          properties: {
            content: `Content for item ${i}`.repeat(100) // Make it larger
          }
        }
      ]
    };
  }

  return survey;
};

describe('SurveyEditorUndoRedo', () => {
  let undoRedo: SurveyEditorUndoRedo;
  let initialSurvey: JsonSurvey;

  beforeEach(() => {
    initialSurvey = createSurvey();
    undoRedo = new SurveyEditorUndoRedo(initialSurvey);
  });

  describe('Initialization', () => {
    test('should initialize with initial survey', () => {
      expect(undoRedo.getCurrentState()).toEqual(initialSurvey);
      expect(undoRedo.canUndo()).toBe(false);
      expect(undoRedo.canRedo()).toBe(false);
    });

    test('should accept custom configuration', () => {
      const config = {
        maxTotalMemoryMB: 100,
        minHistorySize: 5,
        maxHistorySize: 500
      };

      const customUndoRedo = new SurveyEditorUndoRedo(initialSurvey, config);
      expect(customUndoRedo.getConfig()).toEqual(config);
    });

    test('should use default configuration when not provided', () => {
      const config = undoRedo.getConfig();
      expect(config.maxTotalMemoryMB).toBe(50);
      expect(config.minHistorySize).toBe(10);
      expect(config.maxHistorySize).toBe(200);
    });
  });

  describe('Commit functionality', () => {
    test('should commit new state and enable undo', () => {
      const newSurvey = createSurvey('survey2', 'Modified Survey');

      undoRedo.commit(newSurvey, 'Added new survey');

      expect(undoRedo.getCurrentState()).toEqual(newSurvey);
      expect(undoRedo.canUndo()).toBe(true);
      expect(undoRedo.canRedo()).toBe(false);
    });

    test('should clear redo history when committing after undo', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');
      const survey2 = createSurvey('survey2', 'Survey 2');
      const survey3 = createSurvey('survey3', 'Survey 3');

      undoRedo.commit(survey1, 'Step 1');
      undoRedo.commit(survey2, 'Step 2');

      // Undo once
      undoRedo.undo();
      expect(undoRedo.canRedo()).toBe(true);

      // Commit new change, should clear redo history
      undoRedo.commit(survey3, 'Step 3');
      expect(undoRedo.canRedo()).toBe(false);
      expect(undoRedo.getCurrentState()).toEqual(survey3);
    });

    test('should create deep clones of survey data', () => {
      const survey = createSurvey();
      undoRedo.commit(survey, 'Test commit');

      // Modify original survey
      survey.surveyItems.survey = {
        itemType: SurveyItemType.Display,
        components: []
      };

      // Stored state should be unchanged
      const storedState = undoRedo.getCurrentState();
      expect(storedState.surveyItems.survey.itemType).toBe(SurveyItemType.Group);
    });
  });

  describe('Undo functionality', () => {
    test('should undo to previous state', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');

      undoRedo.commit(survey1, 'Step 1');

      const undoResult = undoRedo.undo();
      expect(undoResult).toEqual(initialSurvey);
      expect(undoRedo.getCurrentState()).toEqual(initialSurvey);
      expect(undoRedo.canUndo()).toBe(false);
      expect(undoRedo.canRedo()).toBe(true);
    });

    test('should return null when no undo available', () => {
      expect(undoRedo.undo()).toBeNull();
    });

    test('should handle multiple undos', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');
      const survey2 = createSurvey('survey2', 'Survey 2');

      undoRedo.commit(survey1, 'Step 1');
      undoRedo.commit(survey2, 'Step 2');

      // First undo
      expect(undoRedo.undo()).toEqual(survey1);
      expect(undoRedo.canUndo()).toBe(true);

      // Second undo
      expect(undoRedo.undo()).toEqual(initialSurvey);
      expect(undoRedo.canUndo()).toBe(false);
    });
  });

  describe('Redo functionality', () => {
    test('should redo to next state', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');

      undoRedo.commit(survey1, 'Step 1');
      undoRedo.undo();

      const redoResult = undoRedo.redo();
      expect(redoResult).toEqual(survey1);
      expect(undoRedo.getCurrentState()).toEqual(survey1);
      expect(undoRedo.canUndo()).toBe(true);
      expect(undoRedo.canRedo()).toBe(false);
    });

    test('should return null when no redo available', () => {
      expect(undoRedo.redo()).toBeNull();
    });

    test('should handle multiple redos', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');
      const survey2 = createSurvey('survey2', 'Survey 2');

      undoRedo.commit(survey1, 'Step 1');
      undoRedo.commit(survey2, 'Step 2');

      // Undo twice
      undoRedo.undo();
      undoRedo.undo();

      // First redo
      expect(undoRedo.redo()).toEqual(survey1);
      expect(undoRedo.canRedo()).toBe(true);

      // Second redo
      expect(undoRedo.redo()).toEqual(survey2);
      expect(undoRedo.canRedo()).toBe(false);
    });
  });

  describe('State checking', () => {
    test('canUndo should work correctly', () => {
      expect(undoRedo.canUndo()).toBe(false);

      undoRedo.commit(createSurvey('test'), 'Test commit');
      expect(undoRedo.canUndo()).toBe(true);

      undoRedo.undo();
      expect(undoRedo.canUndo()).toBe(false);
    });

    test('canRedo should work correctly', () => {
      expect(undoRedo.canRedo()).toBe(false);

      undoRedo.commit(createSurvey('test'), 'Test commit');
      expect(undoRedo.canRedo()).toBe(false);

      undoRedo.undo();
      expect(undoRedo.canRedo()).toBe(true);

      undoRedo.redo();
      expect(undoRedo.canRedo()).toBe(false);
    });
  });

  describe('Description functionality', () => {
    test('should return correct undo description', () => {
      undoRedo.commit(createSurvey('test'), 'Test operation');

      expect(undoRedo.getUndoDescription()).toBe('Test operation');

      undoRedo.undo();
      expect(undoRedo.getUndoDescription()).toBeNull();
    });

    test('should return correct redo description', () => {
      undoRedo.commit(createSurvey('test'), 'Test operation');

      expect(undoRedo.getRedoDescription()).toBeNull();

      undoRedo.undo();
      expect(undoRedo.getRedoDescription()).toBe('Test operation');

      undoRedo.redo();
      expect(undoRedo.getRedoDescription()).toBeNull();
    });

    test('should handle multiple operations with descriptions', () => {
      undoRedo.commit(createSurvey('test1'), 'Operation 1');
      undoRedo.commit(createSurvey('test2'), 'Operation 2');

      expect(undoRedo.getUndoDescription()).toBe('Operation 2');
      expect(undoRedo.getRedoDescription()).toBeNull();

      undoRedo.undo();
      expect(undoRedo.getUndoDescription()).toBe('Operation 1');
      expect(undoRedo.getRedoDescription()).toBe('Operation 2');

      undoRedo.undo();
      expect(undoRedo.getUndoDescription()).toBeNull();
      expect(undoRedo.getRedoDescription()).toBe('Operation 1');
    });
  });

  describe('Memory management', () => {
    test('should track memory usage', () => {
      const usage = undoRedo.getMemoryUsage();
      expect(usage.entries).toBe(1); // Initial state
      expect(usage.totalMB).toBeGreaterThan(0);

      undoRedo.commit(createSurvey('test'), 'Test commit');

      const newUsage = undoRedo.getMemoryUsage();
      expect(newUsage.entries).toBe(2);
      expect(newUsage.totalMB).toBeGreaterThan(usage.totalMB);
    });

    test('should cleanup old history when memory limit exceeded', () => {
      const smallMemoryUndoRedo = new SurveyEditorUndoRedo(initialSurvey, {
        maxTotalMemoryMB: 0.001, // Very small limit
        minHistorySize: 2,
        maxHistorySize: 10
      });

      const largeSurvey = createLargeSurvey(10);

      // Add several large surveys
      for (let i = 0; i < 5; i++) {
        smallMemoryUndoRedo.commit(largeSurvey, `Large survey ${i}`);
      }

      const usage = smallMemoryUndoRedo.getMemoryUsage();
      expect(usage.entries).toBeGreaterThanOrEqual(2); // Should maintain minimum
      expect(usage.entries).toBeLessThan(6); // Should have cleaned up some
    });

    test('should cleanup old history when max history size exceeded', () => {
      const maxHistoryUndoRedo = new SurveyEditorUndoRedo(initialSurvey, {
        maxTotalMemoryMB: 1000, // Very large memory limit
        minHistorySize: 2,
        maxHistorySize: 3
      });

      // Add more than max history size
      for (let i = 0; i < 5; i++) {
        maxHistoryUndoRedo.commit(createSurvey(`test${i}`), `Operation ${i}`);
      }

      const usage = maxHistoryUndoRedo.getMemoryUsage();
      expect(usage.entries).toBe(3); // Should be limited to maxHistorySize
    });

    test('should preserve minimum history size', () => {
      const minHistoryUndoRedo = new SurveyEditorUndoRedo(initialSurvey, {
        maxTotalMemoryMB: 0.0001, // Extremely small limit
        minHistorySize: 5,
        maxHistorySize: 10
      });

      const largeSurvey = createLargeSurvey(20);

      // Add several large surveys
      for (let i = 0; i < 8; i++) {
        minHistoryUndoRedo.commit(largeSurvey, `Large survey ${i}`);
      }

      const usage = minHistoryUndoRedo.getMemoryUsage();
      expect(usage.entries).toBeGreaterThanOrEqual(5); // Should maintain minimum
    });
  });

  describe('Error handling', () => {
    test('should throw error for invalid history state', () => {
      // Force invalid state by manipulating internal state
      const invalidUndoRedo = new SurveyEditorUndoRedo(initialSurvey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (invalidUndoRedo as any).currentIndex = -1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (invalidUndoRedo as any).history = [];

      expect(() => invalidUndoRedo.getCurrentState()).toThrow('Invalid history state');
    });

    test('should handle getCurrentState with valid indices', () => {
      undoRedo.commit(createSurvey('test'), 'Test');
      expect(() => undoRedo.getCurrentState()).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complex undo/redo sequence', () => {
      const survey1 = createSurvey('survey1', 'Survey 1');
      const survey2 = createSurvey('survey2', 'Survey 2');
      const survey3 = createSurvey('survey3', 'Survey 3');
      const survey4 = createSurvey('survey4', 'Survey 4');

      // Build history
      undoRedo.commit(survey1, 'Step 1');
      undoRedo.commit(survey2, 'Step 2');
      undoRedo.commit(survey3, 'Step 3');

      // Undo twice
      undoRedo.undo();
      undoRedo.undo();
      expect(undoRedo.getCurrentState()).toEqual(survey1);

      // Redo once
      undoRedo.redo();
      expect(undoRedo.getCurrentState()).toEqual(survey2);

      // Commit new change (should clear remaining redo history)
      undoRedo.commit(survey4, 'Step 4');
      expect(undoRedo.getCurrentState()).toEqual(survey4);
      expect(undoRedo.canRedo()).toBe(false);

      // Verify undo path
      expect(undoRedo.undo()).toEqual(survey2);
      expect(undoRedo.undo()).toEqual(survey1);
      expect(undoRedo.undo()).toEqual(initialSurvey);
      expect(undoRedo.canUndo()).toBe(false);
    });

    test('should maintain data integrity through multiple operations', () => {
      const surveys: JsonSurvey[] = [];

      // Create 10 different surveys
      for (let i = 0; i < 10; i++) {
        surveys.push(createSurvey(`survey${i}`, `Survey ${i}`));
      }

      // Commit all surveys
      surveys.forEach((survey, index) => {
        undoRedo.commit(survey, `Operation ${index}`);
      });

      // Undo all changes
      for (let i = surveys.length - 1; i >= 0; i--) {
        const expected = i === 0 ? initialSurvey : surveys[i - 1];
        expect(undoRedo.undo()).toEqual(expected);
      }

      // Redo all changes
      surveys.forEach((survey) => {
        expect(undoRedo.redo()).toEqual(survey);
      });

      // Verify final state
      expect(undoRedo.getCurrentState()).toEqual(surveys[surveys.length - 1]);
    });

    test('should handle rapid commits and undos', () => {
      const operations = 50;

      // Rapid commits
      for (let i = 0; i < operations; i++) {
        undoRedo.commit(createSurvey(`rapid${i}`), `Rapid ${i}`);
      }

      expect(undoRedo.getMemoryUsage().entries).toBeGreaterThan(0);
      expect(undoRedo.canUndo()).toBe(true);

      // Rapid undos
      let undoCount = 0;
      while (undoRedo.canUndo()) {
        undoRedo.undo();
        undoCount++;
      }

      expect(undoCount).toBeGreaterThan(0);
      expect(undoRedo.getCurrentState()).toEqual(initialSurvey);
    });
  });

  describe('Configuration edge cases', () => {
    test('should handle extreme configuration values', () => {
      const extremeConfig = {
        maxTotalMemoryMB: 0,
        minHistorySize: 0,
        maxHistorySize: 1
      };

      const extremeUndoRedo = new SurveyEditorUndoRedo(initialSurvey, extremeConfig);
      expect(() => extremeUndoRedo.commit(createSurvey('test'), 'Test')).not.toThrow();
    });

    test('should handle partial configuration', () => {
      const partialConfig = {
        maxTotalMemoryMB: 25
      };

      const partialUndoRedo = new SurveyEditorUndoRedo(initialSurvey, partialConfig);
      const config = partialUndoRedo.getConfig();

      expect(config.maxTotalMemoryMB).toBe(25);
      expect(config.minHistorySize).toBe(10); // Default
      expect(config.maxHistorySize).toBe(200); // Default
    });
  });
});
