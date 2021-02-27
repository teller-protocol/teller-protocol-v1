module.exports = async function (
    logicContracts,
    params,
) {
    console.log('Starting to deploy logic contracts.');
    const { deployerApp, txConfig, web3 } = params;

    const result = new Map();

    for (const logicContract of logicContracts) {
        const { Contract, name, address } = logicContract;
        const logicNameBytes32 = web3.utils.soliditySha3(name);
        await deployerApp.deploy(Contract, txConfig);
        console.log(`Deploying logic contract: ${name} - key: ${logicNameBytes32} - logic address: ${Contract.address}`);
        result.set(name, {
            name,
            nameBytes32: logicNameBytes32,
            address: Contract.address,
            Contract,
            contract: Contract,
        });
    }
    console.log(`Total deployed logic contracts: ${result.size}`);
    return result;
}
