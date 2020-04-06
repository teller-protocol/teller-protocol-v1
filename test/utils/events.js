// @dev see details on https://www.npmjs.com/package/truffle-assertions
const truffleAssert = require('truffle-assertions');

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
    zeroCollateral: {
        collateralDeposited: tx => {
            const name = 'CollateralDeposited';
            return {
                name: name,
                emitted: (borrower, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
    lenderInfo: {
        accruedInterestUpdated: tx => {
            const name = 'AccruedInterestUpdated';
            return {
                name: name,
                emitted: (lender, lastBlockAccrued, totalAccruedInterest) => emitted(tx, name, ev => {
                    assert.equal(ev.lender, lender);
                    assert.equal(ev.lastBlockAccrued.toString(), lastBlockAccrued.toString());
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
    daiPool: {
        daiDeposited: tx => {
            const name = 'DaiDeposited';
            return {
                name: name,
                emitted: (sender, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.sender, sender);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
        daiWithdrew: tx => {
            const name = 'DaiWithdrew';
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
        daiRepaid: tx => {
            const name = 'DaiRepaid';
            return {
                name: name,
                emitted: (borrower, amount) => emitted(tx, name, ev => {
                    assert.equal(ev.borrower, borrower);
                    assert.equal(ev.amount.toString(), amount.toString());
                }),
                notEmitted: (assertFunction = () => {} ) => notEmitted(tx, name, assertFunction)
            };
        },
    },
};
