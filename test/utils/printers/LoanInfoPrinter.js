const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.default.ROUND_FLOOR });
const assert = require('assert');
const { toDecimals, toUnits } = require("../consts");
const loanStatus = require("../loanStatus");
const Timer = require('../../../scripts/utils/Timer');

const TEN_THOUSAND = 10000;
const TEN_HUNDRED = 100;
const ETH_DECIMALS = 18;
// TODO Remove after removing who are using it.
class LoanInfoPrinter {
    constructor(web3, loanInfo, token, collateralToken) {
        this.web3 = web3;
        this.loanInfo = loanInfo;
        this.token = { tokenName: token.tokenName, decimals: token.decimals };
        this.timer = new Timer(web3);
        this.collateralToken = { tokenName: collateralToken.tokenName, decimals: collateralToken.decimals };
        assert(this.web3, 'Web3 instance is required.');
        assert(this.loanInfo, 'Loan info is required.');
        assert(this.token, 'Token is required.');
    }
}

LoanInfoPrinter.prototype.getLoanTerms = function() {
    const { loanTerms } = this.loanInfo;
    const {
        interestRate,
        collateralRatio,
        maxLoanAmount,
    } =  loanTerms;
    return {
        interestRate: interestRate,
        interestRateValue: interestRate / 100,
        collateralRatio: collateralRatio,
        collateralRatioValue: collateralRatio / 100,
        maxLoanAmount: maxLoanAmount,
        maxLoanAmountValue: toUnits(maxLoanAmount, this.token.decimals),
    };
}

LoanInfoPrinter.prototype.isActive = function() {
    return this.loanInfo.status.toString() === loanStatus.Active.toString();
}

LoanInfoPrinter.prototype.isTermsSet = function() {
    return this.loanInfo.status.toString() === loanStatus.TermsSet.toString();
}

LoanInfoPrinter.prototype.getTotalOwed = function() {
    return BigNumber(this.loanInfo.principalOwed).plus(BigNumber(this.loanInfo.interestOwed));
}

LoanInfoPrinter.prototype.getTotalOwedUnits = function() {
    return toUnits(this.getTotalOwed(), this.token.decimals);
}

LoanInfoPrinter.prototype.getCollateralRatio = function() {
    return BigNumber(this.loanInfo.loanTerms.collateralRatio);
}

LoanInfoPrinter.prototype.getCollateralNeededInTokens = function() {
    const collateralRatio = this.getCollateralRatio();
    const totalOwed = this.getTotalOwed();
    return totalOwed.times(collateralRatio).div(TEN_THOUSAND);
}

LoanInfoPrinter.prototype.getCollateral = function() {
    return BigNumber(this.loanInfo.collateral.toString());
}

LoanInfoPrinter.prototype.getCollateralInTokens = function(price) {
    return  this.getCollateral()
            .times(this.getAWholeToken())
            .div(price);
}

LoanInfoPrinter.prototype.getTotalTokensPaymentInLiquidation = function(price, ethPricePercentage) {
    const collateralInTokens = this.getCollateralInTokens(price);
    const collateralInTokensBigNumber = BigNumber(collateralInTokens.toFixed(0));
    return collateralInTokensBigNumber.times(ethPricePercentage).div(TEN_THOUSAND);
}

LoanInfoPrinter.prototype.getCollateralUnits = function() {
    return toUnits(this.getCollateral(), ETH_DECIMALS);
}

LoanInfoPrinter.prototype.getCollateralRatioValues = function() {
    return {
        collateralRatio: this.getCollateralRatio(),
        collateralRatioPercentage: this.getCollateralRatio().div(TEN_HUNDRED),
        collateralRatioDecimals: this.getCollateralRatio().div(TEN_THOUSAND),
    };
}

LoanInfoPrinter.prototype.getOwedValues = function() {
    return {
        principalOwed: BigNumber(this.loanInfo.principalOwed),
        interestOwed: BigNumber(this.loanInfo.interestOwed),
    };
}

LoanInfoPrinter.prototype.getOwedValuesUnit = function() {
    const { interestOwed, principalOwed } = this.getOwedValues();
    return {
        principalOwedUnit: toUnits(principalOwed, this.token.decimals),
        interestOwedUnit: toUnits(interestOwed, this.token.decimals),
    };
}

LoanInfoPrinter.prototype.getAWholeToken = function() {
    return toDecimals(1, this.token.decimals);
}

LoanInfoPrinter.prototype.getCollateralNeededInWeis = function(price) {
    return this.getCollateralNeededInTokens().times(price).div(this.getAWholeToken());
}

LoanInfoPrinter.prototype.getCollateralNeededInWeisUnit = function(price) {
    return toUnits(this.getCollateralNeededInWeis(price), this.token.decimals);
}

LoanInfoPrinter.prototype.isCollateralNeededGtCollateral = function(price) {
    return this.getCollateralNeededInWeis(price).gt(this.getCollateral());
}

LoanInfoPrinter.prototype.getStartDate = function() {
    const startTime = this.getStartTime();
    if(startTime === 0) {
        return undefined;
    }
    return new Date(startTime);
}

LoanInfoPrinter.prototype.getStartTime = function() {
    return parseInt(this.loanInfo.loanStartTime) * 1000;
}

LoanInfoPrinter.prototype.getEndDate = function() {
    const endTime = this.getEndTime()
    if (endTime === 0) {
        return undefined;
    }
    return new Date(endTime);
}

LoanInfoPrinter.prototype.getEndTime = function() {
    const startTime = this.getStartTime()
    if (startTime === 0) {
        return 0;
    }
    return startTime + (parseInt(this.loanInfo.loanTerms.duration) * 1000);
}

LoanInfoPrinter.prototype.isEndTimeLtNow = async function() {
    return this.getEndTime() < (await this.getNowTime());
}

LoanInfoPrinter.prototype.getNowTime = async function() {
    return (await this.timer.getCurrentTimestamp());
}

LoanInfoPrinter.prototype.getNowDate = async function() {
    return (await this.timer.getCurrentDate());
}

LoanInfoPrinter.prototype.isLiquidable = async function(price) {
    return this.isActive() && (this.isCollateralNeededGtCollateral(price) || (await this.isEndTimeLtNow()));
}

module.exports = LoanInfoPrinter;