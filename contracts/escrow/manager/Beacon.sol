interface Registry {
    function getImplementation(string calldata name) external returns (address);
}

contract Beacon {
    address public immutable implementation;
    address public immutable admin;

    constructor(Registry _registry, string memory _name) {
        implementation = _registry.getImplementation(_name);
        admin = address(_registry);
    }

    function destroy() public {
        assert(msg.sender == admin);
        selfdestruct(payable(msg.sender));
    }
}
