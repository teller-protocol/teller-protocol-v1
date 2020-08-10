pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";


contract ERC20Mock is ERC20Detailed, ERC20Mintable, ERC20Burnable {
    constructor(
        string memory aName,
        string memory aSymbol,
        uint8 aDecimals,
        uint256 initialMintAmount
    ) public ERC20Detailed(aName, aSymbol, aDecimals) {
        _mint(msg.sender, initialMintAmount * (10**uint256(decimals())));
    }

    function mint(address account, uint256 amount) public returns (bool) {
        _mint(account, amount);
        return true;
    }
}
