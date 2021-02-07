import { deployLoanLib } from './steps/0_loan_lib';
import { deployLogicContracts } from './steps/1_logic_contracts';
import { deployProxies } from './steps/2_proxies';
import { deployDynamicProxies } from './steps/3_dynamic_proxies';
import { initializeSettings } from './steps/3_initialize_settings';
import { initializeProxies } from './steps/4_initialize_dynamic_proxies';
import { registerLogicVersions } from './steps/5_register_logic_versions';
import { createPlatformSettings } from './steps/6_platform_settings';
import { addChainlinkPairs } from './steps/7_chainlink';
import { addDapps } from './steps/8_dapps';

export async function deploy() {
  await deployLoanLib();
  // await deployLogicContracts();
  // await deployProxies();
  // await deployDynamicProxies();
  // await initializeSettings();
  // await initializeProxies();
  // await registerLogicVersions();
  // await createPlatformSettings();
  // await addChainlinkPairs();
  // await addDapps();
}
