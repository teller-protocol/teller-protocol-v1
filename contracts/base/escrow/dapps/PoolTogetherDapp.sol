// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External Libraries
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// Common
import "../../../util/AddressLib.sol";

//Contracts
import "../BaseEscrowDapp.sol";

// Interfaces
import "./IPoolTogetherDapp.sol";
import "../../../providers/pooltogether/PrizePoolInterface.sol";

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
    @notice This contract is used to define the Pool Together dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract PoolTogetherDapp is IPoolTogetherDapp, BaseEscrowDapp {
    using AddressLib for address;
    using Address for address;
    using SafeERC20 for IERC20;

    /** State Variables */

    /** External Functions */

    /**
        @notice This function deposits the users funds into a Pool Together Prize Pool for a ticket.
        @param tokenAddress address of the token.
        @param amount of tokens to deposit.
    */
    function depositTicket(address tokenAddress, uint256 amount)
        public
        override
        onlyBorrower
    {
        require(
            _balanceOf(tokenAddress) >= amount,
            "POOL_INSUFFICIENT_UNDERLYING"
        );

        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);
        uint256 balanceBefore = _balanceOf(ticketAddress);
        IERC20(tokenAddress).safeApprove(address(prizePool), amount);

        prizePool.depositTo(
            address(this),
            amount,
            ticketAddress,
            address(this)
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter > balanceBefore, "DEPOSIT_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherDeposited(
            tokenAddress,
            ticketAddress,
            amount,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }

    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
        @param amount The amount of tokens to withdraw.
    */
    function withdraw(address tokenAddress, uint256 amount)
        public
        override
        onlyBorrower
    {
        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);
        uint256 balanceBefore = _balanceOf(ticketAddress);

        (
            uint256 maxExitFee, /* uint256 burnedCredit */

        ) =
            prizePool.calculateEarlyExitFee(
                address(this),
                ticketAddress,
                amount
            );
        prizePool.withdrawInstantlyFrom(
            address(this),
            amount,
            ticketAddress,
            maxExitFee
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter < balanceBefore, "WITHDRAW_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherWithdrawal(
            tokenAddress,
            ticketAddress,
            amount,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }

    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
    */
    function withdrawAll(address tokenAddress) public override onlyBorrower {
        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);

        uint256 balanceBefore = _balanceOf(ticketAddress);

        (uint256 maxExitFee, ) =
            prizePool.calculateEarlyExitFee(
                address(this),
                ticketAddress,
                balanceBefore
            );
        prizePool.withdrawInstantlyFrom(
            address(this),
            balanceBefore,
            ticketAddress,
            maxExitFee
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter < balanceBefore, "WITHDRAW_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherWithdrawal(
            tokenAddress,
            ticketAddress,
            balanceBefore,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }

    /** Internal Functions */
    /**
        @notice Grabs the Pool Together Prize Pool address for an token from the asset settings.
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return PrizePool instance.
     */
    function _getPrizePool(address tokenAddress)
        internal
        view
        returns (PrizePoolInterface)
    {
        return
            PrizePoolInterface(
                settings.assetSettings().getPrizePoolAddress(tokenAddress)
            );
    }

    /**
        @notice Grabs the controlled ticket token address for the prize pool
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return The address of the ticket token contract.
    */
    function _getTicketAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return _getPrizePool(tokenAddress).tokens()[1];
    }
}
