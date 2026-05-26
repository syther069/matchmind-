import { JsonRpcProvider } from "ethers";

export const ethersProvider = new JsonRpcProvider("https://rpc.xlayer.tech", 196, {
  staticNetwork: true
});
