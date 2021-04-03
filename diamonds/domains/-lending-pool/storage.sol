abstract contract sto_LendingPool_v1 {
    uint8 internal constant EXCHANGE_RATE_DECIMALS = 36;

    struct Layout {
        address tToken;
        address lendingToken;
        address cToken;
        address compound;
        address comp;
        /*
            The total amount of underlying asset that has been originally been supplied by each
            lender not including interest earned.
        */
        mapping(address => uint256) _totalSuppliedUnderlyingLender;
        // The total amount of underlying asset that has been lent out for loans.
        uint256 _totalBorrowed;
        // The total amount of underlying asset that has been repaid from loans.
        uint256 _totalRepaid;
        // The total amount of underlying interest that has been claimed for each lender.
        mapping(address => uint256) _totalInterestEarnedLender;
        // The total amount of underlying interest the pool has earned from loans being repaid.
        uint256 totalInterestEarned;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.lending_pool.v1");

    function get() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }

}

abstract contract sto_LendingPool is sto_LendingPool_v1 {}