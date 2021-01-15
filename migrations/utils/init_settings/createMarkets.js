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
    const { marketFactoryInstance } = instances;
    const { tokens, txConfig, signers, deployerApp } = params;
    const { LoanTermsConsensus } = artifacts;
    
    for (const marketDefinition of marketDefinitions) {
      console.log('\n');
      const { lendingTokenName, collateralTokenName } = marketDefinition;

      const lendingTokenAddress = tokens[lendingTokenName];
      assert(lendingTokenAddress, `Borrowed token is undefined. Borrowed token name; ${lendingTokenName}`);
      const collateralTokenAddress = tokens[collateralTokenName];
      assert(collateralTokenAddress, `Collateral token is undefined. Collateral token name; ${collateralTokenAddress}`);
  
      console.log(`Creating market (Sender: ${txConfig.from}): ${lendingTokenName} / ${lendingTokenAddress} - ${collateralTokenName} / ${collateralTokenAddress}.`)
      await marketFactoryInstance.createMarket(
        lendingTokenAddress,
        collateralTokenAddress,
        txConfig,
      );

      const marketInfo = await marketFactoryInstance.getMarket(
        lendingTokenAddress,
        collateralTokenAddress,
      );
      console.log(`Market ${lendingTokenName} / ${collateralTokenName}: Loans (proxy): ${marketInfo.loans}`);
      console.log(`Market ${lendingTokenName} / ${collateralTokenName}: Lending pool (proxy): ${marketInfo.lendingPool}`);
      console.log(`Market ${lendingTokenName} / ${collateralTokenName}: Loan term consensus (proxy): ${marketInfo.loanTermsConsensus}`);

      deployerApp.addContractInfo({
        name: `${collateralTokenName}_Loans_t${lendingTokenName}_Proxy`,
        address: marketInfo.loans
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_LendingPool_t${lendingTokenName}_Proxy`,
        address: marketInfo.lendingPool
      });
      deployerApp.addContractInfo({
        name: `${collateralTokenName}_LoanTermsConsensus_t${lendingTokenName}_Proxy`,
        address: marketInfo.loanTermsConsensus
      });

      const loanTermsConsensusInstance = await LoanTermsConsensus.at(marketInfo.loanTermsConsensus);

      await initSignerAddresses(
        { loanTermsConsensusInstance },
        { signers, txConfig },
        { },
      );
      console.log('\n');
    }
    console.log('\n');
}
