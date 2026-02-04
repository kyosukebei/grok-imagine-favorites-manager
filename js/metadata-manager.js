/**
 * Grok Imagine Favorites Manager - Metadata Manager
 * Manages metadata storage with Supabase
 */

var MetadataManager = {
  /**
   * Store metadata locally (fallback if Supabase unavailable)
   */
  async storeLocally(batchId, metadata) {
    return new Promise((resolve) => {
      const key = `metadata_${batchId}`;
      chrome.storage.local.set({ [key]: metadata }, resolve);
    });
  },

  /**
   * Retrieve locally stored metadata
   */
  async getLocalMetadata(batchId) {
    return new Promise((resolve) => {
      const key = `metadata_${batchId}`;
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },

  /**
   * Generate batch ID for download session
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Record download batch
   */
  async recordBatch(batchId, batch) {
    return new Promise((resolve) => {
      const key = 'download_batches';
      chrome.storage.local.get([key], (result) => {
        const batches = result[key] || [];

        batches.push({
          batchId,
          createdAt: new Date().toISOString(),
          itemCount: batch.items?.length || 0,
          status: 'pending'
        });

        // Keep last 100 batches
        if (batches.length > 100) {
          batches.shift();
        }

        chrome.storage.local.set({ [key]: batches }, resolve);
      });
    });
  },

  /**
   * Update batch status
   */
  async updateBatchStatus(batchId, status) {
    return new Promise((resolve) => {
      const key = 'download_batches';
      chrome.storage.local.get([key], (result) => {
        const batches = result[key] || [];
        const batch = batches.find(b => b.batchId === batchId);

        if (batch) {
          batch.status = status;
          batch.updatedAt = new Date().toISOString();
          chrome.storage.local.set({ [key]: batches }, resolve);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Get all download batches
   */
  async getBatches() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['download_batches'], (result) => {
        resolve(result['download_batches'] || []);
      });
    });
  },

  /**
   * Get items from a specific batch
   */
  async getBatchItems(batchId) {
    return new Promise((resolve) => {
      const key = `metadata_${batchId}`;
      chrome.storage.local.get([key], (result) => {
        const metadata = result[key];
        resolve(metadata?.items || []);
      });
    });
  },

  /**
   * Tag items with prompt and other metadata
   */
  async tagItems(items, tags) {
    return items.map(item => ({
      ...item,
      tags: [...(item.tags || []), ...tags],
      taggedAt: new Date().toISOString()
    }));
  },

  /**
   * Search metadata by criteria
   */
  async search(criteria) {
    const batches = await this.getBatches();
    const results = [];

    for (const batch of batches) {
      const items = await this.getBatchItems(batch.batchId);

      const filtered = items.filter(item => {
        if (criteria.prompt && !item.prompt?.toLowerCase().includes(criteria.prompt.toLowerCase())) {
          return false;
        }

        if (criteria.type && item.type !== criteria.type) {
          return false;
        }

        if (criteria.dateFrom) {
          const itemDate = new Date(item.date);
          if (itemDate < new Date(criteria.dateFrom)) {
            return false;
          }
        }

        if (criteria.dateTo) {
          const itemDate = new Date(item.date);
          if (itemDate > new Date(criteria.dateTo)) {
            return false;
          }
        }

        return true;
      });

      results.push({
        batchId: batch.batchId,
        items: filtered
      });
    }

    return results;
  },

  /**
   * Export search results as CSV
   */
  exportSearchResultsAsCSV(searchResults) {
    const headers = ['BatchID', 'ID', 'Date', 'Type', 'Prompt', 'Filename', 'URL'];
    const rows = [];

    searchResults.forEach(result => {
      result.items.forEach(item => {
        rows.push([
          result.batchId,
          item.id,
          item.date || new Date().toISOString(),
          item.type,
          `"${(item.prompt || '').replace(/"/g, '""')}"`,
          item.filename,
          item.url
        ].join(','));
      });
    });

    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Clear old metadata (older than X days)
   */
  async clearOldMetadata(daysOld = 30) {
    return new Promise((resolve) => {
      const key = 'download_batches';
      chrome.storage.local.get([key], (result) => {
        const batches = result[key] || [];
        const now = Date.now();
        const cutoff = daysOld * 24 * 60 * 60 * 1000;

        const remaining = batches.filter(batch => {
          const batchTime = new Date(batch.createdAt).getTime();
          return (now - batchTime) < cutoff;
        });

        // Also delete metadata for removed batches
        const batchIds = remaining.map(b => b.batchId);
        chrome.storage.local.get(null, (allItems) => {
          const toRemove = {};
          Object.keys(allItems).forEach(key => {
            if (key.startsWith('metadata_')) {
              const batchId = key.replace('metadata_', '');
              if (!batchIds.includes(batchId)) {
                toRemove[key] = undefined;
              }
            }
          });

          chrome.storage.local.set({ [key]: remaining, ...toRemove }, resolve);
        });
      });
    });
  }
};

window.MetadataManager = MetadataManager;
