// PRD Editor handlers
let prdItems = [];

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
    form.classList.remove('hidden');
    titleInput.value = '';
    descInput.value = '';
    titleInput.focus();
  });

  // Hide form on cancel
  cancelBtn.addEventListener('click', () => {
    form.classList.add('hidden');
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

    // Calculate next ID
    const nextId = prdItems.length > 0 ? Math.max(...prdItems.map(item => item.id)) + 1 : 0;

    const newItem = {
      id: nextId,
      title: title,
      description: description || 'No description'
    };

    prdItems.push(newItem);

    // Save to file
    const success = await window.electronAPI.savePrdFile(folderPath, JSON.stringify(prdItems, null, 2));
    
    if (success) {
      form.classList.add('hidden');
      renderRequirementsList();
    } else {
      alert('Failed to save requirement');
      prdItems.pop(); // Remove the item if save failed
    }
  });
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
    listContainer.innerHTML = '<p class="text-gray-500 italic">No requirements yet</p>';
    return;
  }

  listContainer.innerHTML = prdItems.map(item => `
    <div class="p-3 bg-gray-50 border border-gray-200 rounded">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs text-gray-400 font-mono">ID: ${item.id}</span>
          <h4 class="font-medium text-gray-800">${escapeHtml(item.title)}</h4>
          <p class="text-sm text-gray-600">${escapeHtml(item.description)}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
