// See details here https://www.npmjs.com/package/solidity-coverage
module.exports = {
    skipFiles: [
        'mock/',
        'providers/openzeppelin/SignedSafeMath.sol' // It is not included due to it is a OpenZeppelin contract.
    ],
}
