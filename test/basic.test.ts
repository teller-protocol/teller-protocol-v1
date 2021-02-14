import { deployments } from 'hardhat';

describe('Basic', () => {
  before(async () => {
    await deployments.fixture('test');
  });

  it('Should run in parallel', async () => {
    const loanLib = await deployments.get('LoanLib');
    console.log(loanLib.address);
  });
});
