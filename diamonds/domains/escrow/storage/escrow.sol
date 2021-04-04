// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../market/interfaces/IMarket.sol";

// Libraries
import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_Escrow {
    struct EscrowStorage {
        /**
         * @dev Holds the instance of the associated LoanManager contract for this Escrow loan.
         */
        IMarket market;
        /**
         * @dev Holds the loan ID of the loan for this Escrow in the LoansManager contract.
         */
        uint256 loanID;
        /**
         * @dev Holds An array of tokens that are owned by this escrow.
         */
        AddressArrayLib.AddressArray tokens;
    }

    function escrowStore() internal pure returns (EscrowStorage storage s) {
        bytes32 position = keccak256("escrow.storage");
        assembly {
            s.slot := position
        }
    }
}
