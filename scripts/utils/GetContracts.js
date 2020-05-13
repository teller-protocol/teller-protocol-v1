
class GetContracts {
    constructor(artifacts, networkConf) {
        this.artifacts = artifacts;
        this.networkConf = networkConf;
    }
}

GetContracts.prototype.getInfo = function({contractName, keyName}) {
    for (const key of Object.keys(this.networkConf[keyName])) {
        const has = key.toLowerCase() === contractName.toLowerCase();
        if(has) {
            return {
                address: this.networkConf[keyName][key],
                name: key,
            };
        }
    }
    throw new Error(`Contract ${contractName} not found.`);
}

GetContracts.prototype.getDeployed = async function({ keyName, contractName, artifactName = undefined}) {
    const { address, name } = this.getInfo({keyName, contractName});
    const artifact = this.artifacts.require(artifactName || name);
    const instance = await artifact.at(address);
    return instance;
}

module.exports = GetContracts;