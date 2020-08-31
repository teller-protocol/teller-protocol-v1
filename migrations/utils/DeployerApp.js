const assert = require('assert');
const jsonfile = require('jsonfile');
const MOCK_NETWORKS = ["test", "ganache", "soliditycoverage"];

class DeployerApp {
    constructor(deployer, web3, account, { InitializeableDynamicProxy, Mock }, { network, networkConfig }, mockNetworks = MOCK_NETWORKS) {
        this.data = new Map();
        this.web3 = web3;
        this.account = account;
        this.artifacts = { InitializeableDynamicProxy, Mock };
        this.contracts = [];
        this.deployer = deployer;
        this.network = network.toLowerCase();
        this.networkConfig = networkConfig;
        this.mockNetworks = mockNetworks.map( network => network.toLowerCase());
    }
}

DeployerApp.prototype.deployMocksContractsIfNeeded = async function() {
    const deployMocks = this.canDeployMock();
    if (!deployMocks || this.isNetwork('ganache')) {
        return;
    }
	const { tokens, compound, chainlink } = this.networkConfig;
    const { Mock } = this.artifacts;
    if(Mock === undefined) {
        return;
    }
    // Tokens
    console.log(`Deploying mocks for tokens...`);
	for (const symbol in tokens) {
		if (symbol === 'ETH') continue
		tokens[symbol] = (await Mock.new()).address;
	}

    // Compound
    console.log(`Deploying mocks for compound...`);
	for (const symbol in compound) {
		compound[symbol] = (await Mock.new()).address;
	}

    // Chainlink
    console.log(`Deploying mocks for chainlink...`);
	for (const pair in chainlink) {
		chainlink[pair].address = (await Mock.new()).address;
	}
}

/**
    This function deploys two contract: 1- The original and 2- An InitializeableDynamicProxy (with the reference to the original).
    After deploying a proxy, we MUST call the initialize function with the parameters it needs.
 */
DeployerApp.prototype.deployWithUpgradeable = async function(contractName, contract, admin, initData, ...params) {
    await this.deployWith(contractName, contract)
    await this.deployWith(`${contractName}_Proxy`, this.artifacts.InitializeableDynamicProxy, contract.address, admin, initData, ...params)
    return contract.at(this.artifacts.InitializeableDynamicProxy.address)
}

DeployerApp.prototype.deployInitializeableDynamicProxy = async function ({ name, address }, ...params) {
    console.log(`Deploying PROXY for: ${name} - logic address: ${address}.`)
    const proxy = await this.deployWith(
        `${name}_Proxy`,
        this.artifacts.InitializeableDynamicProxy,
        address,
        ...params
    );

    return proxy
}

DeployerApp.prototype.addContractInfo = async function(contractName, contractAddress) {
    this.contracts.push({
        address: contractAddress,
        name: contractName,
    });
}

DeployerApp.prototype.deployWith = async function(contractName, contract, ...params) {
    console.log(`Contract '${contractName}': deploying.`);
    const instance = await this.deployer.deploy(contract, ...params);
    this.addContractInfo(contractName, contract.address);
    return instance
}

DeployerApp.prototype.deploy = async function(contract, ...params) {
    return await this.deployWith(contract.contractName, contract, ...params);
}

DeployerApp.prototype.canDeployMock = function() {
    return this.mockNetworks.indexOf(this.network) > -1;
}

DeployerApp.prototype.isNetwork = function(aNewtork) {
    return this.network.toLowerCase() === aNewtork.toLowerCase();
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