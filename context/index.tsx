import { createContext, useContext } from "react";
import { CeramicClient } from "@ceramicnetwork/http-client"
import { ComposeClient } from "@composedb/client";

import { definition } from "../src/__generated__/definition.js";
import { RuntimeCompositeDefinition } from "@composedb/types";

// const CERAMIC_URL = 'http://localhost:7007'
const CERAMIC_URL = 'https://ceramic-blessclub.hirenodes.io/'
/**
 * Configure ceramic Client & create context.
 */
const ceramic = new CeramicClient(CERAMIC_URL);

const composeClient = new ComposeClient({
  ceramic: CERAMIC_URL,
  // cast our definition as a RuntimeCompositeDefinition
  definition: definition as RuntimeCompositeDefinition,
});

const CeramicContext = createContext({ceramic: ceramic, composeClient: composeClient});

export const CeramicWrapper = ({ children }: any) => {
  return (
    <CeramicContext.Provider value={{ceramic, composeClient}}>
      {children}
    </CeramicContext.Provider>
  );
};

/**
 * Provide access to the Ceramic & Compose clients.
 * @example const { ceramic, compose } = useCeramicContext()
 * @returns CeramicClient
 */

export const useCeramicContext = () => useContext(CeramicContext);
