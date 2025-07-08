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

// New tests for enhanced undo/redo functionality
describe('Enhanced Undo/Redo Functionality', () => {
  let undoRedo: SurveyEditorUndoRedo;
  let initialSurvey: JsonSurvey;
  let surveys: JsonSurvey[];

  beforeEach(() => {
    initialSurvey = createSurvey();
    undoRedo = new SurveyEditorUndoRedo(initialSurvey);

    // Create a set of test surveys
    surveys = [
      createSurvey('survey1', 'Survey 1'),
      createSurvey('survey2', 'Survey 2'),
      createSurvey('survey3', 'Survey 3'),
      createSurvey('survey4', 'Survey 4'),
    ];

    // Commit all surveys to build history
    surveys.forEach((survey, index) => {
      undoRedo.commit(survey, `Operation ${index + 1}`);
    });
  });

  describe('History Information', () => {
    test('should return complete history list', () => {
      const history = undoRedo.getHistory();

      expect(history).toHaveLength(5); // initial + 4 surveys
      expect(history[0].description).toBe('Initial state');
      expect(history[1].description).toBe('Operation 1');
      expect(history[2].description).toBe('Operation 2');
      expect(history[3].description).toBe('Operation 3');
      expect(history[4].description).toBe('Operation 4');

      // Check that current index is marked correctly
      expect(history[4].isCurrent).toBe(true);
      expect(history[0].isCurrent).toBe(false);
      expect(history[1].isCurrent).toBe(false);
      expect(history[2].isCurrent).toBe(false);
      expect(history[3].isCurrent).toBe(false);

      // Check that all entries have required properties
      history.forEach((entry, index) => {
        expect(entry.index).toBe(index);
        expect(typeof entry.description).toBe('string');
        expect(typeof entry.timestamp).toBe('number');
        expect(typeof entry.memorySize).toBe('number');
        expect(typeof entry.isCurrent).toBe('boolean');
        expect(entry.timestamp).toBeGreaterThan(0);
        expect(entry.memorySize).toBeGreaterThan(0);
      });
    });

    test('should track current index correctly', () => {
      expect(undoRedo.getCurrentIndex()).toBe(4);
      expect(undoRedo.getHistoryLength()).toBe(5);

      undoRedo.undo();
      expect(undoRedo.getCurrentIndex()).toBe(3);
      expect(undoRedo.getHistoryLength()).toBe(5);

      undoRedo.undo();
      expect(undoRedo.getCurrentIndex()).toBe(2);
      expect(undoRedo.getHistoryLength()).toBe(5);

      undoRedo.redo();
      expect(undoRedo.getCurrentIndex()).toBe(3);
      expect(undoRedo.getHistoryLength()).toBe(5);
    });

    test('should update isCurrent flag when navigating', () => {
      undoRedo.undo(); // Move to index 3

      const history = undoRedo.getHistory();
      expect(history[3].isCurrent).toBe(true);
      expect(history[4].isCurrent).toBe(false);

      undoRedo.redo(); // Move back to index 4

      const updatedHistory = undoRedo.getHistory();
      expect(updatedHistory[4].isCurrent).toBe(true);
      expect(updatedHistory[3].isCurrent).toBe(false);
    });
  });

  describe('Jump to Index', () => {
    test('should jump forward to specific index', () => {
      const result = undoRedo.jumpToIndex(2);

      expect(result).toEqual(surveys[1]);
      expect(undoRedo.getCurrentIndex()).toBe(2);
      expect(undoRedo.getCurrentState()).toEqual(surveys[1]);
    });

    test('should jump backward to specific index', () => {
      undoRedo.jumpToIndex(1);

      const result = undoRedo.jumpToIndex(3);

      expect(result).toEqual(surveys[2]);
      expect(undoRedo.getCurrentIndex()).toBe(3);
      expect(undoRedo.getCurrentState()).toEqual(surveys[2]);
    });

    test('should handle jumping to initial state', () => {
      const result = undoRedo.jumpToIndex(0);

      expect(result).toEqual(initialSurvey);
      expect(undoRedo.getCurrentIndex()).toBe(0);
      expect(undoRedo.getCurrentState()).toEqual(initialSurvey);
    });

    test('should return null for invalid indices', () => {
      expect(undoRedo.jumpToIndex(4)).toBeNull(); // Current index
      expect(undoRedo.jumpToIndex(5)).toBeNull(); // Beyond history
      expect(undoRedo.jumpToIndex(-1)).toBeNull(); // Invalid index
    });

    test('should handle multiple jumps', () => {
      // Jump to index 1
      undoRedo.jumpToIndex(1);
      expect(undoRedo.getCurrentState()).toEqual(surveys[0]);

      // Jump to index 3
      undoRedo.jumpToIndex(3);
      expect(undoRedo.getCurrentState()).toEqual(surveys[2]);

      // Jump to index 0
      undoRedo.jumpToIndex(0);
      expect(undoRedo.getCurrentState()).toEqual(initialSurvey);
    });

    test('should validate canJumpToIndex correctly', () => {
      expect(undoRedo.canJumpToIndex(0)).toBe(true);
      expect(undoRedo.canJumpToIndex(1)).toBe(true);
      expect(undoRedo.canJumpToIndex(2)).toBe(true);
      expect(undoRedo.canJumpToIndex(3)).toBe(true);
      expect(undoRedo.canJumpToIndex(4)).toBe(false); // Current index
      expect(undoRedo.canJumpToIndex(5)).toBe(false); // Beyond history
      expect(undoRedo.canJumpToIndex(-1)).toBe(false); // Invalid index

      // After jumping to index 2
      undoRedo.jumpToIndex(2);
      expect(undoRedo.canJumpToIndex(0)).toBe(true);
      expect(undoRedo.canJumpToIndex(1)).toBe(true);
      expect(undoRedo.canJumpToIndex(2)).toBe(false); // Current index
      expect(undoRedo.canJumpToIndex(3)).toBe(true);
      expect(undoRedo.canJumpToIndex(4)).toBe(true);
    });
  });

  describe('History Navigation Integration', () => {
    test('should maintain history integrity during navigation', () => {
      const originalHistory = undoRedo.getHistory();

      // Navigate around
      undoRedo.jumpToIndex(1);
      undoRedo.jumpToIndex(3);
      undoRedo.jumpToIndex(0);
      undoRedo.jumpToIndex(2);

      // History should remain the same
      const currentHistory = undoRedo.getHistory();
      expect(currentHistory).toHaveLength(originalHistory.length);

      // Only the current flag should change
      currentHistory.forEach((entry, index) => {
        expect(entry.description).toBe(originalHistory[index].description);
        expect(entry.timestamp).toBe(originalHistory[index].timestamp);
        expect(entry.memorySize).toBe(originalHistory[index].memorySize);
        expect(entry.index).toBe(originalHistory[index].index);
        expect(entry.isCurrent).toBe(index === 2); // Current index is 2
      });
    });

    test('should work correctly with normal undo/redo after navigation', () => {
      undoRedo.jumpToIndex(2);

      // Normal undo should work
      const undoResult = undoRedo.undo();
      expect(undoResult).toEqual(surveys[0]);
      expect(undoRedo.getCurrentIndex()).toBe(1);

      // Normal redo should work
      const redoResult = undoRedo.redo();
      expect(redoResult).toEqual(surveys[1]);
      expect(undoRedo.getCurrentIndex()).toBe(2);
    });

    test('should handle navigation after committing new changes', () => {
      undoRedo.jumpToIndex(2);

      // Commit new change (should clear future history)
      const newSurvey = createSurvey('new-survey', 'New Survey');
      undoRedo.commit(newSurvey, 'New operation');

      expect(undoRedo.getHistoryLength()).toBe(4); // Initial + 2 surveys + new survey
      expect(undoRedo.getCurrentIndex()).toBe(3);

      // Can still navigate within new history
      expect(undoRedo.canJumpToIndex(0)).toBe(true);
      expect(undoRedo.canJumpToIndex(1)).toBe(true);
      expect(undoRedo.canJumpToIndex(2)).toBe(true);
      expect(undoRedo.canJumpToIndex(3)).toBe(false); // Current index
      expect(undoRedo.canJumpToIndex(4)).toBe(false); // Beyond new history
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty history navigation', () => {
      const emptyUndoRedo = new SurveyEditorUndoRedo(initialSurvey);

      expect(emptyUndoRedo.getHistoryLength()).toBe(1);
      expect(emptyUndoRedo.getCurrentIndex()).toBe(0);

      expect(emptyUndoRedo.canJumpToIndex(0)).toBe(false); // Current index
      expect(emptyUndoRedo.jumpToIndex(0)).toBeNull();
    });

    test('should handle boundary conditions', () => {
      // Test at the start of history
      undoRedo.jumpToIndex(0);

      expect(undoRedo.canJumpToIndex(0)).toBe(false); // Current index
      expect(undoRedo.jumpToIndex(0)).toBeNull();

      // Test at the end of history
      undoRedo.jumpToIndex(4);

      expect(undoRedo.canJumpToIndex(4)).toBe(false); // Current index
      expect(undoRedo.jumpToIndex(4)).toBeNull();
    });

    test('should handle navigation with large indices', () => {
      expect(undoRedo.jumpToIndex(1000)).toBeNull();
      expect(undoRedo.canJumpToIndex(1000)).toBe(false);
    });

    test('should handle navigation with negative indices', () => {
      expect(undoRedo.jumpToIndex(-1)).toBeNull();
      expect(undoRedo.canJumpToIndex(-1)).toBe(false);
    });
  });
});

// JSON Serialization and Deserialization Tests
describe('SurveyEditorUndoRedo JSON Serialization', () => {
  let undoRedo: SurveyEditorUndoRedo;
  let initialSurvey: JsonSurvey;
  let survey1: JsonSurvey;
  let survey2: JsonSurvey;

  beforeEach(() => {
    initialSurvey = createSurvey();
    survey1 = createSurvey('survey1', 'Survey 1');
    survey2 = createSurvey('survey2', 'Survey 2');

    undoRedo = new SurveyEditorUndoRedo(initialSurvey, {
      maxTotalMemoryMB: 25,
      minHistorySize: 5,
      maxHistorySize: 100
    });

    // Build some history
    undoRedo.commit(survey1, 'Added survey 1');
    undoRedo.commit(survey2, 'Added survey 2');
  });

  describe('toJSON method', () => {
    test('should serialize complete state to JSON', () => {
      const jsonData = undoRedo.toJSON();

      expect(jsonData).toBeDefined();
      expect(jsonData.history).toBeDefined();
      expect(jsonData.currentIndex).toBeDefined();
      expect(jsonData.config).toBeDefined();
    });

    test('should include all history entries', () => {
      const jsonData = undoRedo.toJSON();

      expect(jsonData.history).toHaveLength(3); // initial + 2 commits
      expect(jsonData.history[0].description).toBe('Initial state');
      expect(jsonData.history[1].description).toBe('Added survey 1');
      expect(jsonData.history[2].description).toBe('Added survey 2');
    });

    test('should include current index', () => {
      const jsonData = undoRedo.toJSON();
      expect(jsonData.currentIndex).toBe(2);

      undoRedo.undo();
      const jsonDataAfterUndo = undoRedo.toJSON();
      expect(jsonDataAfterUndo.currentIndex).toBe(1);
    });

    test('should include configuration', () => {
      const jsonData = undoRedo.toJSON();

      expect(jsonData.config).toEqual({
        maxTotalMemoryMB: 25,
        minHistorySize: 5,
        maxHistorySize: 100
      });
    });

    test('should include all history entry properties', () => {
      const jsonData = undoRedo.toJSON();

      jsonData.history.forEach((entry, index) => {
        expect(entry.survey).toBeDefined();
        expect(typeof entry.timestamp).toBe('number');
        expect(typeof entry.description).toBe('string');
        expect(typeof entry.memorySize).toBe('number');
        expect(entry.timestamp).toBeGreaterThan(0);
        expect(entry.memorySize).toBeGreaterThan(0);
      });
    });

    test('should create deep copies of survey data', () => {
      const jsonData = undoRedo.toJSON();

      // Modify the original survey
      initialSurvey.surveyItems.survey = {
        itemType: SurveyItemType.Display,
        components: []
      };

      // JSON data should be unchanged
      expect(jsonData.history[0].survey.surveyItems.survey.itemType).toBe(SurveyItemType.Group);
    });

    test('should work with different history positions', () => {
      undoRedo.undo(); // Move to position 1
      const jsonData1 = undoRedo.toJSON();
      expect(jsonData1.currentIndex).toBe(1);

      undoRedo.undo(); // Move to position 0
      const jsonData2 = undoRedo.toJSON();
      expect(jsonData2.currentIndex).toBe(0);

      undoRedo.redo(); // Move back to position 1
      const jsonData3 = undoRedo.toJSON();
      expect(jsonData3.currentIndex).toBe(1);
    });
  });

  describe('fromJSON method', () => {
    test('should recreate instance from JSON data', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      expect(restored).toBeInstanceOf(SurveyEditorUndoRedo);
      expect(restored.getCurrentIndex()).toBe(undoRedo.getCurrentIndex());
      expect(restored.getHistoryLength()).toBe(undoRedo.getHistoryLength());
      expect(restored.getCurrentState()).toEqual(undoRedo.getCurrentState());
    });

    test('should restore configuration correctly', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      expect(restored.getConfig()).toEqual(undoRedo.getConfig());
    });

    test('should restore complete history', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      const originalHistory = undoRedo.getHistory();
      const restoredHistory = restored.getHistory();

      expect(restoredHistory).toHaveLength(originalHistory.length);

      restoredHistory.forEach((entry, index) => {
        expect(entry.description).toBe(originalHistory[index].description);
        expect(entry.timestamp).toBe(originalHistory[index].timestamp);
        expect(entry.memorySize).toBe(originalHistory[index].memorySize);
        expect(entry.isCurrent).toBe(originalHistory[index].isCurrent);
      });
    });

    test('should restore undo/redo functionality', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      expect(restored.canUndo()).toBe(undoRedo.canUndo());
      expect(restored.canRedo()).toBe(undoRedo.canRedo());
      expect(restored.getUndoDescription()).toBe(undoRedo.getUndoDescription());
      expect(restored.getRedoDescription()).toBe(undoRedo.getRedoDescription());
    });

    test('should maintain data integrity after restoration', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Test undo functionality
      const originalUndo = undoRedo.undo();
      const restoredUndo = restored.undo();
      expect(restoredUndo).toEqual(originalUndo);

      // Test redo functionality
      const originalRedo = undoRedo.redo();
      const restoredRedo = restored.redo();
      expect(restoredRedo).toEqual(originalRedo);
    });

    test('should work with different history positions', () => {
      undoRedo.undo(); // Move to position 1
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      expect(restored.getCurrentIndex()).toBe(1);
      expect(restored.getCurrentState()).toEqual(survey1);
      expect(restored.canUndo()).toBe(true);
      expect(restored.canRedo()).toBe(true);
    });

    test('should create independent instances', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Modify original
      undoRedo.commit(createSurvey('new-survey'), 'New survey');

      // Restored should be unaffected
      expect(restored.getHistoryLength()).toBe(3);
      expect(undoRedo.getHistoryLength()).toBe(4);
    });

    test('should handle memory usage correctly', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      const originalMemory = undoRedo.getMemoryUsage();
      const restoredMemory = restored.getMemoryUsage();

      expect(restoredMemory.entries).toBe(originalMemory.entries);
      expect(restoredMemory.totalMB).toBeCloseTo(originalMemory.totalMB, 2);
    });
  });

  describe('Error handling', () => {
    test('should throw error for missing history', () => {
      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          history: [],
          currentIndex: 0,
          config: undoRedo.getConfig()
        });
      }).toThrow('Invalid JSON data: history array is required and must not be empty');

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          // @ts-expect-error Testing invalid input
          history: null,
          currentIndex: 0,
          config: undoRedo.getConfig()
        });
      }).toThrow('Invalid JSON data: history array is required and must not be empty');
    });

    test('should throw error for invalid current index', () => {
      const jsonData = undoRedo.toJSON();

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          ...jsonData,
          currentIndex: -1
        });
      }).toThrow('Invalid JSON data: currentIndex must be a valid index within the history array');

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          ...jsonData,
          currentIndex: jsonData.history.length
        });
      }).toThrow('Invalid JSON data: currentIndex must be a valid index within the history array');

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          ...jsonData,
          // @ts-expect-error Testing invalid input
          currentIndex: 'invalid'
        });
      }).toThrow('Invalid JSON data: currentIndex must be a valid index within the history array');
    });

    test('should throw error for missing config', () => {
      const jsonData = undoRedo.toJSON();

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          ...jsonData,
          // @ts-expect-error Testing invalid input
          config: null
        });
      }).toThrow('Invalid JSON data: config is required');

      expect(() => {
        SurveyEditorUndoRedo.fromJSON({
          history: jsonData.history,
          currentIndex: jsonData.currentIndex,
          // @ts-expect-error Testing invalid input
          config: undefined
        });
      }).toThrow('Invalid JSON data: config is required');
    });
  });

  describe('Round-trip serialization', () => {
    test('should maintain identical state after round-trip', () => {
      // Create a complex state
      const survey3 = createSurvey('survey3', 'Survey 3');
      undoRedo.commit(survey3, 'Added survey 3');
      undoRedo.undo();
      undoRedo.undo();

      // Round-trip serialization
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Verify complete state equality
      expect(restored.getCurrentIndex()).toBe(undoRedo.getCurrentIndex());
      expect(restored.getHistoryLength()).toBe(undoRedo.getHistoryLength());
      expect(restored.getCurrentState()).toEqual(undoRedo.getCurrentState());
      expect(restored.canUndo()).toBe(undoRedo.canUndo());
      expect(restored.canRedo()).toBe(undoRedo.canRedo());
      expect(restored.getUndoDescription()).toBe(undoRedo.getUndoDescription());
      expect(restored.getRedoDescription()).toBe(undoRedo.getRedoDescription());
      expect(restored.getConfig()).toEqual(undoRedo.getConfig());

      // Verify history matches
      const originalHistory = undoRedo.getHistory();
      const restoredHistory = restored.getHistory();
      expect(restoredHistory).toEqual(originalHistory);
    });

    test('should work with JSON.stringify and JSON.parse', () => {
      const jsonData = undoRedo.toJSON();
      const jsonString = JSON.stringify(jsonData);
      const parsedData = JSON.parse(jsonString);
      const restored = SurveyEditorUndoRedo.fromJSON(parsedData);

      expect(restored.getCurrentState()).toEqual(undoRedo.getCurrentState());
      expect(restored.getHistoryLength()).toBe(undoRedo.getHistoryLength());
      expect(restored.getCurrentIndex()).toBe(undoRedo.getCurrentIndex());
    });

    test('should handle large surveys correctly', () => {
      const largeSurvey = createLargeSurvey(10);
      undoRedo.commit(largeSurvey, 'Added large survey');

      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      expect(restored.getCurrentState()).toEqual(undoRedo.getCurrentState());

      const originalMemory = undoRedo.getMemoryUsage();
      const restoredMemory = restored.getMemoryUsage();
      expect(restoredMemory.totalMB).toBeCloseTo(originalMemory.totalMB, 1);
    });

    test('should preserve functionality after multiple round-trips', () => {
      // First round-trip
      let jsonData = undoRedo.toJSON();
      let restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Second round-trip
      jsonData = restored.toJSON();
      restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Third round-trip
      jsonData = restored.toJSON();
      restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Should still work correctly
      expect(restored.getCurrentState()).toEqual(undoRedo.getCurrentState());
      expect(restored.getHistoryLength()).toBe(undoRedo.getHistoryLength());

      // Test functionality
      const undoResult = restored.undo();
      expect(undoResult).toEqual(survey1);

      const redoResult = restored.redo();
      expect(redoResult).toEqual(survey2);
    });
  });

  describe('Integration with existing functionality', () => {
    test('should work with jumpToIndex after restoration', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      const jumpResult = restored.jumpToIndex(0);
      expect(jumpResult).toEqual(initialSurvey);
      expect(restored.getCurrentIndex()).toBe(0);

      expect(restored.canJumpToIndex(1)).toBe(true);
      expect(restored.canJumpToIndex(2)).toBe(true);
    });

    test('should work with memory cleanup after restoration', () => {
      // Create instance with small memory limit
      const limitedUndoRedo = new SurveyEditorUndoRedo(initialSurvey, {
        maxTotalMemoryMB: 0.001,
        minHistorySize: 2,
        maxHistorySize: 5
      });

      // Add several large surveys
      for (let i = 0; i < 5; i++) {
        limitedUndoRedo.commit(createLargeSurvey(5), `Large survey ${i}`);
      }

      const jsonData = limitedUndoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Should maintain the same memory characteristics
      const originalMemory = limitedUndoRedo.getMemoryUsage();
      const restoredMemory = restored.getMemoryUsage();

      expect(restoredMemory.entries).toBe(originalMemory.entries);
      expect(restoredMemory.entries).toBeGreaterThanOrEqual(2); // Minimum history size
    });

    test('should continue working after restoration and new commits', () => {
      const jsonData = undoRedo.toJSON();
      const restored = SurveyEditorUndoRedo.fromJSON(jsonData);

      // Add new state to restored instance
      const newSurvey = createSurvey('new-after-restore', 'New After Restore');
      restored.commit(newSurvey, 'Added after restoration');

      expect(restored.getCurrentState()).toEqual(newSurvey);
      expect(restored.getHistoryLength()).toBe(4);
      expect(restored.canUndo()).toBe(true);

      // Should be able to undo to previous states
      expect(restored.undo()).toEqual(survey2);
      expect(restored.undo()).toEqual(survey1);
      expect(restored.undo()).toEqual(initialSurvey);
    });
  });
});
