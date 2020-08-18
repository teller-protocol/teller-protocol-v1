pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract EscrowStorage {
    mapping(bytes32 => bytes) data;
    IERC20 borrowedAsset;

    function getBytes(string memory key) public view returns (bytes memory) {
        return data[keccak256(bytes(key))];
    }
}
