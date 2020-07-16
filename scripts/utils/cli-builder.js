const yargs = require('yargs');
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
const newOption = (
    argv,
    name,
    alias,
    type,
    description,
    defaultValue,
) => {
    argv.option(
        name,
        {
            alias,
            type,
            description,
            default: defaultValue,
            string: type === 'string',
            number: type === 'number',
            boolean: type === 'boolean',
            array: type === 'array',
            required: true,
        }
    )
};

const lendingPoolBase = (yargs) => {
    yargs.scriptName("yarn exec ./scripts/lendingPool/*.js");
    newOption(
        yargs,
        'network',
        'N',
        'string',
        'Sets the network to use in the execution.',
        undefined,
    );
    newOption(
        yargs,
        'tokenName',
        'TN',
        'string',
        'Token to use when the script is executed.',
        DEFAULT_TEST_TOKEN_NAME,
    );
    newOption(
        yargs,
        'collTokenName',
        'CT',
        'string',
        'Collateral token used to send the transaction.',
        DEFAULT_COLLATERAL_TOKEN_NAME,
    );
};

const loansBase = (yargs) => {
    yargs.scriptName("yarn exec ./scripts/loans/*.js");
    newOption(
        yargs,
        'network',
        'N',
        'string',
        'Sets the network to use in the execution.',
        undefined,
    );
    newOption(
        yargs,
        'tokenName',
        'TN',
        'string',
        'Token to use when the script is executed.',
        DEFAULT_TEST_TOKEN_NAME,
    );
    newOption(
        yargs,
        'collToken',
        'CT',
        'string',
        'Collateral token used to send the transaction.',
        DEFAULT_COLLATERAL_TOKEN_NAME,
    );
};

module.exports = {
    ganacheTest: () => {
        yargs.scriptName("yarn test:ganache");
        newOption(
            yargs,
            'network',
            'N',
            'string',
            'Sets the network to use in the execution.',
            undefined,
        );
        newOption(
            yargs,
            'revert',
            'R',
            'boolean',
            'Sets whether the process reverts the changes after running all the integration tests.',
            false,
        );
        newOption(
            yargs,
            'initialNonce',
            'IN',
            'number',
            'Sets the initial nonce number to be used to sign messages.',
            0,
        );
        newOption(
            yargs,
            'signerAddress',
            'SA',
            'array',
            'Adds an address as signer. It supports multiple signers (multiple params). They will be added as signers in the execution context (integration tests).',
            DEFAULT_SIGNER_ADDRESSES,
        );
        newOption(
            yargs,
            'signerUrl',
            'SU',
            'array',
            'Adds an URL endpoint as signer. It supports multiple signers (multiple params). They will be requested when a borrower/lender needs to get a consensus in the execution context (integration tests).',
            DEFAULT_SIGNER_URLS,
        );
        newOption(
            yargs,
            'tokenName',
            'TN',
            'array',
            'Used to add signers in the LoanTermsConsensus contracts used for each token (or lending token).',
            DEFAULT_TOKEN_NAMES,
        );
        newOption(
            yargs,
            'requiredSubmissions',
            'RS',
            'number',
            'Used to set as min required (responses) submissions when a borrower asks to node validators to sign responses.',
            DEFAULT_REQUIRED_SUBMISSIONS,
        );
        newOption(
            yargs,
            'safetyInterval',
            'SI',
            'number',
            'Used to set as min time window (in seconds) between last time borrower deposited collateral and when the borrower takes out the loan.',
            DEFAULT_SAFETY_INTERVAL,
        );
        newOption(
            yargs,
            'testTokenName',
            'TTN',
            'string',
            'This represents the token to be used in the integration tests.',
            DEFAULT_TEST_TOKEN_NAME,
        );
        return yargs;
    },
    lendingPool: {
        balance: () => {
            lendingPoolBase(yargs);
            return yargs;
        },
        deposit: () => {
            lendingPoolBase(yargs);
            newOption(
                yargs,
                'senderIndex',
                'SI',
                'number',
                'Index account (0 based) used to send the transaction.',
                0,
            );
            newOption(
                yargs,
                'amount',
                'A',
                'string',
                'Total amounnt (not including decimals). Example: 100 DAI',
                '100',
            );
            return yargs;
        },
    },
    loans: {
        getAllLoansFor: () => {
            loansBase(yargs);
            newOption(
                yargs,
                'borrower',
                'B',
                'string',
                'Borrower address.',
                undefined,
            );
            return yargs;
        },
        listLoans: () => {
            loansBase(yargs);
            newOption(
                yargs,
                'collTokenName',
                'CT',
                'string',
                'Collateral token used to list the loans.',
                DEFAULT_COLLATERAL_TOKEN_NAME,
            );
            newOption(
                yargs,
                'initialLoanId',
                'ILI',
                'number',
                'Initial loan ID to list. Default: 0',
                0,
            );
            newOption(
                yargs,
                'finalLoanId',
                'FLI',
                'number',
                'Initial loan ID to list. Default: 10000',
                10000,
            );
            return yargs;
        },
        getLoan: () => {
            loansBase(yargs);
            newOption(
                yargs,
                'loanId',
                'LID',
                'number',
                'Loan ID to find.',
                undefined,
            );
            return yargs;
        },
        getLoan: () => {
            loansBase(yargs);
            newOption(
                yargs,
                'loanId',
                'LID',
                'number',
                'Loan ID to find.',
                undefined,
            );
            return yargs;
        },
        liquidate: () => {
            loansBase(yargs);
            newOption(
                yargs,
                'loanId',
                'LID',
                'number',
                'Loan ID to find.',
                undefined,
            );
            newOption(
                yargs,
                'senderIndex',
                'SI',
                'number',
                'Index account (0 based) used to send the transaction.',
                undefined,
            );
            return yargs;
        },
    },
};