const assert = require('assert');
const DeployerApp = require('../utils/DeployerApp');
const PoolDeployer = require('../utils/PoolDeployer');

const tellerMainnet = require('../../config/networks/mainnet/teller');

const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Official Smart Contracts
const TUSDC = artifacts.require("./base/TUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const MarketsState = artifacts.require("./base/MarketsState.sol");
const Lenders = artifacts.require("./base/Lenders.sol");
const TokenCollateralLoans = artifacts.require("./base/TokenCollateralLoans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
// ATM Smart contracts

// External providers
const tokensRequired = ['DAI', 'USDC', 'LINK'];
const chainlinkOraclesRequired = ['DAI_ETH', 'USDC_ETH', 'LINK_USD'];

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens, chainlink, signers, compound } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  // Validations
  tokensRequired.forEach( tokenName => assert(tokens[tokenName], `${tokenName} token address is not defined.`));
  chainlinkOraclesRequired.forEach( pairName => assert(chainlink[pairName], `Chainlink: ${pairName} oracle address is undefined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, UpgradeableProxy, network);

  const TUSDC_ = {
    deployed: async () => {
      const tUSDCInstance = await TUSDC.at(tellerMainnet.TUSDC);
      return tUSDCInstance;
    },
    address: tellerMainnet.TUSDC,
  };
  console.log(`Token TUSDC was deployed at: [${tellerMainnet.TUSDC}] `);  

  // Settings Deployments
  const marketsStateInstance = await MarketsState.at(tellerMainnet.MarketsState);
  const settingsInstance = await Settings.at(tellerMainnet.Settings_Proxy);
  const atmSettingsInstance = await ATMSettings.at(tellerMainnet.ATMSettings);

  console.log(`Markets State Address: ${marketsStateInstance.address}`);  
  console.log(`Settings Address:      ${settingsInstance.address}`);
  console.log(`ATM Settings Address:  ${atmSettingsInstance.address}`);

  const aggregators = {
    LINK_USD: tellerMainnet.ChainlinkPairAggregator_USD_LINK,
  };

  const deployConfig = {
    tokens,
    aggregators,
    signers,
    cTokens: compound,
  };

  const artifacts = {
    Lenders,
    LendingPool,
    InterestConsensus,
    LoanTermsConsensus,
  };
  const poolDeployer = new PoolDeployer(deployerApp, deployConfig, artifacts);

  const instances = {
    marketsStateInstance,
    settingsInstance,
    atmSettingsInstance,
    interestValidatorInstance: undefined, // The first version will be undefined (or 0x0).
  };

  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'LINK', aggregatorName: 'LINK_USD' },
    {
      Loans: TokenCollateralLoans,
      TToken: TUSDC_,
    },
    instances,
    txConfig
  );

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};