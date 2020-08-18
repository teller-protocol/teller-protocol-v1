pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EscrowFactory.sol";


contract EscrowFactoryMock is EscrowFactory {
    constructor(address _escrowLibrary) public EscrowFactory(_escrowLibrary) {}

    function enableDapp(address dapp) external {
        whitelistedDapps[dapp] = true;
    }
}
