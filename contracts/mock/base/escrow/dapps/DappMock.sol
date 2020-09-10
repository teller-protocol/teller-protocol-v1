pragma solidity 0.5.17;

contract DappMock {
    function testFunction(bool failTransaction) external pure {
        require(!failTransaction, "TEST_FUNCTION_FAILED");
    }
}
