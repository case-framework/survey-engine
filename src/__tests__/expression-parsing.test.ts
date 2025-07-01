import {
  Expression,
  ExpressionType,
  ConstExpression,
  ResponseVariableExpression,
  ContextVariableExpression,
  FunctionExpression,
  JsonExpression,
  JsonConstExpression,
  JsonResponseVariableExpression,
  JsonContextVariableExpression,
  JsonFunctionExpression,
  FunctionExpressionNames,
  ContextVariableType
} from '../expressions';
import { ValueReference } from '../survey/utils/value-reference';

describe('Expression JSON Parsing', () => {
  describe('ConstExpression', () => {
    test('should parse const expression with string value', () => {
      const json: JsonConstExpression = {
        type: ExpressionType.Const,
        value: 'test string'
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toBe('test string');
    });

    test('should parse const expression with number value', () => {
      const json: JsonConstExpression = {
        type: ExpressionType.Const,
        value: 42
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toBe(42);
    });

    test('should parse const expression with boolean value', () => {
      const json: JsonConstExpression = {
        type: ExpressionType.Const,
        value: true
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toBe(true);
    });

    test('should parse const expression with array value', () => {
      const json: JsonConstExpression = {
        type: ExpressionType.Const,
        value: ['a', 'b', 'c']
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toEqual(['a', 'b', 'c']);
    });

    test('should parse const expression with undefined value', () => {
      const json: JsonConstExpression = {
        type: ExpressionType.Const
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ConstExpression);
      expect(expression?.type).toBe(ExpressionType.Const);
      expect((expression as ConstExpression).value).toBeUndefined();
    });

    test('should throw error for invalid const expression type', () => {
      const json = {
        type: ExpressionType.ResponseVariable,
        value: 'test'
      } as unknown as JsonConstExpression;

      expect(() => ConstExpression.fromJson(json)).toThrow('Invalid expression type: responseVariable');
    });
  });

  describe('ResponseVariableExpression', () => {
    test('should parse response variable expression', () => {
      const json: JsonResponseVariableExpression = {
        type: ExpressionType.ResponseVariable,
        variableRef: 'TS.I1...get'
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ResponseVariableExpression);
      expect(expression?.type).toBe(ExpressionType.ResponseVariable);
      expect((expression as ResponseVariableExpression).variableRef).toBe('TS.I1...get');
    });

    test('should throw error for invalid response variable expression type', () => {
      const json = {
        type: ExpressionType.Const,
        variableType: 'string',
        variableRef: 'TS.I1...get'
      } as unknown as JsonResponseVariableExpression;

      expect(() => ResponseVariableExpression.fromJson(json)).toThrow('Invalid expression type: const');
    });
  });

  describe('ContextVariableExpression', () => {
    test('should parse context variable expression', () => {
      const json: JsonContextVariableExpression = {
        type: ExpressionType.ContextVariable,
        contextType: ContextVariableType.Locale
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(ContextVariableExpression);
      expect(expression?.type).toBe(ExpressionType.ContextVariable);
    });

    test('should throw error for invalid context variable expression type', () => {
      const json = {
        type: ExpressionType.Const
      } as unknown as JsonContextVariableExpression;

      expect(() => ContextVariableExpression.fromJson(json)).toThrow('Invalid expression type: const');
    });
  });

  describe('FunctionExpression', () => {
    test('should parse function expression with const arguments', () => {
      const json: JsonFunctionExpression = {
        type: ExpressionType.Function,
        functionName: 'gt',
        arguments: [
          { type: ExpressionType.Const, value: 5 },
          { type: ExpressionType.Const, value: 3 }
        ]
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(FunctionExpression);
      expect(expression?.type).toBe(ExpressionType.Function);
      expect((expression as FunctionExpression).functionName).toBe('gt');
      expect((expression as FunctionExpression).arguments).toHaveLength(2);
      expect((expression as FunctionExpression).arguments[0]).toBeInstanceOf(ConstExpression);
      expect((expression as FunctionExpression).arguments[1]).toBeInstanceOf(ConstExpression);
    });

    test('should parse function expression with mixed arguments', () => {
      const json: JsonFunctionExpression = {
        type: ExpressionType.Function,
        functionName: 'eq',
        arguments: [
          { type: ExpressionType.ResponseVariable, variableRef: 'TS.I1...get' },
          { type: ExpressionType.Const, value: 'expected' }
        ]
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(FunctionExpression);
      expect(expression?.type).toBe(ExpressionType.Function);
      expect((expression as FunctionExpression).functionName).toBe('eq');
      expect((expression as FunctionExpression).arguments).toHaveLength(2);
      expect((expression as FunctionExpression).arguments[0]).toBeInstanceOf(ResponseVariableExpression);
      expect((expression as FunctionExpression).arguments[1]).toBeInstanceOf(ConstExpression);
    });

    test('should parse function expression with nested functions', () => {
      const json: JsonFunctionExpression = {
        type: ExpressionType.Function,
        functionName: 'and',
        arguments: [
          {
            type: ExpressionType.Function,
            functionName: 'gt',
            arguments: [
              { type: ExpressionType.ResponseVariable, variableRef: 'TS.I1...get' },
              { type: ExpressionType.Const, value: 0 }
            ]
          },
          {
            type: ExpressionType.Function,
            functionName: 'lt',
            arguments: [
              { type: ExpressionType.ResponseVariable, variableRef: 'TS.I1...get' },
              { type: ExpressionType.Const, value: 100 }
            ]
          }
        ]
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(FunctionExpression);
      expect(expression?.type).toBe(ExpressionType.Function);
      expect((expression as FunctionExpression).functionName).toBe('and');
      expect((expression as FunctionExpression).arguments).toHaveLength(2);
      expect((expression as FunctionExpression).arguments[0]).toBeInstanceOf(FunctionExpression);
      expect((expression as FunctionExpression).arguments[1]).toBeInstanceOf(FunctionExpression);
    });

    test('should parse function expression with editor config', () => {
      const json: JsonFunctionExpression = {
        type: ExpressionType.Function,
        functionName: 'str_eq',
        arguments: [
          { type: ExpressionType.Const, value: 'test' },
          { type: ExpressionType.Const, value: 'test' }
        ],
        editorConfig: {
          usedTemplate: 'custom-template'
        }
      };

      const expression = Expression.fromJson(json);

      expect(expression).toBeInstanceOf(FunctionExpression);
      expect((expression as FunctionExpression).editorConfig).toEqual({
        usedTemplate: 'custom-template'
      });
    });

    test('should throw error for invalid function expression type', () => {
      const json = {
        type: ExpressionType.Const,
        functionName: 'str_eq',
        arguments: []
      } as unknown as JsonFunctionExpression;

      expect(() => FunctionExpression.fromJson(json)).toThrow('Invalid expression type: const');
    });
  });

  describe('Expression.fromJson with different types', () => {
    test('should parse const expression', () => {
      const json: JsonExpression = {
        type: ExpressionType.Const,
        value: 'test'
      };

      const expression = Expression.fromJson(json);
      expect(expression).toBeInstanceOf(ConstExpression);
    });

    test('should parse response variable expression', () => {
      const json: JsonExpression = {
        type: ExpressionType.ResponseVariable,
        variableRef: 'TS.I1...get'
      };

      const expression = Expression.fromJson(json);
      expect(expression).toBeInstanceOf(ResponseVariableExpression);
    });

    test('should parse context variable expression', () => {
      const json: JsonExpression = {
        type: ExpressionType.ContextVariable,
        contextType: ContextVariableType.Locale
      };

      const expression = Expression.fromJson(json);
      expect(expression).toBeInstanceOf(ContextVariableExpression);
    });

    test('should parse function expression', () => {
      const json: JsonExpression = {
        type: ExpressionType.Function,
        functionName: 'and',
        arguments: []
      };

      const expression = Expression.fromJson(json);
      expect(expression).toBeInstanceOf(FunctionExpression);
    });
  });
});

describe('Response Variable Reference Extraction', () => {
  describe('ConstExpression', () => {
    test('should return empty array for const expression', () => {
      const expression = new ConstExpression('test');
      expect(expression.responseVariableRefs).toEqual([]);
    });

    test('should return empty array for const expression with undefined value', () => {
      const expression = new ConstExpression();
      expect(expression.responseVariableRefs).toEqual([]);
    });
  });

  describe('ResponseVariableExpression', () => {
    test('should return single value reference', () => {
      const expression = new ResponseVariableExpression('TS.I1...get');
      const refs = expression.responseVariableRefs;

      expect(refs).toHaveLength(1);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
    });

    test('should return value reference with complex path', () => {
      const expression = new ResponseVariableExpression('TS.P1.I1...get...SC1');
      const refs = expression.responseVariableRefs;

      expect(refs).toHaveLength(1);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.P1.I1...get...SC1');
    });
  });

  describe('ContextVariableExpression', () => {
    test('should return empty array for context variable expression', () => {
      const expression = new ContextVariableExpression(ContextVariableType.Locale);
      expect(expression.responseVariableRefs).toEqual([]);
    });
  });

  describe('FunctionExpression', () => {
    test('should return empty array for function with only const arguments', () => {
      const expression = new FunctionExpression(FunctionExpressionNames.gt, [
        new ConstExpression(5),
        new ConstExpression(3)
      ]);

      expect(expression.responseVariableRefs).toEqual([]);
    });

    test('should return single reference for function with one response variable', () => {
      const expression = new FunctionExpression(FunctionExpressionNames.eq, [
        new ResponseVariableExpression('TS.I1...get'),
        new ConstExpression('expected')
      ]);

      const refs = expression.responseVariableRefs;
      expect(refs).toHaveLength(1);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
    });

    test('should return multiple references for function with multiple response variables', () => {
      const expression = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          new ResponseVariableExpression('TS.I1...get'),
          new ResponseVariableExpression('TS.I2...get')
        ]);

      const refs = expression.responseVariableRefs;
      expect(refs).toHaveLength(2);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
      expect(refs[1]).toBeInstanceOf(ValueReference);
      expect(refs[1].toString()).toBe('TS.I2...get');
    });

    test('should return references from nested functions', () => {
      const nestedFunction = new FunctionExpression(FunctionExpressionNames.gt, [
        new ResponseVariableExpression('TS.I1...get'),
        new ConstExpression(0)
      ]);

      const expression = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          nestedFunction,
          new ResponseVariableExpression('TS.I2...get')
        ]);

      const refs = expression.responseVariableRefs;
      expect(refs).toHaveLength(2);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
      expect(refs[1]).toBeInstanceOf(ValueReference);
      expect(refs[1].toString()).toBe('TS.I2...get');
    });

    test('should return unique references from complex nested structure', () => {
      const innerFunction1 = new FunctionExpression(FunctionExpressionNames.gt, [
        new ResponseVariableExpression('TS.I1...get'),
        new ConstExpression(0)
      ]);

      const innerFunction2 = new FunctionExpression(FunctionExpressionNames.lt, [
        new ResponseVariableExpression('TS.I1...get'), // Same variable as above
        new ConstExpression(100)
      ]);

      const expression = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          innerFunction1,
          innerFunction2,
          new ResponseVariableExpression('TS.I2...get')
        ]);

      const refs = expression.responseVariableRefs;
      expect(refs).toHaveLength(2); // TS.I1...get appears twice but should be counted once
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
      expect(refs[1]).toBeInstanceOf(ValueReference);
      expect(refs[1].toString()).toBe('TS.I2...get');
    });

    test('should handle function with mixed argument types', () => {
      const expression = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          new ResponseVariableExpression('TS.I1...get'),
          new ConstExpression('true'),
          new ResponseVariableExpression('TS.I2...get'),
          new ConstExpression('false')
        ]
      );

      const refs = expression.responseVariableRefs;
      expect(refs).toHaveLength(2);
      expect(refs[0]).toBeInstanceOf(ValueReference);
      expect(refs[0].toString()).toBe('TS.I1...get');
      expect(refs[1]).toBeInstanceOf(ValueReference);
      expect(refs[1].toString()).toBe('TS.I2...get');
    });
  });

  describe('Complex Expression Scenarios', () => {
    test('should extract all response variable references from complex expression', () => {
      // Create a complex expression: (TS.I1...get > 0) AND (TS.I2...get == 'yes') OR (TS.I3...get < 100)
      const condition1 = new FunctionExpression(FunctionExpressionNames.gt, [
        new ResponseVariableExpression('TS.I1...get'),
        new ConstExpression(0)
      ]);

      const condition2 = new FunctionExpression(FunctionExpressionNames.eq, [
        new ResponseVariableExpression('TS.I2...get'),
        new ConstExpression('yes')
      ]);

      const condition3 = new FunctionExpression(FunctionExpressionNames.lt, [
        new ResponseVariableExpression('TS.I3...get'),
        new ConstExpression(100)
      ]);

      const andExpression = new FunctionExpression(
        FunctionExpressionNames.and,
        [condition1, condition2]
      );
      const orExpression = new FunctionExpression(
        FunctionExpressionNames.or,
        [andExpression, condition3]
      );

      const refs = orExpression.responseVariableRefs;

      expect(refs).toHaveLength(3);
      const refStrings = refs.map(ref => ref.toString()).sort();
      expect(refStrings).toEqual(['TS.I1...get', 'TS.I2...get', 'TS.I3...get']);
    });

    test('should handle deeply nested expressions', () => {
      // Create a deeply nested expression structure
      const level4 = new FunctionExpression(FunctionExpressionNames.gt, [
        new ResponseVariableExpression('TS.I4...get'),
        new ConstExpression(0)
      ]);

      const level3 = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          new ResponseVariableExpression('TS.I3...get'),
          level4
        ]);

      const level2 = new FunctionExpression(
        FunctionExpressionNames.or,
        [
          new ResponseVariableExpression('TS.I2...get'),
          level3
        ]);

      const level1 = new FunctionExpression(FunctionExpressionNames.not, [
        level2
      ]);

      const refs = level1.responseVariableRefs;

      expect(refs).toHaveLength(3);
      const refStrings = refs.map(ref => ref.toString()).sort();
      expect(refStrings).toEqual(['TS.I2...get', 'TS.I3...get', 'TS.I4...get']);
    });
  });
});
