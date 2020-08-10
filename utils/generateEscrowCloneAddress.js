const ethUtils = require("ethereumjs-util");
const web3_utils = require("web3-utils");
const { getEscrowBytecodeFromAddress } = require("./getEscrowBytecode");

function generateEscrowCloneAddressFromFactory(loansAddress, loanID, factoryAddress, libraryAddress) {
    const escrowCloneBytecode = getEscrowBytecodeFromAddress(libraryAddress);
    const salt = web3_utils.soliditySha3(loansAddress, loanID);
    const addressBuffer = ethUtils.generateAddress2(factoryAddress, salt, escrowCloneBytecode);
    const address = ethUtils.bufferToHex(addressBuffer);
    return web3_utils.toChecksumAddress(address);
}

module.exports = {
    generateEscrowCloneAddressFromFactory
};