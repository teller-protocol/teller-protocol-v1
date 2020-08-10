/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts/lifecycle/Pausable.sol";

// Interfaces
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/LoansInterface.sol";

// Commons
import "../util/AddressLib.sol";
import "../interfaces/EscrowInterface.sol";


/**
 *
 */
contract EscrowFactory is Pausable, EscrowFactoryInterface {
    using AddressLib for address;

    mapping(address => bool) public whitelistedDapps;

    address public escrowLibrary;

    constructor(address _escrowLibrary) public {
        escrowLibrary = _escrowLibrary;
    }

    function createEscrow(uint256 loanID) external returns (address cloneAddress) {
        bytes32 salt = computeEscrowSalt(loanID);
        bytes memory bytecode = getEscrowBytecode();
        assembly {
            cloneAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        EscrowInterface escrow = EscrowInterface(cloneAddress);
        escrow._initialize(msg.sender, loanID);

        address borrower = LoansInterface(msg.sender).loans(loanID).loanTerms.borrower;
        emit EscrowCreated(borrower, msg.sender, loanID, cloneAddress);
    }

    function computeEscrowSalt(uint256 loanID) public returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, loanID));
    }

    function getEscrowBytecode() public view returns (bytes memory) {
        bytes20 targetBytes = bytes20(escrowLibrary);

        bytes memory bytecode = new bytes(0x37);
        assembly {
            mstore(
                add(bytecode, 0x20),
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(bytecode, 0x34), targetBytes)
            mstore(
                add(bytecode, 0x48),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
        }

        return bytecode;
    }

    function computeEscrowAddress(uint256 loanID) public returns (address result) {
        bytes32 data = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                computeEscrowSalt(loanID),
                keccak256(getEscrowBytecode())
            )
        );
        return address(bytes20(data << 96));
    }

    function isDappWhitelisted(address dapp) public view returns (bool) {
        return whitelistedDapps[dapp];
    }

    function addDapp(address dapp) external onlyPauser() {
        require(!isDappWhitelisted(dapp), 'DAPP_ALREADY_EXIST');

        whitelistedDapps[dapp] = true;
    }

    function removeDapp(address dapp) external onlyPauser() {
        require(isDappWhitelisted(dapp), 'DAPP_NOT_EXIST');

        whitelistedDapps[dapp] = false;
    }
}
