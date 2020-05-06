// JS Libraries
const withData = require('leche').withData;
const { t, encode, createLoanInfo, FIVE_MIN } = require('../utils/consts');
const { createLoanSig } = require('../utils/hashes');
const { loans } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");

contract('LoansTakeOutLoanTest', function (accounts) {
    let instance;
    let oracleInstance;
    let lendingPoolInstance;
    let loanTermsConsInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        instance = await Loans.new(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            FIVE_MIN
        );
    });

    withData({
        _1_firstLoan: [createLoanInfo(1, 900, 5, 200), 0],
        _2_21loan: [createLoanInfo(3, 1200, 3, 300), 21],
    }, function(loanInfo, initialLoanIdCounter) {
        it(t('user', 'takeOutLoan', 'Should able to take out a loan.', false), async function() {
            // Setup
            const now = Math.floor(Date.now() / 1000);
            const getLatestTimestampEncode = encode(web3, 'getLatestTimestamp()');
            await oracleInstance.givenMethodReturnUint(getLatestTimestampEncode, now);
            await instance.setLoanIDCounter(initialLoanIdCounter.toString());

            const borrower = accounts[loanInfo.borrowerIndex];
            const signer = accounts[loanInfo.signerIndex];
            const signature = await createLoanSig(web3, borrower, loanInfo, signer);

            // Invocation
            const result = await instance.takeOutLoan(
                loanInfo.interestRate,
                loanInfo.collateralRatio,
                loanInfo.maxLoanAmount,
                loanInfo.numberDays,
                loanInfo.maxLoanAmount,
                {
                    signerNonce: loanInfo.signerNonce,
                    v: signature.v,
                    r: signature.r,
                    s: signature.s
                },
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