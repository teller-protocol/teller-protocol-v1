const _ = require('lodash');
const { NULL_ADDRESS, ETH_ADDRESS } = require('../../test/utils/consts');

class GetContracts {
    constructor(artifacts, networkConf) {
        this.artifacts = artifacts;
        this.networkConf = networkConf;
    }
}

GetContracts.prototype.getInfo = function({contractName, keyName, addressOnProperty = 'address'}) {
    for (const key of Object.keys(this.networkConf[keyName])) {
        const has = key.toLowerCase() === contractName.toLowerCase();
        if(has) {
            let addressValue = this.networkConf[keyName][key];
            if(typeof addressValue ===  "object") {
                addressValue = _.get(this.networkConf[keyName][key], addressOnProperty);
            }
            return {
                address: addressValue,
                name: key,
            };
        }
    }
    throw new Error(`Contract ${contractName} not found.`);
}

GetContracts.prototype.getAddressOrEmpty = function({contractName, keyName, addressOnProperty = 'address'}) {
    try {
        const info = this.getInfo({ contractName, keyName, addressOnProperty });
        return info.address;
    } catch (error) {
        return NULL_ADDRESS;
    }
}

GetContracts.prototype.getDeployed = async function({ keyName, contractName, addressOnProperty = 'address', artifactName = undefined}) {
    const { address, name } = this.getInfo({keyName, contractName, addressOnProperty});
    const artifact = this.artifacts.require(artifactName || name);
    const instance = await artifact.at(address);
    return instance;
}

GetContracts.prototype.getAllDeployed = async function({ teller, tokens }, tokenName, collTokenName) {
    let collateralToken;
    if(collTokenName.toLowerCase() === 'eth') {
        collateralToken = {
            decimals: async () => Promise.resolve(18),
            name: async () => Promise.resolve('ETH'),
            symbol: async () => Promise.resolve('ETH'),
            address: async () => Promise.resolve(ETH_ADDRESS),
        };
    } else {
        collateralToken = await this.getDeployed(tokens.get(collTokenName));
    }
    const settings = await this.getDeployed(teller.settings());
    const token = await this.getDeployed(tokens.get(tokenName));
    const lendingPool = await this.getDeployed(teller.custom(collTokenName).lendingPool(tokenName));
    const loans = await this.getDeployed(teller.custom(collTokenName).loans(tokenName));
    const loanTermsConsensus = await this.getDeployed(teller.custom(collTokenName).loanTermsConsensus(tokenName));
    const atmGovernance = await this.getDeployed(teller.atmGovernance());

    const oraclePrice = await loans.priceOracle();
    const PairAggregatorInterface = this.artifacts.require('PairAggregatorInterface');
    const pairAggregator = await PairAggregatorInterface.at(oraclePrice);
    const chainlinkAggregator = await pairAggregator.aggregator();
    const PairAggregatorMock = this.artifacts.require('PairAggregatorMock');
    const oracle = await PairAggregatorMock.at(chainlinkAggregator);
    return {
        settings,
        token,
        collateralToken,
        lendingPool,
        loans,
        oracle,
        pairAggregator,
        loanTermsConsensus,
        atmGovernance
    };
}

module.exports = GetContracts;