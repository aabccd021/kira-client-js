/* eslint-disable functional/no-let */
import { None, Option, Right } from 'trimop';

import { DocState } from '../../src';
import { makeDocState, pReadDoc } from '../generated';

describe('DocState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is cool', () => {
    pReadDoc.mockImplementation(async () => Right({ state: 'notExists' }));
    let state: Option<DocState> = None();
    const mockedDocListen = jest
      .fn<void, [Option<DocState>]>()
      .mockImplementation((docState) => (state = docState));
    const mockedEffect = jest.fn();
    const docState = makeDocState({ col: 'meme', id: 'meme1' });
    const unsubscribe = docState.subscribe(mockedDocListen);
    expect(state).toEqual(None());
    const unsubscribeEffect = docState.effectOnInit();
    expect(mockedDocListen).toHaveBeenCalledTimes(1);
    expect(mockedDocListen).toHaveBeenCalledWith(None());
    expect(mockedEffect).toHaveBeenCalledTimes(0);
    expect(unsubscribeEffect).toStrictEqual(None());
    expect(state).toEqual(None());

    expect(pReadDoc).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
