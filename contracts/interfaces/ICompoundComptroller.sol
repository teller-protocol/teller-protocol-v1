pragma solidity 0.5.17;

interface ICompoundComptroller {
    function claimComp(address holder, address[] calldata cTokens) external;
}
