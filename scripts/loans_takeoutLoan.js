// Smart contracts
const LoansInterface = artifacts.require("./interfaces/LoansInterface.sol");
const DAIPoolInterface = artifacts.require("./interfaces/DAIPoolInterface.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const ethUtil = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
const assert = require('assert');
const { hashLoan } = require('../test/utils/hashes');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const interestRate = 200; // 200 -> 2.00%
const collateralRatio = 1000;   // 1000 -> 10.00%
const borrowerIndex = 0;
const signerIndex = 0;
const maxLoanAmount = 5;
const numberDays = 10;
const signerNonce = 1;
const takeOutLoanValue = 1;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        assert(zerocollateral.Loans, "Loans address is undefined.");
        assert(tokens.DAI, "DAI address is undefined.");

        const daiInstance = await ERC20.at(tokens.DAI);
        const loansInstance = await LoansInterface.at(zerocollateral.Loans);
        const daiPoolInstance = await DAIPoolInterface.at(zerocollateral.DAIPool);

        const daiPoolDaiBalance = await daiInstance.balanceOf(daiPoolInstance.address);
        assert(BigNumber(daiPoolDaiBalance.toString()).gte(maxLoanAmount.toString()), "DAIPool: Not enough DAI balance.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const borrower = accounts[borrowerIndex];
        assert(borrower, "Borrower must be defined.");
        const signer = accounts[signerIndex];
        assert(signer, "Signer must be defined.");

        const hashedLoan = hashLoan({
            interestRate,
            collateralRatio,
            borrower,
            maxLoanAmount,
            numberDays,
            signerNonce,
        });
        const msg = ethUtil.bufferToHex(new Buffer(hashedLoan, 'utf8'));
        const sig = await web3.eth.sign(msg, signer);

        const { v, r, s } = ethUtil.fromRpcSig(sig);
        const signature = {
            v: String(v),
            r: ethUtil.bufferToHex(r),
            s: ethUtil.bufferToHex(s),
        };

        const result = await loansInstance.takeOutLoan(
            interestRate,
            collateralRatio,
            maxLoanAmount,
            numberDays,
            maxLoanAmount,
            {
              signerNonce,
              v: signature.v,
              r: signature.r,
              s: signature.s
            },
            {
              from: borrower,
              value: takeOutLoanValue,
            }
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};