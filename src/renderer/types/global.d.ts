export {};

declare global {
  interface Window {
    rxAlert: {
      searchRxTerms(term: string): Promise<{
        total: number;
        items: Array<{
          displayName: string;
          strengths: string[];
          rxcuisByIndex: string[];
        }>;
      }>;
      approxMatch(term: string): Promise<any>;
      getProperties(rxcui: string): Promise<any>;
      savePrescriptions(data: unknown): Promise<boolean>;
      loadPrescriptions(): Promise<any[]>;
      notifyLowSupply(drug: string): Promise<void>;
    };
    nih: {
      approxMatch(term: string): Promise<any>;
      getProperties(rxcui: string): Promise<any>;
    };
  }
}