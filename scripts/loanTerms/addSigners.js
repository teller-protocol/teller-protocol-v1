// Smart contracts
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");

// Util classes
const { loanTerms: readParams } = require("../utils/cli-builder");
const { zerocollateral, tokens } = require("../utils/contracts");
const { printFullLoan, printOraclePrice } = require("../../test/utils/printer");
const { getOracleAggregatorInfo, getDecimals } = require("../../test/utils/collateral-helper");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs(readParams.addSigners().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const senderIndex = processArgs.getValue('senderIndex');
        const addresses = processArgs.getValue('addresses');
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        
        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const loanTermsConsensusInstance = await getContracts.getDeployed(
            zerocollateral.custom(collateralTokenName).loanTermsConsensus(tokenName)
        );

        for (const address of addresses) {
            const isAlreadySigner = await loanTermsConsensusInstance.isSigner(address);

            if (isAlreadySigner.toString() === 'false') {
                const result = await loanTermsConsensusInstance.addSigner(address, senderTxConfig);
                console.log(toTxUrl(result));
    
                const isSigner = await loanTermsConsensusInstance.isSigner(address);
                console.log(`Has ${address} a signer role? ${isSigner.toString()}`);
            } else {
                console.log(`Address ${address} is already signer in loan terms (${tokenName} / ${collateralTokenName})`);
            }
        }
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};