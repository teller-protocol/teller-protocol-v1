import { RepayFacet } from "../RepayFacet.sol";

import { NFTLib } from "../../nft/libraries/NFTLib.sol";
import { LibLoans } from "../libraries/LibLoans.sol";

import { TellerNFT } from "../../nft/TellerNFT.sol";

contract MainnetRepayFacet is RepayFacet {
    constructor(address nftV2Address) RepayFacet(nftV2Address) {}

    /**
     *  @notice On mainnet, we override the restakeNFT method so that TellerNFTV1 is also restakes
     *  @param loanID ID of loan for which to restake linked NFT
     */
    function _restakeNFTForRepayment(uint256 loanID) internal override {
        NFTLib.restakeLinked(loanID, LibLoans.loan(loanID).borrower);

        super._restakeNFTForRepayment(loanID);
    }

    /**
       @notice On mainnet, we override the liquidateNFT method so that TellerNFTV1 is also transferred
       @param loanID ID of loan for which to transfer linked NFT
    */
    function _liquidateNFT(uint256 loanID) internal override {
        NFTLib.liquidateNFT(loanID);

        super._liquidateNFT(loanID);
    }
}
