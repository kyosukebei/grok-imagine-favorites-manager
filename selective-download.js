/**
 * Selective Download UI - Handles filtering and selection
 */

let allMediaItems = [];
let selectedItems = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  Logger.info('SelectiveDownload', 'Initializing selective download UI');

  setupEventListeners();
  await loadMediaItems();
  renderPreview();
  updateStats();
});

function setupEventListeners() {
  document.getElementById('typeFilter').addEventListener('change', filterAndRender);
  document.getElementById('dateFrom').addEventListener('change', filterAndRender);
  document.getElementById('dateTo').addEventListener('change', filterAndRender);

  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
  document.getElementById('invertSelectionBtn').addEventListener('click', invertSelection);

  document.getElementById('cancelBtn').addEventListener('click', () => window.close());
  document.getElementById('downloadBtn').addEventListener('click', startDownload);
}

async function loadMediaItems() {
  try {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div>Loading media items...';
    document.getElementById('mediaPreview').appendChild(loading);

    const fromBackground = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getScannedMedia' }, (response) => {
        if (chrome.runtime.lastError) {
          Logger.error('SelectiveDownload', 'Failed to get scanned media', chrome.runtime.lastError);
          resolve([]);
        } else {
          resolve(response?.media || []);
        }
      });
    });

    if (fromBackground.length > 0) {
      allMediaItems = fromBackground;
      Logger.info('SelectiveDownload', `Loaded ${allMediaItems.length} items from background`);
    } else {
      Logger.warn('SelectiveDownload', 'No media items available yet');
    }

    document.getElementById('mediaPreview').innerHTML = '';
  } catch (error) {
    Logger.error('SelectiveDownload', 'Error loading media items', error);
  }
}

function filterAndRender() {
  renderPreview();
}

function getFilteredItems() {
  let filtered = allMediaItems;

  const typeFilter = document.getElementById('typeFilter').value;
  if (typeFilter === 'images') {
    filtered = filtered.filter(item => !item.url.toLowerCase().includes('.mp4'));
  } else if (typeFilter === 'videos') {
    filtered = filtered.filter(item => item.url.toLowerCase().includes('.mp4'));
  }

  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;

  if (dateFrom || dateTo) {
    filtered = SmartOrganizer.filterByDateRange(filtered, dateFrom, dateTo);
  }

  return filtered;
}

function renderPreview() {
  const filtered = getFilteredItems();
  const preview = document.getElementById('mediaPreview');
  preview.innerHTML = '';

  filtered.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    if (selectedItems.has(index)) {
      div.classList.add('selected');
    }

    const isVideo = item.url.toLowerCase().includes('.mp4');

    if (isVideo) {
      div.innerHTML = `
        <video style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
          <source src="${item.url}" type="video/mp4">
        </video>
        <div class="checkbox">✓</div>
      `;
    } else {
      div.innerHTML = `
        <img src="${item.url}" alt="preview" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
        <div class="checkbox">✓</div>
      `;
    }

    div.addEventListener('click', () => {
      if (selectedItems.has(index)) {
        selectedItems.delete(index);
        div.classList.remove('selected');
      } else {
        selectedItems.add(index);
        div.classList.add('selected');
      }
      updateStats();
    });

    preview.appendChild(div);
  });

  updateStats();
}

function selectAll() {
  const filtered = getFilteredItems();
  const indices = allMediaItems.reduce((acc, item, idx) => {
    if (filtered.includes(item)) {
      acc.add(idx);
    }
    return acc;
  }, new Set());

  selectedItems = indices;
  renderPreview();
}

function deselectAll() {
  selectedItems.clear();
  renderPreview();
}

function invertSelection() {
  const filtered = getFilteredItems();
  const newSelected = new Set();

  allMediaItems.forEach((item, idx) => {
    if (filtered.includes(item)) {
      if (!selectedItems.has(idx)) {
        newSelected.add(idx);
      }
    } else {
      if (selectedItems.has(idx)) {
        newSelected.add(idx);
      }
    }
  });

  selectedItems = newSelected;
  renderPreview();
}

function updateStats() {
  const filtered = getFilteredItems();
  const selected = Array.from(selectedItems).filter(idx => {
    return filtered.includes(allMediaItems[idx]);
  });

  document.getElementById('totalCount').textContent = filtered.length;
  document.getElementById('selectedCount').textContent = selected.length;

  const imageCount = selected.filter(idx => !allMediaItems[idx].url.toLowerCase().includes('.mp4')).length;
  const videoCount = selected.length - imageCount;
  document.getElementById('typeBreakdown').textContent = `${imageCount}I/${videoCount}V`;

  document.getElementById('downloadBtn').disabled = selected.length === 0;
}

async function startDownload() {
  const filtered = getFilteredItems();
  const mediaToDownload = Array.from(selectedItems)
    .filter(idx => filtered.includes(allMediaItems[idx]))
    .map(idx => allMediaItems[idx]);

  if (mediaToDownload.length === 0) {
    alert('No items selected');
    return;
  }

  Logger.info('SelectiveDownload', `Starting download of ${mediaToDownload.length} items`);

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Downloading...';

  try {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'startDownloadsWithOrganization', media: mediaToDownload },
        (response) => {
          if (chrome.runtime.lastError) {
            Logger.error('SelectiveDownload', 'Download error', chrome.runtime.lastError);
          }
          resolve();
        }
      );
    });

    alert(`Download started for ${mediaToDownload.length} items`);
    window.close();
  } catch (error) {
    Logger.error('SelectiveDownload', 'Error starting download', error);
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download Selected';
    alert(`Error: ${error.message}`);
  }
}
