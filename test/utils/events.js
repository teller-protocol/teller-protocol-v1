// @dev see details on https://www.npmjs.com/package/truffle-assertions
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');
const assert = require('assert');

const emitted = (tx, eventName, assertFunction) => {
    truffleAssert.eventEmitted(tx, eventName, event => {
        assertFunction(event);
        return true;
    });
};

const notEmitted = (tx, eventName, assertFunction) => {
    truffleAssert.eventNotEmitted(tx, eventName, event => {
        assertFunction(event);
        return true;
    });
}

module.exports = {
    uniswap: {
        uniswapSwapped: tx => {
            const name = 'UniswapSwapped';
            return {
                name: name,
                emitted: (sourceToken, destinationToken, sourceAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.sourceToken, sourceToken, 'sourceToken does not match', 'sourceToken does not match');
                    assert.equal(ev.destinationToken, destinationToken, 'destinationToken does not match', 'destinationToken does not match');
                    assert.equal(ev.sourceAmount, sourceAmount, 'sourceAmount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    compound: {
        compoundLended: tx => {
            const name = 'CompoundLended';
            return {
                name: name,
                emitted: (tokenAddress, cTokenAddress, amount, tokenBalance, cTokenBalance) => emitted(tx, name, ev => {
                    assert.equal(ev.tokenAddress, tokenAddress, 'tokenAddress does not match');
                    assert.equal(ev.cTokenAddress, cTokenAddress, 'cTokenAddress does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                    assert.equal(ev.tokenBalance.toString(), tokenBalance.toString(), 'tokenBalance does not match');
                    assert.equal(ev.cTokenBalance.toString(), cTokenBalance.toString(), 'cTokenBalance does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        compoundRedeemed: tx => {
            const name = 'CompoundRedeemed';
            return {
                name: name,
                emitted: (tokenAddress, cTokenAddress, amount, isUnderlyingAmount, tokenBalance, cTokenBalance) => emitted(tx, name, ev => {
                    assert.equal(ev.tokenAddress, tokenAddress, 'tokenAddress does not match');
                    assert.equal(ev.cTokenAddress, cTokenAddress, 'cTokenAddress does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                    assert.equal(ev.isUnderlyingAmount, isUnderlyingAmount, 'isUnderlyingAmount does not match');
                    assert.equal(ev.tokenBalance.toString(), tokenBalance.toString(), 'tokenBalance does not match');
                    assert.equal(ev.cTokenBalance.toString(), cTokenBalance.toString(), 'cTokenBalance does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },        
    },
    erc20: {
        transfer: tx => {
            const name = 'Transfer';
            return {
                name: name,
                emitted: (from, to, value) => emitted(tx, name, ev => {
                    assert.equal(ev.from, from, 'from does not match');
                    assert.equal(ev.to, to, 'to does not match');
                    assert.equal(ev.value.toString(), value.toString(), 'value does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    lendingPool: {
        tokenDeposited: tx => {
            const name = 'TokenDeposited';
            return {
                name: name,
                emitted: (sender, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(
                        BigNumber(ev.amount.toString()).toFixed(),
                        BigNumber(amount.toString()).toFixed());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        tokenWithdrawn: tx => {
            const name = 'TokenWithdrawn';
            return {
                name: name,
                emitted: (sender, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        paymentLiquidated: tx => {
            const name = 'PaymentLiquidated';
            return {
                name: name,
                emitted: (liquidator, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.liquidator, liquidator, 'liquidator does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        tokenRepaid: tx => {
            const name = 'TokenRepaid';
            return {
                name: name,
                emitted: (borrower, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        interestWithdrawn: tx => {
            const name = 'InterestWithdrawn';
            return {
                name: name,
                emitted: (lender, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.lender, lender, 'lender does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    loans: {
        loanTermsSet: tx => {
            const name = 'LoanTermsSet';
            return {
                name: name,
                emitted: (loanID, borrower, recipient, interestRate, collateralRatio, maxLoanAmount, duration, expiry) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.recipient, recipient, 'recipient does not match');
                    assert.equal(ev.interestRate.toString(), interestRate.toString(), 'interestRate does not match');
                    assert.equal(ev.collateralRatio.toString(), collateralRatio.toString(), 'collateralRatio does not match');
                    assert.equal(ev.maxLoanAmount.toString(), maxLoanAmount.toString(), 'maxLoanAmount does not match');
                    assert.equal(ev.duration.toString(), duration.toString(), 'duration does not match');
                    assert.equal(ev.termsExpiry.toString(), expiry.toString(), 'termsExpiry does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanTakenOut: tx => {
            const name = 'LoanTakenOut';
            return {
                name: name,
                emitted: (loanID, borrower, escrow, amountBorrowed) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.escrow, escrow, 'escrow does not match');
                    assert.equal(ev.amountBorrowed.toString(), amountBorrowed.toString(), 'amountBorrowed does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        collateralDeposited: tx => {
            const name = 'CollateralDeposited';
            return {
                name: name,
                emitted: (loanID, borrower, depositAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.depositAmount.toString(), depositAmount.toString(), 'depositAmount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        collateralWithdrawn: tx => {
            const name = 'CollateralWithdrawn';
            return {
                name: name,
                emitted: (loanID, borrower, withdrawalAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.withdrawalAmount.toString(), withdrawalAmount.toString(), 'withdrawalAmount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanRepaid: tx => {
            const name = 'LoanRepaid';
            return {
                name: name,
                emitted: (loanID, borrower, amountPaid, payer, totalOwed) => emitted (tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.amountPaid.toString(), BigNumber(amountPaid.toString()).toFixed(0), 'amountPaid does not match');
                    assert.equal(ev.payer, payer, 'payer does not match');
                    assert.equal(ev.totalOwed.toString(), BigNumber(totalOwed.toString()).toFixed(0), 'totalOwed does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanLiquidated: tx => {
            const name = 'LoanLiquidated';
            return {
                name: name,
                emitted: (loanID, borrower, liquidator, collateralOut, tokensIn) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                    assert.equal(ev.borrower, borrower, 'borrower does not match');
                    assert.equal(ev.liquidator, liquidator, 'liquidator does not match');
                    assert.equal(
                        ev.collateralOut.toString(),
                        BigNumber(collateralOut.toString()).toFixed(0)
                    );
                    assert.equal(
                        ev.tokensIn.toString(),
                        BigNumber(tokensIn.toString()).toFixed(0)
                    );
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        priceOracleUpdated: tx => {
            const name = 'PriceOracleUpdated';
            return {
                name: name,
                emitted: (sender, oldPriceOracle, newPriceOracle) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.oldPriceOracle, oldPriceOracle, 'oldPriceOracle does not match');
                    assert.equal(ev.newPriceOracle, newPriceOracle, 'newPriceOracle does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    loanTermsConsensus: {
        termsSubmitted: tx => {
            const name = 'TermsSubmitted';
            return {
                name: name,
                emitted: (signer, borrower, requestNonce, signerNonce, interestRate, collateralRatio, maxLoanAmount) => truffleAssert.eventEmitted(tx, name, ev => {
                    return (
                        ev.signer === signer && 
                        ev.borrower === borrower &&
                        ev.requestNonce.toString() === requestNonce.toString() &&
                        ev.signerNonce.toString() === signerNonce.toString() &&
                        ev.interestRate.toString() === interestRate.toString() &&
                        ev.collateralRatio.toString() === collateralRatio.toString() &&
                        ev.maxLoanAmount.toString() === maxLoanAmount.toString()
                    )
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        termsAccepted: tx => {
            const name = 'TermsAccepted';
            return {
                name: name,
                emitted: (borrower, requestNonce, interestRate, collateralRatio, maxLoanAmount) => truffleAssert.eventEmitted(tx, name, ev => {
                  return (
                        ev.borrower === borrower &&
                        ev.requestNonce.toString() === requestNonce.toString() &&
                        ev.interestRate.toString() === interestRate.toString() &&
                        ev.collateralRatio.toString() === collateralRatio.toString() &&
                        ev.maxLoanAmount.toString() === maxLoanAmount.toString()
                    )
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    tlrToken: {
        newCap: tx => {
            const name = 'NewCap';
            return {
                name: name,
                emitted: (newCap) => emitted(tx, name, ev => {
                    assert.equal(ev.newCap, newCap, 'newCap does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        newVesting: tx => {
            const name = "NewVesting";
            return {
                name: name,
                emitted: (beneficiary, amount, deadline) => emitted(tx, name, ev => {
                    assert.equal(ev.beneficiary, beneficiary, 'beneficiary does not match');
                    assert.equal(ev.amount, amount, 'amount does not match');
                    assert.equal(ev.deadline, deadline, 'deadline does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        vestingClaimed: tx => {
            const name = "VestingClaimed";
            return {
                name: name,
                emitted: (beneficiary, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.beneficiary, beneficiary, 'beneficiary does not match');
                    assert.equal(ev.amount, amount, 'amount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        revokeVesting: tx => {
            const name = "RevokeVesting";
            return {
                name: name,
                emitted: (account, unvestedTokens, deadline) => emitted(tx, name, ev => {
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                    assert.equal(ev.unvestedTokens.toString(), unvestedTokens.toString(), 'unvestedTokens does not match');
                    assert.equal(ev.deadline.toString(), deadline.toString(), 'deadline does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction) 
            };
        },
        snapshot: tx => {
            const name = 'Snapshot';
            return {
                name: name,
                emitted: (id) => emitted(tx, name, ev => {
                    assert.equal(ev.id, id, 'id does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    settings: {
        lendingPoolPaused: tx => {
            const name = 'LendingPoolPaused';
            return {
                name: name,
                emitted: (account, lendingPoolAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account, 'account does not match');
                    assert.equal(ev.lendingPoolAddress, lendingPoolAddress, 'lendingPoolAddress does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        lendingPoolUnpaused: tx => {
            const name = 'LendingPoolUnpaused';
            return {
                name: name,
                emitted: (account, lendingPoolAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account, 'account does not match');
                    assert.equal(ev.lendingPoolAddress, lendingPoolAddress, 'lendingPoolAddress does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsCreated: tx => {
            const name = 'AssetSettingsCreated';
            return {
                name: name,
                emitted: (sender, assetAddress, cTokenAddress, maxLoanAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString(), 'assetAddress does not match');
                    assert.equal(ev.cTokenAddress.toString(), cTokenAddress.toString(), 'cTokenAddress does not match');
                    assert.equal(ev.maxLoanAmount.toString(), maxLoanAmount.toString(), 'maxLoanAmount does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsAddressUpdated: tx => {
            const name = 'AssetSettingsAddressUpdated';
            return {
                name: name,
                emitted: (assetSettingName, sender, assetAddress, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.assetSettingName.toString(), assetSettingName.toString(), 'assetSettingName does not match');
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString(), 'assetAddress does not match');
                    assert.equal(ev.oldValue.toString(), oldValue.toString(), 'oldValue does not match');
                    assert.equal(ev.newValue.toString(), newValue.toString(), 'newValue does not match', 'newValue does not match');

                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsUintUpdated: tx => {
            const name = 'AssetSettingsUintUpdated';
            return {
                name: name,
                emitted: (assetSettingName, sender, assetAddress, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.assetSettingName.toString(), assetSettingName.toString(), 'assetSettingName does not match');
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString(), 'assetAddress does not match');
                    assert.equal(ev.oldValue.toString(), oldValue.toString(), 'oldValue does not match');
                    assert.equal(ev.newValue.toString(), newValue.toString(), 'newValue does not match');

                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsRemoved: tx => {
            const name = 'AssetSettingsRemoved';
            return {
                name: name,
                emitted: (sender, assetAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString(), 'assetAddress does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingCreated: tx => {
            const name = 'PlatformSettingCreated';
            return {
                name: name,
                emitted: (settingName, sender, value, minValue, maxValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString(), 'settingName does not match');
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.value.toString(), value.toString(), 'value does not match');
                    assert.equal(ev.minValue.toString(), minValue.toString(), 'minValue does not match');
                    assert.equal(ev.maxValue.toString(), maxValue.toString(), 'maxValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingUpdated: tx => {
            const name = 'PlatformSettingUpdated';
            return {
                name: name,
                emitted: (settingName, sender, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString(), 'settingName does not match');
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.oldValue.toString(), oldValue.toString(), 'oldValue does not match');
                    assert.equal(ev.newValue.toString(), newValue.toString(), 'newValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingRemoved: tx => {
            const name = 'PlatformSettingRemoved';
            return {
                name: name,
                emitted: (settingName, sender, lastValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString(), 'settingName does not match');
                    assert.equal(ev.lastValue.toString(), lastValue.toString(), 'lastValue does not match');
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    atmGovernance: {
        generalSettingAdded: tx => {
            const name = 'GeneralSettingAdded';
            return {
                name: name,
                emitted: (sender, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.settingValue, settingValue, 'settingValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        generalSettingUpdated: tx => {
            const name = 'GeneralSettingUpdated';
            return {
                name: name,
                emitted: (sender, settingName, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.oldValue, oldValue, 'oldValue does not match');
                    assert.equal(ev.newValue, newValue, 'newValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        generalSettingRemoved: tx => {
            const name = 'GeneralSettingRemoved';
            return {
                name: name,
                emitted: (sender, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.settingValue, settingValue, 'settingValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingAdded: tx => {
            const name = 'AssetMarketSettingAdded';
            return {
                name: name,
                emitted: (sender, asset, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.asset, asset, 'asset does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.settingValue, settingValue, 'settingValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingRemoved: tx => {
            const name = 'AssetMarketSettingRemoved';
            return {
                name: name,
                emitted: (sender, asset, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.asset, asset, 'asset does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.oldValue, settingValue, 'oldValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingUpdated: tx => {
            const name = 'AssetMarketSettingUpdated';
            return {
                name: name,
                emitted: (sender, asset, settingName, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.asset, asset, 'asset does not match');
                    assert.equal(ev.settingName, settingName, 'settingName does not match');
                    assert.equal(ev.oldValue, oldValue, 'oldValue does not match');
                    assert.equal(ev.newValue, newValue, 'newValue does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        dataProviderAdded: tx => {
            const name = 'DataProviderAdded';
            return {
                name: name,
                emitted: (sender, index, amountDataProviders, dataProvider) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.dataTypeIndex, index, 'dataTypeIndex does not match');
                    assert.equal(ev.amountDataProviders, amountDataProviders, 'amountDataProviders does not match');
                    assert.equal(ev.dataProvider, dataProvider, 'dataProvider does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        dataProviderUpdated: tx => {
            const name = 'DataProviderUpdated';
            return {
                name: name,
                emitted: (sender, dataTypeIndex, providerIndex, oldDataProvider, newDataProvider) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.dataTypeIndex, dataTypeIndex, 'dataTypeIndex does not match');
                    assert.equal(ev.dataProviderIndex, providerIndex, 'dataProviderIndex does not match');
                    assert.equal(ev.oldDataProvider, oldDataProvider, 'oldDataProvider does not match');
                    assert.equal(ev.newDataProvider, newDataProvider, 'newDataProvider does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        dataProviderRemoved: tx => {
            const name = 'DataProviderRemoved';
            return {
                name: name,
                emitted: (sender, dataTypeIndex, dataProviderIndex, dataProvider) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.dataTypeIndex, dataTypeIndex, 'dataTypeIndex does not match');
                    assert.equal(ev.dataProviderIndex, dataProviderIndex, 'dataProviderIndex does not match');
                    assert.equal(ev.dataProvider, dataProvider, 'dataProvider does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        CRASet: tx => {
            const name = 'CRASet';
            return {
                name: name,
                emitted: (sender, cra) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender, 'sender does not match');
                    assert.equal(ev.craCommitHash.toString(), cra.toString(), 'craCommitHash does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    atmSettings: {
        atmPaused: tx => {
            const name = 'ATMPaused';
            return {
                name: name,
                emitted: (atm, account) => emitted(tx, name, ev => {
                    assert.equal(ev.atm.toString(), atm.toString(), 'atm does not match');
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        atmUnpaused: tx => {
            const name = 'ATMUnpaused';
            return {
                name: name,
                emitted: (atm, account) => emitted(tx, name, ev => {
                    assert.equal(ev.atm.toString(), atm.toString(), 'atm does not match');
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        marketToAtmUpdated: tx => {
            const name = 'MarketToAtmUpdated';
            return {
                name: name,
                emitted: (borrowedToken, collateralToken, oldAtm, newAtm, account) => emitted(tx, name, ev => {
                    assert.equal(ev.borrowedToken.toString(), borrowedToken.toString(), 'borrowedToken does not match');
                    assert.equal(ev.collateralToken.toString(), collateralToken.toString(), 'collateralToken does not match');
                    assert.equal(ev.oldAtm.toString(), oldAtm.toString(), 'oldAtm does not match');
                    assert.equal(ev.newAtm.toString(), newAtm.toString(), 'newAtm does not match');
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        marketToAtmSet: tx => {
            const name = 'MarketToAtmSet';
            return {
                name: name,
                emitted: (borrowedToken, collateralToken, atm, account) => emitted(tx, name, ev => {
                    assert.equal(ev.borrowedToken.toString(), borrowedToken.toString(), 'borrowedToken does not match');
                    assert.equal(ev.collateralToken.toString(), collateralToken.toString(), 'collateralToken does not match');
                    assert.equal(ev.atm.toString(), atm.toString(), 'atm does not match');
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        marketToAtmRemoved: tx => {
            const name = 'MarketToAtmRemoved';
            return {
                name: name,
                emitted: (borrowedToken, collateralToken, oldAtm, account) => emitted(tx, name, ev => {
                    assert.equal(ev.borrowedToken.toString(), borrowedToken.toString(), 'borrowedToken does not match');
                    assert.equal(ev.collateralToken.toString(), collateralToken.toString(), 'collateralToken does not match');
                    assert.equal(ev.oldAtm.toString(), oldAtm.toString(), 'oldAtm does not match');
                    assert.equal(ev.account.toString(), account.toString(), 'account does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    atmFactory: {
        atmCreated: tx => {
            const name = 'ATMCreated';
            return {
                name: name,
                emitted: (sender, atm, token) => emitted(tx, name, ev => {
                    assert.equal(ev.creator, sender, 'creator does not match');
                    assert.equal(ev.atmGovernanceAddress, atm, 'atmGovernanceAddress does not match');
                    assert.equal(ev.tlrTokenAddress, token, 'tlrTokenAddress does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    escrowFactory: {
        escrowCreated: tx => {
            const name = 'EscrowCreated';
            return {
                name: name,
                emitted: (borrower, loansAddress, loanID) => emitted(tx, name, ev => {
                    assert.equal(ev.borrower.toString(), borrower.toString(), 'borrower does not match');
                    assert.equal(ev.loansAddress.toString(), loansAddress.toString(), 'loansAddress does not match');
                    assert.equal(ev.loanID.toString(), loanID.toString(), 'loanID does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        newDappAdded: tx => {
            const name = 'NewDappAdded';
            return {
                name: name,
                emitted: (sender, dapp, unsecured) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.dapp.toString(), dapp.toString(), 'dapp does not match');
                    assert.equal(ev.unsecured, unsecured, 'unsecured does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        dappUpdated: tx => {
            const name = 'DappUpdated';
            return {
                name: name,
                emitted: (sender, dapp, unsecured) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.dapp.toString(), dapp.toString(), 'dapp does not match');
                    assert.equal(ev.unsecured, unsecured, 'unsecured does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        dappRemoved: tx => {
            const name = 'DappRemoved';
            return {
                name: name,
                emitted: (sender, dapp) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.dapp.toString(), dapp.toString(), 'dapp does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    escrow: {
        tokensClaimed: tx => {
            const name = 'TokensClaimed';
            return {
                name: name,
                emitted: (recipient) => emitted(tx, name, ev => {
                    assert.equal(ev.recipient.toString(), recipient.toString(), 'recipient does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    liquidityMining: {
        stake: tx => {
            const name = 'Stake';
            return {
                name: name,
                emitted: (sender, tToken, amount, lastRewardedBlock, tTokenStakedBalance, accruedTLRBalance) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.tToken.toString(), tToken.toString(), 'tToken does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                    assert.equal(ev.lastRewardedBlock.toString(), lastRewardedBlock.toString(), 'lastRewardedBlock does not match');
                    assert.equal(ev.tTokenStakedBalance.toString(), tTokenStakedBalance.toString(), 'tTokenStakedBalance does not match');
                    assert.equal(ev.accruedTLRBalance.toString(), accruedTLRBalance.toString(), 'accruedTLRBalance does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        unstake: tx => {
            const name = 'UnStake';
            return {
                name: name,
                emitted: (sender, tToken, amount, lastRewardedBlock, tTokenStakedBalance, accruedTLRBalance) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.tToken.toString(), tToken.toString(), 'tToken does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                    assert.equal(ev.lastRewardedBlock.toString(), lastRewardedBlock.toString(), 'lastRewardedBlock does not match');
                    assert.equal(ev.tTokenStakedBalance.toString(), tTokenStakedBalance.toString(), 'tTokenStakedBalance does not match');
                    assert.equal(ev.accruedTLRBalance.toString(), accruedTLRBalance.toString(), 'accruedTLRBalance does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        withdrawTLR: tx => {
            const name = 'TLRWithdrawn';
            return {
                name: name,
                emitted: (sender, amount, lastRewardedBlock, tTokenStakedBalance, accruedTLRBalance) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.amount.toString(), amount.toString(), 'amount does not match');
                    assert.equal(ev.lastRewardedBlock.toString(), lastRewardedBlock.toString(), 'lastRewardedBlock does not match');
                    assert.equal(ev.tTokenStakedBalance.toString(), tTokenStakedBalance.toString(), 'tTokenStakedBalance does not match');
                    assert.equal(ev.accruedTLRBalance.toString(), accruedTLRBalance.toString(), 'accruedTLRBalance does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    upgradeable: {
        upgraded: tx => {
            const name = "Upgraded";
            return {
                name: name,
                emitted: (implementation) => emitted(tx, name, ev => {
                    assert.equal(ev.implementation, implementation, 'implementation does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    marketFactory: {
        newMarketCreated: tx => {
            const name = "NewMarketCreated";
            return {
                name: name,
                emitted: (
                    sender,
                    borrowedToken,
                    collateralToken,
                    loans,
                    lenders,
                    lendingPool,
                    loanTermsConsensus
                ) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.borrowedToken.toString(), borrowedToken.toString(), 'borrowedToken does not match');
                    assert.equal(ev.collateralToken.toString(), collateralToken.toString(), 'collateralToken does not match');
                    assert.equal(ev.loans.toString(), loans.toString(), 'loans does not match');
                    assert.equal(ev.lenders.toString(), lenders.toString(), 'lenders does not match');
                    assert.equal(ev.lendingPool.toString(), lendingPool.toString(), 'lendingPool does not match');
                    assert.equal(ev.loanTermsConsensus.toString(), loanTermsConsensus.toString(), 'loanTermsConsensus does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        marketRemoved: tx => {
            const name = "MarketRemoved";
            return {
                name: name,
                emitted: (
                    sender,
                    borrowedToken,
                    collateralToken,
                ) => emitted(tx, name, ev => {
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                    assert.equal(ev.borrowedToken.toString(), borrowedToken.toString(), 'borrowedToken does not match');
                    assert.equal(ev.collateralToken.toString(), collateralToken.toString(), 'collateralToken does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    tTokenRegistry: {
        tTokenRegistered: tx => {
            const name = 'TTokenRegistered';
            return {
                name: name,
                emitted: (
                    tToken,
                    sender
                ) => emitted(tx, name, ev => {
                    assert.equal(ev.tToken.toString(), tToken.toString(), 'tToken does not match');
                    assert.equal(ev.sender.toString(), sender.toString(), 'sender does not match');
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
};
