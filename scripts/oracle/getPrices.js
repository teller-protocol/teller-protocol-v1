// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

const tokenName = 'USDC'.toUpperCase();
const senderIndex = 0;
const back = 1;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral } = appConf.networkConfig;
        const chainlinkPairAggregatorAddress = zerocollateral[`ChainlinkPairAggregator_${tokenName}_ETH`];

        assert(chainlinkPairAggregatorAddress, "ChainlinkPairAggregator configuration address is undefined.");
        const chainlinkAggregatorAggregator = await ChainlinkPairAggregator.at(chainlinkPairAggregatorAddress);

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");

        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        console.log(`Chainlink Aggregator => ${tokenName} / ETH: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await chainlinkAggregatorAggregator.getLatestAnswer();
        console.log(`Lastest Answer:        1 ${tokenName} = ${getLatestAnswerResult.toString()} WEI = ${web3.utils.fromWei(getLatestAnswerResult.toString(), 'ether')} ETHER`);

        const getLatestTimestampResult = parseInt(await chainlinkAggregatorAggregator.getLatestTimestamp()) * 1000;
        console.log(`Latest Timestamp:      ${getLatestTimestampResult} ms = ${new Date(getLatestTimestampResult).toISOString()}`);

        const getPreviousAnswerResult = await chainlinkAggregatorAggregator.getPreviousAnswer(back);
        console.log(`Previous Answer:       1 ${tokenName} = ${getPreviousAnswerResult.toString()} WEI = ${web3.utils.fromWei(getPreviousAnswerResult.toString(), 'ether')} ETHER`);

        const getPreviousTimestampResult = parseInt(await chainlinkAggregatorAggregator.getPreviousTimestamp(back)) * 1000;
        console.log(`Previous Timestamp:    ${getPreviousTimestampResult.toString()} ms = ${new Date(getPreviousTimestampResult).toISOString()}`);
        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
