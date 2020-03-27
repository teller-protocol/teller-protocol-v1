pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract SimpleToken is ERC20Detailed, ERC20Mintable, ERC20Burnable {
    /**
     * @dev Constructor that gives _msgSender() all of existing tokens.
     */
    constructor() public ERC20Detailed("SimpleToken", "SIM", 18) {
        _mint(msg.sender, 1000000000000 * (10**uint256(decimals())));
    }

    function mint(address beneficiary, uint256 amount) public {
        _mint(beneficiary, amount);
    }
}
