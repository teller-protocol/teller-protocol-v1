pragma solidity ^0.5.0;

interface ChainlinkInterface {

    function setReferenceContract(address _aggregator) external;
    function getLatestPrice() external view returns (int256);
    function getLatestUpdateHeight() external view returns (uint256);
}
