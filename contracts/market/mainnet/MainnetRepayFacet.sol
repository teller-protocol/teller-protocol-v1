import { RepayFacet } from "../RepayFacet.sol";

import { NFTLib } from "../../nft/libraries/NFTLib.sol";
import { LibLoans } from "../libraries/LibLoans.sol";

contract MainnetRepayFacet is RepayFacet {
    /**
       @notice On mainnet, we override the restakeNFT method so that TellerNFTV1 is also restakes
       @param loanID ID of loan for which to restake linked NFT
    */
    function _restakeNFT(uint256 loanID) internal override {
        NFTLib.restakeLinked(loanID, LibLoans.loan(loanID).borrower);

        super._restakeNFT(loanID);
    }
}
