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
    erc20: {
        transfer: tx => {
            const name = 'Transfer';
            return {
                name: name,
                emitted: (from, to, value) => emitted(tx, name, ev => {
                    assert.equal(ev.from, from);
                    assert.equal(ev.to, to);
                    assert.equal(ev.value.toString(), value.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    lenders: {
        accruedInterestUpdated: tx => {
            const name = 'AccruedInterestUpdated';
            return {
                name: name,
                emitted: (lender, totalNotWithdrawn, totalAccruedInterest) => emitted(tx, name, ev => {
                    assert.equal(ev.lender, lender);
                    assert.equal(ev.totalNotWithdrawn.toString(), totalNotWithdrawn.toString());
                    assert.equal(ev.totalAccruedInterest.toString(), totalAccruedInterest.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        accruedInterestWithdrawn: tx => {
            const name = 'AccruedInterestWithdrawn';
            return {
                name: name,
                emitted: (recipient, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.recipient, recipient);
                    assert.equal(ev.amount.toString(), amount.toString());
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
                    assert.equal(ev.sender, sender);
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
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        paymentLiquidated: tx => {
            const name = 'PaymentLiquidated';
            return {
                name: name,
                emitted: (liquidator, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.liquidator, liquidator);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        tokenRepaid: tx => {
            const name = 'TokenRepaid';
            return {
                name: name,
                emitted: (borrower, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        interestWithdrawn: tx => {
            const name = 'InterestWithdrawn';
            return {
                name: name,
                emitted: (lender, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.lender, lender);
                    assert.equal(ev.amount.toString(), amount.toString());
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
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.recipient, recipient);
                    assert.equal(ev.interestRate.toString(), interestRate.toString());
                    assert.equal(ev.collateralRatio.toString(), collateralRatio.toString());
                    assert.equal(ev.maxLoanAmount.toString(), maxLoanAmount.toString());
                    assert.equal(ev.duration.toString(), duration.toString());
                    assert.equal(ev.termsExpiry.toString(), expiry.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanTakenOut: tx => {
            const name = 'LoanTakenOut';
            return {
                name: name,
                emitted: (loanID, borrower, amountBorrowed) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.amountBorrowed.toString(), amountBorrowed.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        collateralDeposited: tx => {
            const name = 'CollateralDeposited';
            return {
                name: name,
                emitted: (loanID, borrower, depositAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.depositAmount.toString(), depositAmount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        collateralWithdrawn: tx => {
            const name = 'CollateralWithdrawn';
            return {
                name: name,
                emitted: (loanID, borrower, withdrawalAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.withdrawalAmount.toString(), withdrawalAmount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanRepaid: tx => {
            const name = 'LoanRepaid';
            return {
                name: name,
                emitted: (loanID, borrower, amountPaid, payer, totalOwed) => emitted (tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.amountPaid.toString(), BigNumber(amountPaid.toString()).toFixed(0));
                    assert.equal(ev.payer, payer);
                    assert.equal(ev.totalOwed.toString(), BigNumber(totalOwed.toString()).toFixed(0));
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        loanLiquidated: tx => {
            const name = 'LoanLiquidated';
            return {
                name: name,
                emitted: (loanID, borrower, liquidator, collateralOut, tokensIn) => emitted(tx, name, ev => {
                    assert.equal(ev.loanID.toString(), loanID.toString());
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.liquidator, liquidator);
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
                    assert.equal(ev.sender.toString(), sender.toString());
                    assert.equal(ev.oldPriceOracle, oldPriceOracle);
                    assert.equal(ev.newPriceOracle, newPriceOracle);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    interestConsensus: {
        interestSubmitted: tx => {
            const name = 'InterestSubmitted';
            return {
                name: name,
                emitted: (signer, lender, requestNonce, endTime, interest) => truffleAssert.eventEmitted(tx, name, ev => {
                    return (
                        ev.signer.toString() === signer.toString() && 
                        ev.lender.toString() === lender.toString() &&
                        ev.requestNonce.toString() === requestNonce.toString() &&
                        ev.endTime.toString() === endTime.toString() &&
                        ev.interest.toString() === interest.toString()
                    );
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        interestAccepted: tx => {
            const name = 'InterestAccepted';
            return {
                name: name,
                emitted: (lender, requestNonce, endTime, interest) => truffleAssert.eventEmitted(tx, name, ev => {
                    return (
                        ev.lender === lender && 
                        ev.requestNonce.toString() === requestNonce.toString() &&
                        ev.endTime.toString() === endTime.toString() &&
                        ev.interest.toString() === interest.toString()
                    )
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
                emitted: (signer, borrower, requestNonce, interestRate, collateralRatio, maxLoanAmount) => truffleAssert.eventEmitted(tx, name, ev => {
                    return (
                        ev.signer === signer && 
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
    settings: {
        lendingPoolPaused: tx => {
            const name = 'LendingPoolPaused';
            return {
                name: name,
                emitted: (account, lendingPoolAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account);
                    assert.equal(ev.lendingPoolAddress, lendingPoolAddress);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        lendingPoolUnpaused: tx => {
            const name = 'LendingPoolUnpaused';
            return {
                name: name,
                emitted: (account, lendingPoolAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account);
                    assert.equal(ev.lendingPoolAddress, lendingPoolAddress);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        createComponentVersion: tx => {
            const name = 'ComponentVersionCreated';
            return {
                name: name,
                emitted: (account, componentName, minVersion) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account);
                    assert.equal(ev.minVersion, minVersion); 
                    assert.equal(ev.componentName.toString(), componentName.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        updateComponentVersion: tx => {
            const name = 'ComponentVersionUpdated';
            return {
                name: name,
                emitted: (account, componentName, oldVersion, newVersion) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account);
                    assert.equal(ev.componentName.toString(), componentName.toString());
                    assert.equal(ev.oldVersion, oldVersion);
                    assert.equal(ev.newVersion, newVersion);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        removeComponentVersion: tx => {
            const name = 'ComponentVersionRemoved';
            return {
                name: name,
                emitted: (account, componentName, previousVersion) => emitted(tx, name, ev => {
                    assert.equal(ev.account, account);
                    assert.equal(ev.componentName.toString(), componentName.toString());
                    assert.equal(ev.previousVersion, previousVersion);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsCreated: tx => {
            const name = 'AssetSettingsCreated';
            return {
                name: name,
                emitted: (sender, assetAddress, cTokenAddress, maxLoanAmount) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString());
                    assert.equal(ev.cTokenAddress.toString(), cTokenAddress.toString());
                    assert.equal(ev.maxLoanAmount.toString(), maxLoanAmount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsAddressUpdated: tx => {
            const name = 'AssetSettingsAddressUpdated';
            return {
                name: name,
                emitted: (assetSettingName, sender, assetAddress, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.assetSettingName.toString(), assetSettingName.toString());
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString());
                    assert.equal(ev.oldValue.toString(), oldValue.toString());
                    assert.equal(ev.newValue.toString(), newValue.toString());

                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsUintUpdated: tx => {
            const name = 'AssetSettingsUintUpdated';
            return {
                name: name,
                emitted: (assetSettingName, sender, assetAddress, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.assetSettingName.toString(), assetSettingName.toString());
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString());
                    assert.equal(ev.oldValue.toString(), oldValue.toString());
                    assert.equal(ev.newValue.toString(), newValue.toString());

                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetSettingsRemoved: tx => {
            const name = 'AssetSettingsRemoved';
            return {
                name: name,
                emitted: (sender, assetAddress) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.assetAddress.toString(), assetAddress.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingCreated: tx => {
            const name = 'PlatformSettingCreated';
            return {
                name: name,
                emitted: (settingName, sender, value, minValue, maxValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString());
                    assert.equal(ev.sender.toString(), sender.toString());
                    assert.equal(ev.value.toString(), value.toString());
                    assert.equal(ev.minValue.toString(), minValue.toString());
                    assert.equal(ev.maxValue.toString(), maxValue.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingUpdated: tx => {
            const name = 'PlatformSettingUpdated';
            return {
                name: name,
                emitted: (settingName, sender, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString());
                    assert.equal(ev.sender.toString(), sender.toString());
                    assert.equal(ev.oldValue.toString(), oldValue.toString());
                    assert.equal(ev.newValue.toString(), newValue.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        platformSettingRemoved: tx => {
            const name = 'PlatformSettingRemoved';
            return {
                name: name,
                emitted: (settingName, sender, lastValue) => emitted(tx, name, ev => {
                    assert.equal(ev.settingName.toString(), settingName.toString());
                    assert.equal(ev.lastValue.toString(), lastValue.toString());
                    assert.equal(ev.sender.toString(), sender.toString());
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
                    assert.equal(ev.signer, sender);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.settingValue, settingValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        generalSettingUpdated: tx => {
            const name = 'GeneralSettingUpdated';
            return {
                name: name,
                emitted: (sender, settingName, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.signer, sender);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.oldValue, oldValue);
                    assert.equal(ev.newValue, newValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        generalSettingRemoved: tx => {
            const name = 'GeneralSettingRemoved';
            return {
                name: name,
                emitted: (sender, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.signer, sender);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.settingValue, settingValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingAdded: tx => {
            const name = 'AssetMarketSettingAdded';
            return {
                name: name,
                emitted: (signer, asset, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.signer, signer);
                    assert.equal(ev.asset, asset);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.settingValue, settingValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingRemoved: tx => {
            const name = 'AssetMarketSettingRemoved';
            return {
                name: name,
                emitted: (signer, asset, settingName, settingValue) => emitted(tx, name, ev => {
                    assert.equal(ev.signer, signer);
                    assert.equal(ev.asset, asset);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.oldValue, settingValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        assetMarketSettingUpdated: tx => {
            const name = 'AssetMarketSettingUpdated';
            return {
                name: name,
                emitted: (signer, asset, settingName, oldValue, newValue) => emitted(tx, name, ev => {
                    assert.equal(ev.signer, signer);
                    assert.equal(ev.asset, asset);
                    assert.equal(ev.settingName, settingName);
                    assert.equal(ev.oldValue, oldValue);
                    assert.equal(ev.newValue, newValue);
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    }
};
