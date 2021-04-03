import { s_AccessControl } from "../../../storage/AccessControl.sol";

abstract contract int_GetStorageV1 {
    function getStorage()
        internal
        pure
        returns (s_AccessControl.Layout storage l_)
    {
        l_ = s_AccessControl.get();
    }
}
