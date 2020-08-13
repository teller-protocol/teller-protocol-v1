pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../providers/openzeppelin/ERC20.sol";


/**
    @notice This library helps contracts to validate amounts (balances and allowances) when a 'transfer' or 'transferFrom' is executed.

    @author develop@teller.finance
 */
library ERC20Lib {
    using SafeMath for uint256;

    // Used to calculate one whole token.
    uint256 internal constant TEN = 10;

    /**
        @notice Gets a whole token based on the token decimals.
        @param self the current ERC20 instance.
        @return a whole token value based on the decimals.
     */
    function getAWholeToken(ERC20 self) internal view returns (uint256) {
        uint8 decimals = self.decimals();
        return TEN**decimals;
    }

    /**
        @notice It transfers an amount of tokens to a specific address.
        @param self The current token instance.
        @param recipient The address which will receive the tokens.
        @param amount The amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function tokenTransfer(ERC20 self, address recipient, uint256 amount) internal {
        uint256 initialBalance = self.balanceOf(address(this));
        require(initialBalance >= amount, "NOT_ENOUGH_TOKENS_BALANCE");

        bool transferResult = self.transfer(recipient, amount);
        require(transferResult, "TOKENS_TRANSFER_FAILED");

        uint256 finalBalance = self.balanceOf(address(this));

        require(initialBalance.sub(finalBalance) == amount, "INV_BALANCE_AFTER_TRANSFER");
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param self The current token instance.
        @param from The address where the tokens will transfer from.
        @param amount The amount to be transferred.
        @dev It throws a require error if the allowance is not enough.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(ERC20 self, address from, uint256 amount) internal {
        uint256 currentAllowance = self.allowance(from, address(this));
        require(currentAllowance >= amount, "NOT_ENOUGH_TOKENS_ALLOWANCE");

        uint256 initialBalance = self.balanceOf(address(this));
        bool transferFromResult = self.transferFrom(from, address(this), amount);
        require(transferFromResult, "TOKENS_TRANSFER_FROM_FAILED");

        uint256 finalBalance = self.balanceOf(address(this));
        require(
            finalBalance.sub(initialBalance) == amount,
            "INV_BALANCE_AFTER_TRANSFER_FROM"
        );
    }
}
