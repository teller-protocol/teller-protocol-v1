const assert = require('assert');
const initSignerAddresses = require('./initSignerAddresses');

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
    const { LoanTermsConsensus, InterestConsensus, ERC20Mintable } = artifacts;
    
    for (const marketDefinition of marketDefinitions) {
      console.log('\n');
      const { tTokenAddress, borrowedTokenName, collateralTokenName } = marketDefinition;
      assert(tTokenAddress, `TToken address is undefined.`);

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

      deployerApp.addContractInfo({
        name: `${collateralTokenName}_Loans_t${borrowedTokenName}_Proxy`,
        address: marketInfo.loans
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_Lenders_t${borrowedTokenName}_Proxy`,
        address: marketInfo.lenders
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_LendingPool_t${borrowedTokenName}_Proxy`,
        address: marketInfo.lendingPool
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_LoanTermsConsensus_t${borrowedTokenName}_Proxy`,
        address: marketInfo.loanTermsConsensus
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_InterestConsensus_t${borrowedTokenName}_Proxy`,
        address: marketInfo.interestConsensus
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_ChainlinkPairAggregator_t${borrowedTokenName}_Proxy`,
        address: marketInfo.pairAggregator
      });

      console.log(`TToken (${tTokenAddress}): Adding as minter ${marketInfo.lendingPool} (LendingPool). Sender: ${txConfig.from}`);
      const tTokenInstance = await ERC20Mintable.at(tTokenAddress);
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