// PRD Editor handlers
let prdItems = [];
let editingItemId = null;

export function initPrdEditor(getCurrentFolderPath, refreshPrdData) {
  const createBtn = document.getElementById('createRequirementBtn');
  const form = document.getElementById('requirementForm');
  const okayBtn = document.getElementById('okayBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const titleInput = document.getElementById('requirementTitle');
  const descInput = document.getElementById('requirementDescription');

  if (!createBtn) return;

  // Show form when "Create new requirement" is clicked
  createBtn.addEventListener('click', () => {
    editingItemId = null;
    form.classList.remove('hidden');
    titleInput.value = '';
    descInput.value = '';
    titleInput.focus();
  });

  // Hide form on cancel
  cancelBtn.addEventListener('click', () => {
    form.classList.add('hidden');
    editingItemId = null;
  });

  // Handle Okay button
  okayBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const folderPath = getCurrentFolderPath();

    if (!title) {
      alert('Please enter a title');
      return;
    }

    if (!folderPath) {
      alert('No folder selected');
      return;
    }

    if (editingItemId !== null) {
      // Edit existing item
      const itemIndex = prdItems.findIndex(item => item.id === editingItemId);
      if (itemIndex !== -1) {
        prdItems[itemIndex].title = title;
        prdItems[itemIndex].description = description || 'No description';
      }
    } else {
      // Create new item
      const nextId = prdItems.length > 0 ? Math.max(...prdItems.map(item => item.id)) + 1 : 0;

      const newItem = {
        id: nextId,
        title: title,
        description: description || 'No description'
      };

      prdItems.push(newItem);
    }

    // Save to file
    const success = await window.electronAPI.savePrdFile(folderPath, JSON.stringify(prdItems, null, 2));
    
    if (success) {
      form.classList.add('hidden');
      editingItemId = null;
      renderRequirementsList();
    } else {
      alert('Failed to save requirement');
      if (editingItemId === null) {
        prdItems.pop(); // Remove the item if save failed
      }
    }
  });

  // Make handleEditItem globally accessible for event handlers
  window.handleEditItem = (itemId) => {
    const item = prdItems.find(i => i.id === itemId);
    if (item) {
      editingItemId = itemId;
      titleInput.value = item.title;
      descInput.value = item.description;
      form.classList.remove('hidden');
      titleInput.focus();
    }
  };
}

export function setPrdItems(items) {
  if (Array.isArray(items)) {
    prdItems = items;
  } else if (items && typeof items === 'object') {
    // Handle single object (legacy format)
    prdItems = [items];
  } else {
    prdItems = [];
  }
  renderRequirementsList();
}

export function renderRequirementsList() {
  const listContainer = document.getElementById('requirementsList');
  if (!listContainer) return;

  if (prdItems.length === 0) {
    listContainer.innerHTML = '<p class="text-gray-500 italic">No items found. Create a new item to see</p>';
    return;
  }

  listContainer.innerHTML = prdItems.map(item => `
    <div class="p-3 bg-gray-50 border border-gray-200 rounded">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2.5 h-2.5 rounded-full ${item.isDone ? 'bg-emerald-500' : 'bg-amber-500'}" title="${item.isDone ? 'Completed' : 'Not completed'}"></div>
            <span class="text-xs text-gray-400 font-mono">ID: ${item.id}</span>
          </div>
          <h4 class="font-medium text-gray-800">${escapeHtml(item.title)}</h4>
          <p class="text-sm text-gray-600">${escapeHtml(item.description)}</p>
        </div>
        <button onclick="handleEditItem(${item.id})" class="ml-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit requirement">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0  0 2 2h9a2 2 0 0 0 2 -2v-1" />
            <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
            <path d="M16 5l3 3" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
