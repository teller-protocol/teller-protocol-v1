// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const BigNumber = require('bignumber.js');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

contract('LoansBaseConvertWeiToTokenTest', function () {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 })

    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let lendingTokenInstance;
    let settingsInstance;
    let marketsInstance;
    let atmSettingsInstance;

    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new();
        marketsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            marketsInstance.address,
            atmSettingsInstance.address,
        )

        // encode lending token address
        const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
        await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
    });

    withData({
        _1_usdc_price: [BigNumber("4721489128502654"), 6, BigNumber("1234567890123456789")], //1.23 ETH
        _1_dai_price: [BigNumber("4721489128502654"), 18, BigNumber("44567890123456789")],  // 0.44 ETH
        _1_btc_price: [BigNumber("46919720360000000000"), 18, BigNumber("1234567890123456789")],  //1.23 ETH
        _1_mkr_price: [BigNumber("1599950000000000000"), 18, BigNumber("4567890123456789")],  // 0.045 ETH
    }, function(
        oraclePrice,
        tokenDecimals,
        weiAmount
    ) {
        it(t('user', 'convertWeiToToken', 'Should able to convert wei to token.', false), async function() {
            // encode current token price
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());

            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);

            const tokenAmount = await instance.externalConvertWeiToToken(weiAmount)

            // do the calculation, and then remove the decimal and all after (big number cannot floor)
            let actualTokenAmount = weiAmount.times(10**tokenDecimals).dividedBy(oraclePrice).toFixed()

            assert.equal(tokenAmount.toString(), actualTokenAmount)
        })

    })

})