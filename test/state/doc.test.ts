/* eslint-disable functional/no-let */
import { None, Right } from 'trimop';

import { CreatingDocState, DocState, InitializingDocState, NotExistsDocState } from '../../src';
import { makeDocState, MemeImageCDoc, pReadDoc, pSetDoc } from '../generated';

function sleep(milli: number): Promise<unknown> {
  return new Promise((res) => setTimeout(res, milli));
}

describe('DocState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is cool', async () => {
    pReadDoc.mockImplementation(async () => Right({ state: 'notExists' }));
    pSetDoc.mockImplementation(async () => Right({ state: 'notExists' }));
    let memeImageState: DocState | undefined;
    const mockedDocListen = jest
      .fn<void, [DocState]>()
      .mockImplementation((docState) => (memeImageState = docState));

    const docState = makeDocState({ col: 'memeImage', id: 'memeImage1' });
    const unsubscribe = docState.subscribe(mockedDocListen);

    expect(memeImageState).toStrictEqual(InitializingDocState());

    const unsubscribeEffect = docState.effectOnInit();
    await sleep(100);

    expect(unsubscribeEffect).toStrictEqual(None());
    expect(memeImageState).toStrictEqual(NotExistsDocState({ create: expect.any(Function) }));
    expect(pReadDoc).toHaveBeenCalledTimes(1);
    expect(pSetDoc).toHaveBeenCalledTimes(0);

    (memeImageState as NotExistsDocState<MemeImageCDoc>).create({
      image: 'https://',
    });
    expect(memeImageState).toStrictEqual(CreatingDocState());
    await sleep(500);
    expect(pReadDoc).toHaveBeenCalledTimes(1);
    expect(memeImageState).toStrictEqual(CreatingDocState());
    expect(pSetDoc).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
