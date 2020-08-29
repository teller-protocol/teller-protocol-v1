pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/Proxy.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

/**
    @notice It is the base Proxy contract for all other Proxy contracts.
    @dev It makes the current logic implementation address publicly available.

    @author develop@teller.finance
 */
contract BaseProxy is Proxy {
    using Address for address;

    /** Internal Functions **/
    // TODO Do we need this contract?

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
        // TODO Error message too long (max 32 chars).
        require(_implementation.isContract(), "PROXY_DELEGATE_TO_IMPLEMENTATION_MUST_BE_A_CONTRACT");

        (bool success, bytes memory data) = _implementation.delegatecall(_data);
        require(success, ':(');// TODO Add a valid error message.
        return data;
    }
}
