import { ethers } from 'hardhat';
import { Dummy__factory } from '../typechain';

export async function setupProtocol() {
  const dummyFactory = (await ethers.getContractFactory('Dummy')) as Dummy__factory;
  const dummy = await dummyFactory.deploy();
  return {
    contracts: {
      dummy: dummy.address,
    },
  };
}
