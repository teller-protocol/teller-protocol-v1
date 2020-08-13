const jsonfile = require('jsonfile');

const MOCK_NETWORKS = ["test", "ganache"];

class DeployerApp {
    constructor(deployer, web3, account, AdminUpgradeabilityProxy, network, mockNetworks = MOCK_NETWORKS) {
        this.data = new Map();
        this.web3 = web3;
        this.account = account;
        this.AdminUpgradeabilityProxy = AdminUpgradeabilityProxy
        this.contracts = [];
        this.deployer = deployer;
        this.network = network.toLowerCase();
        this.mockNetworks = mockNetworks.map( network => network.toLowerCase());
    }

    async deployWithUpgradeable(contractName, contract, admin, data, ...params) {
        await this.deployWith(contractName, contract, ...params)
        await this.deployWith(`${contractName} - Upgradable Proxy`, this.AdminUpgradeabilityProxy, contract.address, admin, data, ...params)
        return contract.at(this.AdminUpgradeabilityProxy.address)
    }
}

DeployerApp.prototype.deployWith = async function(contractName, contract, ...params) {
    console.log(`Contract '${contractName}': deploying.`);
    await this.deployer.deploy(contract, ...params);
    this.contracts.push({
        address: contract.address,
        name: contractName,
    });
}

DeployerApp.prototype.deploy = async function(contract, ...params) {
    await this.deployWith(contract.contractName, contract, ...params);
}

DeployerApp.prototype.canDeployMock = function() {
    return this.mockNetworks.indexOf(this.network) > -1;
}

DeployerApp.prototype.deployMockIf = async function(contract, ...params) {
    if(this.canDeployMock()) {
        await this.deploy(contract, ...params);
    }
}

DeployerApp.prototype.deployMockIfWith = async function(contractName, contract, ...params) {
    if(this.canDeployMock()) {
        await this.deployWith(contractName, contract, ...params);
    }
}

DeployerApp.prototype.deployMocksIf = async function(contracts, ...params) {
    for (const key in contracts) {
        if (contracts.hasOwnProperty(key)) {
            const contract = contracts[key];
            await this.deployMockIf(contract, ...params);
        }
    }
}

DeployerApp.prototype.deploys = async function(contracts, ...params) {
    for (const key in contracts) {
        if (contracts.hasOwnProperty(key)) {
            const contract = contracts[key];
            await this.deploy(contract, ...params);
        }
    }
}

DeployerApp.prototype.links = async function(contract, libraries) {
    const { contractName } = contract;
    for (const key in libraries) {
        if (libraries.hasOwnProperty(key)) {
            const library = libraries[key];
            console.log(`Contract '${contractName}': linking library '${library.contractName}'.`);
            await this.deployer.link(library, contract);
        }
    }
}

DeployerApp.prototype.print = function() {
    console.log(`\n${'-'.repeat(25)} Starts contracts info ${'-'.repeat(25)}`);
    this.contracts.forEach(item => console.log(`${item.name}: ${item.address}`));
    console.log(`${'-'.repeat(25)} Ends contracts info ${'-'.repeat(25)}\n`);
}

DeployerApp.prototype.writeJson = function(outputJson = `./build/${this.network}_${new Date().getTime()}.json`) {
    if(this.canDeployMock()) {
        return;
    }
    const jsonData = {
        contracts: []
    };

    for (const contractInfo of this.contracts) {
        jsonData.contracts.push({
            order: this.contracts.indexOf(contractInfo) + 1,
            address: contractInfo.address,
            name: contractInfo.name,
        });
    }

    jsonfile.writeFile(outputJson, jsonData, {spaces: 4, EOL: '\r\n'}, function (err) {
      console.log(`JSON file created at '${outputJson}'.`);
      if(err) {
        console.error("Errors: " + err);
      }
    });
}

module.exports = DeployerApp;