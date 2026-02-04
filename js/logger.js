/**
 * Grok Imagine Favorites Manager - Logging System
 * Centralized logging with levels and storage
 */

var Logger = {
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },

  currentLevel: 1, // Default to INFO
  maxLogs: 500,
  logs: [],

  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.levels[level.toUpperCase()] || 1;
    } else {
      this.currentLevel = level;
    }
  },

  debug(component, message, data) {
    this._log('DEBUG', component, message, data);
  },

  info(component, message, data) {
    this._log('INFO', component, message, data);
  },

  warn(component, message, data) {
    this._log('WARN', component, message, data);
  },

  error(component, message, data) {
    this._log('ERROR', component, message, data);
  },

  _log(level, component, message, data) {
    const levelNum = this.levels[level] || 1;

    if (levelNum < this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component,
      message,
      data
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    const prefix = `[${level}] [${component}]`;
    const output = data ? `${prefix} ${message}` : `${prefix} ${message}`;

    if (level === 'ERROR') {
      console.error(output, data || '');
    } else if (level === 'WARN') {
      console.warn(output, data || '');
    } else if (level === 'DEBUG') {
      console.debug(output, data || '');
    } else {
      console.log(output, data || '');
    }
  },

  getLogs(filter = {}) {
    let filtered = this.logs;

    if (filter.level) {
      const levelNum = this.levels[filter.level.toUpperCase()] || -1;
      filtered = filtered.filter(log => this.levels[log.level] >= levelNum);
    }

    if (filter.component) {
      filtered = filtered.filter(log => log.component === filter.component);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    return filtered;
  },

  exportLogs(format = 'json') {
    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Component', 'Message'];
      const rows = this.logs.map(log =>
        [log.timestamp, log.level, log.component, log.message].map(v => `"${v}"`).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  },

  clearLogs() {
    this.logs = [];
  }
};

window.Logger = Logger;
