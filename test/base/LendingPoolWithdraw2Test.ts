import { withData } from 'leche';
import { t } from '../utils/consts';
import { lendingPool } from '../utils/events';
import {
  DAIMockInstance,
  LendingPoolMockInstance,
  MockInstance,
  SettingsInstance,
  TTokenInstance,
} from '../../types/truffle-contracts';

contract('LendingPoolWithdrawTest', (accounts: string[]) => {
  let settingsInstance: SettingsInstance;
  let tTokenInstance: TTokenInstance;
  let lendingTokenInstance: DAIMockInstance;
  let loansInstance: MockInstance;
  let lendingPoolInstance: LendingPoolMockInstance;

  beforeEach(async () => {
    settingsInstance = await artifacts.require('Settings').new();
    tTokenInstance = await artifacts
      .require('TToken')
      .new(settingsInstance.address, 'Teller DAI', 'TDAI', 18);
    lendingTokenInstance = await artifacts.require('DAIMock').new();
    loansInstance = await artifacts.require('Mock').new();

    lendingPoolInstance = await artifacts.require('LendingPoolMock').new();
    await lendingPoolInstance.mockRequireIsLoan(true);

    await tTokenInstance.addMinter(lendingPoolInstance.address);

    await lendingPoolInstance.methods['initialize(address,address,address,address)'](
      tTokenInstance.address,
      lendingTokenInstance.address,
      loansInstance.address,
      settingsInstance.address
    );
  });

  it('Should claim all tokens in the pool due to one lender and no repayments', async () => {
    await lendingTokenInstance.approve(lendingPoolInstance.address, 50, {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit(50, { from: accounts[0] });
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[0] });
    lendingPool.tokenWithdrawn(result).emitted(accounts[0], 50);
  });

  it('Should withdraw a proportional amount due to multiple lenders and no repayments', async () => {
    // Transfer to second account
    await lendingTokenInstance.transfer(accounts[1], 100);

    // First account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, 50, {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit(50, { from: accounts[0] });

    // Second Account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, 100, {
      from: accounts[1],
    });
    await lendingPoolInstance.deposit(100, { from: accounts[1] });

    // Withdraw all from second account
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[1] });
    lendingPool.tokenWithdrawn(result).emitted(accounts[1], 100);
  });

  it('Should withdraw all interest due to single lender and repayments', async () => {
    const depositAmount = BigInt(5000e18);
    const repayPrincipalAmount = BigInt(100e18);
    const repayInterestAmount = BigInt(20e18);

    await lendingTokenInstance.approve(
      lendingPoolInstance.address,
      depositAmount.toString(),
      {
        from: accounts[0],
      }
    );
    await lendingPoolInstance.deposit(depositAmount.toString(), { from: accounts[0] });

    // Repay
    await lendingTokenInstance.approve(
      lendingPoolInstance.address,
      (repayPrincipalAmount + repayInterestAmount).toString()
    );
    await lendingPoolInstance.repay(
      repayPrincipalAmount.toString(),
      repayInterestAmount.toString(),
      accounts[0]
    );

    // Withdraw all
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[0] });

    lendingPool
      .tokenWithdrawn(result)
      .emitted(accounts[0], depositAmount + repayInterestAmount);
  });

  it('Should withdraw proportional amount of interest due to multiple lenders and repayments', async () => {
    const lender1Amount = (50e18).toString();
    const lender2Amount = (100e18).toString();
    const principalAmount = (50e18).toString();
    const interestAmount = (10e18).toString();
    const repaymentAmount = (60e18).toString();

    // Transfer to second account
    await lendingTokenInstance.transfer(accounts[1], lender2Amount.toString());

    // First account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, lender1Amount, {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit(lender1Amount, { from: accounts[0] });

    // Second Account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, lender2Amount, {
      from: accounts[1],
    });
    await lendingPoolInstance.deposit(lender2Amount, { from: accounts[1] });

    // Repay
    await lendingTokenInstance.approve(lendingPoolInstance.address, repaymentAmount);
    await lendingPoolInstance.repay(principalAmount, interestAmount, accounts[0]);

    // Withdraw all
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[1] });

    lendingPool
      .tokenWithdrawn(result)
      .emitted(accounts[1], BigInt('106666666666666666666'));
  });
});
