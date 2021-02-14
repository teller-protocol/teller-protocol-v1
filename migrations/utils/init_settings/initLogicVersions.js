const assert = require("assert");
const {toDecimals, toBytes32} = require("../../../test-old/utils/consts");

module.exports = async function (logicContracts, instances, params) {
    console.log("\n");
    const {logicVersionsRegistryInstance} = instances;
    const {txConfig} = params;
    const logicContractsKeys = Array.from(logicContracts.keys());

    console.log(`Initializing ${logicContractsKeys.length} logic versions...`)
    const logicVersionRequests = logicContractsKeys.map(
    (logicContractKey, index) => {

        const {name, nameBytes32, address} = logicContracts.get(logicContractKey);
        console.log(
            `${index+1}# Logic Name / Key: ${name} / ${nameBytes32} - Address: ${address} - Version: 1.`
        );
        return {
            logic: address,
            logicName: nameBytes32,
        };
    });
    await logicVersionsRegistryInstance.createLogicVersions(
        logicVersionRequests,
        txConfig
    );
    console.log("\n");
};
