// Smart contracts
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const loanTermsConsensusName = 'LoanTermsConsensus_zUSDC'; // LoanTermsConsensus_zDAI or LoanTermsConsensus_zUSDC
const senderIndex = 0;
const addressToAddFromIndex = 9;
const addressToAddToIndex = 14;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral, toTxUrl } = appConf.networkConfig;

        const loanTermsConsensusAddress = zerocollateral[loanTermsConsensusName];
        assert(loanTermsConsensusAddress, "LoanTermsConsensus address is undefined.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");
        const addressToAddFrom = accounts[addressToAddFromIndex];
        assert(addressToAddFrom, "AddressToAddFrom must be defined.");
        const addressToAddTo = accounts[addressToAddToIndex];
        assert(addressToAddTo, "AddressToAddTo must be defined.");
        const txConfig = { from: sender };

        const loanTermsConsensus = await LoanTermsConsensus.at(loanTermsConsensusAddress);

        for(let currentIndex = addressToAddFromIndex; currentIndex < addressToAddToIndex; currentIndex++) {
            const addressToAdd = accounts[currentIndex];
            const isAlreadySigner = await loanTermsConsensus.isSigner(addressToAdd);

            if (isAlreadySigner.toString() === 'false') {
                const result = await loanTermsConsensus.addSigner(addressToAdd, txConfig);
                console.log(toTxUrl(result));
    
                const isSigner = await loanTermsConsensus.isSigner(addressToAdd);
                console.log(`Has ${addressToAdd} a signer role? ${isSigner.toString()}`);
            } else {
                console.log(`AddressToAdd ${addressToAdd} is already signer in ${loanTermsConsensusName} / ${loanTermsConsensusAddress}`);
            }
        }
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};