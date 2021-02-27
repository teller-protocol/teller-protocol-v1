const {
  NETWORK,
  COLL_TOKEN_NAME,
  TOKEN_NAME,
  SENDER_INDEX,
  AMOUNT,
  NEW_VALUE,
  LOAN_ID,
  SETTING_NAME,
  ASSET_SETTING_NAME,
  RECEIVER_INDEX,
  CTOKEN_NAME,
  BORROWER_INDEX,
  INITIAL_LOAN_ID,
  FINAL_LOAN_ID,
  RECIPIENT_INDEX,
  DURATION_DAYS,
  SECONDS,
  COLL_AMOUNT,
  NONCE,
  ADDRESSES,
  BORROWER,
  ACCOUNT_INDEX,
  REVERT,
  INITIAL_NONCE,
  SIGNER_ADDRESS,
  SIGNER_URL,
  TOKEN_NAMES,
  MAX_TVL_AMOUNT,
  TEST_TOKEN_NAME,
  MAX_LOAN_AMOUNT,
  MIN_VALUE,
  MAX_VALUE,
  BACK_ROUNDS,
  MIN_AMOUNT,
  LOGIC_NAME,
  CONTRACT_NAME,
  REVERT_TEST,
  COLL_TOKEN_NAMES,
  VERBOSE,
} = require("./names");

const newOption = (argv, name, alias, type, description, defaultValue) => {
  argv.option(name, {
    alias,
    type,
    description,
    default: defaultValue,
    string: type === "string",
    number: type === "number",
    boolean: type === "boolean",
    array: type === "array",
    required: true,
  });
};

module.exports.addNetwork = (yargs, defaultParam = NETWORK.default) => {
  newOption(
    yargs,
    NETWORK.name,
    NETWORK.alias,
    "string",
    `Sets the network to use in the execution. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addTokenName = (yargs, defaultParam = TOKEN_NAME.default) => {
  newOption(
    yargs,
    TOKEN_NAME.name,
    TOKEN_NAME.alias,
    "string",
    `Token to use when the script is executed. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addCollTokenName = (
  yargs,
  defaultParam = COLL_TOKEN_NAME.default
) => {
  newOption(
    yargs,
    COLL_TOKEN_NAME.name,
    COLL_TOKEN_NAME.alias,
    "string",
    `Collateral token used to send the transaction. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSenderIndex = (
  yargs,
  defaultParam = SENDER_INDEX.default
) => {
  newOption(
    yargs,
    SENDER_INDEX.name,
    SENDER_INDEX.alias,
    "number",
    `Index account (0 based) used to send the transaction. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSenderIndex = (
  yargs,
  defaultParam = RECEIVER_INDEX.default
) => {
  newOption(
    yargs,
    RECEIVER_INDEX.name,
    RECEIVER_INDEX.alias,
    "number",
    `Address (index) that will receive the tokens. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addAmount = (yargs, defaultParam = AMOUNT.default) => {
  newOption(
    yargs,
    AMOUNT.name,
    AMOUNT.alias,
    "number",
    `Amount to send in transaction. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addNewValue = (yargs, defaultParam = NEW_VALUE.default) => {
  newOption(
    yargs,
    NEW_VALUE.name,
    NEW_VALUE.alias,
    "string",
    `New value to se in the settings. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMaxValue = (yargs, defaultParam = MAX_VALUE.default) => {
  newOption(
    yargs,
    MAX_VALUE.name,
    MAX_VALUE.alias,
    "string",
    `Max value to set in the settings. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMinValue = (yargs, defaultParam = MIN_VALUE.default) => {
  newOption(
    yargs,
    MIN_VALUE.name,
    MIN_VALUE.alias,
    "string",
    `Min value to set in the settings. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addLoanId = (yargs, defaultParam = LOAN_ID.default) => {
  newOption(
    yargs,
    LOAN_ID.name,
    LOAN_ID.alias,
    "number",
    `Loan ID to use in the transaction. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSettingName = (
  yargs,
  defaultParam = SETTING_NAME.default
) => {
  newOption(
    yargs,
    SETTING_NAME.name,
    SETTING_NAME.alias,
    "string",
    `Setting name to connfigure. By default  ${defaultParam}`,
    defaultParam
  );
};

module.exports.addAssetSettingName = (
  yargs,
  defaultParam = ASSET_SETTING_NAME.default
) => {
  newOption(
    yargs,
    ASSET_SETTING_NAME.name,
    ASSET_SETTING_NAME.alias,
    "string",
    `Asset setting name to configure. By default  ${defaultParam}`,
    defaultParam
  );
};

module.exports.addCTokenName = (yargs, defaultParam = CTOKEN_NAME.default) => {
  newOption(
    yargs,
    CTOKEN_NAME.name,
    CTOKEN_NAME.alias,
    "string",
    `CToken name to use in the transaction. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMaxLoanAmount = (
  yargs,
  defaultParam = MAX_LOAN_AMOUNT.default
) => {
  newOption(
    yargs,
    MAX_LOAN_AMOUNT.name,
    MAX_LOAN_AMOUNT.alias,
    "number",
    `Max loan amount to use in the transaction. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMaxTVLAmount = (
  yargs,
  defaultParam = MAX_TVL_AMOUNT.default
) => {
  newOption(
    yargs,
    MAX_TVL_AMOUNT.name,
    MAX_TVL_AMOUNT.alias,
    "number",
    `Max TVL amount to use in the transaction. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addBorrowerIndex = (
  yargs,
  defaultParam = BORROWER_INDEX.default
) => {
  newOption(
    yargs,
    BORROWER_INDEX.name,
    BORROWER_INDEX.alias,
    "number",
    `Index account to use as borrower. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addInitialLoanId = (
  yargs,
  defaultParam = INITIAL_LOAN_ID.default
) => {
  newOption(
    yargs,
    INITIAL_LOAN_ID.name,
    INITIAL_LOAN_ID.alias,
    "number",
    `Initial loan ID to use. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addFinalLoanId = (
  yargs,
  defaultParam = FINAL_LOAN_ID.default
) => {
  newOption(
    yargs,
    FINAL_LOAN_ID.name,
    FINAL_LOAN_ID.alias,
    "number",
    `Initial loan ID to use. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addRecipientIndex = (
  yargs,
  defaultParam = RECIPIENT_INDEX.default
) => {
  newOption(
    yargs,
    RECIPIENT_INDEX.name,
    RECIPIENT_INDEX.alias,
    "number",
    `Index account to use as recipient. By default ${defaultParam} (0x0 address).`,
    defaultParam
  );
};

module.exports.addDurationDays = (
  yargs,
  defaultParam = DURATION_DAYS.default
) => {
  newOption(
    yargs,
    DURATION_DAYS.name,
    DURATION_DAYS.alias,
    "number",
    `Total of days for the loan (duration). By default ${defaultParam}.`,
    defaultParam
  );
};

module.exports.addReceiverIndex = (
  yargs,
  defaultParam = RECEIVER_INDEX.default
) => {
  newOption(
    yargs,
    RECEIVER_INDEX.name,
    RECEIVER_INDEX.alias,
    "number",
    `Address (index) that will receive the tokens. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSeconds = (yargs, defaultParam = SECONDS.default) => {
  newOption(
    yargs,
    SECONDS.name,
    SECONDS.alias,
    "number",
    `Seconds to advance. By default: ${defaultParam}`,
    defaultParam
  );
};

module.exports.addCollAmount = (yargs, defaultParam = COLL_AMOUNT.default) => {
  newOption(
    yargs,
    COLL_AMOUNT.name,
    COLL_AMOUNT.alias,
    "number",
    `Amount to send as collateral. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addBackRounds = (yargs, defaultParam = BACK_ROUNDS.default) => {
  newOption(
    yargs,
    BACK_ROUNDS.name,
    BACK_ROUNDS.alias,
    "number",
    `Total back rounds to get an oracle price. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addNonce = (yargs, defaultParam = NONCE.default) => {
  newOption(
    yargs,
    NONCE.name,
    NONCE.alias,
    "number",
    `Nonce value to use in the signatures. By default ${defaultParam}.`,
    defaultParam
  );
};

module.exports.addAddresses = (yargs, defaultParam = ADDRESSES.default) => {
  newOption(
    yargs,
    ADDRESSES.name,
    ADDRESSES.alias,
    "string",
    `Addresses to add as signers. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addBorrower = (yargs, defaultParam = BORROWER.default) => {
  newOption(
    yargs,
    BORROWER.name,
    BORROWER.alias,
    "string",
    `Borrower address. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addAccountIndex = (
  yargs,
  defaultParam = ACCOUNT_INDEX.default
) => {
  newOption(
    yargs,
    ACCOUNT_INDEX.name,
    ACCOUNT_INDEX.alias,
    "number",
    `Address (index) to use in the transaction. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addRevert = (yargs, defaultParam = REVERT.default) => {
  newOption(
    yargs,
    REVERT.name,
    REVERT.alias,
    "boolean",
    `Sets whether the process reverts the changes after running all the integration tests. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addRevertTest = (yargs, defaultParam = REVERT_TEST.default) => {
  newOption(
    yargs,
    REVERT_TEST.name,
    REVERT_TEST.alias,
    "boolean",
    `Sets whether the process reverts the changes after running each integration test. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addCollTokenNames = (
  yargs,
  defaultParam = COLL_TOKEN_NAMES.default
) => {
  newOption(
    yargs,
    COLL_TOKEN_NAMES.name,
    COLL_TOKEN_NAMES.alias,
    "array",
    `The collateral token names used in the integration tests. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addInitialNonce = (
  yargs,
  defaultParam = INITIAL_NONCE.default
) => {
  newOption(
    yargs,
    INITIAL_NONCE.name,
    INITIAL_NONCE.alias,
    "number",
    `Sets the initial nonce number to be used to sign messages. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSignerAddress = (
  yargs,
  defaultParam = SIGNER_ADDRESS.default
) => {
  newOption(
    yargs,
    SIGNER_ADDRESS.name,
    SIGNER_ADDRESS.alias,
    "array",
    `Adds an address as signer. It supports multiple signers (multiple params). They will be added as signers in the execution context (integration tests). By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSignerUrl = (yargs, defaultParam = SIGNER_URL.default) => {
  newOption(
    yargs,
    SIGNER_URL.name,
    SIGNER_URL.alias,
    "array",
    `Adds an URL endpoint as signer. It supports multiple signers (multiple params). They will be requested when a borrower/lender needs to get a consensus in the execution context (integration tests). By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addTokenNames = (yargs, defaultParam = TOKEN_NAMES.default) => {
  newOption(
    yargs,
    TOKEN_NAMES.name,
    TOKEN_NAMES.alias,
    "array",
    `Used to execute the integration tests. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMinAmount = (yargs, defaultParam = MIN_AMOUNT.default) => {
  newOption(
    yargs,
    MIN_AMOUNT.name,
    MIN_AMOUNT.alias,
    "number",
    `This represents the minimum amount of tokens that an address should have. It is used in the integration tests and validation scripts. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addLogicName = (yargs, defaultParam = LOGIC_NAME.default) => {
  newOption(
    yargs,
    LOGIC_NAME.name,
    LOGIC_NAME.alias,
    "string",
    `The current logic name. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addContractName = (
  yargs,
  defaultParam = CONTRACT_NAME.default
) => {
  newOption(
    yargs,
    CONTRACT_NAME.name,
    CONTRACT_NAME.alias,
    "string",
    `The contract name to update. It should be equal to the contract name (including cases). By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addVerbose = (yargs, defaultParam = VERBOSE.default) => {
  newOption(
    yargs,
    VERBOSE.name,
    VERBOSE.alias,
    "boolean",
    `Used in integration tests to print info out. By default ${defaultParam}`,
    defaultParam
  );
};
