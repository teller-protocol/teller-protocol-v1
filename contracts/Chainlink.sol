pragma solidity ^0.5.0;

import "./interfaces/AggregatorInterface.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
    DATA CONTRACTS (ETH/USD)

    MAINNET = 0x79fEbF6B9F76853EDBcBc913e6aAE8232cFB9De9
    RINKEBY = 0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA
    ROPSTEN = 0x8468b2bDCE073A157E560AA4D9CcF6dB1DB98507
 */

contract Chainlink is Ownable {
    // Chainlink Aggregator Instance
    AggregatorInterface internal dataSource;

    function setReferenceContract(address _aggregator) public onlyOwner {
        dataSource = AggregatorInterface(_aggregator);
    }

    function getLatestPrice() public view returns (int256) {
        return dataSource.latestAnswer();
    }

    function getLatestUpdateHeight() public view returns (uint256) {
        return dataSource.latestTimestamp();
    }

}
