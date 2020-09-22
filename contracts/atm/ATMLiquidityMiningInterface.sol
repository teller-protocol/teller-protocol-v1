pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

interface ATMLiquidityMiningInterface {

    function initialize(address atmGovernanceProxy, address atmTLRTokenProxy) external;

}