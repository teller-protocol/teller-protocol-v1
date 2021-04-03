modifier entry {
  require()
  _;
}

contract Deposit is Domain {
    function deposit(uint256 lendingTokenAmount)
        external
        override
        entry
        whenNotPaused
        whenLendingPoolNotPaused(address(this))
        onlyAuthorized
    {}
}
