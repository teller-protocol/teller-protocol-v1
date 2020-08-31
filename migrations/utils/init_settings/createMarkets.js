const assert = require('assert');
const initSignerAddresses = require('./initSignerAddresses');
const logicNames = require('../../../test/utils/logicNames');

module.exports = async function (
    marketDefinitions,
    instances,
    params,
    artifacts,
) {
    console.log('\n\n');
    console.log(`Creating ${marketDefinitions.length} markets.`);
    const { marketFactoryInstance, marketsStateInstance } = instances;
    const { tokens, txConfig, signers, deployerApp } = params;
    const { LoanTermsConsensus, InterestConsensus, IERC20Mintable } = artifacts;
    
    for (const marketDefinition of marketDefinitions) {
      console.log('\n');
      const { tTokenAddress, borrowedTokenName, collateralTokenName } = marketDefinition;
      assert(tTokenAddress, `TToken address is undefined.`);

      // TODO: should we create markets in both directions? i.e. borrowed => collateral && collateral => borrowed
      // if the collateral token is LINK, flip the market pair direction so it will be accessed correctly on-chain
      const borrowedTokenAddress = tokens[borrowedTokenName];
      assert(borrowedTokenAddress, `Borrowed token is undefined. Borrowed token name; ${borrowedTokenName}`);
      const collateralTokenAddress = tokens[collateralTokenName];
      assert(collateralTokenAddress, `Collateral token is undefined. Collateral token name; ${collateralTokenAddress}`);
  
      console.log(`Creating market (Sender: ${txConfig.from}): ${borrowedTokenName} / ${borrowedTokenAddress} - ${collateralTokenName} / ${collateralTokenAddress}.`)
      await marketFactoryInstance.createMarket(
        tTokenAddress,
        borrowedTokenAddress,
        collateralTokenAddress,
        txConfig,
      );

      const marketInfo = await marketFactoryInstance.getMarket(
        borrowedTokenAddress,
        collateralTokenAddress,
      );
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Loans (proxy): ${marketInfo.loans}`);
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Lenders (proxy): ${marketInfo.lenders}`);
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Lending pool (proxy): ${marketInfo.lendingPool}`);
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Loan term consensus (proxy): ${marketInfo.loanTermsConsensus}`);
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Interest consensus (proxy): ${marketInfo.interestConsensus}`);
      console.log(`Market ${borrowedTokenName} / ${collateralTokenName}: Pair aggregator (proxy): ${marketInfo.pairAggregator}`);

      deployerApp.addContractInfo(`${collateralTokenName}_Loans_t${borrowedTokenName}_Proxy`, marketInfo.loans);
      deployerApp.addContractInfo(`${collateralTokenName}_Lenders_t${borrowedTokenName}_Proxy`, marketInfo.lenders);
      deployerApp.addContractInfo(`${collateralTokenName}_LendingPool_t${borrowedTokenName}_Proxy`, marketInfo.lendingPool);
      deployerApp.addContractInfo(`${collateralTokenName}_LoanTermsConsensus_t${borrowedTokenName}_Proxy`, marketInfo.loanTermsConsensus);
      deployerApp.addContractInfo(`${collateralTokenName}_InterestConsensus_t${borrowedTokenName}_Proxy`, marketInfo.interestConsensus);
      deployerApp.addContractInfo(`${collateralTokenName}_ChainlinkPairAggregator_t${borrowedTokenName}_Proxy`, marketInfo.pairAggregator);

      console.log(`TToken (${tTokenAddress}): Adding as minter ${marketInfo.lendingPool} (LendingPool). Sender: ${txConfig.from}`);
      const tTokenInstance = await IERC20Mintable.at(tTokenAddress);
      await tTokenInstance.addMinter(marketInfo.lendingPool, txConfig);
      
      console.log(`MarketsState (${marketsStateInstance.address}): Adding as whitelisted ${marketInfo.loans} (loans proxy). Sender: ${txConfig.from}`);
      await marketsStateInstance.addWhitelisted(marketInfo.loans, txConfig);
      console.log(`MarketsState (${marketsStateInstance.address}): Adding as whitelisted ${marketInfo.lendingPool} (lending pool proxy). Sender: ${txConfig.from}`);
      await marketsStateInstance.addWhitelisted(marketInfo.lendingPool, txConfig);
      const loanTermsConsensusInstance = await LoanTermsConsensus.at(marketInfo.loanTermsConsensus);
      const interestConsensusInstance = await InterestConsensus.at(marketInfo.loanTermsConsensus);

      await initSignerAddresses(
        { loanTermsConsensusInstance, interestConsensusInstance },
        { signers, txConfig },
        { },
      );
      console.log('\n');
    }
    console.log('\n');
}