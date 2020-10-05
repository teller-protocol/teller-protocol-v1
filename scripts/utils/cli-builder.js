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
    addMinValue,
    addMaxValue,
    addBackRounds,
    addMinAmount,
    addLogicName,
    addContractName,
    addRevertTest,
    addCollTokenNames,
    addVerbose,
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
        yargs.scriptName("yarn test:ganache*");
        addNetwork(yargs);
        addRevert(yargs);
        addRevertTest(yargs);
        addInitialNonce(yargs);
        addSignerAddress(yargs);
        addSignerUrl(yargs);
        addTokenNames(yargs);
        addCollTokenNames(yargs);
        addRequiredSubmissions(yargs);
        addSafetyInterval(yargs);
        addVerbose(yargs);
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
        withdraw: () => {
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
        requireBalanceOf: () => {
            addTokenName(yargs);
            addAccountIndex(yargs);
            addMinAmount(yargs);
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
        takeOutLast: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
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
        repayLast: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
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
        depositCollateralLast: () => {
            addLoansBase(yargs);
            addBorrowerIndex(yargs);
            addSenderIndex(yargs);
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
        updateOraclePriceAddress: () => {
            addLoansBase(yargs);
            addSenderIndex(yargs);
            addNewValue(yargs);
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
    logicVersion: {
        updateLogicVersion: () => {
            addBase(yargs);
            addLogicName(yargs);
            addContractName(yargs);
            return yargs;
        },
    },
    settings: {
        view: () => {
            addBase(yargs);
            return yargs;
        },
        viewAsset: () => {
            addBase(yargs);
            addTokenName(yargs);
            return yargs;
        },
        updatePlatformSetting: () => {
            addBase(yargs);
            addNewValue(yargs);
            addSettingName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        createPlatformSetting: () => {
            addBase(yargs);
            addNewValue(yargs);
            addMinValue(yargs);
            addMaxValue(yargs);
            addSettingName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        removePlatformSetting: () => {
            addBase(yargs);
            addSettingName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        updateAssetSetting: () => {
            addBase(yargs);
            addNewValue(yargs);
            addTokenName(yargs);
            addAssetSettingName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        removeAssetSetting: () => {
            addBase(yargs);
            addTokenName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        createAssetSetting: () => {
            addBase(yargs);
            addTokenName(yargs);
            addSenderIndex(yargs);
            addCTokenName(yargs);
            addMaxLoanAmount(yargs);
            return yargs;
        },
        pausePlatform: () => {
            addBase(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        unpausePlatform: () => {
            addBase(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        pauseLendingPool: () => {
            addBase(yargs);
            addTokenName(yargs);
            addCollTokenName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
        unpauseLendingPool: () => {
            addBase(yargs);
            addTokenName(yargs);
            addCollTokenName(yargs);
            addSenderIndex(yargs);
            return yargs;
        },
    },
    oracle: {
        getPrices: () => {
            addTokenName(yargs);
            addCollTokenName(yargs);
            addBackRounds(yargs);
            return yargs;
        },
    },
    chainlink: {
        getPrices: () => {
            addTokenName(yargs);
            addCollTokenName(yargs);
            addBackRounds(yargs);
            return yargs;
        },
    }
};
