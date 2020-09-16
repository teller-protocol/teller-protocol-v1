// Smart contracts

// Util classes
const { teller } = require("../utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');

const MarketsState = artifacts.require("./base/MarketsState.sol");
const TokenCollateralLoans = artifacts.require("./base/TokenCollateralLoans.sol");
const EtherCollateralLoans = artifacts.require("./base/EtherCollateralLoans.sol");

const { logicVersion: readParams } = require("../utils/cli-builder");
const { SENDER_INDEX, LOGIC_NAME } = require('../utils/cli/names');
const { toBytes32 } = require('../../test/utils/consts');
const { assert } = require("chai");
const processArgs = new ProcessArgs(readParams.updateLogicVersion().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl, maxGasLimit } = appConf.networkConfig;

        const logicName = processArgs.getValue(LOGIC_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const sender = await accounts.getAt(senderIndex);
        const senderTxConfig = {
            from: sender,
            gas: maxGasLimit,
        };

        const getContracts = processArgs.createGetContracts(artifacts);
        const logicVersionsRegistry = await getContracts.getDeployed(teller.logicVersionsRegistry());
        console.log(`Using LogicVersionsRegistry:   ${logicVersionsRegistry.address}`);

        const logicNameBytes32 = toBytes32(web3, logicName);
        
        const hasLogicVersionResult = await logicVersionsRegistry.hasLogicVersion(logicNameBytes32, senderTxConfig);
        assert(hasLogicVersionResult, `Logic name ${logicName} / ${logicNameBytes32} is not registered.`);
    
        const getLogicVersionResult = await logicVersionsRegistry.getLogicVersion(logicNameBytes32, senderTxConfig);
        console.log(`Current logic version info: ${JSON.stringify(getLogicVersionResult)}`);

        /**
         * Set the ContractReference variable with the contract you want to update.
         * Verify it has a default constructor (without parameters).
         */
        const ContractReference = EtherCollateralLoans;

        const instance = await ContractReference.new(senderTxConfig);

        const newLogicAddress = instance.address;

        const updateLogicVersionResult = await logicVersionsRegistry.updateLogicAddress(
            logicNameBytes32,
            newLogicAddress,
            senderTxConfig
        );
        
        console.log(toTxUrl(updateLogicVersionResult));

        const newLogicVersionResult = await logicVersionsRegistry.getLogicVersion(logicNameBytes32, senderTxConfig);
        console.log(`New logic version info: ${JSON.stringify(newLogicVersionResult)}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};