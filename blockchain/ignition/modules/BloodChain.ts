import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BloodChainModule", (m) => {
  const bloodChain = m.contract("BloodChain");

  return { bloodChain };
});
