pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

// Common
import "../../../util/AddressLib.sol";

// Contracts
import "../../escrow/BaseEscrowDapp.sol";

// Interfaces
import "./IUniswapDapp.sol";
import "../../../providers/uniswap/IUniswapV2Router02.sol";
import "../../../providers/uniswap/UniSwapper.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                      DAPP CONTRACT IS AN EXTENSION OF THE ESCROW CONTRACT                       **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Because there are multiple dApp contracts, and they all extend the Escrow contract that is     **/
/**  itself upgradeable, they cannot have their own storage variables as they would cause the the   **/
/**  storage slots to be overwritten on the Escrow proxy contract!                                  **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to define Uniswap dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract UniswapDapp is IUniswapDapp, UniSwapper, BaseEscrowDapp {
    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public onlyBorrower {
        uint256 destinationAmount =
            _uniswap(path, sourceAmount, minDestination);

        _tokenUpdated(path[0]);
        _tokenUpdated(path[path.length - 1]);

        emit UniswapSwapped(
            path[0],
            path[path.length - 1],
            sourceAmount,
            destinationAmount
        );
    }
}
