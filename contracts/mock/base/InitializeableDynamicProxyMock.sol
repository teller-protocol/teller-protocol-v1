pragma solidity 0.5.17;

import "../../base/InitializeableDynamicProxy.sol";

contract InitializeableDynamicProxyMock is InitializeableDynamicProxy {

    function externalLogicName() external view returns (bytes32 name) {
        return logicName();
    }
}
