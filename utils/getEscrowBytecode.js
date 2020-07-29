"use strict";

function getEscrowBytecodeFromAddress(libraryAddress) {
    return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${libraryAddress.substr(2)}5af43d82803e903d91602b57fd5bf3`;
}

module.exports = {
    getEscrowBytecodeFromAddress
};
