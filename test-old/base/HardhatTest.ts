import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { DAIMock, DAIMock__factory } from '../../typechain';

describe('Hardhat', () => {
  let daiMock: DAIMock;
  let accounts: Signer[];

  before(async () => {
    const DaiMockFactory = (await ethers.getContractFactory(
      'DAIMock'
    )) as DAIMock__factory;
    daiMock = await DaiMockFactory.deploy();
    accounts = await ethers.getSigners();
  });

  it('should work for a simple contract', async () => {
    const account2Address = await accounts[1].getAddress();
    const transferTransaction = await daiMock.transfer(account2Address, 100);
    const transferTxHash = await transferTransaction.wait();
    console.log({ transferTxHash });
    const balanceOf = await daiMock.balanceOf(account2Address);
    console.log({ balanceOf: balanceOf.toString() });
    assert(balanceOf.toString() == '100', 'Bad balanceOf');
  });
});
