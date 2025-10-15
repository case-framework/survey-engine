import { parseStudyVariableValues } from '../utils';
import { StudyVariable } from '../data_types';

describe('parseStudyVariableValues', () => {
  test('converts date string to Date and leaves others intact', () => {
    const input: { [key: string]: StudyVariable } = {
      // date provided as ISO string -> should be converted to Date
      studyStartAt: { type: 'date', value: '2020-01-01T00:00:00.000Z' as any },
      // date already a Date -> should be preserved
      studyEndAt: { type: 'date', value: new Date('2020-12-31T23:59:59.000Z') as any },
      // non-date types -> should be passed through unchanged
      enrollmentOpen: { type: 'boolean', value: true },
      targetSampleSize: { type: 'int', value: 100 },
      targetResponseRate: { type: 'float', value: 0.5 },
      studyTitle: { type: 'string', value: 'Hello' },
    };

    const result = parseStudyVariableValues(input);

    expect(Object.keys(result).sort()).toEqual([
      'enrollmentOpen',
      'studyEndAt',
      'studyStartAt',
      'studyTitle',
      'targetResponseRate',
      'targetSampleSize',
    ].sort());

    // date string converted
    expect(result.studyStartAt.type).toBe('date');
    expect(result.studyStartAt.value instanceof Date).toBe(true);
    expect((result.studyStartAt.value as Date).toISOString()).toBe('2020-01-01T00:00:00.000Z');

    // existing Date preserved
    expect(result.studyEndAt.type).toBe('date');
    expect(result.studyEndAt.value instanceof Date).toBe(true);
    expect((result.studyEndAt.value as Date).toISOString()).toBe('2020-12-31T23:59:59.000Z');

    // non-date types unchanged
    expect(result.enrollmentOpen).toEqual({ type: 'boolean', value: true });
    expect(result.targetSampleSize).toEqual({ type: 'int', value: 100 });
    expect(result.targetResponseRate).toEqual({ type: 'float', value: 0.5 });
    expect(result.studyTitle).toEqual({ type: 'string', value: 'Hello' });
  });

  test('skips keys with undefined or null values', () => {
    const input: { [key: string]: StudyVariable } = {
      a: { type: 'string', value: 'ok' },
      b: { type: 'string', value: undefined as any },
      c: { type: 'date', value: null as any },
      d: { type: 'int', value: 1 },
    };

    const result = parseStudyVariableValues(input);

    expect(result).toEqual({
      a: { type: 'string', value: 'ok' },
      d: { type: 'int', value: 1 },
    });
    expect('b' in result).toBe(false);
    expect('c' in result).toBe(false);
  });
});


