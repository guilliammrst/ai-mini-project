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
      let tasks = data ? JSON.parse(data) : [];
      
      // Migration: Add priority to old tasks
      tasks = tasks.map((task) => ({
        ...task,
        priority: task.priority || "normal", // Default to 'normal' if missing
      }));
      
      // Re-save migrated tasks
      if (tasks.length > 0 && tasks.some((t) => !data.includes('"priority"'))) {
        this.saveTasks(tasks);
      }
      
      return tasks;
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
    priority: "",
    search: "",
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

  addTask(title, categoryId, deadline, priority = "normal") {
    const id = Date.now().toString();
    const task = {
      id,
      title,
      categoryId,
      deadline: deadline || null,
      status: "todo",
      priority: priority, // Add priority level
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

  updateTaskStatus(id, newStatus) {
    const task = this.tasks.find((t) => t.id === id);
    if (task && ["todo", "in-progress", "done"].includes(newStatus)) {
      task.status = newStatus;
      StorageManager.saveTasks(this.tasks);
    }
    return task;
  },

  getFilteredTasks() {
    const filtered = this.tasks.filter((task) => {
      const categoryMatch =
        !this.filters.category || task.categoryId === this.filters.category;
      const statusMatch =
        !this.filters.status || task.status === this.filters.status;
      const priorityMatch =
        !this.filters.priority || task.priority === this.filters.priority;
      const searchMatch =
        !this.filters.search ||
        task.title.toLowerCase().includes(this.filters.search.toLowerCase());
      return categoryMatch && statusMatch && priorityMatch && searchMatch;
    });
    
    // Sort by priority
    return sortTasksByPriority(filtered);
  },

  setFilters(category, status, search, priority) {
    this.filters.category = category;
    this.filters.status = status;
    this.filters.priority = priority;
    this.filters.search = search || this.filters.search;
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

function getPriorityOrder(priority) {
  const order = { urgent: 0, hot: 1, normal: 2, low: 3 };
  return order[priority] ?? 2; // Default to 'normal' (2) if unknown
}

function sortTasksByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    // First, sort by priority (ascending order index)
    const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by creation date (newest first)
    const createdDiff = new Date(b.createdAt) - new Date(a.createdAt);
    if (createdDiff !== 0) return createdDiff;
    
    // If same creation date, sort by deadline (earliest first, nullable)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return a.deadline ? -1 : 1; // Tasks with deadline first
  });
}

function getPriorityIcon(priority) {
  const icons = {
    low: "📍",
    normal: "➖",
    hot: "🔥",
    urgent: "⚠️",
  };
  return icons[priority] || "➖";
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
  editTaskForm: document.getElementById("edit-task-form"),
  categoryNameInput: document.getElementById("category-name"),
  taskTitleInput: document.getElementById("task-title"),
  taskCategorySelect: document.getElementById("task-category"),
  taskDeadlineInput: document.getElementById("task-deadline"),
  taskPrioritySelect: document.getElementById("task-priority"),
  editTaskTitleInput: document.getElementById("edit-task-title"),
  editTaskCategorySelect: document.getElementById("edit-task-category"),
  editTaskDeadlineInput: document.getElementById("edit-task-deadline"),
  editTaskPrioritySelect: document.getElementById("edit-task-priority"),
  cancelEditTaskBtn: document.getElementById("cancel-edit-task-btn"),

  // Lists & Containers
  categoriesList: document.getElementById("categories-list"),
  tasksList: document.getElementById("tasks-list"),
  emptyState: document.getElementById("empty-state"),

  // Filters
  searchInput: document.getElementById("search-input"),
  filterCategory: document.getElementById("filter-category"),
  filterStatus: document.getElementById("filter-status"),
  filterPriority: document.getElementById("filter-priority"),

  // Storage Actions
  exportBtn: document.getElementById("export-btn"),
  importBtn: document.getElementById("import-btn"),
  importFileInput: document.getElementById("import-file"),
};

// ========================================
// EDIT STATE
// ========================================

let editingTaskId = null;

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

  // Update edit task category select
  DOM.editTaskCategorySelect.innerHTML =
    '<option value="">-- Choisir une catégorie --</option>';
  AppState.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    DOM.editTaskCategorySelect.appendChild(option);
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
    taskEl.className = `task-item task-item--${task.status}`;
    taskEl.setAttribute("role", "listitem");

    const isOverdueTask = isOverdue(task.deadline) && task.status !== "done";
    const deadlineHtml = task.deadline
      ? `
        <div class="task-meta-item ${isOverdueTask ? "overdue" : ""}">
          📅 ${formatDate(task.deadline)}
          ${isOverdueTask ? "<span> (Dépassée)</span>" : ""}
        </div>
      `
      : "";

    const statusLabels = {
      todo: "À faire",
      "in-progress": "En cours",
      done: "Terminée",
    };

    taskEl.innerHTML = `
      <select 
        class="task-status-select" 
        data-action="change-task-status" 
        data-id="${task.id}"
        aria-label="Changer le statut de la tâche: ${task.title}"
      >
        <option value="todo">À faire</option>
        <option value="in-progress">En cours</option>
        <option value="done">Terminée</option>
      </select>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="priority-badge priority-badge--${task.priority}" aria-label="Priorité: ${task.priority}" title="${task.priority}">
            ${getPriorityIcon(task.priority)}
          </span>
          ${category ? `<span class="task-category-badge" style="background-color: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}40;">${escapeHtml(category.name)}</span>` : ""}
          ${deadlineHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn task-btn--edit" data-action="edit-task" data-id="${task.id}" aria-label="Éditer la tâche">✎</button>
        <button class="task-btn task-btn--delete" data-action="delete-task" data-id="${task.id}" aria-label="Supprimer la tâche">✕</button>
      </div>
    `;

    // Set the current status in the select
    const selectEl = taskEl.querySelector(".task-status-select");
    selectEl.value = task.status;

    DOM.tasksList.appendChild(taskEl);
  });
}

function renderUI() {
  renderCategories();
  renderTasks();
  updateProgressBar();
}

function updateProgressBar() {
  const totalTasks = AppState.tasks.length;
  const doneTasks = AppState.tasks.filter((t) => t.status === "done").length;
  const percentage = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  if (progressBar && progressText) {
    progressBar.style.width = percentage + "%";
    progressText.textContent = percentage + "% complété";
    progressBar.parentElement.setAttribute("aria-valuenow", percentage);
  }
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
  DOM.taskPrioritySelect.value = "normal";
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const title = DOM.taskTitleInput.value.trim();
  const categoryId = DOM.taskCategorySelect.value;
  const deadline = DOM.taskDeadlineInput.value;
  const priority = DOM.taskPrioritySelect.value;

  if (!title) {
    alert("Le titre de la tâche ne peut pas être vide.");
    return;
  }

  if (!categoryId) {
    alert("Veuillez sélectionner une catégorie.");
    return;
  }

  AppState.addTask(title, categoryId, deadline, priority);
  DOM.taskTitleInput.value = "";
  DOM.taskCategorySelect.value = "";
  DOM.taskDeadlineInput.value = "";
  DOM.taskPrioritySelect.value = "normal";
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
    handleOpenEditTask(id);
  }
}

function handleOpenEditTask(id) {
  const task = AppState.tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;
  
  // Ensure category select options are up-to-date
  DOM.editTaskCategorySelect.innerHTML =
    '<option value="">-- Choisir une catégorie --</option>';
  AppState.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    DOM.editTaskCategorySelect.appendChild(option);
  });

  // Pre-fill form with current task data
  DOM.editTaskTitleInput.value = task.title;
  DOM.editTaskCategorySelect.value = task.categoryId;
  DOM.editTaskDeadlineInput.value = task.deadline || "";
  DOM.editTaskPrioritySelect.value = task.priority;

  // Show edit form
  DOM.editTaskForm.hidden = false;
  DOM.editTaskTitleInput.focus();
}

function handleCancelEditTask() {
  DOM.editTaskForm.hidden = true;
  editingTaskId = null;
  DOM.editTaskTitleInput.value = "";
  DOM.editTaskCategorySelect.value = "";
  DOM.editTaskDeadlineInput.value = "";
  DOM.editTaskPrioritySelect.value = "normal";
}

function handleEditTaskFormSubmit(e) {
  e.preventDefault();
  
  if (!editingTaskId) return;

  const title = DOM.editTaskTitleInput.value.trim();
  const categoryId = DOM.editTaskCategorySelect.value;
  const deadline = DOM.editTaskDeadlineInput.value;
  const priority = DOM.editTaskPrioritySelect.value;

  if (!title) {
    alert("Le titre de la tâche ne peut pas être vide.");
    return;
  }

  if (!categoryId) {
    alert("Veuillez sélectionner une catégorie.");
    return;
  }

  AppState.updateTask(editingTaskId, {
    title,
    categoryId,
    deadline: deadline || null,
    priority,
  });

  handleCancelEditTask();
  renderUI();
}

function handleTaskStatusChange(id, newStatus) {
  AppState.updateTaskStatus(id, newStatus);
  renderUI();
}

function handleFilterChange() {
  const category = DOM.filterCategory.value;
  const status = DOM.filterStatus.value;
  const search = DOM.searchInput.value;
  const priority = DOM.filterPriority.value;
  AppState.setFilters(category, status, search, priority);
  renderTasks();
}

function handleSearchInput(e) {
  const search = e.target.value;
  AppState.filters.search = search;
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

  // Task status change
  if (target.dataset.action === "change-task-status") {
    handleTaskStatusChange(target.dataset.id, target.value);
  }

  // Filters
  if (target === DOM.filterCategory || target === DOM.filterStatus || target === DOM.filterPriority) {
    handleFilterChange();
  }
});

// Search input listener (input event for real-time search)
if (DOM.searchInput) {
  DOM.searchInput.addEventListener("input", handleSearchInput);
}

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

  // Edit task form listeners
  DOM.editTaskForm.addEventListener("submit", handleEditTaskFormSubmit);
  DOM.cancelEditTaskBtn.addEventListener("click", handleCancelEditTask);

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
  if (AppState.filters.priority) {
    DOM.filterPriority.value = AppState.filters.priority;
  }
  if (AppState.filters.search) {
    DOM.searchInput.value = AppState.filters.search;
  }
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
