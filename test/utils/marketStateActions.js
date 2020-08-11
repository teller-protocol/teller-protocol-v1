const actions = {
    Inc_Supply: 'Inc_Supply',
    Dec_Supply: 'Dec_Supply',
    Borrow: 'Borrow',
    Repay: 'Repay',
};
module.exports = {
    ...actions,
    execute: async (instance, type, { borrowedAssset, collateralAssset, amount }, txConfig) => {
        let result;
        if(type === actions.Inc_Supply) {
            result = await instance.increaseSupply(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Dec_Supply) {
            result = await instance.decreaseSupply(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Borrow) {
            result = await instance.increaseBorrow(borrowedAssset, collateralAssset, amount, txConfig);
        }
        if(type === actions.Repay) {
            result = await instance.increaseRepayment(borrowedAssset, collateralAssset, amount, txConfig);
        }
        return result;
    },
}
