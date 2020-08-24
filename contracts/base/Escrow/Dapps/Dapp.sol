pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../../../util/AddressLib.sol";

// Interfaces
import "./IDApp.sol";

contract Dapp is IDApp {
    using Address for address;
    using AddressLib for address;

    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public wethAddress;

    /**
        @notice Sets canonical WETH address for each network.
        @param canonicalWeth canonical weth address on this network.
        @dev https://uniswap.org/docs/v2/smart-contracts/router02/#weth
     */
    function _updateWethAddress(address canonicalWeth)
        internal
    {
        require(canonicalWeth.isContract(), "CANONICAL_WETH_MUST_BE_CONTRACT");
        IERC20(canonicalWeth).balanceOf(address(this)); // Should revert if it is not ERC20 compatible.
        address previousWeth = wethAddress;
        previousWeth.requireNotEqualTo(canonicalWeth, "NEW_WETH_ADDRESS_SAME_PREVIOUS");
        wethAddress = canonicalWeth;
        emit WethAddressUpdated(msg.sender, previousWeth, wethAddress);
    }
}