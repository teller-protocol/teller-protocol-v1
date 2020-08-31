const assert = require('assert');
const initSignerAddresses = require('./initSignerAddresses');

module.exports = async function (
    marketDefinitions,
    instances,
    params,
    artifacts,
) {
    console.log('\n');
    console.log(`Creating ${marketDefinitions.length} markets.`);
    const { marketFactoryInstance, marketsStateInstance } = instances;
    const { tokens, txConfig, signers } = params;
    const { LoanTermsConsensus, InterestConsensus, IERC20Mintable } = artifacts;
    
    for (const marketDefinition of marketDefinitions) {
        const { tTokenAddress, borrowedTokenName, collateralTokenName } = marketDefinition;
        assert(tTokenAddress, `TToken address is undefined.`);

        // TODO: should we create markets in both directions? i.e. borrowed => collateral && collateral => borrowed
        // if the collateral token is LINK, flip the market pair direction so it will be accessed correctly on-chain
        const borrowedTokenAddress = collateralTokenName === 'LINK' ? tokens[collateralTokenName] : tokens[borrowedTokenName];
        assert(borrowedTokenAddress, `Borrowed token is undefined. Borrowed token name; ${borrowedTokenName}`);
        const collateralTokenAddress = collateralTokenName === 'LINK' ? tokens[borrowedTokenName] : tokens[collateralTokenName];
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
        // TODO Add proxy addresses to deployer, so it is printed out at the end of the process.
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
      }
    console.log('\n');
}