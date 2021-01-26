import { deployments } from 'hardhat';
import { EscrowFactory } from '../typechain';

export const setup = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  // ensure to start from a fresh deployments
  await deployments.fixture();
  const { deployer, user1 } = await getNamedAccounts();
  const escrowFactory = (await ethers.getContract('EscrowFactory')) as EscrowFactory;

  const addy = escrowFactory.address;

  console.log(addy);

  return {
    escrowFactory: {
      address: addy,
    },
  };
});
