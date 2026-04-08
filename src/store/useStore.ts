import { create } from 'zustand';

export interface BrandVariant {
  text: string;
  type: 'auto' | 'manual';
}

export interface BrandConfig {
  name: string;
  url: string;
  industry: string;
  competitors: string[];
  historicalSov: number;
  brandSearchGrowth: number;
}

export interface CSVRow {
  query: string;
  volume: number;
  brand_mentioned: boolean;
  brand_cited: boolean;
  intent?: 'Informacyjne' | 'Komercyjne' | 'Transakcyjne';
  url?: string;
  [key: string]: any; // for competitors
}

export interface PlatformData {
  id: string;
  name: string;
  rows: CSVRow[];
}

export interface DiagnosticLog {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface UnassignedFile {
  id: string;
  file: File;
  name: string;
  error?: string;
}

interface AppState {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  brand: BrandConfig;
  setBrand: (brand: Partial<BrandConfig>) => void;
  brandVariants: BrandVariant[];
  setBrandVariants: (variants: BrandVariant[]) => void;
  platformData: Record<string, PlatformData>;
  setPlatformData: (platformId: string, data: PlatformData) => void;
  removePlatformData: (platformId: string) => void;
  uploadedFiles: Record<string, File>;
  setUploadedFile: (platformId: string, file: File) => void;
  removeUploadedFile: (platformId: string) => void;
  bsData: any[];
  setBsData: (data: any[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  reportApproved: boolean;
  setReportApproved: (approved: boolean) => void;
  reportComment: string;
  setReportComment: (comment: string) => void;
  gatekeeping: { industryMatch: boolean; dataVerified: boolean };
  setGatekeeping: (gk: Partial<{ industryMatch: boolean; dataVerified: boolean }>) => void;
  diagnosticLogs: DiagnosticLog[];
  addDiagnosticLog: (log: Omit<DiagnosticLog, 'id' | 'timestamp'>) => void;
  clearDiagnosticLogs: () => void;
  unassignedFiles: UnassignedFile[];
  addUnassignedFile: (file: UnassignedFile) => void;
  removeUnassignedFile: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  brand: { name: '', url: '', industry: 'Usługi', competitors: [], historicalSov: 10, brandSearchGrowth: 5 },
  setBrand: (brand) => set((state) => ({ brand: { ...state.brand, ...brand } })),
  brandVariants: [],
  setBrandVariants: (variants) => set({ brandVariants: variants }),
  platformData: {},
  setPlatformData: (platformId, data) => set((state) => ({
    platformData: { ...state.platformData, [platformId]: data }
  })),
  removePlatformData: (platformId) => set((state) => {
    const newData = { ...state.platformData };
    delete newData[platformId];
    return { platformData: newData };
  }),
  uploadedFiles: {},
  setUploadedFile: (platformId, file) => set((state) => ({
    uploadedFiles: { ...state.uploadedFiles, [platformId]: file }
  })),
  removeUploadedFile: (platformId) => set((state) => {
    const newFiles = { ...state.uploadedFiles };
    delete newFiles[platformId];
    return { uploadedFiles: newFiles };
  }),
  bsData: [],
  setBsData: (data) => set({ bsData: data }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  reportApproved: false,
  setReportApproved: (approved) => set({ reportApproved: approved }),
  reportComment: '',
  setReportComment: (comment) => set({ reportComment: comment }),
  gatekeeping: { industryMatch: false, dataVerified: false },
  setGatekeeping: (gk) => set((state) => ({ gatekeeping: { ...state.gatekeeping, ...gk } })),
  diagnosticLogs: [],
  addDiagnosticLog: (log) => set((state) => ({
    diagnosticLogs: [{ ...log, id: Math.random().toString(36).substring(2, 9), timestamp: Date.now() }, ...state.diagnosticLogs]
  })),
  clearDiagnosticLogs: () => set({ diagnosticLogs: [] }),
  unassignedFiles: [],
  addUnassignedFile: (file) => set((state) => ({ unassignedFiles: [...state.unassignedFiles, file] })),
  removeUnassignedFile: (id) => set((state) => ({ unassignedFiles: state.unassignedFiles.filter(f => f.id !== id) })),
}));
