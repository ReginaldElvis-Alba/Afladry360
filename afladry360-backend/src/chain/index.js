import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./afla-chain-backend.did.js";
export { idlFactory } from "./afla-chain-backend.did.js";

export const canisterId = 'rwzqi-tyaaa-aaaae-acf5a-cai';

export const createActor = (canisterId, options = {}) => {
  const agent = new HttpAgent({ host: "https://ic0.app" });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

export const afla_chain_backend = createActor(canisterId);