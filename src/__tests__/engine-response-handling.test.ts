import { SurveyEngineCore } from '../engine/engine';
import { Survey } from '../survey/survey';
import { GroupItem, SurveyItemType } from '../survey/items/survey-item';
import { ResponseItem, JsonSurveyItemResponse } from '../survey/responses/item-response';
import { ResponseMeta } from '../survey/responses/response-meta';
import { SurveyEditor } from '../survey-editor';

describe('SurveyEngineCore response handling', () => {
  function makeSurveyWithQuestions(keys: string[]): Survey {
    const rootKey = 'test-survey';
    const survey = new Survey(rootKey);
    const editor = new SurveyEditor(survey);

    for (const key of keys) {
      editor.initNewItem({ parentKey: rootKey }, SurveyItemType.SingleChoiceQuestion, key);
    }
    return survey;
  }

  function getMetaArray(meta: ResponseMeta | undefined, type: 'responded' | 'displayed'): number[] {
    if (!meta) return [];
    const json = meta.toJson();
    switch (type) {
      case 'responded': return json.responded;
      case 'displayed': return json.displayed;
    }
  }

  it('initializes responses for all items', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const engine = new SurveyEngineCore(survey);
    const responses = engine.getResponses();
    expect(responses.length).toBe(2);
    expect(responses[0].key.fullKey).toBe('test-survey.q1');
    expect(responses[1].key.fullKey).toBe('test-survey.q2');
  });

  it('setResponse updates the response and meta', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const engine = new SurveyEngineCore(survey);
    engine.setResponse('test-survey.q1', new ResponseItem('foo'));
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('foo');
    expect(resp?.meta).toBeDefined();
    expect(getMetaArray(resp?.meta, 'responded').length).toBeGreaterThan(0);
  });

  it('prefills are not used if wrong type provided', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.Display, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response).toBeUndefined();
    // q2 should not be prefilled
    expect(engine.getResponseItem('test-survey.q2')?.response).toBeUndefined();
  });

  it('prefills are used if provided', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.SingleChoiceQuestion, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('prefilled');
    // q2 should not be prefilled
    expect(engine.getResponseItem('test-survey.q2')?.response).toBeUndefined();
  });

  it('setResponse overwrites prefill', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.Display, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    engine.setResponse('test-survey.q1', new ResponseItem('newval'));
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('newval');
  });

  it('ResponseMeta tracks rendered, displayed, responded', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const engine = new SurveyEngineCore(survey);
    engine.setResponse('test-survey.q1', new ResponseItem('foo'));
    engine.onQuestionDisplayed('test-survey.q1');
    const resp = engine.getResponseItem('test-survey.q1');
    expect(getMetaArray(resp?.meta, 'responded').length).toBeGreaterThan(0);
    expect(getMetaArray(resp?.meta, 'displayed').length).toBeGreaterThan(0);
  });
});
