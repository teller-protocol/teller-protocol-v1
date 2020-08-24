pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/Proxy.sol";

contract BaseProxy is Proxy {
    constructor() public payable {
    }

    /** Internal Functions **/

    /**
        @notice Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view returns (address) {
        return _implementation();
    }

    /** Internal Functions **/

    /**
        @notice It delegates data to an address with encoded data.
        @param _implementation address to delegatcall to
        @param _data encoded bytes to forward
        @return encoded bytes returned from the delegatecall
     */
    function _delegateToWith(address _implementation, bytes memory _data) internal returns (bytes memory) {
        (bool success, bytes memory data) = _implementation.delegatecall(_data);
        require(success);
        return data;
    }
}
