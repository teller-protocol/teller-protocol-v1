pragma solidity 0.5.17;

import "../../util/AddressArrayLib.sol";

contract AddressArrayLibMock {
    using AddressArrayLib for address[];

    address[] public result;

    constructor(address[] memory initialData) public {
        result = initialData;
    }

    function getResult() public view returns (address[] memory) {
        return result;
    }

    function add(address newItem) external {
        result.add(newItem);
    }

    function removeAt(uint256 indexAt) external {
        result.removeAt(indexAt);
    }

    function getIndex(address item) external view returns (bool found, uint256 indexAt) {
        return result.getIndex(item);
    }

    function remove(address item) external {
        result.remove(item);
    }
}
