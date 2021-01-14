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
    const balanceBeforeDeposit = await lendingTokenInstance.balanceOf(accounts[0]);
    await lendingTokenInstance.approve(lendingPoolInstance.address, 50, {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit(50, { from: accounts[0] });
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[0] });
    const balanceAfterWithdrawal = await lendingTokenInstance.balanceOf(accounts[0]);
    assert(balanceBeforeDeposit.toString() == balanceAfterWithdrawal.toString());
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
    const balanceBeforeDeposit = await lendingTokenInstance.balanceOf(accounts[1]);
    await lendingTokenInstance.approve(
      lendingPoolInstance.address,
      balanceBeforeDeposit,
      { from: accounts[1] }
    );
    await lendingPoolInstance.deposit(balanceBeforeDeposit, { from: accounts[1] });

    // Withdraw all from second account
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[1] });
    const balanceAfterWithdrawal = await lendingTokenInstance.balanceOf(accounts[1]);
    assert(balanceBeforeDeposit.toString() == balanceAfterWithdrawal.toString());
    lendingPool.tokenWithdrawn(result).emitted(accounts[1], balanceBeforeDeposit);
  });

  it('Should withdraw all interest due to single lender and repayments', async () => {
    await lendingTokenInstance.approve(lendingPoolInstance.address, 50, {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit(50, { from: accounts[0] });

    // Repay
    await lendingTokenInstance.approve(lendingPoolInstance.address, 70);
    await lendingPoolInstance.repay(20, 50, accounts[0]);

    // Withdraw all
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[0] });

    lendingPool.tokenWithdrawn(result).emitted(accounts[0], 100);
  });

  it('Should withdraw proportional amount of interest due to multiple lenders and repayments', async () => {
    // Transfer to second account
    await lendingTokenInstance.transfer(accounts[1], (100e18).toString());

    // First account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, (50e18).toString(), {
      from: accounts[0],
    });
    await lendingPoolInstance.deposit((50e18).toString(), { from: accounts[0] });

    // Second Account deposits
    await lendingTokenInstance.approve(lendingPoolInstance.address, (100e18).toString(), {
      from: accounts[1],
    });
    await lendingPoolInstance.deposit((100e18).toString(), { from: accounts[1] });

    // Repay
    await lendingTokenInstance.approve(lendingPoolInstance.address, (60e18).toString());
    await lendingPoolInstance.repay((50e18).toString(), (10e18).toString(), accounts[0]);

    // Withdraw all
    const result = await lendingPoolInstance.withdrawAll({ from: accounts[1] });

    lendingPool
      .tokenWithdrawn(result)
      .emitted(accounts[1], Math.floor(100e18 + (10e18 * 100e18) / 150e18).toString());
  });
});
