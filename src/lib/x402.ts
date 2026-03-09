import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import type { RouteConfig } from "@x402/next";
import type { Network } from "@x402/core/types";

// x402 Payment Configuration for RELAY
// All values are hardcoded per spec (no env vars)

const FACILITATOR_URL = "https://www.x402.org/facilitator";
const PAY_TO = "0x643C5dD371461dcD8661b10b259dc0D938941598";
const NETWORK: Network = "eip155:84532"; // Base Sepolia testnet

// Create facilitator client (testnet, no API key needed)
const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
});

// Create resource server and register EVM scheme
const resourceServer = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(resourceServer);

// Route config for /api/simulate
export const simulateRouteConfig: RouteConfig = {
  accepts: {
    scheme: "exact",
    payTo: PAY_TO,
    price: "$0.001",
    network: NETWORK,
  },
  description: "Run Mistral AI sandbox simulation on E2B",
};

export { resourceServer, NETWORK, PAY_TO };
