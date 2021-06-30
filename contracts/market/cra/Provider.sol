// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract Provider {
    mapping(address => bool) public admins;
    mapping(address => bool) public signers;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Teller: not admin");
        _;
    }

    constructor() {
        admins[msg.sender] = true;
    }

    function setSigner(address signerAddress, bool signerValue)
        public
        onlyAdmin
    {
        signers[signerAddress] = signerValue;
    }

    function setAdmin(address adminAddress, bool adminValue) public onlyAdmin {
        admins[adminAddress] = adminValue;
    }
}
