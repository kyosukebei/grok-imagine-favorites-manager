/**
 * Organization Settings - Handles preferences and export
 */

let searchResults = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadSettings();
  setupEventListeners();
});

function setupTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

async function loadSettings() {
  const prefs = await Config.getPreferences();

  document.getElementById('folderStructure').value = prefs.folderStructure;
  document.getElementById('filenameTemplate').value = prefs.filenameTemplate;
  document.getElementById('includeMetadata').checked = prefs.includeMetadata;
  document.getElementById('dateFormat').value = prefs.dateFormat;

  updateTemplateExample();
}

function setupEventListeners() {
  document.getElementById('folderStructure').addEventListener('change', updateTemplateExample);
  document.getElementById('filenameTemplate').addEventListener('input', updateTemplateExample);
  document.getElementById('dateFormat').addEventListener('change', updateTemplateExample);

  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('closeBtn').addEventListener('click', () => window.close());
  document.getElementById('closeBtnExport').addEventListener('click', () => window.close());

  document.getElementById('exportJson').addEventListener('click', () => exportHistory('json'));
  document.getElementById('exportCsv').addEventListener('click', () => exportHistory('csv'));

  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('exportSearchJson').addEventListener('click', () => exportSearchResults('json'));
  document.getElementById('exportSearchCsv').addEventListener('click', () => exportSearchResults('csv'));
}

function updateTemplateExample() {
  const template = document.getElementById('filenameTemplate').value;
  const exampleItem = {
    id: 'abc123def456',
    date: new Date().toISOString().split('T')[0],
    prompt: 'A beautiful landscape with mountains'
  };

  const imageFilename = SmartOrganizer._generateFilename(exampleItem, template, 'jpg');
  const videoFilename = SmartOrganizer._generateFilename(exampleItem, template, 'mp4');

  let example = `<strong>Examples:</strong><br>
    Image: ${imageFilename}<br>
    Video: ${videoFilename}`;

  document.getElementById('templateExample').innerHTML = example;
}

async function saveSettings() {
  const preferences = {
    folderStructure: document.getElementById('folderStructure').value,
    filenameTemplate: document.getElementById('filenameTemplate').value || '{id}.{ext}',
    includeMetadata: document.getElementById('includeMetadata').checked,
    dateFormat: document.getElementById('dateFormat').value
  };

  await Config.savePreferences(preferences);

  const successMsg = document.getElementById('successMsg');
  successMsg.classList.add('show');

  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 2000);

  Logger.info('OrganizationSettings', 'Settings saved', preferences);
}

async function exportHistory(format) {
  const history = await Config.getDownloadHistory();

  if (history.length === 0) {
    alert('No download history available');
    return;
  }

  const prefs = await Config.getPreferences();
  let content;
  let filename;
  let mimeType;

  if (format === 'json') {
    content = SmartOrganizer.exportMetadataJson(history, prefs);
    filename = `download-history-${new Date().toISOString().split('T')[0]}.json`;
    mimeType = 'application/json';
  } else {
    content = SmartOrganizer.exportMetadataCsv(history, prefs);
    filename = `download-history-${new Date().toISOString().split('T')[0]}.csv`;
    mimeType = 'text/csv';
  }

  downloadFile(content, filename, mimeType);
  Logger.info('OrganizationSettings', `Exported history as ${format}`, { count: history.length });
}

async function performSearch() {
  const prompt = document.getElementById('searchPrompt').value;
  const dateFrom = document.getElementById('searchDateFrom').value;
  const dateTo = document.getElementById('searchDateTo').value;
  const type = document.getElementById('searchType').value;

  const criteria = {};
  if (prompt) criteria.prompt = prompt;
  if (dateFrom) criteria.dateFrom = dateFrom;
  if (dateTo) criteria.dateTo = dateTo;
  if (type) criteria.type = type;

  searchResults = await MetadataManager.search(criteria);

  const resultsDiv = document.getElementById('searchResults');
  if (searchResults.length === 0) {
    resultsDiv.innerHTML = '<div style="color: #888;">No results found</div>';
    return;
  }

  let totalItems = 0;
  searchResults.forEach(r => { totalItems += r.items.length; });

  resultsDiv.innerHTML = `<div style="font-size: 12px; color: #aaa;">
    Found ${totalItems} items in ${searchResults.length} batch(es)
  </div>`;

  Logger.info('OrganizationSettings', 'Search performed', { criteria, resultsCount: totalItems });
}

async function exportSearchResults(format) {
  if (searchResults.length === 0) {
    alert('No search results to export');
    return;
  }

  let content;
  let filename;
  let mimeType;

  if (format === 'json') {
    content = JSON.stringify(searchResults, null, 2);
    filename = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    mimeType = 'application/json';
  } else {
    content = MetadataManager.exportSearchResultsAsCSV(searchResults);
    filename = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
    mimeType = 'text/csv';
  }

  downloadFile(content, filename, mimeType);
  Logger.info('OrganizationSettings', `Exported search results as ${format}`);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
