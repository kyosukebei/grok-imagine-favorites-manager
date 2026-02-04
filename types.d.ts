/**
 * Grok Imagine Favorites Manager - TypeScript Type Definitions
 */

interface MediaItem {
  url: string;
  filename: string;
  id: string;
  type?: 'image' | 'video';
  date?: string;
  prompt?: string;
  downloadedAt?: string;
}

interface PostData {
  id: string;
  url: string;
  prompt?: string;
}

interface ConfigPreferences {
  folderStructure: 'date' | 'prompt' | 'flat';
  filenameTemplate: string;
  dateFormat: 'yyyy-mm-dd' | 'yyyy/mm/dd';
  includeMetadata: boolean;
  parallelDownloads: number;
  retryFailed: boolean;
  maxRetries: number;
}

interface DownloadHistoryItem extends MediaItem {
  downloadedAt: string;
  status: 'pending' | 'complete' | 'failed';
}

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  message: string;
  data?: any;
}

interface ScanResult {
  media: MediaItem[];
  selectedMedia?: MediaItem[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface AnalysisResult {
  url: string;
  id: string;
  type: 'image' | 'video';
}

declare global {
  namespace Window {
    var SELECTORS: typeof SELECTORS;
    var CONFIG: typeof CONFIG;
    var Config: typeof Config;
    var Logger: typeof Logger;
    var MediaScanner: typeof MediaScanner;
    var ItemClassifier: typeof ItemClassifier;
    var Api: typeof Api;
    var ProgressModal: typeof ProgressModal;
    var Utils: typeof Utils;
    var SmartOrganizer: typeof SmartOrganizer;
    var MetadataManager: typeof MetadataManager;
    var GrokModules: {
      Scanner: typeof MediaScanner;
      Classifier: typeof ItemClassifier;
      Api: typeof Api;
      UI: typeof ProgressModal;
      Utils: typeof Utils;
    };
  }
}

export {};
