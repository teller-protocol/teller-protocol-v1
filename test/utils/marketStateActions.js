const actions = {
    Inc_Supply: 'Inc_Supply',
    Dec_Supply: 'Dec_Supply',
    Borrow: 'Borrow',
    Repay: 'Repay',
};
module.exports = {
    ...actions,
    execute: async (instance, type, { borrowedAsset, collateralAsset, amount }, txConfig) => {
        let result;
        if(type === actions.Inc_Supply) {
            result = await instance.increaseSupply(borrowedAsset, collateralAsset, amount, txConfig);
        }
        if(type === actions.Dec_Supply) {
            result = await instance.decreaseSupply(borrowedAsset, collateralAsset, amount, txConfig);
        }
        if(type === actions.Borrow) {
            result = await instance.increaseBorrow(borrowedAsset, collateralAsset, amount, txConfig);
        }
        if(type === actions.Repay) {
            result = await instance.increaseRepayment(borrowedAsset, collateralAsset, amount, txConfig);
        }
        return result;
    },
}
