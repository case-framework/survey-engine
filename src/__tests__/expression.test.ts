import { ExpressionEvaluator } from "../expressions";
import { ConstExpression, Expression, ExpressionEditorConfig, ExpressionType, FunctionExpression, FunctionExpressionNames, ResponseVariableExpression } from "../expressions/expression";
import { ExpectedValueType, ResponseItem, SurveyItemKey, SurveyItemResponse, SurveyItemType, ValueType } from "../survey";
import { ConstBooleanEditor, ConstDateArrayEditor, ConstDateEditor, ConstNumberArrayEditor, ConstNumberEditor, ConstStringArrayEditor, ConstStringEditor } from "../survey-editor/expression-editor";
import { const_string, const_string_array, str_list_contains, response_string, const_number, const_boolean, in_range, sum, min, max, ctx_locale, ctx_pflag_is_defined, ctx_pflag_string, ctx_pflag_num, ctx_pflag_date, ctx_custom_value, ctx_custom_expression } from "../survey-editor/expression-editor-generators";

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
      const editor = str_list_contains(const_string_array('test', 'test2'), const_string('test3'));

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


describe('expression evaluator', () => {
  let expression: Expression;

  beforeEach(() => {
    const editor = str_list_contains(
      const_string_array('option1', 'option2'),
      response_string('survey.question1...get')
    );
    expression = editor.getExpression() as Expression;
  });

  it('if no response is provided, the expression should be false', () => {
    const expEval = new ExpressionEvaluator();
    expect(expEval.eval(expression)).toBeFalsy();
  });

  it('if the response is provided, but the question is not answered, the expression should be false', () => {
    const expEval = new ExpressionEvaluator({
      responses: {},
      surveyContext: {
        locale: 'en'
      }
    });
    expect(expEval.eval(expression)).toBeFalsy();
  });

  it('if the response is provided, and the question is answered, the expression should be true', () => {
    const expEval = new ExpressionEvaluator({
      responses: {
        'survey.question1': new SurveyItemResponse({
          key: SurveyItemKey.fromFullKey('survey.question1'),
          itemType: SurveyItemType.SingleChoiceQuestion,
        }, new ResponseItem('option1'))
      },
      surveyContext: {
        locale: 'en'
      }
    });
    expect(expEval.eval(expression)).toBeTruthy();
  });

  describe('in_range function evaluation', () => {
    it('should return true for value in range (inclusive)', () => {
      const editor = in_range(const_number(5), const_number(1), const_number(10), const_boolean(true));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBeTruthy();
    });

    it('should return true for value at boundary (inclusive)', () => {
      const editor1 = in_range(const_number(1), const_number(1), const_number(10), const_boolean(true));
      const editor2 = in_range(const_number(10), const_number(1), const_number(10), const_boolean(true));
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(editor1.getExpression() as Expression)).toBeTruthy();
      expect(expEval.eval(editor2.getExpression() as Expression)).toBeTruthy();
    });

    it('should return false for value at boundary (exclusive)', () => {
      const editor1 = in_range(const_number(1), const_number(1), const_number(10), const_boolean(false));
      const editor2 = in_range(const_number(10), const_number(1), const_number(10), const_boolean(false));
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(editor1.getExpression() as Expression)).toBeFalsy();
      expect(expEval.eval(editor2.getExpression() as Expression)).toBeFalsy();
    });

    it('should return true for value in range (exclusive)', () => {
      const editor = in_range(const_number(5), const_number(1), const_number(10), const_boolean(false));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBeTruthy();
    });

    it('should return false for value outside range', () => {
      const editor1 = in_range(const_number(0), const_number(1), const_number(10), const_boolean(true));
      const editor2 = in_range(const_number(11), const_number(1), const_number(10), const_boolean(true));
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(editor1.getExpression() as Expression)).toBeFalsy();
      expect(expEval.eval(editor2.getExpression() as Expression)).toBeFalsy();
    });

    it('should return false for undefined values', () => {
      const editor = in_range(response_string('survey.nonexistent...get'), const_number(1), const_number(10), const_boolean(true));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBeFalsy();
    });

    it('should throw error for wrong argument count', () => {
      const expEval = new ExpressionEvaluator();
      const functionExpr = new FunctionExpression(FunctionExpressionNames.in_range, [
        new ConstExpression(5),
        new ConstExpression(1)
      ]);

      expect(() => expEval.eval(functionExpr)).toThrow('In range function expects 4 arguments, got 2');
    });
  });

  describe('sum function evaluation', () => {
    it('should return sum of positive numbers', () => {
      const editor = sum(const_number(1), const_number(2), const_number(3));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(6);
    });

    it('should return sum including negative numbers', () => {
      const editor = sum(const_number(10), const_number(-3), const_number(2));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(9);
    });

    it('should return sum including decimal numbers', () => {
      const editor = sum(const_number(1.5), const_number(2.3), const_number(0.2));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBeCloseTo(4.0);
    });

    it('should handle single argument', () => {
      const editor = sum(const_number(42));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(42);
    });

    it('should skip undefined values', () => {
      const editor = sum(const_number(1), response_string('survey.nonexistent...get'), const_number(3));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(4);
    });

    it('should throw error for non-numeric values', () => {
      const editor = sum(const_number(1), const_string('invalid'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(() => expEval.eval(expression)).toThrow('Sum function expects all arguments to be numbers, got string');
    });
  });

  describe('min function evaluation', () => {
    it('should return minimum of positive numbers', () => {
      const editor = min(const_number(5), const_number(2), const_number(8));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(2);
    });

    it('should return minimum including negative numbers', () => {
      const editor = min(const_number(10), const_number(-3), const_number(2));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(-3);
    });

    it('should return minimum including decimal numbers', () => {
      const editor = min(const_number(1.5), const_number(2.3), const_number(0.2));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(0.2);
    });

    it('should handle single argument', () => {
      const editor = min(const_number(42));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(42);
    });

    it('should skip undefined values', () => {
      const editor = min(const_number(5), response_string('survey.nonexistent...get'), const_number(3));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(3);
    });

    it('should throw error for non-numeric values', () => {
      const editor = min(const_number(1), const_string('invalid'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(() => expEval.eval(expression)).toThrow('Min function expects all arguments to be numbers, got string');
    });

    it('should throw error for no arguments', () => {
      const expEval = new ExpressionEvaluator();
      const functionExpr = new FunctionExpression(FunctionExpressionNames.min, []);

      expect(() => expEval.eval(functionExpr)).toThrow('Min function expects at least 1 argument, got 0');
    });
  });

  describe('max function evaluation', () => {
    it('should return maximum of positive numbers', () => {
      const editor = max(const_number(5), const_number(2), const_number(8));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(8);
    });

    it('should return maximum including negative numbers', () => {
      const editor = max(const_number(-10), const_number(-3), const_number(-5));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(-3);
    });

    it('should return maximum including decimal numbers', () => {
      const editor = max(const_number(1.5), const_number(2.3), const_number(0.2));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(2.3);
    });

    it('should handle single argument', () => {
      const editor = max(const_number(42));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(42);
    });

    it('should skip undefined values', () => {
      const editor = max(const_number(5), response_string('survey.nonexistent...get'), const_number(3));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBe(5);
    });

    it('should throw error for non-numeric values', () => {
      const editor = max(const_number(1), const_string('invalid'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(() => expEval.eval(expression)).toThrow('Max function expects all arguments to be numbers, got string');
    });

    it('should throw error for no arguments', () => {
      const expEval = new ExpressionEvaluator();
      const functionExpr = new FunctionExpression(FunctionExpressionNames.max, []);

      expect(() => expEval.eval(functionExpr)).toThrow('Max function expects at least 1 argument, got 0');
    });
  });
});


describe('Context Expression Evaluation', () => {
  describe('ctx_locale', () => {
    it('should return correct locale value', () => {
      const editor = ctx_locale();
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en-US'
        }
      });

      expect(expEval.eval(expression)).toBe('en-US');
    });

    it('should return correct locale for different locale', () => {
      const editor = ctx_locale();
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'de-DE'
        }
      });

      expect(expEval.eval(expression)).toBe('de-DE');
    });

    it('should return undefined when no survey context', () => {
      const editor = ctx_locale();
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator();

      expect(expEval.eval(expression)).toBeUndefined();
    });
  });

  describe('ctx_pflag_is_defined', () => {
    it('should return false when no flags are defined', () => {
      const editor = ctx_pflag_is_defined(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBe(false);
    });

    it('should return false when participantFlags is undefined', () => {
      const editor = ctx_pflag_is_defined(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: undefined
        }
      });

      expect(expEval.eval(expression)).toBe(false);
    });

    it('should return false when flag key does not exist', () => {
      const editor = ctx_pflag_is_defined(const_string('nonexistent'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBe(false);
    });

    it('should return true when flag exists', () => {
      const editor = ctx_pflag_is_defined(const_string('existing'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBe(true);
    });

    it('should return undefined when key is not a string', () => {
      const editor = ctx_pflag_is_defined(const_number(123));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });
  });

  describe('ctx_pflag_string', () => {
    it('should return undefined when no flags are defined', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when participantFlags is undefined', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: undefined
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when flag key does not exist', () => {
      const editor = ctx_pflag_string(const_string('nonexistent'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return string value when flag exists', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': 'hello world'
          }
        }
      });

      expect(expEval.eval(expression)).toBe('hello world');
    });

    it('should return empty string when flag value is empty', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': ''
          }
        }
      });

      expect(expEval.eval(expression)).toBe('');
    });

    it('should return numeric string as string', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': '123.45'
          }
        }
      });

      expect(expEval.eval(expression)).toBe('123.45');
    });

    it('should handle special characters in flag value', () => {
      const editor = ctx_pflag_string(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': 'value with spaces & symbols!'
          }
        }
      });

      expect(expEval.eval(expression)).toBe('value with spaces & symbols!');
    });

    it('should return undefined when key is not a string', () => {
      const editor = ctx_pflag_string(const_number(123));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });
  });

  describe('ctx_pflag_num', () => {
    it('should return undefined when no flags are defined', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when participantFlags is undefined', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: undefined
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when flag contains non-number string', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': 'not-a-number'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return number when flag contains valid number string', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': '42.5'
          }
        }
      });

      expect(expEval.eval(expression)).toBe(42.5);
    });

    it('should handle negative numbers', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': '-123.45'
          }
        }
      });

      expect(expEval.eval(expression)).toBe(-123.45);
    });

    it('should handle zero', () => {
      const editor = ctx_pflag_num(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': '0'
          }
        }
      });

      expect(expEval.eval(expression)).toBe(0);
    });
  });

  describe('ctx_pflag_date', () => {
    it('should return undefined when no flags are defined', () => {
      const editor = ctx_pflag_date(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when participantFlags is undefined', () => {
      const editor = ctx_pflag_date(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: undefined
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when flag contains non-number string', () => {
      const editor = ctx_pflag_date(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': 'not-a-timestamp'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return Date when flag contains valid posix timestamp', () => {
      const editor = ctx_pflag_date(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const expectedDate = new Date('2023-01-01T00:00:00Z');
      const posixTimestamp = Math.floor(expectedDate.getTime() / 1000);

      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': posixTimestamp.toString()
          }
        }
      });

      expect(expEval.eval(expression)).toEqual(expectedDate);
    });

    it('should handle decimal timestamps', () => {
      const editor = ctx_pflag_date(const_string('test'));
      const expression = editor.getExpression() as Expression;
      const posixTimestamp = 1672531200.5; // 2023-01-01T00:00:00.5Z

      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          participantFlags: {
            'test': posixTimestamp.toString()
          }
        }
      });

      expect(expEval.eval(expression)).toEqual(new Date(posixTimestamp * 1000));
    });
  });

  describe('ctx_custom_value', () => {
    it('should return undefined when customValues is empty', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when customValues is undefined', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: undefined
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when key not found', () => {
      const editor = ctx_custom_value(const_string('nonexistent'), ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'existing': 'value'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return value when key exists and type matches', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': 'hello world'
          }
        }
      });

      expect(expEval.eval(expression)).toBe('hello world');
    });

    it('should return undefined when value type does not match expected type', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.Number);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': 'string value'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should handle number values correctly', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.Number);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': 42.5
          }
        }
      });

      expect(expEval.eval(expression)).toBe(42.5);
    });

    it('should handle boolean values correctly', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.Boolean);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': true
          }
        }
      });

      expect(expEval.eval(expression)).toBe(true);
    });

    it('should handle date values correctly', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.Date);
      const expression = editor.getExpression() as Expression;
      const testDate = new Date('2023-01-01');
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': testDate
          }
        }
      });

      expect(expEval.eval(expression)).toBe(testDate);
    });

    it('should handle string array values correctly', () => {
      const editor = ctx_custom_value(const_string('test'), ExpectedValueType.StringArray);
      const expression = editor.getExpression() as Expression;
      const testArray = ['hello', 'world'];
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customValues: {
            'test': testArray
          }
        }
      });

      expect(expEval.eval(expression)).toEqual(testArray);
    });
  });

  describe('ctx_custom_expression', () => {
    it('should return undefined when customExpressions is empty', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en'
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when customExpressions is undefined', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: undefined
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when expression key not found', () => {
      const editor = ctx_custom_expression(const_string('nonexistent'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'existing': () => 'result'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should return undefined when expression key exists but is not a function', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'test': 'not a function' as any
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should execute custom expression and return correct result', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => 'hello world'
          }
        }
      });

      expect(expEval.eval(expression)).toBe('hello world');
    });

    it('should pass arguments to custom expression', () => {
      const editor = ctx_custom_expression(
        const_string('test'),
        [const_string('arg1'), const_number(42)],
        ExpectedValueType.String
      );
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': (args) => {
              // Custom expressions receive Expression arguments, not evaluated values
              expect(args).toHaveLength(2);
              return 'executed';
            }
          }
        }
      });

      expect(expEval.eval(expression)).toBe('executed');
    });

    it('should return undefined when result type does not match expected type', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.Number);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => 'string result'
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should handle custom expression that throws error', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.String);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => {
              throw new Error('Custom expression error');
            }
          }
        }
      });

      expect(expEval.eval(expression)).toBeUndefined();
    });

    it('should handle number return type correctly', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.Number);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => 42.5
          }
        }
      });

      expect(expEval.eval(expression)).toBe(42.5);
    });

    it('should handle boolean return type correctly', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.Boolean);
      const expression = editor.getExpression() as Expression;
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => true
          }
        }
      });

      expect(expEval.eval(expression)).toBe(true);
    });

    it('should handle date return type correctly', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.Date);
      const expression = editor.getExpression() as Expression;
      const testDate = new Date('2023-01-01');
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => testDate
          }
        }
      });

      expect(expEval.eval(expression)).toBe(testDate);
    });

    it('should handle array return types correctly', () => {
      const editor = ctx_custom_expression(const_string('test'), [], ExpectedValueType.StringArray);
      const expression = editor.getExpression() as Expression;
      const testArray = ['hello', 'world'];
      const expEval = new ExpressionEvaluator({
        responses: {},
        surveyContext: {
          locale: 'en',
          customExpressions: {
            'test': () => testArray
          }
        }
      });

      expect(expEval.eval(expression)).toEqual(testArray);
    });
  });
});
