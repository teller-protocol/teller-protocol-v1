pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Consensus.sol";


contract ConsensusModifiersMock is Consensus {
    function externalIsCaller(address sender) external isCaller(sender) {}
}
