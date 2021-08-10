import { RepayFacet } from "../RepayFacet.sol";

import { NFTLib } from "../../nft/libraries/NFTLib.sol";
import { LibLoans } from "../libraries/LibLoans.sol";

contract MainnetRepayFacet is RepayFacet {
    function _restakeNFT(uint256 loanID) internal override {
        NFTLib.restakeLinked(loanID, LibLoans.loan(loanID).borrower);

        super._restakeNFT(loanID);
    }
}
