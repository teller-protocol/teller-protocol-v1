import "./UpgradableV1.sol";


contract UpgradableV2 is UpgradableV1 {
    function setValue(uint256 newValue) external {
        value = newValue;
    }

    function sendETHToSender(uint256 amount) public {
        sendETH(msg.sender, amount);
    }

    function sendTokenToSender(address tokenAddress, uint256 amount) public {
        sendToken(tokenAddress, msg.sender, amount);
    }
}
