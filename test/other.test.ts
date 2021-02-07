import { expect } from 'chai';
import { TestHelper } from './helper';
import { setupProtocol } from './setup';

describe('Basic', () => {
  let helper: TestHelper;

  before(async () => {
    const { contracts } = await setupProtocol();
    helper = new TestHelper(contracts);
    await helper.setupContracts();
    await helper.setDummyValue('777');
  });

  it('Should run in parallel', async () => {
    const originalDummyValue = await helper.getDummyValue();
    const newValue = '778';
    await helper.setDummyValue(newValue);
    const newValueGot = await helper.getDummyValue();
    console.log({
      originalDummyValue,
      newValue,
      newValueGot,
    });
  });
});
