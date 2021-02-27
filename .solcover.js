// See details here https://www.npmjs.com/package/solidity-coverage
module.exports = {
  skipFiles: [
    'providers/openzeppelin/SignedSafeMath.sol', // It is not included due to it is a OpenZeppelin contract.
  ],
}
