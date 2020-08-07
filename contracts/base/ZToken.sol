pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "../interfaces/ZTokenInterface.sol";


/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
// TODO: Change to TToken
contract ZToken is ZTokenInterface, ERC20Detailed, ERC20Mintable {
    /* Constructor */
    /**
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param decimals The amount of decimals for the token
     */
    constructor(string memory name, string memory symbol, uint8 decimals)
        public
        ERC20Detailed(name, symbol, decimals)
    {}

    /* Public Functions */
    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     * @return true if successful
     */
    function burn(address account, uint256 amount) public onlyMinter returns (bool) {
        _burn(account, amount);
        return true;
    }

}
