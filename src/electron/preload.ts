import { contextBridge, ipcRenderer } from "electron";

/**
 * Keep a minimal, typed bridge. We expose two namespaces:
 * - nih: legacy alias for NIH calls
 * - rxAlert: full app API (NIH + persistence + notifications)
 */

// --- NIH subset (legacy alias) ---
const nih = {
  approxMatch: (term: string) => ipcRenderer.invoke("rxnav:approxMatch", term),
  getProperties: (rxcui: string) => ipcRenderer.invoke("rxnav:props", rxcui),
};

// --- Full app API ---
const rxAlert = {
searchRxTerms: (term: string) => ipcRenderer.invoke("rxterms:search", term),
  // NIH
  approxMatch: (term: string) => ipcRenderer.invoke("rxnav:approxMatch", term),
  getProperties: (rxcui: string) => ipcRenderer.invoke("rxnav:props", rxcui),

  // Local data
  savePrescriptions: (data: unknown) =>
    ipcRenderer.invoke("prescriptions:save", data),
  loadPrescriptions: () => ipcRenderer.invoke("prescriptions:load"),

  // Notifications
  notifyLowSupply: (drug: string) =>
    ipcRenderer.invoke("notify:lowSupply", drug),
};
    

contextBridge.exposeInMainWorld("nih", nih);
contextBridge.exposeInMainWorld("rxAlert", rxAlert);

// ---------------------- Types for the renderer ----------------------
declare global {
  interface Window {
    nih: {
      approxMatch(term: string): Promise<any>;
      getProperties(rxcui: string): Promise<any>;
    };
    rxAlert: {
    searchRxTerms(term: string): Promise<{
        total: number;
        items: { displayName: string; strengths: string[]; rxcuisByIndex: string[] }}>;
      approxMatch(term: string): Promise<any>;
      getProperties(rxcui: string): Promise<any>;
      savePrescriptions(data: unknown): Promise<boolean>;
      loadPrescriptions(): Promise<any[]>;
      notifyLowSupply(drug: string): Promise<void>;
      
    };
  }
}
