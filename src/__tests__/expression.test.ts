import { ConstExpression, ExpressionEditorConfig, ExpressionType, FunctionExpression, FunctionExpressionNames, ResponseVariableExpression } from "../expressions/expression";
import { ExpectedValueType } from "../survey";
import { ConstBooleanEditor, ConstDateArrayEditor, ConstDateEditor, ConstNumberArrayEditor, ConstNumberEditor, ConstStringArrayEditor, ConstStringEditor } from "../survey-editor/expression-editor";
import { const_string, const_string_array, list_contains, response_string } from "../survey-editor/expression-editor-generators";

describe('expression editor to expression', () => {
  describe('Expression Editors', () => {

    describe('ConstStringArrayEditor', () => {
      test('should create instance with empty array', () => {
        const editor = new ConstStringArrayEditor([]);

        expect(editor.returnType).toBe(ExpectedValueType.StringArray);
        expect(editor.values).toEqual([]);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with string array values', () => {
        const values = ['test1', 'test2', 'test3'];
        const editor = new ConstStringArrayEditor(values);

        expect(editor.returnType).toBe(ExpectedValueType.StringArray);
        expect(editor.values).toEqual(values);
        expect(editor.values).toBe(values); // References the same array
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstStringArrayEditor(['test'], config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting values', () => {
        const editor = new ConstStringArrayEditor([]);
        const newValues = ['new1', 'new2'];

        editor.values = newValues;

        expect(editor.values).toEqual(newValues);
      });

      test('should generate correct ConstExpression', () => {
        const values = ['test1', 'test2'];
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstStringArrayEditor(values, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toEqual(values);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should support withEditorConfig method', () => {
        const editor = new ConstStringArrayEditor(['test']);
        const config: ExpressionEditorConfig = { usedTemplate: 'new-template' };

        const result = editor.withEditorConfig(config);

        expect(result).toBe(editor); // Should return same instance
        expect(editor.editorConfig).toEqual(config);
      });
    });

    describe('ConstStringEditor', () => {
      test('should create instance with string value', () => {
        const value = 'test string';
        const editor = new ConstStringEditor(value);

        expect(editor.returnType).toBe(ExpectedValueType.String);
        expect(editor.value).toBe(value);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'string-template' };
        const editor = new ConstStringEditor('test', config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting value', () => {
        const editor = new ConstStringEditor('initial');
        const newValue = 'updated value';

        editor.value = newValue;

        expect(editor.value).toBe(newValue);
      });

      test('should generate correct ConstExpression', () => {
        const value = 'test string';
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstStringEditor(value, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toBe(value);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should handle empty string', () => {
        const editor = new ConstStringEditor('');

        expect(editor.value).toBe('');

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toBe('');
      });
    });

    describe('ConstNumberEditor', () => {
      test('should create instance with number value', () => {
        const value = 42.5;
        const editor = new ConstNumberEditor(value);

        expect(editor.returnType).toBe(ExpectedValueType.Number);
        expect(editor.value).toBe(value);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'number-template' };
        const editor = new ConstNumberEditor(123, config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting value', () => {
        const editor = new ConstNumberEditor(0);
        const newValue = 999.99;

        editor.value = newValue;

        expect(editor.value).toBe(newValue);
      });

      test('should generate correct ConstExpression', () => {
        const value = -15.7;
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstNumberEditor(value, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toBe(value);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should handle zero value', () => {
        const editor = new ConstNumberEditor(0);

        expect(editor.value).toBe(0);

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toBe(0);
      });

      test('should handle negative values', () => {
        const editor = new ConstNumberEditor(-100);

        expect(editor.value).toBe(-100);

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toBe(-100);
      });
    });

    describe('ConstBooleanEditor', () => {
      test('should create instance with true value', () => {
        const editor = new ConstBooleanEditor(true);

        expect(editor.returnType).toBe(ExpectedValueType.Boolean);
        expect(editor.value).toBe(true);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with false value', () => {
        const editor = new ConstBooleanEditor(false);

        expect(editor.returnType).toBe(ExpectedValueType.Boolean);
        expect(editor.value).toBe(false);
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'boolean-template' };
        const editor = new ConstBooleanEditor(true, config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting value', () => {
        const editor = new ConstBooleanEditor(true);

        editor.value = false;
        expect(editor.value).toBe(false);

        editor.value = true;
        expect(editor.value).toBe(true);
      });

      test('should generate correct ConstExpression for true', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstBooleanEditor(true, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toBe(true);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should generate correct ConstExpression for false', () => {
        const editor = new ConstBooleanEditor(false);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toBe(false);
      });
    });

    describe('ConstDateEditor', () => {
      test('should create instance with Date value', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const editor = new ConstDateEditor(date);

        expect(editor.returnType).toBe(ExpectedValueType.Date);
        expect(editor.value).toBe(date);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'date-template' };
        const date = new Date();
        const editor = new ConstDateEditor(date, config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting value', () => {
        const initialDate = new Date('2024-01-01');
        const newDate = new Date('2024-12-31');
        const editor = new ConstDateEditor(initialDate);

        editor.value = newDate;

        expect(editor.value).toBe(newDate);
      });

      test('should generate correct ConstExpression', () => {
        const date = new Date('2024-06-15T14:30:00Z');
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstDateEditor(date, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toBe(date);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should handle current date', () => {
        const now = new Date();
        const editor = new ConstDateEditor(now);

        expect(editor.value).toBe(now);

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toBe(now);
      });
    });

    describe('ConstNumberArrayEditor', () => {
      test('should create instance with empty array', () => {
        const editor = new ConstNumberArrayEditor([]);

        expect(editor.returnType).toBe(ExpectedValueType.NumberArray);
        expect(editor.values).toEqual([]);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with number array values', () => {
        const values = [1, 2.5, -3, 0, 999.99];
        const editor = new ConstNumberArrayEditor(values);

        expect(editor.returnType).toBe(ExpectedValueType.NumberArray);
        expect(editor.values).toEqual(values);
        expect(editor.values).toBe(values); // References the same array
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'number-array-template' };
        const editor = new ConstNumberArrayEditor([1, 2, 3], config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting values', () => {
        const editor = new ConstNumberArrayEditor([]);
        const newValues = [10, 20, 30];

        editor.values = newValues;

        expect(editor.values).toEqual(newValues);
      });

      test('should generate correct ConstExpression', () => {
        const values = [1.1, 2.2, 3.3];
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstNumberArrayEditor(values, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toEqual(values);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should handle array with mixed positive and negative numbers', () => {
        const values = [-100, 0, 100, -1.5, 1.5];
        const editor = new ConstNumberArrayEditor(values);

        expect(editor.values).toEqual(values);

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toEqual(values);
      });
    });

    describe('ConstDateArrayEditor', () => {
      test('should create instance with empty array', () => {
        const editor = new ConstDateArrayEditor([]);

        expect(editor.returnType).toBe(ExpectedValueType.DateArray);
        expect(editor.values).toEqual([]);
        expect(editor.editorConfig).toBeUndefined();
      });

      test('should create instance with date array values', () => {
        const values = [
          new Date('2024-01-01'),
          new Date('2024-06-15'),
          new Date('2024-12-31')
        ];
        const editor = new ConstDateArrayEditor(values);

        expect(editor.returnType).toBe(ExpectedValueType.DateArray);
        expect(editor.values).toEqual(values);
        expect(editor.values).toBe(values); // References the same array
      });

      test('should create instance with editor config', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'date-array-template' };
        const dates = [new Date()];
        const editor = new ConstDateArrayEditor(dates, config);

        expect(editor.editorConfig).toEqual(config);
      });

      test('should allow setting values', () => {
        const editor = new ConstDateArrayEditor([]);
        const newValues = [
          new Date('2023-01-01'),
          new Date('2023-12-31')
        ];

        editor.values = newValues;

        expect(editor.values).toEqual(newValues);
      });

      test('should generate correct ConstExpression', () => {
        const values = [
          new Date('2024-03-15T09:00:00Z'),
          new Date('2024-03-16T10:00:00Z')
        ];
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };
        const editor = new ConstDateArrayEditor(values, config);

        const expression = editor.getExpression();

        expect(expression).toBeInstanceOf(ConstExpression);
        expect((expression as ConstExpression).value).toEqual(values);
        expect(expression?.editorConfig).toEqual(config);
      });

      test('should handle array with single date', () => {
        const date = new Date('2024-07-04T12:00:00Z');
        const editor = new ConstDateArrayEditor([date]);

        expect(editor.values).toEqual([date]);

        const expression = editor.getExpression();
        expect((expression as ConstExpression).value).toEqual([date]);
      });
    });

    describe('ExpressionEditor base class functionality', () => {
      test('should support withEditorConfig method', () => {
        const editor = new ConstStringEditor('test');
        const config: ExpressionEditorConfig = { usedTemplate: 'test-template' };

        const result = editor.withEditorConfig(config);

        expect(result).toBe(editor); // Should return same instance for chaining
        expect(editor.editorConfig).toEqual(config);
      });

      test('should support method chaining with withEditorConfig', () => {
        const config: ExpressionEditorConfig = { usedTemplate: 'chained-template' };

        const editor = new ConstNumberEditor(42)
          .withEditorConfig(config);

        expect(editor.editorConfig).toEqual(config);
        expect((editor as ConstNumberEditor).value).toBe(42);
      });

      test('should allow updating editor config', () => {
        const editor = new ConstBooleanEditor(true);
        const config1: ExpressionEditorConfig = { usedTemplate: 'config-1' };
        const config2: ExpressionEditorConfig = { usedTemplate: 'config-2' };

        editor.withEditorConfig(config1);
        expect(editor.editorConfig).toEqual(config1);

        editor.withEditorConfig(config2);
        expect(editor.editorConfig).toEqual(config2);
      });
    });
  });

  describe('simple expressions', () => {
    it('create simple const string array expression', () => {
      const editor = const_string_array('test', 'test2');

      const expression = editor.getExpression();
      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toEqual(['test', 'test2']);
    });

    it('create empty const string array expression', () => {
      const editor = const_string_array();

      const expression = editor.getExpression();
      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toEqual([]);
    });
  });

  describe('function expressions', () => {
    it('create simple list contains expression', () => {
      const editor = list_contains(const_string_array('test', 'test2'), const_string('test3'));

      const expression = editor.getExpression();
      expect(expression).toBeInstanceOf(FunctionExpression);
      expect(expression?.type).toBe(ExpressionType.Function);
      expect((expression as FunctionExpression).functionName).toBe(FunctionExpressionNames.list_contains);
      expect((expression as FunctionExpression).arguments).toHaveLength(2);
      expect((expression as FunctionExpression).arguments[0]).toBeInstanceOf(ConstExpression);
      expect((expression as FunctionExpression).arguments[0]?.type).toBe(ExpressionType.Const);
      expect(((expression as FunctionExpression).arguments[0] as ConstExpression)?.value).toEqual(['test', 'test2']);
      expect(((expression as FunctionExpression).arguments[1] as ConstExpression)?.value).toEqual('test3');
    });
  });

  describe('response variable expressions', () => {
    it('create simple response string expression', () => {
      const editor = response_string('survey.test...get');

      const expression = editor.getExpression();
      expect(expression).toBeInstanceOf(ResponseVariableExpression);
      expect(expression?.type).toBe(ExpressionType.ResponseVariable);
      expect((expression as ResponseVariableExpression).variableRef).toEqual('survey.test...get');
      expect((expression as ResponseVariableExpression).responseVariableRefs).toHaveLength(1);
      expect((expression as ResponseVariableExpression).responseVariableRefs[0].toString()).toEqual('survey.test...get');
    });
  });
});

/*
describe('expression editor to expression', () => {
  let singleChoiceConfig: ScgMcgChoiceResponseConfig;

  beforeEach(() => {
    singleChoiceConfig = new ScgMcgChoiceResponseConfig('scg', undefined, 'survey.test-item');
  });

  describe('Basic functionality', () => {
    it('should create ScgMcgChoiceResponseConfig with correct type', () => {
      expect(singleChoiceConfig.componentType).toBe(ItemComponentType.SingleChoice);
      expect(singleChoiceConfig.options).toEqual([]);
    });

  });
});
*/


/*

TODO:
import { add, getUnixTime } from 'date-fns';
import { Expression, SurveyItemResponse, SurveySingleItem, SurveyContext, ExpressionArg, ExpressionArgDType, SurveyGroupItemResponse } from '../data_types';
import { ExpressionEval } from '../expression-eval';

test('testing undefined expression', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval(undefined)).toBeTruthy();
  expect(expEval.eval({ name: undefined } as any)).toBeTruthy();
})

// ---------- LOGIC OPERATORS ----------------
test('testing OR expression', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'or', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 0 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'or', data: [{ dtype: 'num', num: 0 }, { dtype: 'num', num: 1 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'or', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 1 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'or', data: [{ dtype: 'num', num: 0 }, { dtype: 'num', num: 0 }] })).toBeFalsy();
});

test('testing AND expression', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'and', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 0 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'and', data: [{ dtype: 'num', num: 0 }, { dtype: 'num', num: 1 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'and', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 1 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'and', data: [{ dtype: 'num', num: 0 }, { dtype: 'num', num: 0 }] })).toBeFalsy();
});

test('testing NOT expression', () => {
  const trueExp: Expression = { name: 'and', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 1 }] }
  const falseExp: Expression = { name: 'and', data: [{ dtype: 'num', num: 0 }, { dtype: 'num', num: 1 }] }

  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'not', data: [{ dtype: 'exp', exp: trueExp }] })).toBeFalsy();
  expect(expEval.eval({ name: 'not', data: [{ dtype: 'exp', exp: falseExp }] })).toBeTruthy();
});


// ---------- COMPARISONS ----------------
test('testing EQ expression', () => {
  const expEval = new ExpressionEval();
  // numbers
  expect(expEval.eval({ name: 'eq', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 0 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'eq', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 1 }] })).toBeTruthy();

  // strings
  expect(expEval.eval({ name: 'eq', data: [{ dtype: 'str', str: "test1" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
  expect(expEval.eval({ name: 'eq', data: [{ str: "test1" }, { str: "test1" }] })).toBeTruthy();
})

test('testing LT expression', () => {
  const expEval = new ExpressionEval();
  // numbers
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'num', num: 3 }, { dtype: 'num', num: 2 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'num', num: 2 }, { dtype: 'num', num: 2 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 2 }] })).toBeTruthy();

  // strings
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'str', str: "test3" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'str', str: "test2" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lt', data: [{ dtype: 'str', str: "test1" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
})

test('testing LTE expression', () => {
  const expEval = new ExpressionEval();
  // numbers
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'num', num: 3 }, { dtype: 'num', num: 2 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'num', num: 2 }, { dtype: 'num', num: 2 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 2 }] })).toBeTruthy();

  // strings
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'str', str: "test3" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'str', str: "test2" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
  expect(expEval.eval({ name: 'lte', data: [{ dtype: 'str', str: "test1" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
})

test('testing GT expression', () => {
  const expEval = new ExpressionEval();
  // numbers
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'num', num: 3 }, { dtype: 'num', num: 2 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'num', num: 2 }, { dtype: 'num', num: 2 }] })).toBeFalsy();
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 2 }] })).toBeFalsy();

  // strings
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'str', str: "test3" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'str', str: "test2" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
  expect(expEval.eval({ name: 'gt', data: [{ dtype: 'str', str: "test1" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
})

test('testing GTE expression', () => {
  const expEval = new ExpressionEval();
  // numbers
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'num', num: 3 }, { dtype: 'num', num: 2 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'num', num: 2 }, { dtype: 'num', num: 2 }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'num', num: 1 }, { dtype: 'num', num: 2 }] })).toBeFalsy();

  // strings
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'str', str: "test3" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'str', str: "test2" }, { dtype: 'str', str: "test2" }] })).toBeTruthy();
  expect(expEval.eval({ name: 'gte', data: [{ dtype: 'str', str: "test1" }, { dtype: 'str', str: "test2" }] })).toBeFalsy();
})

test('testing expression: isDefined', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
        }
      }
    ]
  }


  expect(expEval.eval({
    name: 'isDefined', data: [
      {
        dtype: 'exp', exp: {
          name: 'getObjByHierarchicalKey',
          data: [
            { dtype: 'exp', exp: { name: 'getResponses' } },
            { dtype: 'str', str: 'TS.I1' }
          ]
        }
      }
    ]
  }, undefined, undefined, testSurveyResponses)).toBeTruthy();

  expect(expEval.eval({
    name: 'isDefined', data: [
      {
        dtype: 'exp', exp: {
          name: 'getObjByHierarchicalKey',
          data: [
            { dtype: 'exp', exp: { name: 'getResponses' } },
            { dtype: 'str', str: 'TS.IWRONG' }
          ]
        }
      }
    ]
  }, undefined, undefined, testSurveyResponses)).toBeFalsy();
})


test('testing expression: parseValueAsNum', () => {
  const expEval = new ExpressionEval();

  expect(expEval.eval({
    name: 'parseValueAsNum', data: [
      {
        dtype: 'exp', exp: {
          name: "getAttribute",
          data: [
            {
              dtype: 'exp', exp: {
                name: "getAttribute",
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { dtype: 'str', str: 'participantFlags' }
                ],
              }
            },
            { dtype: 'str', str: 'test' }
          ]
        }
      },
    ]
  }, undefined, {
    participantFlags: {
      test: '2'
    }
  }, undefined)).toEqual(2);

  expect(expEval.eval({
    name: 'parseValueAsNum', data: [
      {
        dtype: 'exp', exp: {
          name: "getAttribute",
          data: [
            {
              dtype: 'exp', exp: {
                name: "getAttribute",
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { dtype: 'str', str: 'participantFlags' }
                ],
              }
            },
            { dtype: 'str', str: 'wrong' }
          ]
        }
      },
    ]
  }, undefined, {
    participantFlags: {
      test: '2'
    }
  }, undefined)).toBeUndefined();

});

test('testing expression: getResponseValueAsNum', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          items: [
            { key: 'V1', value: 'not a number' },
            { key: 'V2', value: '123.23' },
            { key: 'V3' }
          ]
        }
      }
    ]
  }



  expect(expEval.eval({
    name: 'getResponseValueAsNum', data: [
      { dtype: 'str', str: 'TS.wrong' },
      { dtype: 'str', str: 'R1.V2' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();

  expect(expEval.eval({
    name: 'getResponseValueAsNum', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.Vwrong' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();


  expect(expEval.eval({
    name: 'getResponseValueAsNum', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.V3' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();

  expect(expEval.eval({
    name: 'getResponseValueAsNum', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.V1' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeNaN();

  expect(expEval.eval({
    name: 'getResponseValueAsNum', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.V2' },
    ]
  }, undefined, undefined, testSurveyResponses)).toEqual(123.23);
});

test('testing expression: getResponseValueAsStr', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          items: [
            { key: 'V1' },
            { key: 'V2', value: 'something' }
          ]
        }
      }
    ]
  }

  expect(expEval.eval({
    name: 'getResponseValueAsStr', data: [
      { dtype: 'str', str: 'TS.wrong' },
      { dtype: 'str', str: 'R1.V2' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();

  expect(expEval.eval({
    name: 'getResponseValueAsStr', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.Vwrong' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();

  expect(expEval.eval({
    name: 'getResponseValueAsStr', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.V1' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();

  expect(expEval.eval({
    name: 'getResponseValueAsStr', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1.V2' },
    ]
  }, undefined, undefined, testSurveyResponses)).toEqual("something");
});


test('testing expression: regexp', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    items: [
      {
        key: 'TS.I1',
        response: {
          key: 'R1',
        }
      },
      {
        key: 'TS.I2',
        response: {
          key: 'R1',
          value: 'test'
        }
      }
    ]
  }

  const regex1Exp: Expression = {
    name: 'checkResponseValueWithRegex', data: [
      { dtype: 'str', str: 'TS.I1' },
      { dtype: 'str', str: 'R1' },
      { dtype: 'str', str: '.*\\S.*' },
    ]
  };

  const regex2Exp: Expression = {
    name: 'checkResponseValueWithRegex', data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'str', str: 'R1' },
      { dtype: 'str', str: '.*\\S.*' },
    ]
  };

  const regex3Exp: Expression = {
    name: 'checkResponseValueWithRegex', data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'str', str: 'R1' },
      { dtype: 'str', str: '\\d' },
    ]
  };


  expect(expEval.eval(regex1Exp, undefined, undefined, testSurveyResponses)).toBeFalsy();
  expect(expEval.eval(regex2Exp, undefined, undefined, testSurveyResponses)).toBeTruthy();
  expect(expEval.eval(regex3Exp, undefined, undefined, testSurveyResponses)).toBeFalsy();
})

test('testing expression: timestampWithOffset', () => {
  const expEval = new ExpressionEval();

  const withWrongType: Expression = {
    name: 'timestampWithOffset', data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'str', str: 'R1' },
    ]
  };

  const withMissingArgs: Expression = {
    name: 'timestampWithOffset',
  };

  const withTooManyArgs: Expression = {
    name: 'timestampWithOffset',
    data: [
      { dtype: 'num', num: 22432 },
      { dtype: 'num', num: 342345342 },
      { dtype: 'num', num: 342345342 },
    ]
  };

  const withNowAsReference: Expression = {
    name: 'timestampWithOffset',
    data: [
      { dtype: 'num', num: -1000 },
    ]
  };

  const withAbsoluteReference: Expression = {
    name: 'timestampWithOffset',
    data: [
      { dtype: 'num', num: -1000 },
      { dtype: 'num', num: 2000 },
    ]
  };

  expect(expEval.eval(withWrongType, undefined, undefined, undefined)).toBeUndefined();
  expect(expEval.eval(withMissingArgs, undefined, undefined, undefined)).toBeUndefined();
  expect(expEval.eval(withTooManyArgs, undefined, undefined, undefined)).toBeUndefined();
  expect(expEval.eval(withNowAsReference, undefined, undefined, undefined)).toBeLessThan(Date.now() - 900);
  expect(expEval.eval(withAbsoluteReference, undefined, undefined, undefined)).toEqual(1000);

})

test('testing expression: countResponseItems', () => {
  const expEval = new ExpressionEval();

  const withWrongType: Expression = {
    name: 'countResponseItems', data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'num', num: 2 },
    ]
  };

  const withMissingArgs: Expression = {
    name: 'countResponseItems',
  };

  const withTooManyArgs: Expression = {
    name: 'countResponseItems',
    data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'str', str: 'rg.mcg' },
      { dtype: 'str', str: 'rg.mcg' },
    ]
  };

  const withCorrectExp: Expression = {
    name: 'countResponseItems',
    data: [
      { dtype: 'str', str: 'TS.I2' },
      { dtype: 'str', str: 'rg.mcg' },
    ]
  };

  expect(expEval.eval(withWrongType, undefined, undefined, undefined)).toEqual(-1);
  expect(expEval.eval(withMissingArgs, undefined, undefined, undefined)).toEqual(-1);
  expect(expEval.eval(withTooManyArgs, undefined, undefined, undefined)).toEqual(-1);

  // missing info
  expect(expEval.eval(withCorrectExp, undefined, undefined, undefined)).toEqual(-1);


  // missing question
  expect(expEval.eval(withCorrectExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.other',
        response: {
          key: 'rg',
          items: [{ key: 'mcg', items: [] }]
        }
      }
    ]
  })).toEqual(-1);

  // missing response group
  expect(expEval.eval(withCorrectExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.I2',
        response: {
          key: 'rg',
          items: [{ key: 'scg', items: [] }]
        }
      }
    ]
  })).toEqual(-1);

  // zero item
  expect(expEval.eval(withCorrectExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.I2',
        response: {
          key: 'rg',
          items: [{ key: 'mcg', items: [] }]
        }
      }
    ]
  })).toEqual(0);

  // with items
  expect(expEval.eval(withCorrectExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.I2',
        response: {
          key: 'rg',
          items: [{ key: 'mcg', items: [{ key: '1' }] }]
        }
      }
    ]
  })).toEqual(1);
  expect(expEval.eval(withCorrectExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.I2',
        response: {
          key: 'rg',
          items: [{ key: 'mcg', items: [{ key: '1' }, { key: '2' }, { key: '3' }] }]
        }
      }
    ]
  })).toEqual(3);

  // combined exp:
  const combExp: Expression = {
    name: 'gt',
    data: [
      { dtype: 'exp', exp: withCorrectExp },
      { dtype: 'num', num: 2 },
    ]
  }
  expect(expEval.eval(combExp, undefined, undefined, {
    key: 'TS',
    items: [
      {
        key: 'TS.I2',
        response: {
          key: 'rg',
          items: [{ key: 'mcg', items: [{ key: '1' }, { key: '2' }, { key: '3' }] }]
        }
      }
    ]
  })).toBeTruthy();
})

// ---------- ROOT REFERENCES ----------------
test('testing expression: getContext', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'getContext' })).toBeUndefined();

  const testContext = {
    mode: 'test',
    participantFlags: {
      prev: "1",
    }
  };
  expect(expEval.eval({ name: 'getContext' }, undefined, testContext)).toBeDefined();

  expect(expEval.eval(
    {
      name: 'eq', data: [
        {
          dtype: 'exp', exp: {
            name: "getAttribute",
            data: [
              {
                dtype: 'exp', exp: {
                  name: "getAttribute",
                  data: [
                    { dtype: 'exp', exp: { name: 'getContext' } },
                    { dtype: 'str', str: 'participantFlags' }
                  ],
                }
              },
              { dtype: 'str', str: 'prev' }
            ]
          }
        },
        { dtype: 'str', str: '1' }
      ]
    }
    , undefined, testContext
  )).toBeTruthy();
})

test('testing expression: getResponses', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'getResponses' })).toBeUndefined();
  expect(expEval.eval({ name: 'getResponses' }, undefined, undefined, {
    key: 'test',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: []
  })).toBeDefined();
})

test('testing expression: getRenderedItems', () => {
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'getRenderedItems' })).toBeUndefined();
  expect(expEval.eval({ name: 'getRenderedItems' }, {
    key: 'test',
    items: []
  })).toBeDefined();
})

// ---------- WORKING WITH OBJECT/ARRAYS ----------------
test('testing expression: getAttribute', () => {
  const expEval = new ExpressionEval();

  expect(expEval.eval(
    {
      name: 'getAttribute',
      returnType: 'float',
      data: [
        { dtype: 'exp', exp: { name: 'getContext' } },
        { dtype: 'str', str: 'profile' }
      ]
    }
    , undefined, {
    mode: 'test',
    profile: 1.453,
  })).toEqual(1.453);

  expect(expEval.eval(
    {
      name: 'getAttribute',
      returnType: 'float',
      data: [
        { dtype: 'exp', exp: { name: 'getContext' } },
        { dtype: 'str', str: 'notexisting' }
      ]
    }
    , undefined, {
    mode: 'test',
    profile: 1,
  })).toBeUndefined();
})

test('testing expression: getArrayItemAtIndex', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          value: 'testvalue'
        }
      },
      {
        key: 'TS.I2',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          value: 'testvalue2'
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'getArrayItemAtIndex',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'num', num: 0 }
      ]
    }, undefined, undefined, testSurveyResponses).response.value).toEqual('testvalue');

  expect(expEval.eval(
    {
      name: 'getArrayItemAtIndex',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'num', num: 1 }
      ]
    }, undefined, undefined, testSurveyResponses).response.value).toEqual('testvalue2');

  expect(expEval.eval(
    {
      name: 'getArrayItemAtIndex',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'num', num: 2 }
      ]
    }, undefined, undefined, testSurveyResponses)).toBeUndefined();
})

test('testing expression: getArrayItemByKey', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          value: 'testvalue'
        }
      },
      {
        key: 'TS.I2',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          value: 'testvalue2'
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'getArrayItemByKey',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'str', str: 'TS.I1' }]
    }, undefined, undefined, testSurveyResponses).response.value).toEqual('testvalue');

  expect(expEval.eval(
    {
      name: 'getArrayItemByKey',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'str', str: 'TS.I2' }]
    }, undefined, undefined, testSurveyResponses).response.value).toEqual('testvalue2');

  expect(expEval.eval(
    {
      name: 'getArrayItemByKey',
      data: [
        {
          dtype: 'exp', exp: {
            name: 'getAttribute', data: [
              { dtype: 'exp', exp: { name: 'getResponses' } },
              { dtype: 'str', str: 'items' }
            ]
          }
        },
        { dtype: 'str', str: 'TS.IWRONG' }]
    }, undefined, undefined, testSurveyResponses)).toBeNull();
})

test('testing expression: getObjByHierarchicalKey', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          value: 'testvalue'
        }
      }
    ]
  }

  // Using survey item responses
  expect(expEval.eval(
    {
      name: 'getObjByHierarchicalKey',
      data: [
        { dtype: 'exp', exp: { name: 'getResponses' } },
        { dtype: 'str', str: 'TS.I1' }]
    }, undefined, undefined, testSurveyResponses).response.value).toEqual('testvalue');

  expect(expEval.eval({
    name: 'getObjByHierarchicalKey',
    data: [
      { dtype: 'exp', exp: { name: 'getResponses' } },
      { dtype: 'str', str: 'TS.IWRONG' }
    ]
  }, undefined, undefined, testSurveyResponses)).toBeNull();
})

test('testing expression: getResponseItem', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'RG1',
          items: [
            { key: 'R1', value: 'testvalue' }
          ]
        }
      }
    ]
  }

  expect(expEval.eval({
    name: 'getResponseItem',
    data: [
      { str: 'TS.I1' },
      { str: 'RG1.R1' }
    ]
  }, undefined, undefined, testSurveyResponses).value).toEqual('testvalue');

  expect(expEval.eval({
    name: 'getResponseItem',
    data: [
      { str: 'TS.I1' },
      { str: 'RG1' }
    ]
  }, undefined, undefined, testSurveyResponses).items).toHaveLength(1);

  expect(expEval.eval({
    name: 'getResponseItem',
    data: [
      { str: 'TS.I1' },
      { str: 'SOMETHING' }
    ]
  }, undefined, undefined, testSurveyResponses)).toBeUndefined();
})

test('testing expression: getSurveyItemValidation', () => {
  const expEval = new ExpressionEval();
  const testRenderedSurveyItem: SurveySingleItem = {
    key: 'TS',
    type: 'test',
    components: {
      role: 'root',
      items: []
    },
    validations: [
      {
        key: 'v1',
        type: 'hard',
        rule: true
      },
      {
        key: 'v2',
        type: 'hard',
        rule: false
      }
    ]
  }

  expect(expEval.eval({
    name: 'getSurveyItemValidation',
    data: [
      { str: 'this' },
      { str: 'v1' }
    ]
  }, undefined, undefined, undefined, testRenderedSurveyItem)).toBeTruthy();

  expect(expEval.eval({
    name: 'getSurveyItemValidation',
    data: [
      { str: 'this' },
      { str: 'v2' }
    ]
  }, undefined, undefined, undefined, testRenderedSurveyItem)).toBeFalsy();

  expect(expEval.eval({
    name: 'getSurveyItemValidation',
    data: [
      { str: 'this' },
      { str: 'v3' }
    ]
  }, undefined, undefined, undefined, testRenderedSurveyItem)).toBeTruthy();
})

// ---------- QUERY METHODS ----------------
test('testing expression: findPreviousSurveyResponsesByKey', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      { key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [] },
      { key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [] }
    ]
  }
  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'findPreviousSurveyResponsesByKey', data: [{ str: 'weekly' }] })).toHaveLength(0);
  expect(expEval.eval({ name: 'findPreviousSurveyResponsesByKey', data: [{ str: 'weekly' }] }, undefined, context)).toHaveLength(2);
})

test('testing expression: getLastFromSurveyResponses', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      { key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [] },
      { key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [] }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'getLastFromSurveyResponses', data: [{ str: 'weekly' }] })).toBeUndefined();
  expect(expEval.eval({ name: 'getLastFromSurveyResponses', data: [{ str: 'weekly' }] }, undefined, context).participantId).toEqual('test');
})

test('testing expression: getPreviousResponses', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test1' } },
          { key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test2' } }
        ]
      },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test3' } },
          { key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test4' } }
        ]
      }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({ name: 'getPreviousResponses', data: [{ str: 'weekly.q1' }] })).toHaveLength(0);
  expect(expEval.eval({ name: 'getPreviousResponses', data: [{ str: 'weekly.q1' }] }, undefined, context)).toHaveLength(2);
})

test('testing expression: filterResponsesByIncludesKeys', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test1' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', items: [{ key: '1' }] }
              ]
            }
          }
        ]
      },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test3' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', items: [{ key: '1' }, { key: '2' }] }
              ]
            }
          }
        ]
      }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({
    name: 'filterResponsesByIncludesKeys', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: '2' },
    ]
  })).toHaveLength(0);

  expect(expEval.eval({
    name: 'filterResponsesByIncludesKeys', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: '2' },
    ]
  }, undefined, context)).toHaveLength(1);

  expect(expEval.eval({
    name: 'filterResponsesByIncludesKeys', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: '1' },
      { str: '2' },
    ]
  }, undefined, context)).toHaveLength(1);

  expect(expEval.eval({
    name: 'filterResponsesByIncludesKeys', data: [
      { exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: '3' },
    ]
  }, undefined, context)).toHaveLength(0);
})

test('testing expression: filterResponsesByValue', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test1' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', value: 'test1' }
              ]
            }
          }
        ]
      },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test3' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', value: 'test2' }
              ]
            }
          }
        ]
      }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({
    name: 'filterResponsesByValue', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: 'test1' },
    ]
  })).toHaveLength(0);

  expect(expEval.eval({
    name: 'filterResponsesByValue', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: 'test1' },
    ]
  }, undefined, context)).toHaveLength(1);

  expect(expEval.eval({
    name: 'filterResponsesByValue', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: 'test2' },
    ]
  }, undefined, context)).toHaveLength(1);

  expect(expEval.eval({
    name: 'filterResponsesByValue', data: [
      { exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
      { str: '1.1' },
      { str: 'test3' },
    ]
  }, undefined, context)).toHaveLength(0);
})


test('testing expression: getLastFromSurveyItemResponses', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test1' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', value: 'test1' }
              ]
            }
          }
        ]
      },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [20], displayed: [10] }, response: { key: '1', value: 'test3' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [20], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1', value: 'test2' }
              ]
            }
          }
        ]
      }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({
    name: 'getLastFromSurveyItemResponses', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } }
    ]
  })).toBeUndefined();

  expect(expEval.eval({
    name: 'getLastFromSurveyItemResponses', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } },
    ]
  }, undefined, context).response.items[0].value).toEqual('test2');
})

test('testing expression: getSecondsSince', () => {
  const context: SurveyContext = {
    previousResponses: [
      { key: 'intake', versionId: 'wfdojsdfpo', submittedAt: 1000000, participantId: 'test', responses: [] },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1200000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: { key: '1', value: 'test1' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [10], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1.1', value: 'test1' }
              ]
            }
          }
        ]
      },
      {
        key: 'weekly', versionId: 'wfdojsdfpo', submittedAt: 1300000, participantId: 'test', responses: [
          { key: 'weekly.q1', meta: { position: 0, rendered: [10], responded: [20], displayed: [10] }, response: { key: '1', value: 'test3' } },
          {
            key: 'weekly.q2', meta: { position: 0, rendered: [10], responded: [Date.now() / 1000 - 100], displayed: [10] }, response: {
              key: '1', items: [
                { key: '1.1', value: 'test2' }
              ]
            }
          }
        ]
      }
    ]
  }

  const expEval = new ExpressionEval();
  expect(expEval.eval({
    name: 'getSecondsSince', data: [
      { dtype: 'num', num: Date.now() / 1000 - 10 }
    ]
  })).toBeGreaterThanOrEqual(10);
  expect(expEval.eval({
    name: 'getSecondsSince', data: [
      { dtype: 'num', num: Date.now() / 1000 - 10 }
    ]
  })).toBeLessThan(30);


  // result is not a number
  expect(expEval.eval({
    name: 'getSecondsSince', data: [
      { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } }
    ]
  })).toBeUndefined();

  const getLastResp: ExpressionArg = {
    dtype: 'exp', exp: {
      name: 'getLastFromSurveyItemResponses', data: [
        { dtype: 'exp', exp: { name: 'getPreviousResponses', data: [{ str: 'weekly.q2' }] } }
      ]
    }
  };

  const getMeta: ExpressionArg = {
    dtype: 'exp', exp: {
      name: 'getAttribute', data: [
        getLastResp,
        { str: 'meta' }
      ]
    }
  };

  const getResponded: ExpressionArg = {
    dtype: 'exp', exp: {
      name: 'getAttribute', data: [
        getMeta,
        { str: 'responded' }
      ]
    }
  };

  const expRes = expEval.eval({
    name: 'getSecondsSince', data: [
      {
        dtype: 'exp', exp: {
          name: 'getArrayItemAtIndex', data: [
            getResponded,
            { dtype: 'num', num: 0 }
          ]
        }
      },
    ]
  }, undefined, context);
  expect(expRes).toBeGreaterThan(90);
  expect(expRes).toBeLessThan(190);
})

test('testing expression: responseHasKeysAny', () => {
  const expEval = new ExpressionEval();
  const testResp: SurveyGroupItemResponse = {
    key: '1',
    items: [
      {
        key: '1.1', response: {
          key: '1',
          items: [{
            key: '1',
            items: [{
              key: '1',
              items: [
                { key: '1' },
                { key: '2' },
                { key: '3' },
              ]
            }]
          }]
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'responseHasKeysAny', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '4' }, { str: '3' },
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAny', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '2' }, { str: '3' }, { str: '1' }
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAny', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAny', data: [
        { str: '1.1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAny', data: [
        { str: '1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();


});

test('testing expression: responseHasKeysAll', () => {
  const expEval = new ExpressionEval();
  const testResp: SurveyGroupItemResponse = {
    key: '1',
    items: [
      {
        key: '1.1', response: {
          key: '1',
          items: [{
            key: '1',
            items: [{
              key: '1',
              items: [
                { key: '1' },
                { key: '2' },
                { key: '3' },
              ]
            }]
          }]
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'responseHasKeysAll', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '4' }, { str: '3' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAll', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '2' }, { str: '3' }, { str: '1' }
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAll', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '1' }, { str: '2' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAll', data: [
        { str: '1.1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasKeysAll', data: [
        { str: '1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();

});

test('testing expression: hasResponse', () => {
  const expEval = new ExpressionEval();
  const testResp: SurveyGroupItemResponse = {
    key: '1',
    items: [
      {
        key: '1.1', response: {
          key: '1',
          items: [{
            key: '1',
            items: [{
              key: '1',
              items: [
                { key: '1' },
                { key: '2' },
                { key: '3' },
              ]
            }]
          }]
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'hasResponse', data: [
        { str: '1.1' }, { str: '1.2' }
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'hasResponse', data: [
        { str: '1.2' }, { str: '1.1' }
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'hasResponse', data: [
        { str: '1.1' }, { str: '1.1' },
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
});

test('testing expression: responseHasOnlyKeysOtherThan', () => {
  const expEval = new ExpressionEval();
  const testResp: SurveyGroupItemResponse = {
    key: '1',
    items: [
      {
        key: '1.1', response: {
          key: '1',
          items: [{
            key: '1',
            items: [{
              key: '1',
              items: [
                { key: '1' },
                { key: '2' },
                { key: '3' },
              ]
            }]
          }]
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'responseHasOnlyKeysOtherThan', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '4' }, { str: '3' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasOnlyKeysOtherThan', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '2' }, { str: '3' }, { str: '1' }
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
  expect(expEval.eval(
    {
      name: 'responseHasOnlyKeysOtherThan', data: [
        { str: '1.1' }, { str: '1.1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
  expect(expEval.eval(
    {
      name: 'responseHasOnlyKeysOtherThan', data: [
        { str: '1.1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeTruthy();
  expect(expEval.eval(
    {
      name: 'responseHasOnlyKeysOtherThan', data: [
        { str: '1' }, { str: '1.1' }, { str: '4' }, { str: '5' },
      ]
    }, undefined, undefined, testResp
  )).toBeFalsy();
});

test('testing expression: hasParticipantFlagKey', () => {
  const expEval = new ExpressionEval();
  const testContext: SurveyContext = {
    participantFlags: {
      test: '2'
    }
  };

  expect(expEval.eval(
    {
      name: 'hasParticipantFlagKey', data: [
        { str: 'test' }
      ]
    }, undefined, testContext
  )).toBeTruthy();

  expect(expEval.eval(
    {
      name: 'hasParticipantFlagKey', data: [
        { str: 'wrong' }
      ]
    }, undefined, testContext
  )).toBeFalsy();
});

test('testing expression: hasParticipantFlagKeyAndValue', () => {
  const expEval = new ExpressionEval();
  const testContext: SurveyContext = {
    participantFlags: {
      test: '2'
    }
  };

  expect(expEval.eval(
    {
      name: 'hasParticipantFlagKeyAndValue', data: [
        { str: 'test' }, { str: '2' }
      ]
    }, undefined, testContext
  )).toBeTruthy();

  expect(expEval.eval(
    {
      name: 'hasParticipantFlagKeyAndValue', data: [
        { str: 'wrong' }, { str: '2' }
      ]
    }, undefined, testContext
  )).toBeFalsy();

  expect(expEval.eval(
    {
      name: 'hasParticipantFlagKeyAndValue', data: [
        { str: 'test' }, { str: 'wrong' }
      ]
    }, undefined, testContext
  )).toBeFalsy();
});

test('testing expression: getParticipantFlagValue', () => {
  const expEval = new ExpressionEval();
  const testContext: SurveyContext = {
    participantFlags: {
      test: '2'
    }
  };

  expect(expEval.eval(
    {
      name: 'getParticipantFlagValue', data: [
        { str: 'test' }
      ]
    }, undefined, testContext
  )).toEqual('2');

  expect(expEval.eval(
    {
      name: 'getParticipantFlagValue', data: [
        { str: 'wrong' }
      ]
    }, undefined, testContext
  )).toBeUndefined();
});


test('testing expression: validateSelectedOptionHasValueDefined', () => {
  const expEval = new ExpressionEval();
  const testSurveyResponses: SurveyItemResponse = {
    key: 'TS',
    meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
    items: [
      {
        key: 'TS.I1',
        meta: { position: 0, localeCode: 'de', rendered: [], displayed: [], responded: [] },
        response: {
          key: 'R1',
          items: [
            { key: 'V1', value: '' },
            { key: 'V2', value: '123.23' },
            { key: 'V3' }
          ]
        }
      }
    ]
  }

  expect(expEval.eval({
    name: 'validateSelectedOptionHasValueDefined', data: [
      { str: 'TS.I1' }, { str: 'R1.V1' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeTruthy();

  expect(expEval.eval({
    name: 'validateSelectedOptionHasValueDefined', data: [
      { str: 'TS.I1' }, { str: 'R1.V2' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeTruthy();

  expect(expEval.eval({
    name: 'validateSelectedOptionHasValueDefined', data: [
      { str: 'TS.I1' }, { str: 'R1.V3' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeFalsy();

  expect(expEval.eval({
    name: 'validateSelectedOptionHasValueDefined', data: [
      { str: 'TS.I1' }, { str: 'R1.V4' },
    ]
  }, undefined, undefined, testSurveyResponses)).toBeTruthy();

})

test('testing expression: dateResponseDiffFromNow', () => {
  const expEval = new ExpressionEval();
  const testResp: SurveyGroupItemResponse = {
    key: '1',
    items: [
      {
        key: '1.1', response: {
          key: '1',
          items: [{
            key: '1',
            items: [{
              key: '1',
              items: [
                { key: '1', dtype: 'date', value: getUnixTime(add(new Date(), { years: -2 })).toString() },
                { key: '2', dtype: 'date', value: getUnixTime(add(new Date(), { months: 18 })).toString() },
                { key: '3', value: '15323422332' },
              ]
            }]
          }]
        }
      }
    ]
  }

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.2' }, { str: '1.1.1.1' }, { str: 'years' }, { num: 1 },
      ]
    }, undefined, undefined, testResp
  )).toBeUndefined();

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.no' }, { str: 'years' }, { num: 1 },
      ]
    }, undefined, undefined, testResp
  )).toBeUndefined();

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.3' }, { str: 'years' }, { num: 1 },
      ]
    }, undefined, undefined, testResp
  )).toBeUndefined();

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.1' }, { str: 'years' }, { num: 1 },
      ]
    }, undefined, undefined, testResp
  )).toEqual(2);

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.1' }, { str: 'months' },
      ]
    }, undefined, undefined, testResp
  )).toEqual(-24);

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.2' }, { str: 'months' },
      ]
    }, undefined, undefined, testResp
  )).toEqual(17);

  expect(expEval.eval(
    {
      name: 'dateResponseDiffFromNow', data: [
        { str: '1.1' }, { str: '1.1.1.2' }, { str: 'years' },
      ]
    }, undefined, undefined, testResp
  )).toEqual(1);
});
 */
