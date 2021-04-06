import "../storage/loans.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../data/signer.sol";

abstract contract ent_signers_Market_v1 is
    sto_Loans,
    mod_authorized_AccessControl_v1
{
    using AddressArrayLib for AddressArrayLib.AddressArray;

    function addSigner(address account)
        external
        authorized(SIGNER, msg.sender)
    {
        _addSigner(account);
    }

    function addSigners(address[] calldata accounts)
        external
        authorized(SIGNER, msg.sender)
    {
        for (uint8 i = 0; i < accounts.length; i++) _addSigner(accounts[i]);
    }

    function _addSigner(address account) private {
        getLoansStorage().signers.add(account);
    }
}
