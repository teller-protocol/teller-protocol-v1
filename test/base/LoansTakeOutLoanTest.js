// JS Libraries
const withData = require('leche').withData;
const { t, encode, createLoanInfo, SEVEN_DAYS } = require('../utils/consts');
const { loans } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");

contract('LoansTakeOutLoanTest', function (accounts) {
    let instance;
    let oracleInstance;
    let lendingPoolInstance;
    let loanTermsConsensusInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsensusInstance = await Mock.new();
        instance = await Loans.new(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsensusInstance.address,
            SEVEN_DAYS
        );
    });

    withData({
        _1_firstLoan: [createLoanInfo(1, 900, 5, 200), 0],
        _2_21loan: [createLoanInfo(3, 1200, 3, 300), 0],
    }, function(loanInfo, initialLoanIdCounter) {
        it(t('user', 'takeOutLoan', 'Should able to take out a loan.', false), async function() {
            // Setup
            const now = Math.floor(Date.now() / 1000);
            const getLatestTimestampEncode = encode(web3, 'getLatestTimestamp()');
            await oracleInstance.givenMethodReturnUint(getLatestTimestampEncode, now);
            const getLatestAnswerEncode = encode(web3, 'getLatestAnswer()');
            await oracleInstance.givenMethodReturnUint(getLatestAnswerEncode, 1000);

            const borrower = accounts[loanInfo.borrowerIndex];
            await instance.mockRequestedLoan(
                borrower,
                initialLoanIdCounter,
                loanInfo.maxLoanAmount,
                loanInfo.numberDays,
                loanInfo.maxLoanAmount,
                loanInfo.interestRate,
                loanInfo.collateralRatio,
                now.toString(),
                2,
            );

            // Invocation
            const result = await instance.takeOutLoan(
                {
                    from: borrower,
                    value: loanInfo.takeOutLoanValue,
                }
            );

            // Assertions
            assert(result);
            loans
                .loanCreated(result)
                .emitted(
                    borrower,
                    loanInfo.interestRate,
                    loanInfo.collateralRatio,
                    loanInfo.maxLoanAmount,
                    loanInfo.numberDays,
                    initialLoanIdCounter,
                );
        });
    });
});