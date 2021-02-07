import { deploy } from '../deploy/refactor/deploy';
import { helper } from '../deploy/refactor/helper';

describe('Basic', () => {
  before(async () => {
    await deploy();
  });

  it('Should run in parallel', async () => {
    helper.deployments;
    console.log(helper.deployments);
  });
});
