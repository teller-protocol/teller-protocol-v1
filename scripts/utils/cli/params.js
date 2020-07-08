const {
  NETWORK,
  COLL_TOKEN_NAME,
  TOKEN_NAME,
  SENDER_INDEX,
  AMOUNT,
  NEW_VALUE,
  LOAN_ID,
  SETTING_NAME,
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
  REQUIRED_SUBMISSIONS,
  SAFETY_INTERVAL,
  TEST_TOKEN_NAME,
  RATE_PROCESS_FREQUENCY,
  MAX_LENDING_AMOUNT,
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
    "number",
    `New value to se in the settings. By default: ${defaultParam}`,
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
    `Used to add signers in the LoanTermsConsensus contracts used for each token (or lending token). By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addRequiredSubmissions = (
  yargs,
  defaultParam = REQUIRED_SUBMISSIONS.default
) => {
  newOption(
    yargs,
    REQUIRED_SUBMISSIONS.name,
    REQUIRED_SUBMISSIONS.alias,
    "number",
    `Used to set as min required (responses) submissions when a borrower asks to node validators to sign responses. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addSafetyInterval = (
  yargs,
  defaultParam = SAFETY_INTERVAL.default
) => {
  newOption(
    yargs,
    SAFETY_INTERVAL.name,
    SAFETY_INTERVAL.alias,
    "number",
    "Used to set as min time window (in seconds) between last time borrower deposited collateral and when the borrower takes out the loan.",
    defaultParam
  );
};

module.exports.addTestTokenName = (
  yargs,
  defaultParam = TEST_TOKEN_NAME.default
) => {
  newOption(
    yargs,
    TEST_TOKEN_NAME.name,
    TEST_TOKEN_NAME.alias,
    "string",
    `This represents the token to be used in the integration tests. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addRateProcessFrequence = (yargs, defaultParam = RATE_PROCESS_FREQUENCY.default) => {
  newOption(
    yargs,
    RATE_PROCESS_FREQUENCY.name,
    RATE_PROCESS_FREQUENCY.alias,
    "number",
    `Define the # blocks (frequence) to process the cToken exchange rate. It considers 1 block every 15 seconds. By default ${defaultParam}`,
    defaultParam
  );
};

module.exports.addMaxLendingAmount = (yargs, defaultParam = MAX_LENDING_AMOUNT.default) => {
  newOption(
    yargs,
    MAX_LENDING_AMOUNT.name,
    MAX_LENDING_AMOUNT.alias,
    "number",
    `It defines the max lending amount for an asset. By default ${defaultParam}`,
    defaultParam
  );
};