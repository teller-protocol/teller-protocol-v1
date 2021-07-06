// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

library States {
    enum StatesCode {
        AK,
        AL,
        AR,
        AZ,
        CA,
        CO,
        CT,
        DC,
        DE,
        FL,
        GA,
        HI,
        IA,
        ID,
        IL,
        IN,
        KS,
        KY,
        LA,
        MA,
        MD,
        ME,
        MI,
        MN,
        MO,
        MS,
        MT,
        NC,
        ND,
        NE,
        NH,
        NJ,
        NM,
        NV,
        NY,
        OH,
        OK,
        OR,
        PA,
        RI,
        SC,
        SD,
        TN,
        TX,
        UT,
        VA,
        VT,
        WA,
        WI,
        WV,
        WY
    }
}

contract Rates {
    uint16[] public rates = [
        1050,
        600,
        500,
        1000,
        1000,
        800,
        1200,
        600,
        500,
        1200,
        700,
        1200,
        500,
        1200,
        900,
        2100,
        1000,
        800,
        1200,
        600,
        600,
        800,
        500,
        800,
        900,
        800,
        1000,
        800,
        550,
        600,
        1000,
        600,
        1500,
        0,
        1600,
        800,
        600,
        900,
        600,
        1200,
        875,
        1500,
        1000,
        600,
        1000,
        800,
        1200,
        1200,
        500,
        600,
        700
    ];
}
