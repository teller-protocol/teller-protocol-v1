pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract ERC20Mintable is ERC20, MinterRole {
    // fDAI States
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    constructor(
        string memory name, 
        string memory symbol, 
        uint8 decimals
    )
        public
    {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
    }
    
    // fDAI name
    function name() public view returns (string memory) {
        return _name;
    }

    // fDAI symbol
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    // fDAI number of decimals
    function decimals() public view returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the {MinterRole}.
     */
    function mint(address account, uint256 amount) public returns (bool) {
        _mint(account, amount);
        return true;
    }
}