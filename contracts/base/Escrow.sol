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

// Contracts
import "./Initializable.sol";
import "./Escrow/EscrowStorage.sol";

// Interfaces
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";

// Libraries
import "../util/AddressLib.sol";

// Commons


contract Escrow is Initializable, EscrowInterface, EscrowStorage {
    using AddressLib for address;
    using AddressLib for address payable;

    EscrowFactoryInterface public factory;
    LoansInterface public loans;
    uint256 public loanID;

    struct DappData {
        address location;
        bytes data;
    }

    modifier onlyBorrower() {
        require(isBorrower(), 'CALLER_NOT_BORROWER');
        _;
    }

    function isBorrower() internal returns (bool) {
        return msg.sender == loans.loans(loanID).loanTerms.borrower;
    }

    function _initialize(address _loans, uint256 _loanID) public isNotInitialized() {
        _initialize();

        factory = EscrowFactoryInterface(msg.sender);
        loans = LoansInterface(_loans);
        loanID = _loanID;
        borrowedAsset = IERC20(loans.lendingToken());
    }

    function callDapp(DappData memory dappData) public isInitialized() onlyBorrower() {
        require(factory.isDappWhitelisted(dappData.location), 'DAPP_NOT_WHITELISTED');

        dappData.location.delegatecall(dappData.data);
    }
}
