// Import dependencies
import "./styles.css";
import Swal from "sweetalert2";

// API Configuration
const BASE_URL = "https://notes-api.dicoding.dev/v2";

// Helper function for headers
function getHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

// Loading Component
class LoadingIndicator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .loader {
          border: 4px solid #f3f3f3;
          border-radius: 50%;
          border-top: 4px solid #3c2e2e;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="loader"></div>
    `;
  }
}

customElements.define("loading-indicator", LoadingIndicator);

// API Functions
async function getActiveNotes() {
  try {
    const response = await fetch(`${BASE_URL}/notes`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch active notes");
    }
    const data = await response.json();
    // Sort notes by createdAt in descending order (newest first)
    data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return data.data;
  } catch (error) {
    console.error("Error fetching active notes:", error);
    showError(error.message);
    throw error;
  }
}

async function getArchivedNotes() {
  try {
    const response = await fetch(`${BASE_URL}/notes/archived`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch archived notes");
    }
    const data = await response.json();
    // Sort notes by createdAt in descending order (newest first)
    data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return data.data;
  } catch (error) {
    console.error("Error fetching archived notes:", error);
    showError(error.message);
    throw error;
  }
}

async function addNote(note) {
  try {
    const response = await fetch(`${BASE_URL}/notes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        title: note.title,
        body: note.body,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Failed to add note");
    }

    showSuccess("Note added successfully!");
    await renderNotes();
    return responseData.data;
  } catch (error) {
    console.error("Error adding note:", error);
    showError(error.message);
    throw error;
  }
}

async function deleteNote(id) {
  try {
    const response = await fetch(`${BASE_URL}/notes/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete note");
    }

    showSuccess("Note deleted successfully!");
    await renderNotes();
    return true;
  } catch (error) {
    console.error("Error deleting note:", error);
    showError("Failed to delete note. Please try again.");
    throw error;
  }
}

async function archiveNote(id) {
  try {
    const response = await fetch(`${BASE_URL}/notes/${id}/archive`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.message || "Failed to archive note");
    }

    showSuccess("Note archived successfully!");
    await renderNotes(); // Re-render notes to update the UI
  } catch (error) {
    console.error("Error archiving note:", error);
    showError(error.message);
    throw error;
  }
}

async function unarchiveNote(id) {
  try {
    const response = await fetch(`${BASE_URL}/notes/${id}/unarchive`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.message || "Failed to unarchive note");
    }

    showSuccess("Note unarchived successfully!");
    await renderNotes(); // Re-render notes to update the UI
  } catch (error) {
    console.error("Error unarchiving note:", error);
    showError(error.message);
    throw error;
  }
}

// Helper functions for notifications
function showError(message) {
  return Swal.fire({
    icon: "error",
    title: "Oops...",
    text: message,
  });
}

function showSuccess(message) {
  return Swal.fire({
    icon: "success",
    title: "Success!",
    text: message,
    timer: 1500,
  });
}

// Function to render notes with loading state
async function renderNotes() {
  const activeNotesGrid = document.getElementById("active-notes-grid");
  const archivedNotesGrid = document.getElementById("archived-notes-grid");

  activeNotesGrid.innerHTML = "<loading-indicator></loading-indicator>";
  archivedNotesGrid.innerHTML = "<loading-indicator></loading-indicator>";

  try {
    // Fetch active and archived notes in parallel
    const [activeNotes, archivedNotes] = await Promise.all([
      getActiveNotes(),
      getArchivedNotes(),
    ]);

    // Render active notes
    activeNotesGrid.innerHTML = "";
    if (activeNotes.length === 0) {
      activeNotesGrid.innerHTML =
        '<p style="text-align: center">Tidak ada catatan aktif</p>';
    } else {
      activeNotes.forEach((note) => {
        const noteItem = document.createElement("note-item");
        noteItem.setAttribute("id", note.id);
        noteItem.setAttribute("title", note.title);
        noteItem.setAttribute("body", note.body);
        noteItem.setAttribute("created-at", note.createdAt);
        noteItem.setAttribute("archived", "false");
        activeNotesGrid.appendChild(noteItem);
      });
    }

    // Render archived notes
    archivedNotesGrid.innerHTML = "";
    if (archivedNotes.length === 0) {
      archivedNotesGrid.innerHTML =
        '<p style="text-align: center">Tidak ada catatan terarsip</p>';
    } else {
      archivedNotes.forEach((note) => {
        const noteItem = document.createElement("note-item");
        noteItem.setAttribute("id", note.id);
        noteItem.setAttribute("title", note.title);
        noteItem.setAttribute("body", note.body);
        noteItem.setAttribute("created-at", note.createdAt);
        noteItem.setAttribute("archived", "true");
        archivedNotesGrid.appendChild(noteItem);
      });
    }
  } catch (error) {
    console.error("Error rendering notes:", error);
    activeNotesGrid.innerHTML =
      '<p style="text-align: center; color: red;">Failed to load notes</p>';
    archivedNotesGrid.innerHTML =
      '<p style="text-align: center; color: red;">Failed to load notes</p>';
  }
}

// Custom Element: App Bar
class AppBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const title = this.getAttribute("title") || "Default Title";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: linear-gradient(145deg, #3c2e2e, #868a86);
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 1.5em;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      </style>
      <header>${title}</header>
    `;
  }
}

customElements.define("app-bar", AppBar);

// Custom Element: Note Item
class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const title = this.getAttribute("title") || "Untitled";
    const body = this.getAttribute("body") || "No content";
    const createdAt = this.getAttribute("created-at") || "Unknown date";
    const archived = this.getAttribute("archived") === "true";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        :host(:hover) {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        h3 {
          margin: 0 0 10px;
          font-size: 1.2em;
          color: #3c2e2e;
        }
        p {
          margin: 0;
          font-size: 0.9em;
          color: #555;
          white-space: pre-wrap;
        }
        small {
          display: block;
          margin: 10px 0;
          font-size: 0.8em;
          color: #888;
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          transition: opacity 0.3s;
          color: white;
        }
        .archive-btn {
          background-color: #4CAF50;
        }
        .delete-btn {
          background-color: #f44336;
        }
        button:hover {
          opacity: 0.8;
        }
        .loading {
          opacity: 0.5;
          pointer-events: none;
        }
      </style>
      <article>
        <h3>${title}</h3>
        <p>${body}</p>
        <small>Created: ${new Date(createdAt).toLocaleString()}</small>
        <div class="actions">
          <button class="archive-btn">${archived ? "Unarchive" : "Archive"}</button>
          <button class="delete-btn">Delete</button>
        </div>
      </article>
    `;
  }

  setupEventListeners() {
    const archiveBtn = this.shadowRoot.querySelector(".archive-btn");
    const deleteBtn = this.shadowRoot.querySelector(".delete-btn");
    const noteId = this.getAttribute("id");
    const archived = this.getAttribute("archived") === "true";

    archiveBtn.addEventListener("click", async () => {
      try {
        const article = this.shadowRoot.querySelector("article");
        article.classList.add("loading");

        if (archived) {
          await unarchiveNote(noteId);
        } else {
          await archiveNote(noteId);
        }
      } catch (error) {
        const article = this.shadowRoot.querySelector("article");
        article.classList.remove("loading");
      }
    });

    deleteBtn.addEventListener("click", async () => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3c2e2e",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        try {
          const article = this.shadowRoot.querySelector("article");
          article.classList.add("loading");
          await deleteNote(noteId);
        } catch (error) {
          const article = this.shadowRoot.querySelector("article");
          article.classList.remove("loading");
        }
      }
    });
  }
}

customElements.define("note-item", NoteItem);

// Custom Element: Note Form
class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 20px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        input, textarea {
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1em;
          font-family: inherit;
          transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
          border-color: #3c2e2e;
          outline: none;
        }
        button {
          padding: 12px;
          background: #3c2e2e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #4a3b3b;
        }
        .error {
          color: #f44336;
          font-size: 0.9em;
          margin-top: -8px;
          display: none;
        }
      </style>
      <form id="noteForm">
        <input type="text" id="title" placeholder="Note Title" required>
        <div class="error" id="title-error">Title is required</div>
        <textarea id="body" placeholder="Note Content" rows="4" required></textarea>
        <div class="error" id="body-error">Content is required</div>
        <button type="submit">Add Note</button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById("noteForm");
    const titleInput = this.shadowRoot.getElementById("title");
    const bodyInput = this.shadowRoot.getElementById("body");
    const titleError = this.shadowRoot.getElementById("title-error");
    const bodyError = this.shadowRoot.getElementById("body-error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      if (!title) {
        titleError.style.display = "block";
        return;
      }

      if (!body) {
        bodyError.style.display = "block";
        return;
      }

      try {
        form.style.opacity = "0.5";
        form.style.pointerEvents = "none";

        await addNote({ title, body });

        titleInput.value = "";
        bodyInput.value = "";
        titleError.style.display = "none";
        bodyError.style.display = "none";
      } catch (error) {
        console.error("Error adding note:", error);
      } finally {
        form.style.opacity = "1";
        form.style.pointerEvents = "auto";
      }
    });

    titleInput.addEventListener("input", () => {
      titleError.style.display = titleInput.value.trim() ? "none" : "block";
    });

    bodyInput.addEventListener("input", () => {
      bodyError.style.display = bodyInput.value.trim() ? "none" : "block";
    });
  }
}

customElements.define("note-form", NoteForm);

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  renderNotes();
});
