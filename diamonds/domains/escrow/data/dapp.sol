pragma solidity ^0.8.0;

/**
 * @notice This struct defines the dapp address and data to execute in the callDapp function.
 * @dev It is executed using a delegatecall in the Escrow contract.
 * @param exists Flag marking whether the dapp is a Teller registered address
 * @param unsecured Flag marking if the loan allowed to be used in the dapp is a secured, or unsecured loan
 */
struct Dapp {
    bool exists;
    bool unsecured;
}

/**
 * @notice This struct defines the dapp address and data to execute in the callDapp function.
 * @dev It is executed using a delegatecall in the Escrow contract.
 * @param location The proxy contract address for the dapp that will be used by the Escrow contract delegatecall
 * @param data The encoded function signature with parameters for the dapp method in bytes that will be sent in the Escrow delegatecall
 */
struct DappData {
    address location;
    bytes data;
}
