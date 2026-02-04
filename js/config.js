/**
 * Grok Imagine Favorites Manager - Configuration Management
 * Centralized configuration with smart defaults and user overrides
 */

var Config = {
  storage: {
    prefix: 'grok_favorites_',
    keys: {
      preferences: 'preferences',
      downloadHistory: 'downloadHistory',
      folderStructure: 'folderStructure',
      filenameTemplate: 'filenameTemplate'
    }
  },

  defaults: {
    folderStructure: 'date', // 'date', 'prompt', 'flat'
    filenameTemplate: '{id}.{ext}', // {id}, {ext}, {date}, {prompt}
    dateFormat: 'yyyy-mm-dd', // yyyy-mm-dd or yyyy/mm/dd
    includeMetadata: true,
    parallelDownloads: 1, // Rate limiting
    retryFailed: true,
    maxRetries: 3
  },

  async getPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([this.storage.prefix + this.storage.keys.preferences], (result) => {
        const stored = result[this.storage.prefix + this.storage.keys.preferences] || {};
        resolve({ ...this.defaults, ...stored });
      });
    });
  },

  async savePreferences(preferences) {
    return new Promise((resolve) => {
      const key = this.storage.prefix + this.storage.keys.preferences;
      chrome.storage.sync.set({ [key]: preferences }, resolve);
    });
  },

  async getDownloadHistory() {
    return new Promise((resolve) => {
      const key = this.storage.prefix + this.storage.keys.downloadHistory;
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || []);
      });
    });
  },

  async addToDownloadHistory(item) {
    return new Promise((resolve) => {
      this.getDownloadHistory().then((history) => {
        const newItem = {
          ...item,
          downloadedAt: new Date().toISOString(),
          status: 'pending'
        };
        history.push(newItem);

        // Keep only last 1000 items
        if (history.length > 1000) {
          history = history.slice(-1000);
        }

        const key = this.storage.prefix + this.storage.keys.downloadHistory;
        chrome.storage.local.set({ [key]: history }, resolve);
      });
    });
  },

  formatFilename(template, item, ext) {
    let filename = template || this.defaults.filenameTemplate;

    filename = filename.replace('{id}', item.id || 'unknown');
    filename = filename.replace('{ext}', ext);
    filename = filename.replace('{date}', item.date || new Date().toISOString().split('T')[0]);
    filename = filename.replace('{prompt}', (item.prompt || 'generated').substring(0, 30).replace(/[^a-z0-9]/gi, '_'));

    return filename;
  },

  getDateStr(date, format) {
    if (!date) date = new Date();
    if (typeof date === 'string') date = new Date(date);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return format === 'yyyy/mm/dd'
      ? `${yyyy}/${mm}/${dd}`
      : `${yyyy}-${mm}-${dd}`;
  }
};

window.Config = Config;
