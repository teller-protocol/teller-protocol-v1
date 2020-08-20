pragma solidity 0.5.17;

interface IDApp {
    /**
        @notice This event is emitted when a Dapp executes an action.
        @param dappName Dapp name.
        @param action action name.
     */
    event DappAction(bytes32 dappName, bytes32 action);
}
