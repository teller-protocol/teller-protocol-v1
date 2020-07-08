const DEFAULT_SIGNER_URLS = [
    // TODO Sets the default URLs once we have them
];
const DEFAULT_SIGNER_ADDRESSES = [
    '0xE8bF0ceF0Bf531Fd56081Ad0B85706cE37A7FD34',
    '0x34fA03245325fd8cf67C694685932B73aC73666C',
    '0x981D72d7E8dCaeae14D10db3A94f50958904C117',
    '0xa75f98d2566673De80Ac4169Deab45c6adad3164',
    '0x924Af6Cfa15F76E04763D9e24a1c892fD7767983',
    '0x3Eb394E83f82be8ed7ac86aF0DcbdaE4890Be307',
];
const DEFAULT_COLLATERAL_TOKEN_NAME = 'ETH';
const DEFAULT_TEST_TOKEN_NAME = 'DAI';
const DEFAULT_TOKEN_NAMES = ['DAI', 'USDC'];
const DEFAULT_REQUIRED_SUBMISSIONS = 2;
const DEFAULT_SAFETY_INTERVAL = 1;

module.exports = {
    NETWORK: {
        name: 'network',
        alias: 'N',
        default: undefined,
    },
    TOKEN_NAME: {
        name: 'tokenName',
        alias: 'TN',
        default: 'DAI',
    },
    COLL_TOKEN_NAME: {
        name: 'collTokenName',
        alias: 'CTN',
        default: DEFAULT_COLLATERAL_TOKEN_NAME,
    },
    SENDER_INDEX: {
        name: 'senderIndex',
        alias: 'SI',
        default: 0,
    },
    RECEIVER_INDEX: {
        name: 'receiverIndex',
        alias: 'RI',
        default: 1,
    },
    AMOUNT: {
        name: 'amount',
        alias: 'A',
        default: 100,
    },
    NEW_VALUE: {
        name: 'newValue',
        alias: 'NV',
        default: undefined,
    },
    LOAN_ID: {
        name: 'loanId',
        alias: 'LI',
        default: undefined,
    },
    SETTING_NAME: {
        name: 'settingName',
        alias: 'SN',
        default: undefined,
    },
    CTOKEN_NAME: {
        name: 'cTokenName',
        alias: 'CTN',
        default: undefined,
    },
    BORROWER_INDEX: {
        name: 'borrowerIndex',
        alias: 'BI',
        default: 0,
    },
    INITIAL_LOAN_ID: {
        name: 'initialLoanId',
        alias: 'ILI',
        default: 0,
    },
    FINAL_LOAN_ID: {
        name: 'finalLoanId',
        alias: 'FLI',
        default: 10000,
    },
    RECIPIENT_INDEX: {
        name: 'recipientIndex',
        alias: 'RI',
        default: -1,
    },
    DURATION_DAYS: {
        name: 'durationDays',
        alias: 'DD',
        default: 10,
    },
    BORROWER: {
        name: 'borrower',
        alias: 'B',
        default: undefined,
    },
    SECONDS: {
        name: 'seconds',
        alias: 'S',
        default: 60 * 2,
    },
    COLL_AMOUNT: {
        name: 'collAmount',
        alias: 'CA',
        default: 0,
    },
    NONCE: {
        name: 'nonce',
        alias: 'NN',
        default: 0,
    },
    ADDRESSES: {
        name: 'addresses',
        alias: 'AA',
        default: undefined,
    },
    ACCOUNT_INDEX: {
        name: 'accountIndex',
        alias: 'AI',
        default: 0,
    },
    REVERT: {
        name: 'revert',
        alias: 'R',
        default: false,
    },
    INITIAL_NONCE: {
        name: 'initialNonce',
        alias: 'IN',
        default: 0,
    },
    SIGNER_ADDRESS: {
        name: 'signerAddress',
        alias: 'SA',
        default: DEFAULT_SIGNER_ADDRESSES,
    },
    SIGNER_URL: {
        name: 'signerUrl',
        alias: 'SU',
        default: DEFAULT_SIGNER_URLS,
    },
    TOKEN_NAMES: {
        name: 'tokenNames',
        alias: 'TNS',
        default: DEFAULT_TOKEN_NAMES,
    },
    REQUIRED_SUBMISSIONS: {
        name: 'requiredSubmissions',
        alias: 'RS',
        default: DEFAULT_REQUIRED_SUBMISSIONS,
    },
    SAFETY_INTERVAL: {
        name: 'safetyInterval',
        alias: 'SI',
        default: DEFAULT_SAFETY_INTERVAL,
    },
    TEST_TOKEN_NAME: {
        name: 'testTokenName',
        alias: 'TTN',
        default: DEFAULT_TEST_TOKEN_NAME,
    },
    MAX_LENDING_AMOUNT: {
        name: 'maxLendingAmount',
        alias: 'MLA',
        default: 1000,
    },
    RATE_PROCESS_FREQUENCY: {
        name: 'rateProcessFrequence',
        alias: 'RPF',
        default: (12 * 60 * 60) / 15, // 12 hours
    },
};
