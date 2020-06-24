// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t, toDecimals, NULL_ADDRESS, ACTIVE, toUnits } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const AggregatorInterfaceEncoder = require('../utils/encoders/AggregatorInterfaceEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");
const InverseChainlinkPairAggregator = artifacts.require("./providers/chainlink/InverseChainlinkPairAggregator.sol");

// Smart contracts
const TokenLoans = artifacts.require("./mock/base/TokenLoansMock.sol");
const EtherLoans = artifacts.require("./mock/base/EtherLoansMock.sol");

contract('LoansBaseGetCollateralInfoTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 })

    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);

    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let lendingTokenInstance;
    let collateralToken;
    let settingsInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        collateralToken = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new();
    });

    const buildLoanInfo = (loanID, borrower, collateralRatio, collateral, principalOwed, interestOwed) => {
        return {
            loanID,
            borrower,
            collateralRatio,
            collateral,
            principalOwed,
            interestOwed,
            borrowedAmount: principalOwed.toString(),
            maxAmount: principalOwed.toString(),
        };
    };

    const createLoans = async (useTokens, Loans, aggregatorReference, decimalsConf) => {
        const aggregator = await aggregatorReference.new(
            oracleInstance.address,
            decimalsConf.lendingTokenDecimals,
            decimalsConf.responseDecimals,
            decimalsConf.collateralDecimals,
        );
        let instance;
        if (useTokens) {
            instance = await Loans.new();
            await instance.initialize(
                 aggregator.address,
                 lendingPoolInstance.address,
                 loanTermsConsInstance.address,
                 settingsInstance.address,
                 collateralToken.address,
             )
        } else {
            instance = await Loans.new();
            await instance.initialize(
                 aggregator.address,
                 lendingPoolInstance.address,
                 loanTermsConsInstance.address,
                 settingsInstance.address
             );
        }

        return instance
    };

    withData({
        _1_link_usd_response_8_token_18_inverse_repay_0: [
            buildLoanInfo(1, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            InverseChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 18, responseDecimals: 8 },
            BigNumber("414000000"),
            // 1 USD = 4.14 LINK; repay: 0; coll needed (lending tokens): 50 USD; coll. needed tokens: 12.08 (50 / 4.14) (divided due to decimals in the lending token/response)
            { requireCollateral: true, neededCollInLendingTokens: '50000000000000000000', neededCollInCollTokens: '12077294685990338150' }
        ],
        _2_link_usd_response_8_token_18_inverse_repay_50: [
            buildLoanInfo(2, accounts[0], '5000', '12.077294685990338150', 99, 1),
            true,
            TokenLoans,
            50,
            InverseChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 18, responseDecimals: 8 },
            BigNumber("414000000"),
            // 1 USD = 4.14 LINK; repay: 50; coll needed (lending tokens): 25 USD; coll. needed tokens: 6.038 (25 / 4.14) (divided due to decimals in the lending token/response)
            { requireCollateral: false, neededCollInLendingTokens: '25000000000000000000', neededCollInCollTokens: '6038647342995169075' }
        ],
        _3_link_usd_response_8_token_18_inverse_repay_100: [
            buildLoanInfo(3, accounts[0], '5000', '12.077294685990338150', 99, 1),
            true,
            TokenLoans,
            100,
            InverseChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 18, responseDecimals: 8 },
            BigNumber("414000000"),
            // 1 USD = 4.14 LINK; repay: 100; coll needed (lending tokens): 0 USD; coll. needed tokens: 0
            { requireCollateral: false, neededCollInLendingTokens: '0', neededCollInCollTokens: '0' }
        ],
        _4_usdc_eth_response_18_token_6_repay_0: [
            buildLoanInfo(4, accounts[0], '5000', 0, 99, 1),
            false,
            EtherLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 6, responseDecimals: 18 },
            BigNumber("4312905000000000"),
            // 1 USD = 0.004312 ETH; repay: 0; coll needed (lending tokens): 50 USD; coll. needed tokens: 0.2156 (50 * 0.004312) (multiplied due to decimals in the lending token/response)
            { requireCollateral: true, neededCollInLendingTokens: '50000000', neededCollInCollTokens: '215645250000000000' }
        ],
        _5_usdc_eth_response_18_token_6_repay_50: [
            buildLoanInfo(5, accounts[0], '5000', '0.215600000000000000', 99, 1),
            false,
            EtherLoans,
            50,
            ChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 6, responseDecimals: 18 },
            BigNumber("4312905000000000"),
            // 1 USD = 0.004312 ETH; repay: 50; coll needed (lending tokens): 25 USD; coll. needed tokens: 0.1078 (25 * 0.004312) (multiplied due to decimals in the lending token/response)
            { requireCollateral: false, neededCollInLendingTokens: '25000000', neededCollInCollTokens: '107822625000000000' }
        ],
        _6_usdc_eth_response_18_token_6_repay_100: [
            buildLoanInfo(6, accounts[0], '5000', '0.215645250000000000', 99, 1),
            false,
            EtherLoans,
            100,
            ChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 6, responseDecimals: 18 },
            BigNumber("4312905000000000"),
            // 1 USD = 0.004312 ETH; repay: 100; coll needed (lending tokens): 0 USD; coll. needed tokens: 0
            { requireCollateral: false, neededCollInLendingTokens: '0', neededCollInCollTokens: '0' }
        ],
        _7_dai_eth_response_18_token_18_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            false,
            EtherLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 18, lendingTokenDecimals: 18, responseDecimals: 18 },
            BigNumber("4414795000000000"),
            // 1 DAI = 0.004414795 ETH; repay: 0; coll needed (lending tokens): 50 USD; coll. needed tokens: 0.2207 (50 * 0.0044)
            { requireCollateral: true, neededCollInLendingTokens: '50000000000000000000', neededCollInCollTokens: '220739750000000000' }
        ],
        _8_usdc_slink_response_12_token_6_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 8, lendingTokenDecimals: 6, responseDecimals: 12 },
            BigNumber("3000000000000"),
            // 1 USDC = 3 SLINK; repay: 0; coll needed (lending tokens): 50 USDC; coll. needed tokens: 150 (50 * 3)
            { requireCollateral: true, neededCollInLendingTokens: '50000000', neededCollInCollTokens: '150000000' }
        ],
        _9_usdc_slink_response_12_token_6_repay_50: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            50,
            ChainlinkPairAggregator,
            { collateralDecimals: 8, lendingTokenDecimals: 6, responseDecimals: 12 },
            BigNumber("3000000000000"),
            // 1 USDC = 3 SLINK; repay: 50; coll needed (lending tokens): 50 USDC; coll. needed tokens: 75 (25 / 3)
            { requireCollateral: true, neededCollInLendingTokens: '25000000', neededCollInCollTokens: '75000000' }
        ],
        _10_usdc_slink_response_12_token_6_repay_100: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            100,
            ChainlinkPairAggregator,
            { collateralDecimals: 8, lendingTokenDecimals: 6, responseDecimals: 12 },
            BigNumber("3000000000000"),
            // 1 USDC = 3 SLINK; repay: 100; coll needed (lending tokens): 0 USDC; coll. needed tokens: 0
            { requireCollateral: false, neededCollInLendingTokens: '0', neededCollInCollTokens: '0' }
        ],
        _11_usdc_tlink_response_12_token_6_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 12, lendingTokenDecimals: 6, responseDecimals: 10 },
            BigNumber("20000000000"),
            // 1 USDC = 2 TLINK; repay: 0; coll needed (lending tokens): 50 USDC; coll. needed tokens: 100 (50 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '50000000', neededCollInCollTokens: '100000000000000' }
        ],
        _12_usdc_tlink_response_12_token_6_repay_50: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            50,
            ChainlinkPairAggregator,
            { collateralDecimals: 12, lendingTokenDecimals: 6, responseDecimals: 10 },
            BigNumber("20000000000"),
            // 1 USDC = 2 TLINK; repay: 50; coll needed (lending tokens): 25 USDC; coll. needed tokens: 50 (25 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '25000000', neededCollInCollTokens: '50000000000000' }
        ],
        _13_usdc_tlink_response_12_token_6_repay_100: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            100,
            ChainlinkPairAggregator,
            { collateralDecimals: 12, lendingTokenDecimals: 6, responseDecimals: 10 },
            BigNumber("20000000000"),
            // 1 USDC = 2 TLINK; repay: 100; coll needed (lending tokens): 0 USDC; coll. needed tokens: 0
            { requireCollateral: false, neededCollInLendingTokens: '0', neededCollInCollTokens: '0' }
        ],
        _14_usdc_tlink_response_12_token_10_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 12, lendingTokenDecimals: 10, responseDecimals: 10 },
            BigNumber("20000000000"),
            // 1 USDC = 2 TLINK; repay: 0; coll needed (lending tokens): 50 USDC; coll. needed tokens: 100 (50 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '500000000000', neededCollInCollTokens: '100000000000000' }
        ],
        _15_usdc_tlink_response_12_token_11_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 12, lendingTokenDecimals: 11, responseDecimals: 10 },
            BigNumber("20000000000"),
            // 1 USDC = 2 TLINK; repay: 0; coll needed (lending tokens): 50 USDC; coll. needed tokens: 100 (50 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '5000000000000', neededCollInCollTokens: '100000000000000' }
        ],
        _16_usdc_tlink_response_12_token_11_repay_0: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            0,
            ChainlinkPairAggregator,
            { collateralDecimals: 6, lendingTokenDecimals: 10, responseDecimals: 8 },
            BigNumber("200000000"),
            // 1 USDC = 2 TLINK; repay: 0; coll needed (lending tokens): 50 USDC; coll. needed tokens: 100 (50 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '500000000000', neededCollInCollTokens: '100000000' }
        ],
        _17_usdc_tlink_response_12_token_11_repay_50: [
            buildLoanInfo(7, accounts[0], '5000', 0, 99, 1),
            true,
            TokenLoans,
            50,
            ChainlinkPairAggregator,
            { collateralDecimals: 6, lendingTokenDecimals: 10, responseDecimals: 8 },
            BigNumber("200000000"),
            // 1 USDC = 2 TLINK; repay: 50; coll needed (lending tokens): 25 USDC; coll. needed tokens: 50 (25 * 2)
            { requireCollateral: true, neededCollInLendingTokens: '250000000000', neededCollInCollTokens: '50000000' }
        ],
    }, function(loanInfo, useTokens, loanReference, repayAmount, aggregatorReference, decimalsConf, oraclePrice, expectedResults) {
        it(t('user', 'getCollateralInfo', 'Should able to get collateral info from a loan.', false), async function() {
            // Setup
            const instance  = await createLoans(useTokens, loanReference, aggregatorReference, decimalsConf);
            const { loanID, borrower, collateralRatio, maxAmount, collateral, principalOwed, interestOwed, borrowedAmount } = loanInfo;

            // Mocking lending token data
            const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
            await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
            // Mocking Oracle data
            const encodeGetLatestAnswer = aggregatorInterfaceEncoder.encodeLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());
            if(useTokens) {
                // Mocking collateral token data
                await collateralToken.givenMethodReturnUint(
                    erc20InterfaceEncoder.encodeBalanceOf(),
                    toDecimals(collateral, decimalsConf.collateralDecimals),
                );
                await collateralToken.givenMethodReturnBool(erc20InterfaceEncoder.encodeTransfer(), true );
            } else {
                // Sending ETH to EtherLoans contract (the mock has fallback function).
                await web3.eth.sendTransaction({ from: borrower, to: instance.address, value: toDecimals(collateral, decimalsConf.collateralDecimals) });
            }
            // Mocking lending token data
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, decimalsConf.lendingTokenDecimals);

            const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, collateralRatio, toDecimals(maxAmount, decimalsConf.lendingTokenDecimals).toString(), 0);
            await instance.setLoan(loanID, loanTerms, 0, 0, toDecimals(collateral, decimalsConf.collateralDecimals), 0, toDecimals(principalOwed, decimalsConf.lendingTokenDecimals), toDecimals(interestOwed, decimalsConf.lendingTokenDecimals), toDecimals(borrowedAmount, decimalsConf.lendingTokenDecimals), ACTIVE, false);
            // Repay loan to assert changes in the collateral needed.
            await instance.repay(toDecimals(repayAmount.toString(), decimalsConf.lendingTokenDecimals), loanID, { from: borrower });

            // Invocation
            const {
                collateralNeededLendingTokens: collateralNeededLendingTokensResult,
                collateralNeededCollateralTokens: collateralNeededCollateralTokensResult,
                requireCollateral: requireCollateralResult,
                oraclePrice: oraclePriceResult
            } = await instance.getCollateralInfo(loanID);
            console.log(`Coll Needed`);
            console.log(`Oracle Price:      ${oraclePriceResult.toString()}`);
            console.log(`In Lending Tokens: ${collateralNeededLendingTokensResult.toString()} USDC`);
            console.log(`In Coll Tokens:    ${collateralNeededCollateralTokensResult.toString()}`);
            console.log(`Chainlink Return:  ${oraclePrice.toString()}`);
            
            // Assertions
            //assert.equal(requireCollateralResult, expectedResults.requireCollateral);
            assert.equal(collateralNeededCollateralTokensResult.toString(), expectedResults.neededCollInCollTokens);
            assert.equal(collateralNeededLendingTokensResult.toString(), expectedResults.neededCollInLendingTokens);
        })

    })
})