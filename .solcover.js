// See details here https://www.npmjs.com/package/solidity-coverage
module.exports = {
    norpc: true,
    testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage',
    compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network coverage',
    skipFiles: [
        'mock/',
        'providers/openzeppelin/SignedSafeMath.sol' // It is not included due to it is a OpenZeppelin contract.
    ]
}