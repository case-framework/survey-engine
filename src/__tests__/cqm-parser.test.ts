import { parseCQM } from '../cqm-parser';

describe('CQM Parser', () => {
  describe('Basic formatting', () => {
    test('should parse plain text without formatting', () => {
      const result = parseCQM('Hello world');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Hello world'
      });
    });

    test('should parse bold text with **', () => {
      const result = parseCQM('**bold text**');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold text'
      });
    });

    test('should parse underlined text with __', () => {
      const result = parseCQM('__underlined text__');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: true,
        primary: false,
        italic: false,
        content: 'underlined text'
      });
    });

    test('should parse primary text with !!', () => {
      const result = parseCQM('!!primary text!!');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: true,
        italic: false,
        content: 'primary text'
      });
    });

    test('should parse italic text with //', () => {
      const result = parseCQM('//italic text//');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: true,
        content: 'italic text'
      });
    });

    test('should treat expressions as literal text', () => {
      const result = parseCQM('Hello {{name}}, welcome!');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Hello {{name}}, welcome!'
      });
    });

    test('should treat expressions with whitespace as literal text', () => {
      const result = parseCQM('Hello {{ name }}, welcome!');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Hello {{ name }}, welcome!'
      });
    });
  });

  describe('Mixed content', () => {
    test('should parse text with multiple formatting types', () => {
      const result = parseCQM('Normal **bold** __underlined__ !!primary!! //italic//');
      expect(result).toHaveLength(8);

      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Normal '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold'
      });

      expect(result[2]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' '
      });

      expect(result[3]).toEqual({
        bold: false,
        underline: true,
        primary: false,
        italic: false,
        content: 'underlined'
      });

      expect(result[4]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' '
      });

      expect(result[5]).toEqual({
        bold: false,
        underline: false,
        primary: true,
        italic: false,
        content: 'primary'
      });

      expect(result[6]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' '
      });

      expect(result[7]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: true,
        content: 'italic'
      });
    });

    test('should parse text with expressions and formatting', () => {
      const result = parseCQM('Hello **John** and __welcome {{name}}__');
      expect(result).toHaveLength(4);

      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Hello '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'John'
      });

      expect(result[2]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' and '
      });

      expect(result[3]).toEqual({
        bold: false,
        underline: true,
        primary: false,
        italic: false,
        content: 'welcome {{name}}'
      });
    });
  });

  describe('Nested formatting', () => {
    test('should handle nested bold and underline', () => {
      const result = parseCQM('**bold __and underlined__ text**');
      expect(result).toHaveLength(3);

      expect(result[0]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: true,
        primary: false,
        italic: false,
        content: 'and underlined'
      });

      expect(result[2]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: ' text'
      });
    });

    test('should handle multiple nested formatting', () => {
      const result = parseCQM('**bold //italic !!primary!! text// end**');
      expect(result).toHaveLength(5);

      expect(result[0]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: true,
        content: 'italic '
      });

      expect(result[2]).toEqual({
        bold: true,
        underline: false,
        primary: true,
        italic: true,
        content: 'primary'
      });

      expect(result[3]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: true,
        content: ' text'
      });

      expect(result[4]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: ' end'
      });
    });
  });

  describe('Toggle behavior', () => {
    test('should toggle formatting on and off', () => {
      const result = parseCQM('normal **bold** normal **bold again**');
      expect(result).toHaveLength(4);

      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'normal '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold'
      });

      expect(result[2]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' normal '
      });

      expect(result[3]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold again'
      });
    });

    test('should handle unclosed formatting tags', () => {
      const result = parseCQM('**bold text without closing');
      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'bold text without closing'
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle empty string', () => {
      const result = parseCQM('');
      expect(result).toHaveLength(0);
    });

    test('should handle string with only formatting markers', () => {
      const result = parseCQM('****');
      expect(result).toHaveLength(0);
    });

    test('should handle expressions as literal text', () => {
      const result = parseCQM('{{incomplete expression');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '{{incomplete expression'
      });
    });

    test('should handle empty expressions as literal text', () => {
      const result = parseCQM('{{}}');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '{{}}'
      });
    });

    test('should handle single characters', () => {
      const result = parseCQM('*');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '*'
      });
    });

    test('should handle consecutive formatting markers', () => {
      const result = parseCQM('**__!!//text//__!!**');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: true,
        underline: true,
        primary: true,
        italic: true,
        content: 'text'
      });
    });

    test('should handle mixed single and double markers', () => {
      const result = parseCQM('*bold* __underline__');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '*bold* '
      });
      expect(result[1]).toEqual({
        bold: false,
        underline: true,
        primary: false,
        italic: false,
        content: 'underline'
      });
    });

    test('should handle expressions with special characters as literal text', () => {
      const result = parseCQM('{{expression_with-special.chars123}}');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '{{expression_with-special.chars123}}'
      });
    });

    test('should handle multiple expressions as literal text', () => {
      const result = parseCQM('{{first}} and {{second}}');
      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '{{first}} and {{second}}'
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('should parse complex survey text with expressions as literal text', () => {
      const result = parseCQM('Dear **John**, please answer the following __important__ question about !!{{topic}}!!. //Note: this is confidential.//');
      expect(result).toHaveLength(8);

      expect(result[0]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: 'Dear '
      });

      expect(result[1]).toEqual({
        bold: true,
        underline: false,
        primary: false,
        italic: false,
        content: 'John'
      });

      expect(result[2]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ', please answer the following '
      });

      expect(result[3]).toEqual({
        bold: false,
        underline: true,
        primary: false,
        italic: false,
        content: 'important'
      });

      expect(result[4]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: ' question about '
      });

      expect(result[5]).toEqual({
        bold: false,
        underline: false,
        primary: true,
        italic: false,
        content: '{{topic}}'
      });

      expect(result[6]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: false,
        content: '. '
      });

      expect(result[7]).toEqual({
        bold: false,
        underline: false,
        primary: false,
        italic: true,
        content: 'Note: this is confidential.'
      });
    });
  });
});
