// Smart contracts

// Util classes
const { teller } = require("../utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');

const { logicVersion: readParams } = require("../utils/cli-builder");
const { SENDER_INDEX, LOGIC_NAME, CONTRACT_NAME } = require('../utils/cli/names');
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
        const contractName = processArgs.getValue(CONTRACT_NAME.name);
        const sender = await accounts.getAt(senderIndex);
        const senderTxConfig = {
            from: sender,
            gas: maxGasLimit,
        };

        const ContractReference = artifacts.require(contractName);
        console.log(`Using contract artifcact: '${ContractReference.contract_name}'`);

        const getContracts = processArgs.createGetContracts(artifacts);
        const logicVersionsRegistry = await getContracts.getDeployed(teller.logicVersionsRegistry());
        console.log(`Using LogicVersionsRegistry:   ${logicVersionsRegistry.address}`);

        const logicNameBytes32 = web3.utils.soliditySha3(logicName);
        
        const hasLogicVersionResult = await logicVersionsRegistry.hasLogicVersion(logicNameBytes32, senderTxConfig);
        assert(hasLogicVersionResult, `Logic name ${logicName} / ${logicNameBytes32} is not registered.`);
    
        const getLogicVersionResult = await logicVersionsRegistry.getLogicVersion(logicNameBytes32, senderTxConfig);
        console.log(`Current logic version info: ${JSON.stringify(getLogicVersionResult)}`);

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
