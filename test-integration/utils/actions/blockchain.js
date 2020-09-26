const {
  minutesToSeconds,
} = require("../../../test/utils/consts");

const advanceMinutes = async ({timer}, {testContext}, {minutes}) => {
  const {network} = testContext;
  if(!['ganache', 'ganache-mainnet'].includes(network.toLowerCase())) {
    return;
  }
  console.log(`Blockchain: Advancing time (current: ${await timer.getCurrentDate()})...`);
  const nextTimestamp = await timer.getCurrentTimestampInSecondsAndSum(
    minutesToSeconds(minutes)
  );
  await timer.advanceBlockAtTime(nextTimestamp);
};

module.exports = {
  advanceMinutes,
};
