/**
 * Grok Imagine Favorites Manager - Smart Organization
 * Handles folder structures, filename generation, and metadata
 */

var SmartOrganizer = {
  /**
   * Generate organized path for media item
   */
  getOrganizedPath(item, config) {
    const ext = item.url.toLowerCase().includes('.mp4') ? 'mp4' : 'jpg';
    const filename = this._generateFilename(item, config.filenameTemplate, ext);

    let folder = 'grok-imagine';

    if (config.folderStructure === 'date') {
      const dateStr = config.dateFormat === 'yyyy/mm/dd'
        ? this._formatDateWithSlash(item.date)
        : this._formatDateWithDash(item.date);
      folder = `grok-imagine/${dateStr}`;
    } else if (config.folderStructure === 'prompt') {
      const promptFolder = this._sanitizePrompt(item.prompt);
      folder = `grok-imagine/${promptFolder}`;
    }

    return `${folder}/${filename}`;
  },

  /**
   * Generate filename based on template
   */
  _generateFilename(item, template, ext) {
    let filename = template;

    filename = filename.replace('{id}', item.id || 'unknown');
    filename = filename.replace('{ext}', ext);

    const dateStr = item.date || new Date().toISOString().split('T')[0];
    filename = filename.replace('{date}', dateStr);

    const promptSanitized = this._sanitizePrompt(item.prompt);
    filename = filename.replace('{prompt}', promptSanitized);

    // Remove any duplicate dots
    filename = filename.replace(/\.+/g, '.');

    return filename;
  },

  /**
   * Sanitize prompt for folder name
   */
  _sanitizePrompt(prompt) {
    if (!prompt) return 'generated';

    return prompt
      .substring(0, 50)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'generated';
  },

  /**
   * Format date as yyyy-mm-dd
   */
  _formatDateWithDash(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Format date as yyyy/mm/dd
   */
  _formatDateWithSlash(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  },

  /**
   * Extract date from item or return current date
   */
  extractDate(item) {
    if (item.date) {
      return new Date(item.date);
    }

    if (item.downloadedAt) {
      return new Date(item.downloadedAt);
    }

    return new Date();
  },

  /**
   * Check if item is within date range
   */
  isInDateRange(item, startDate, endDate) {
    const itemDate = this.extractDate(item).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    return itemDate >= start && itemDate <= end;
  },

  /**
   * Filter items by date range
   */
  filterByDateRange(items, startDate, endDate) {
    return items.filter(item => this.isInDateRange(item, startDate, endDate));
  },

  /**
   * Group items by date (for display purposes)
   */
  groupByDate(items) {
    const groups = {};

    items.forEach(item => {
      const dateStr = this._formatDateWithDash(item.date);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });

    return groups;
  },

  /**
   * Generate metadata for batch download
   */
  generateMetadata(items, config) {
    const metadata = {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      folderStructure: config.folderStructure,
      filenameTemplate: config.filenameTemplate,
      items: items.map(item => ({
        id: item.id,
        url: item.url,
        filename: this._generateFilename(
          item,
          config.filenameTemplate,
          item.url.toLowerCase().includes('.mp4') ? 'mp4' : 'jpg'
        ),
        date: item.date || new Date().toISOString(),
        prompt: item.prompt,
        type: item.url.toLowerCase().includes('.mp4') ? 'video' : 'image'
      }))
    };

    return metadata;
  },

  /**
   * Export metadata as JSON file
   */
  exportMetadataJson(items, config) {
    const metadata = this.generateMetadata(items, config);
    return JSON.stringify(metadata, null, 2);
  },

  /**
   * Export metadata as CSV
   */
  exportMetadataCsv(items, config) {
    const headers = ['ID', 'Date', 'Type', 'Prompt', 'Filename', 'URL'];
    const rows = items.map(item => {
      const ext = item.url.toLowerCase().includes('.mp4') ? 'mp4' : 'jpg';
      const filename = this._generateFilename(item, config.filenameTemplate, ext);
      const type = ext === 'mp4' ? 'video' : 'image';

      return [
        item.id,
        item.date || new Date().toISOString(),
        type,
        `"${(item.prompt || '').replace(/"/g, '""')}"`,
        filename,
        item.url
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};

window.SmartOrganizer = SmartOrganizer;
