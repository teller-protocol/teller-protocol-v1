pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EscrowFactory.sol";

contract EscrowFactoryMock is EscrowFactory {
    constructor(address _escrowLibrary) EscrowFactory(_escrowLibrary) public {
    }

    function enableDapp(address dapp) external {
        whitelistedDapps[dapp] = true;
    }
}
