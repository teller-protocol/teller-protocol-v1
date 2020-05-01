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

// Libraries
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../util/ZeroCollateralCommon.sol";

// Contracts
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";
import "./Initializable.sol";


contract Consensus is SignerRole, Initializable {
    using SafeMath for uint256;

    // Has signer address already submitted their answer for (user, identifier)?
    mapping(address => mapping(address => mapping(uint256 => bool))) public hasSubmitted;

    // mapping from signer address, to signerNonce, to boolean.
    // Has the signer already used this nonce?
    mapping(address => mapping(uint256 => bool)) public signerNonceTaken;

    // the total number of submissions required for consensus on a value
    uint256 public requiredSubmissions;

    // this is a percentage with 2 decimal places
    // i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
    uint256 public maximumTolerance;

    // the address with permissions to submit a request for processing
    address caller;

    modifier isCaller() {
        require(caller == msg.sender, "Address has no permissions.");
        _;
    }

    function initialize(
        address callerAddress,
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance,
        uint256 initResponseExpiry
    ) public isNotInitialized() {
        require(callerAddress != address(0), "MUST_PROVIDE_LENDER_INFO");
        require(initRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        require(initResponseExpiry > 0, "MUST_PROVIDE_RESPONSE_EXP");

        _initialize();

        caller = callerAddress;
        requiredSubmissions = initRequiredSubmissions;
        maximumTolerance = initMaximumTolerance;
        responseExpiryLength = initResponseExpiry;
    }

    function _signatureValid(
        ZeroCollateralCommon.Signature memory signature,
        bytes32 dataHash,
        address expectedSigner
    ) internal view returns (bool) {
        if (!isSigner(expectedSigner)) return false;

        address signer = ecrecover(
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash)),
            signature.v,
            signature.r,
            signature.s
        );
        return (signer == expectedSigner);
    }
}
