/* ========================================
   TO-DO LIST APPLICATION
   ES6+ Vanilla JavaScript
   ======================================== */

// ========================================
// STORAGE MANAGER - Handle localStorage
// ========================================

const StorageManager = {
  STORAGE_KEYS: {
    CATEGORIES: "todoapp_categories",
    TASKS: "todoapp_tasks",
  },

  getCategories() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading categories from storage:", error);
      return [];
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.CATEGORIES,
        JSON.stringify(categories)
      );
    } catch (error) {
      console.error("Error saving categories to storage:", error);
    }
  },

  getTasks() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading tasks from storage:", error);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to storage:", error);
    }
  },
};

// ========================================
// DATA MODEL
// ========================================

const AppState = {
  categories: StorageManager.getCategories(),
  tasks: StorageManager.getTasks(),
  filters: {
    category: "",
    status: "",
  },

  addCategory(name, color) {
    const id = Date.now().toString();
    const category = { id, name, color };
    this.categories.push(category);
    StorageManager.saveCategories(this.categories);
    return category;
  },

  updateCategory(id, name, color) {
    const category = this.categories.find((c) => c.id === id);
    if (category) {
      category.name = name;
      category.color = color;
      StorageManager.saveCategories(this.categories);
    }
    return category;
  },

  deleteCategory(id) {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.categories.splice(index, 1);
      // Remove tasks associated with this category
      this.tasks = this.tasks.filter((t) => t.categoryId !== id);
      StorageManager.saveCategories(this.categories);
      StorageManager.saveTasks(this.tasks);
    }
  },

  addTask(title, categoryId, deadline) {
    const id = Date.now().toString();
    const task = {
      id,
      title,
      categoryId,
      deadline: deadline || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    StorageManager.saveTasks(this.tasks);
    return task;
  },

  updateTask(id, updates) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      Object.assign(task, updates);
      StorageManager.saveTasks(this.tasks);
    }
    return task;
  },

  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      StorageManager.saveTasks(this.tasks);
    }
  },

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      StorageManager.saveTasks(this.tasks);
    }
    return task;
  },

  getFilteredTasks() {
    return this.tasks.filter((task) => {
      const categoryMatch =
        !this.filters.category || task.categoryId === this.filters.category;
      const statusMatch =
        !this.filters.status ||
        (this.filters.status === "completed" && task.completed) ||
        (this.filters.status === "pending" && !task.completed);
      return categoryMatch && statusMatch;
    });
  },

  setFilters(category, status) {
    this.filters.category = category;
    this.filters.status = status;
  },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateRandomColor() {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f43f5e", // rose
    "#14b8a6", // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const options = { month: "short", day: "numeric" };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = "numeric";
  }

  return date.toLocaleDateString("fr-FR", options);
}

function isOverdue(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function getCategoryById(id) {
  return AppState.categories.find((c) => c.id === id);
}

// ========================================
// EXPORT / IMPORT FUNCTIONS
// ========================================

function exportData() {
  try {
    const data = {
      categories: StorageManager.getCategories(),
      tasks: StorageManager.getTasks(),
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `todo-backup-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Données exportées avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'export :", error);
    alert("Erreur lors de l'export des données");
  }
}

function importData(file) {
  if (!file) return;

  try {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        // Validation de la structure
        if (!data.categories || !data.tasks || !Array.isArray(data.categories) || !Array.isArray(data.tasks)) {
          throw new Error("Structure JSON invalide");
        }

        // Sauvegarde des données
        StorageManager.saveCategories(data.categories);
        StorageManager.saveTasks(data.tasks);

        // Mise à jour de l'AppState
        AppState.categories = data.categories;
        AppState.tasks = data.tasks;

        // Rafraîchir l'interface
        renderUI();

        console.log("✅ Données importées avec succès");
        alert("Données importées avec succès !");
      } catch (parseError) {
        console.error("❌ Erreur lors du parsing JSON :", parseError);
        alert("Fichier JSON invalide. Vérifiez le format.");
      }
    };

    reader.onerror = function () {
      console.error("❌ Erreur lors de la lecture du fichier");
      alert("Impossible de lire le fichier");
    };

    reader.readAsText(file);
  } catch (error) {
    console.error("❌ Erreur lors de l'import :", error);
    alert("Erreur lors de l'import des données");
  }
}

// ========================================
// DOM ELEMENTS
// ========================================

const DOM = {
  // Buttons
  addCategoryBtn: document.getElementById("add-category-btn"),
  addTaskBtn: document.getElementById("add-task-btn"),
  cancelCategoryBtn: document.getElementById("cancel-category-btn"),
  cancelTaskBtn: document.getElementById("cancel-task-btn"),

  // Forms
  categoryForm: document.getElementById("category-form"),
  taskForm: document.getElementById("task-form"),
  categoryNameInput: document.getElementById("category-name"),
  taskTitleInput: document.getElementById("task-title"),
  taskCategorySelect: document.getElementById("task-category"),
  taskDeadlineInput: document.getElementById("task-deadline"),

  // Lists & Containers
  categoriesList: document.getElementById("categories-list"),
  tasksList: document.getElementById("tasks-list"),
  emptyState: document.getElementById("empty-state"),

  // Filters
  filterCategory: document.getElementById("filter-category"),
  filterStatus: document.getElementById("filter-status"),

  // Storage Actions
  exportBtn: document.getElementById("export-btn"),
  importBtn: document.getElementById("import-btn"),
  importFileInput: document.getElementById("import-file"),
};

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderCategories() {
  DOM.categoriesList.innerHTML = "";

  if (AppState.categories.length === 0) {
    DOM.categoriesList.innerHTML =
      '<p style="grid-column: 1 / -1; text-align: center; color: #9ca3af;">Aucune catégorie. Créez-en une pour commencer.</p>';
    DOM.taskCategorySelect.innerHTML =
      '<option value="">-- Choisir une catégorie --</option>';
    return;
  }

  // Render category items
  AppState.categories.forEach((category) => {
    const categoryEl = document.createElement("div");
    categoryEl.className = "category-item";
    categoryEl.setAttribute("role", "listitem");
    categoryEl.innerHTML = `
      <div class="category-color" style="background-color: ${category.color};" aria-hidden="true"></div>
      <div class="category-name">${escapeHtml(category.name)}</div>
      <div class="category-actions">
        <button class="category-btn category-btn--edit" data-action="edit-category" data-id="${category.id}" aria-label="Éditer ${category.name}">✎</button>
        <button class="category-btn category-btn--delete" data-action="delete-category" data-id="${category.id}" aria-label="Supprimer ${category.name}">✕</button>
      </div>
    `;
    DOM.categoriesList.appendChild(categoryEl);
  });

  // Update task category select
  DOM.taskCategorySelect.innerHTML =
    '<option value="">-- Choisir une catégorie --</option>';
  AppState.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    DOM.taskCategorySelect.appendChild(option);
  });

  // Update filter category select
  DOM.filterCategory.innerHTML = '<option value="">Toutes les catégories</option>';
  AppState.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    DOM.filterCategory.appendChild(option);
  });
}

function renderTasks() {
  const filteredTasks = AppState.getFilteredTasks();
  DOM.tasksList.innerHTML = "";

  if (filteredTasks.length === 0) {
    DOM.emptyState.hidden = false;
    return;
  }

  DOM.emptyState.hidden = true;

  filteredTasks.forEach((task) => {
    const category = getCategoryById(task.categoryId);
    const taskEl = document.createElement("div");
    taskEl.className = `task-item ${task.completed ? "task-item--completed" : ""}`;
    taskEl.setAttribute("role", "listitem");

    const deadlineHtml = task.deadline
      ? `
        <div class="task-meta-item ${isOverdue(task.deadline) && !task.completed ? "overdue" : ""}">
          📅 ${formatDate(task.deadline)}
          ${isOverdue(task.deadline) && !task.completed ? "<span> (Dépassée)</span>" : ""}
        </div>
      `
      : "";

    taskEl.innerHTML = `
      <input 
        type="checkbox" 
        class="task-checkbox" 
        data-action="toggle-task" 
        data-id="${task.id}"
        ${task.completed ? "checked" : ""}
        aria-label="Marquer comme ${task.completed ? "à faire" : "terminée"}: ${task.title}"
      />
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${category ? `<span class="task-category-badge" style="background-color: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}40;">${escapeHtml(category.name)}</span>` : ""}
          ${deadlineHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn task-btn--edit" data-action="edit-task" data-id="${task.id}" aria-label="Éditer la tâche">✎</button>
        <button class="task-btn task-btn--delete" data-action="delete-task" data-id="${task.id}" aria-label="Supprimer la tâche">✕</button>
      </div>
    `;
    DOM.tasksList.appendChild(taskEl);
  });
}

function renderUI() {
  renderCategories();
  renderTasks();
}

// ========================================
// EVENT HANDLERS
// ========================================

function handleAddCategoryClick() {
  DOM.categoryForm.hidden = false;
  DOM.categoryNameInput.focus();
}

function handleCancelCategoryClick() {
  DOM.categoryForm.hidden = true;
  DOM.categoryNameInput.value = "";
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const name = DOM.categoryNameInput.value.trim();

  if (!name) {
    alert("Le nom de la catégorie ne peut pas être vide.");
    return;
  }

  const color = generateRandomColor();
  AppState.addCategory(name, color);
  DOM.categoryNameInput.value = "";
  DOM.categoryForm.hidden = true;
  renderUI();
}

function handleAddTaskClick() {
  if (AppState.categories.length === 0) {
    alert("Veuillez créer au moins une catégorie avant d'ajouter une tâche.");
    return;
  }
  DOM.taskForm.hidden = false;
  DOM.taskTitleInput.focus();
}

function handleCancelTaskClick() {
  DOM.taskForm.hidden = true;
  DOM.taskTitleInput.value = "";
  DOM.taskCategorySelect.value = "";
  DOM.taskDeadlineInput.value = "";
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const title = DOM.taskTitleInput.value.trim();
  const categoryId = DOM.taskCategorySelect.value;
  const deadline = DOM.taskDeadlineInput.value;

  if (!title) {
    alert("Le titre de la tâche ne peut pas être vide.");
    return;
  }

  if (!categoryId) {
    alert("Veuillez sélectionner une catégorie.");
    return;
  }

  AppState.addTask(title, categoryId, deadline);
  DOM.taskTitleInput.value = "";
  DOM.taskCategorySelect.value = "";
  DOM.taskDeadlineInput.value = "";
  DOM.taskForm.hidden = true;
  renderUI();
}

function handleCategoryAction(action, id) {
  if (action === "delete-category") {
    if (
      confirm(
        "Êtes-vous sûr ? Les tâches associées seront également supprimées."
      )
    ) {
      AppState.deleteCategory(id);
      renderUI();
    }
  } else if (action === "edit-category") {
    const category = getCategoryById(id);
    if (category) {
      const newName = prompt("Nouveau nom de catégorie:", category.name);
      if (newName && newName.trim()) {
        AppState.updateCategory(id, newName.trim(), category.color);
        renderUI();
      }
    }
  }
}

function handleTaskAction(action, id) {
  if (action === "delete-task") {
    if (confirm("Supprimer cette tâche ?")) {
      AppState.deleteTask(id);
      renderUI();
    }
  } else if (action === "edit-task") {
    const task = AppState.tasks.find((t) => t.id === id);
    if (task) {
      const newTitle = prompt("Nouveau titre de tâche:", task.title);
      if (newTitle && newTitle.trim()) {
        AppState.updateTask(id, { title: newTitle.trim() });
        renderUI();
      }
    }
  } else if (action === "toggle-task") {
    AppState.toggleTask(id);
    renderUI();
  }
}

function handleFilterChange() {
  const category = DOM.filterCategory.value;
  const status = DOM.filterStatus.value;
  AppState.setFilters(category, status);
  renderTasks();
}

// ========================================
// EVENT DELEGATION
// ========================================

document.addEventListener("click", (e) => {
  const target = e.target;

  // Category actions
  if (target.dataset.action === "edit-category") {
    handleCategoryAction("edit-category", target.dataset.id);
  } else if (target.dataset.action === "delete-category") {
    handleCategoryAction("delete-category", target.dataset.id);
  }

  // Task actions
  if (target.dataset.action === "delete-task") {
    handleTaskAction("delete-task", target.dataset.id);
  } else if (target.dataset.action === "edit-task") {
    handleTaskAction("edit-task", target.dataset.id);
  }
});

document.addEventListener("change", (e) => {
  const target = e.target;

  // Task checkbox
  if (target.dataset.action === "toggle-task") {
    handleTaskAction("toggle-task", target.dataset.id);
  }

  // Filters
  if (target === DOM.filterCategory || target === DOM.filterStatus) {
    handleFilterChange();
  }
});

// ========================================
// UTILITY: HTML ESCAPE
// ========================================

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
  // Attach event listeners
  DOM.addCategoryBtn.addEventListener("click", handleAddCategoryClick);
  DOM.cancelCategoryBtn.addEventListener("click", handleCancelCategoryClick);
  DOM.categoryForm.addEventListener("submit", handleCategoryFormSubmit);

  DOM.addTaskBtn.addEventListener("click", handleAddTaskClick);
  DOM.cancelTaskBtn.addEventListener("click", handleCancelTaskClick);
  DOM.taskForm.addEventListener("submit", handleTaskFormSubmit);

  // Export / Import listeners
  DOM.exportBtn.addEventListener("click", exportData);
  DOM.importBtn.addEventListener("click", function () {
    DOM.importFileInput.click();
  });
  DOM.importFileInput.addEventListener("change", function (e) {
    importData(e.target.files[0]);
    // Reset input so the same file can be imported again
    e.target.value = "";
  });

  // Initial render
  renderUI();

  // Restore filter state (optional)
  if (AppState.filters.category) {
    DOM.filterCategory.value = AppState.filters.category;
  }
  if (AppState.filters.status) {
    DOM.filterStatus.value = AppState.filters.status;
  }
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
