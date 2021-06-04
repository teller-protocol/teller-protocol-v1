contract SampleHandler {
    function handler(
        uint256 marketScore,
        uint256 collateralAsset,
        uint256 collateralRatio,
        uint256 loanAsset,
        uint256 loanAmount,
        uint256 duration
    ) external returns (uint256 interestRate) {
        require(duration < 180 days, "ME01");
        require(loanAmount < marketScore, "ME02");
        require(address(collateralAsset) == YFI, "ME03");

        (interestRate, collateralRatio, loanAmount);

        require(
            LendingLib.tToken(request.request.assetAddress).debtRatioFor(
                maxLoanAmount
            ) <= MaxDebtRatioLib.get(request.request.assetAddress),
            "ME04"
        );
    }
}
