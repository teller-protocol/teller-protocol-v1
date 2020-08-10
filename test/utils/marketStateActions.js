const actions = {
    Inc_Supply: 'Inc_Supply',
    Dec_Supply: 'Dec_Supply',
    Borrow: 'Borrow',
    Repay: 'Repay',
};
module.exports = {
    ...actions,
    execute: async (instance, type, { borrowedAssset, collateralAssset, amount }, txConfig) => {
        if(type === actions.Inc_Supply) {
            await instance.increaseSupply(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Dec_Supply) {
            await instance.decreaseSupply(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Borrow) {
            await instance.increaseBorrow(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Repay) {
            await instance.increaseRepayment(borrowedAssset, collateralAssset, amount, txConfig);
        }
    },
}
