const _ = require('lodash');
const { NULL_ADDRESS } = require('../../test/utils/consts');

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

module.exports = GetContracts;