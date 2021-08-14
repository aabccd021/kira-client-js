/* eslint-disable functional/no-let */
import { None, Right } from 'trimop';

import { DocState, InitializingDocState, NotExistsDocState } from '../../src';
import { makeDocState, pReadDoc } from '../generated';

function sleep(milli: number): Promise<unknown> {
  return new Promise((res) => setTimeout(res, milli));
}

describe('DocState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is cool', async () => {
    pReadDoc.mockImplementation(async () => Right({ state: 'notExists' }));
    let state: DocState | undefined;
    const mockedDocListen = jest
      .fn<void, [DocState]>()
      .mockImplementation((docState) => (state = docState));
    const mockedEffect = jest.fn();
    const docState = makeDocState({ col: 'meme', id: 'meme1' });
    const unsubscribe = docState.subscribe(mockedDocListen);
    expect(state).toStrictEqual(InitializingDocState());
    const unsubscribeEffect = docState.effectOnInit();

    await sleep(100);
    expect(mockedDocListen).toHaveBeenCalledTimes(2);
    expect(mockedDocListen).toHaveBeenNthCalledWith(1, InitializingDocState());
    expect(mockedDocListen).toHaveBeenNthCalledWith(
      2,
      NotExistsDocState({ create: expect.any(Function) })
    );
    expect(mockedEffect).toHaveBeenCalledTimes(0);
    expect(unsubscribeEffect).toStrictEqual(None());
    console.log('z');
    expect(state?.state).toStrictEqual('NotExists');
    console.log('p');

    expect(pReadDoc).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
