const yargs = require("yargs");
const {
    addNetwork,
    addTokenName,
    addCollTokenName,
    addSenderIndex,
    addAmount,
    addNewValue,
    addLoanId,
    addSettingName,
    addCTokenName,
    addBorrowerIndex,
    addRecipientIndex,
    addDurationDays,
    addReceiverIndex,
    addInitialLoanId,
    addFinalLoanId,
    addAddresses,
    addNonce,
    addCollAmount,
    addSeconds,
    addBorrower,
    addAccountIndex,
    addRevert,
    addInitialNonce,
    addSignerAddress,
    addSignerUrl,
    addTokenNames,
    addRequiredSubmissions,
    addSafetyInterval,
    addTestTokenName,
} = require("./cli/params");

const addBase = (yargs) => {
    addNetwork(yargs);
};

const addPairBase = (yargs) => {
    addBase(yargs);
    addTokenName(yargs);
    addCollTokenName(yargs);
};

const addLendingPoolBase = (yargs) => {
  yargs.scriptName("yarn exec ./scripts/lendingPool/*.js");
  addPairBase(yargs);
};

const addLoansBase = (yargs) => {
  yargs.scriptName("yarn exec ./scripts/loans/*.js");
  addPairBase(yargs);
};

module.exports = {
    ganacheTest: () => {
        yargs.scriptName("yarn test:ganache");
        addNetwork(yargs);
        addRevert(yargs);
        addInitialNonce(yargs);
        addSignerAddress(yargs);
        addSignerUrl(yargs);
        addTokenNames(yargs);
        addRequiredSubmissions(yargs);
        addSafetyInterval(yargs);
        addTestTokenName(yargs);
        return yargs;
    },
    lendingPool: {
        balance: () => {
            addLendingPoolBase(yargs);
            return yargs;
        },
        deposit: () => {
            addLendingPoolBase(yargs);
            addSenderIndex(yargs);
            addAmount(yargs);
            return yargs;
        },
    },
    tokens: {
        mint: () => {
            addTokenName(yargs);
            addReceiverIndex(yargs);
            addAmount(yargs);
            return yargs;
        },
        balanceOf: () => {
            addTokenName(yargs);
            addAccountIndex(yargs);
            return yargs;
        },
    },
    ganache: {
        advanceTime: () => {
            addNetwork(yargs);
            addSeconds(yargs);
            return yargs;
        },
        setOraclePrice: () => {
            addLoansBase(yargs);
            addNewValue(yargs);
            return yargs;
        },
    },
    loans: {
        getAllLoansFor: () => {
            addLoansBase(yargs);
            addBorrower(yargs);
            return yargs;
        },
        listLoans: () => {
            addLoansBase(yargs);
            addInitialLoanId(yargs);
            addFinalLoanId(yargs);
            return yargs;
        },
        setLoanTerms: () => {
            addLoansBase(yargs);
            addBorrowerIndex(yargs);
            addRecipientIndex(yargs);
            addDurationDays(yargs);
            addDurationDays(yargs);
            addAmount(yargs);
            addCollAmount(yargs);
            addNonce(yargs);
            return yargs;
        },
        getLoan: () => {
            addLoansBase(yargs);
            addLoanId(yargs);
            return yargs;
        },
        liquidate: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
            addLoanId(yargs);
            return yargs;
        },
        takeOut: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
            addLoanId(yargs);
            addAmount(yargs);
            return yargs;
        },
        repay: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
            addLoanId(yargs);
            addAmount(yargs);
            return yargs;
        },
        depositCollateral: () => {
            addLoansBase(yargs);
            addBorrowerIndex(yargs);
            addSenderIndex(yargs);
            addLoanId(yargs);
            addAmount(yargs);
            return yargs;
        },
        withdrawCollateral: () => {
            addLoansBase(yargs);
            addBorrowerIndex(yargs);
            addLoanId(yargs);
            addAmount(yargs);
            return yargs;
        },
    },
    loanTerms: {
        addSigners: () => {
            addPairBase(yargs);
            addSenderIndex(yargs);
            addAddresses(yargs);
            return yargs;
        },
    },
    cTokens: () => {
            addCTokenName(yargs);
            return yargs;
    },
    settings: {
        view: () => {
            addBase(yargs);
            return yargs;
        },
        setNewSetting: () => {
            addBase(yargs);
            addNewValue(yargs);
            addSettingName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
    },
};
