/* =========================================================
   CHORDIPOT
   Full app logic
   ========================================================= */

const LS_KEY = "chordipot_v3";

const DEFAULT_CHORDS = [
  { id: "g", name: "G", type: "Major", strings: ["3", "2", "0", "0", "3", "3"], tab: "230033" },
  { id: "c", name: "C", type: "Major", strings: ["x", "3", "2", "0", "1", "0"], tab: "x32010" },
  { id: "d", name: "D", type: "Major", strings: ["x", "x", "0", "2", "3", "2"], tab: "xx0232" },
  { id: "a", name: "A", type: "Major", strings: ["x", "0", "2", "2", "2", "0"], tab: "x02220" },
  { id: "e", name: "E", type: "Major", strings: ["0", "2", "2", "1", "0", "0"], tab: "022100" },
  { id: "f", name: "F", type: "Major", strings: ["1", "3", "3", "2", "1", "1"], tab: "133211" },

  { id: "am", name: "Am", type: "Minor", strings: ["x", "0", "2", "2", "1", "0"], tab: "x02210" },
  { id: "em", name: "Em", type: "Minor", strings: ["0", "2", "2", "0", "0", "0"], tab: "022000" },
  { id: "dm", name: "Dm", type: "Minor", strings: ["x", "x", "0", "2", "3", "1"], tab: "xx0231" },

  { id: "gsus2", name: "Gsus2", type: "Sus2", strings: ["3", "0", "0", "2", "3", "3"], tab: "300233" },
  { id: "gsus4", name: "Gsus4", type: "Sus4", strings: ["3", "3", "0", "0", "1", "3"], tab: "330013" },
  { id: "dsus2", name: "Dsus2", type: "Sus2", strings: ["x", "x", "0", "2", "3", "0"], tab: "xx0230" },

  { id: "g5", name: "G5", type: "Power", strings: ["3", "5", "5", "x", "x", "x"], tab: "355xxx" },
  { id: "a5", name: "A5", type: "Power", strings: ["x", "0", "2", "2", "x", "x"], tab: "x022xx" },

  { id: "bdim", name: "Bdim", type: "Diminished", strings: ["x", "2", "3", "4", "3", "x"], tab: "x2343x" },
  { id: "caug", name: "Caug", type: "Augmented", strings: ["x", "3", "2", "1", "1", "0"], tab: "x32110" },

  { id: "gmaj7", name: "Gmaj7", type: "Major 7", strings: ["3", "2", "0", "0", "0", "2"], tab: "320002" },
  { id: "gmaj9", name: "Gmaj9", type: "Major 9", strings: ["3", "2", "0", "2", "0", "2"], tab: "320202" },
  { id: "gmaj11", name: "Gmaj11", type: "Major 11", strings: ["3", "2", "0", "2", "1", "0"], tab: "320210" },

  { id: "am7", name: "Am7", type: "Minor 7", strings: ["x", "0", "2", "0", "1", "0"], tab: "x02010" },
  { id: "am9", name: "Am9", type: "Minor 9", strings: ["x", "0", "5", "4", "1", "0"], tab: "x05410" },
  { id: "am11", name: "Am11", type: "Minor 11", strings: ["5", "0", "5", "5", "3", "0"], tab: "505530" },

  { id: "c7", name: "C7", type: "Dominant 7", strings: ["x", "3", "2", "3", "1", "0"], tab: "x32310" },
  { id: "d7", name: "D7", type: "Dominant 7", strings: ["x", "x", "0", "2", "1", "2"], tab: "xx0212" },
  { id: "e7", name: "E7", type: "Dominant 7", strings: ["0", "2", "0", "1", "0", "0"], tab: "020100" }
];

const CHORD_ROOTS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

const CHORD_QUALITIES = [
  "",
  "m",
  "sus2",
  "sus4",
  "5",
  "dim",
  "aug",
  "maj7",
  "maj9",
  "maj11",
  "7",
  "9",
  "11",
  "m7",
  "m9",
  "m11"
];

const defaultStore = {
  songs: [],
  folders: ["General", "Sunday Set"],
  favorites: [],
  history: [],
  theme: "light",
  chords: DEFAULT_CHORDS
};

function loadStore() {
  try {
    const oldStore = JSON.parse(localStorage.getItem(LS_KEY));

    if (!oldStore) {
      return JSON.parse(JSON.stringify(defaultStore));
    }

    return {
      ...defaultStore,
      ...oldStore,
      songs: Array.isArray(oldStore.songs) ? oldStore.songs : [],
      folders: Array.isArray(oldStore.folders) && oldStore.folders.length
        ? oldStore.folders
        : ["General", "Sunday Set"],
      favorites: Array.isArray(oldStore.favorites) ? oldStore.favorites : [],
      history: Array.isArray(oldStore.history) ? oldStore.history : [],
      chords: Array.isArray(oldStore.chords) && oldStore.chords.length
        ? oldStore.chords
        : DEFAULT_CHORDS
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultStore));
  }
}

let store = loadStore();

let viewingSong = null;
let editingSongId = null;
let editingFolderName = null;
let editingChordId = null;

let transpose = 0;

let selectedSongs = new Set();
let selectedFolderSongs = new Set();
let folderSelectionMode = false;

let currentFolder = null;
let viewerReturnFolder = null;
let viewerReturnPage = "songs";

let longPressTimer = null;
let longPressTriggered = false;

const $ = (selector) => document.querySelector(selector);

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}


function formatChordName(name) {
  const raw = String(name || "").trim();

  const match = raw.match(/^([a-gA-G])([#b]?)(.*)$/);

  if (!match) {
    return raw;
  }

  const root =
    match[1].toUpperCase() +
    match[2];

  const suffixRaw = match[3] || "";

  const suffixMap = {
    "": "",
    "m": "m",
    "sus2": "sus2",
    "sus4": "sus4",
    "5": "5",
    "dim": "dim",
    "aug": "aug",
    "add9": "add9",
    "7": "7",
    "9": "9",
    "11": "11",
    "m7": "m7",
    "m9": "m9",
    "m11": "m11",
    "maj7": "maj7",
    "maj9": "maj9",
    "maj11": "maj11"
  };

  const suffix =
    suffixMap[suffixRaw.toLowerCase()] ??
    suffixRaw;

  return root + suffix;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
  const isDark = store.theme === "dark";

  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );

  const toggle = $("#themeToggle");

  if (toggle) {
    toggle.classList.toggle("on", isDark);
  }

  const themeColor = isDark ? "#0f0f0f" : "#ffffff";

  let themeMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeMeta) {
    themeMeta.setAttribute("content", themeColor);
  }
}

const themeToggle = $("#themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    store.theme = store.theme === "dark" ? "light" : "dark";
    save();
    applyTheme();
  });
}

applyTheme();

/* =========================================================
   SIDEBAR
   ========================================================= */

function openSidebar() {
  $("#sidebar")?.classList.add("open");
  $("#overlay")?.classList.add("active");
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#overlay")?.classList.remove("active");
}

$("#menuBtn")?.addEventListener("click", (event) => {
  event.stopPropagation();

  if ($("#sidebar")?.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

$("#overlay")?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSidebar();
    closeAllModals();
  }
});

/* =========================================================
   NAVIGATION
   ========================================================= */

const pageMap = {
  songs: "page-songs",
  fav: "page-fav",
  history: "page-history",
  chords: "page-chords",
  settings: "page-settings",
  viewer: "page-viewer",
  folder: "page-folder"
};

function updateSidebarActive(page) {
  // Clear active state from all normal sidebar items.
  document
    .querySelectorAll(".side-item")
    .forEach((item) => {
      item.classList.remove("active");
    });

  // Clear active state from all folder sidebar items.
  document
    .querySelectorAll(".folder-side-item")
    .forEach((item) => {
      item.classList.remove("active");
    });

  // Viewer keeps the active state of the page/folder
  // that opened it.
  if (page === "viewer") {
    return;
  }

  // Folder page: activate the exact current folder.
  if (page === "folder") {
    if (!currentFolder) return;

    const folderItems =
      document.querySelectorAll(".folder-side-item");

    folderItems.forEach((item) => {
      const nameEl =
        item.querySelector(".folder-side-name");

      if (
        nameEl &&
        nameEl.textContent.trim() === currentFolder
      ) {
        item.classList.add("active");
      }
    });

    return;
  }

  // Normal pages: activate the matching data-page item.
  const activeItem =
    document.querySelector(
      `.side-item[data-page="${page}"]`
    );

  activeItem?.classList.add("active");
}

function navigate(page) {
  // Leaving the current song context always cancels
  // normal song selection to prevent stale selections.
  const previousSongContext = getSongActionContext();

  let nextSongContext = "songs";

  if (page === "fav") {
    nextSongContext = "favorites";
  } else if (page === "history") {
    nextSongContext = "history";
  } else if (page === "folder") {
    nextSongContext = "folder";
  }

  if (
    selectedSongs.size > 0 &&
    previousSongContext !== nextSongContext
  ) {
    selectedSongs.clear();
  }

  // Leaving the folder page always cancels
  // folder selection to prevent stale state.
  if (page !== "folder") {
    selectedFolderSongs.clear();
    folderSelectionMode = false;
  }

  if (page !== "folder") {
    folderSelectionMode = false;
    selectedFolderSongs.clear();
  }

  document
    .querySelectorAll(".page")
    .forEach((pageEl) => pageEl.classList.remove("active"));

  const target = document.getElementById(pageMap[page] || "page-songs");

  if (target) {
    target.classList.add("active");
  }

  updateSidebarActive(page);

  const navbar = $("#navbar");
  const addButton = $("#addSongBtn");

  if (page === "viewer") {
    navbar?.classList.add("hidden");
    if (addButton) addButton.style.display = "none";
  } else {
    navbar?.classList.remove("hidden");

    if (addButton) {
      addButton.style.display =
        page === "chords" || page === "settings" ? "none" : "block";
    }
  }

  if (page === "songs") {
    renderSongs($("#searchInput")?.value || "");
  }

  if (page === "fav") {
    renderFavorites();
  }

  if (page === "history") {
    renderHistory();
  }

  if (page === "chords") {
    renderChords($("#chordSearchInput")?.value || "");
  }

  if (page === "folder") {
    renderCurrentFolder();
  }

  if (page !== "viewer") {
    closeViewerState();
  }
}

document.querySelectorAll(".side-item").forEach((item) => {
  item.addEventListener("click", () => {
    
    /*
     * Leaving a folder through the main sidebar
     * clears the previous folder context.
     *
     * This makes Add Song behave as a normal
     * My Songs / Favorites / History form.
     */
    if (item.dataset.page !== "folder") {
      currentFolder = null;
    }

    navigate(item.dataset.page);
    closeSidebar();
  });
});

/* =========================================================
   COUNTS
   ========================================================= */

function updateCounts() {
  const songs = store.songs;

  $("#cntSongs").textContent = songs.length;
  $("#cntFavorites").textContent = store.favorites.length;
  $("#cntHistory").textContent = store.history.length;

  renderFolders();
}

/* =========================================================
   FOLDERS
   ========================================================= */

function renderFolders() {
  const list = $("#foldersList");

  if (!list) return;

  list.innerHTML = "";

  store.folders.forEach((folderName) => {
    const count = store.songs.filter(
      (song) => (song.folder || "General") === folderName
    ).length;

    const item = document.createElement("div");

    item.className = "folder-side-item";

    item.innerHTML = `
      <span class="folder-side-name">${escapeHTML(folderName)}</span>
      <span class="count">${count}</span>
    `;

    item.addEventListener("click", () => {
      openFolder(folderName);
      closeSidebar();
    });

    attachLongPress(item, () => {
      openFolderAction(folderName);
    });

    // Restore the active indicator after folders are re-rendered.
    if (
      currentFolder &&
      folderName === currentFolder
    ) {
      item.classList.add("active");
    }

    list.appendChild(item);
  });
}

function openFolder(folderName) {
  // Always reset folder selection when entering/changing folder
  selectedFolderSongs.clear();
  folderSelectionMode = false;

  // Also reset normal song selection
  selectedSongs.clear();

  currentFolder = folderName;

  $("#folderPageTitle").textContent = folderName;

  navigate("folder");

  updateFolderSelectionBar();
  updateSongSelectionBar();
}

$("#addFolderBtn")?.addEventListener("click", (event) => {
  event.stopPropagation();

  editingFolderName = null;

  $("#folderModalTitle").textContent = "New folder";
  $("#folderNameInput").value = "";

  openModal("#folderModal");

  setTimeout(() => {
    $("#folderNameInput")?.focus();
  }, 50);
});

function openFolderAction(folderName) {
  openActionModal(
    folderName,
    [
      {
        label: "Rename",
        action: () => {
          closeModal("#actionModal");
          openRenameFolderModal(folderName);
        }
      },
      {
        label: "Delete",
        danger: true,
        action: () => {
          closeModal("#actionModal");
          deleteFolder(folderName);
        }
      }
    ]
  );
}

function openRenameFolderModal(folderName) {
  editingFolderName = folderName;

  const title = $("#folderModalTitle");
  const input = $("#folderNameInput");

  if (title) {
    title.textContent = "Rename folder";
  }

  if (input) {
    input.value = folderName;
  }

  openModal("#folderModal");

  setTimeout(() => {
    input?.focus();
    input?.select();
  }, 50);
}

function deleteFolder(folderName) {
  if (store.folders.length <= 1) {
    alert("You need at least one folder.");
    return;
  }

  const destination = store.folders.find(
    (folder) => folder !== folderName
  );

  const affectedSongs = store.songs.filter(
    (song) => song.folder === folderName
  );

  const songCount = affectedSongs.length;

  const message = songCount > 0
    ? `${songCount} song${songCount > 1 ? "s" : ""} in "${folderName}" will be moved to "${destination}" before this folder is deleted.`
    : `Delete the folder "${folderName}"?`;

  openConfirmModal(
    "Delete Folder",
    message,
    "Delete Folder",
    () => {

      if (songCount > 0) {
        store.songs.forEach((song) => {
          if (song.folder === folderName) {
            song.folder = destination;
          }
        });
      }

      store.folders = store.folders.filter(
        (folder) => folder !== folderName
      );

      save();

      if (currentFolder === folderName) {
        currentFolder = null;
        navigate("songs");
      }

      updateCounts();
      renderFolders();
      renderSongs();

      toast("Folder deleted");
    }
  );
}

$("#saveFolderBtn")?.addEventListener("click", () => {
  const name = $("#folderNameInput").value.trim();

  if (!name) {
    alert("Enter a folder name.");
    return;
  }

  const duplicate = store.folders.some(
    (folder) =>
      normalize(folder) === normalize(name) &&
      folder !== editingFolderName
  );

  if (duplicate) {
    alert("A folder with that name already exists.");
    return;
  }

  if (editingFolderName) {
    store.songs.forEach((song) => {
      if (song.folder === editingFolderName) {
        song.folder = name;
      }
    });

    const index = store.folders.indexOf(editingFolderName);

    if (index !== -1) {
      store.folders[index] = name;
    }

    if (currentFolder === editingFolderName) {
      currentFolder = name;
    }
  } else {
    store.folders.push(name);
  }

  save();

  closeModal("#folderModal");

  editingFolderName = null;

  updateCounts();
  renderSongs();

  if (currentFolder) {
    $("#folderPageTitle").textContent = currentFolder;
    renderCurrentFolder();
  }
});

$("#cancelFolderModalBtn")?.addEventListener("click", () => {
  closeModal("#folderModal");
});

$("#closeFolderModalBtn")?.addEventListener("click", () => {
  closeModal("#folderModal");
});

/* =========================================================
   MODAL HELPERS
   ========================================================= */

function openModal(selector) {
  document.querySelector(selector)?.classList.add("open");
}

function closeModal(selector) {
  document.querySelector(selector)?.classList.remove("open");
}

function closeAllModals() {
  document
    .querySelectorAll(".modal.open")
    .forEach((modal) => modal.classList.remove("open"));
}

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("open");
    }
  });
});

/* =========================================================
   ADD / EDIT SONG
   ========================================================= */

const addModal = $("#addModal");

const titleInput = $("#songTitleInput");
const artistInput = $("#origArtistInput");
const keyInput = $("#origKeyInput");
const churchKeyInput = $("#churchKeyInput");
const leaderInput = $("#worshipLeaderInput");
const folderInput = $("#songFolderInput");
const referenceInput = $("#referenceLinkInput");
const contentInput = $("#songContentInput");

function populateFolderSelect(selectElement, selectedValue) {
  if (!selectElement) return;

  selectElement.innerHTML = "";

  store.folders.forEach((folder) => {
    const option = document.createElement("option");

    option.value = folder;
    option.textContent = folder;

    if (folder === selectedValue) {
      option.selected = true;
    }

    selectElement.appendChild(option);
  });
}

function resetSongForm() {
  titleInput.value = "";
  artistInput.value = "";
  keyInput.value = "";
  churchKeyInput.value = "";
  leaderInput.value = "";
  referenceInput.value = "";
  contentInput.value = "";

  populateFolderSelect(
    folderInput,
    store.folders[0] || "General"
  );
}

function openAddSongModal() {
  editingSongId = null;

  $("#songModalTitle").textContent =
    "Add new song";

  resetSongForm();

  /*
   * If the user is currently inside a folder,
   * automatically select that folder and lock
   * the destination to the current folder.
   *
   * Otherwise keep the normal folder selector.
   */
  if (currentFolder) {
    populateFolderSelect(
      folderInput,
      currentFolder
    );

    folderInput.disabled = true;
  } else {
    folderInput.disabled = false;
  }

  openModal("#addModal");
}

function openEditSongModal(song) {
  editingSongId = song.id;

  $("#songModalTitle").textContent = "Edit song";

  titleInput.value = song.title || "";
  artistInput.value = song.artist || "";
  keyInput.value = song.origKey || song.key || "";
  churchKeyInput.value = song.churchKey || "";
  leaderInput.value = song.leader || "";
  referenceInput.value = song.referenceLink || "";
  contentInput.value = song.content || "";

  populateFolderSelect(
    folderInput,
    song.folder || store.folders[0]
  );

  /*
   * Editing a song must always allow the user
   * to change its destination folder.
   */
  folderInput.disabled = false;

  openModal("#addModal");
}

$("#addSongBtn")?.addEventListener(
  "click",
  openAddSongModal
);

$("#closeModalBtn")?.addEventListener(
  "click",
  () => closeModal("#addModal")
);

$("#cancelBtn")?.addEventListener(
  "click",
  () => closeModal("#addModal")
);

$("#saveSongBtn")?.addEventListener("click", () => {
  const title = titleInput.value.trim();

  if (!title) {
    alert("Please enter a song title.");
    titleInput.focus();
    return;
  }

  /*
   * IMPORTANT:
   * If Add Song was opened while inside a folder,
   * that current folder wins.
   *
   * This prevents the new song from accidentally
   * going to the first/default folder.
   */
  const targetFolder =
    currentFolder ||
    folderInput.value ||
    store.folders[0] ||
    "General";

  const songData = {
    title,
    artist: artistInput.value.trim(),
    origKey: keyInput.value.trim(),
    churchKey: churchKeyInput.value.trim(),
    leader: leaderInput.value.trim(),
    folder: targetFolder,
    referenceLink: referenceInput.value.trim(),
    content: contentInput.value,
    updatedAt: Date.now()
  };

  if (editingSongId !== null) {
    const index = store.songs.findIndex(
      (song) =>
        String(song.id) ===
        String(editingSongId)
    );

    if (index !== -1) {
      store.songs[index] = {
        ...store.songs[index],
        ...songData
      };

      if (
        viewingSong &&
        String(viewingSong.id) ===
        String(editingSongId)
      ) {
        viewingSong = store.songs[index];
      }
    }
  } else {
    store.songs.unshift({
      id: Date.now(),
      ...songData,
      createdAt: Date.now()
    });
  }

  save();

  closeModal("#addModal");

  editingSongId = null;

  updateCounts();
  renderFolders();

  if (currentFolder) {
    renderCurrentFolder();
    updateFolderSelectionBar();
  } else {
    renderSongs(
      $("#searchInput")?.value || ""
    );
  }

  if (viewingSong) {
    const updatedSong =
      store.songs.find(
        (song) =>
          String(song.id) ===
          String(viewingSong.id)
      );

    if (updatedSong) {
      openViewer(updatedSong, false);
    }
  }
});

/* =========================================================
   SEARCH
   ========================================================= */

$("#searchInput")?.addEventListener("input", (event) => {
  renderSongs(event.target.value);
});

$("#chordSearchInput")?.addEventListener("input", (event) => {
  renderChords(event.target.value);
});

/* CHORDIPOT SEARCH KEYBOARD BEHAVIOR */

function hideChordipotKeyboard() {
  const active =
    document.activeElement;

  if (
    active &&
    (
      active.id === "searchInput" ||
      active.id === "chordSearchInput"
    )
  ) {
    active.blur();
  }
}

["searchInput", "chordSearchInput"].forEach((id) => {

  const input = document.getElementById(id);

  if (!input) {
    return;
  }

  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === "Search" ||
        event.key === "Go" ||
        event.key === "Done"
      ) {
        event.preventDefault();
        hideChordipotKeyboard();
      }

    }
  );

});

document.addEventListener(
  "click",
  (event) => {

    const target = event.target;

    const searchBar =
      target.closest(".search-bar");

    if (searchBar) {
      return;
    }

    const active =
      document.activeElement;

    if (
      active &&
      (
        active.id === "searchInput" ||
        active.id === "chordSearchInput"
      )
    ) {
      hideChordipotKeyboard();
    }

  },
  true
);

function songMatches(song, query) {
  const text = [
    song.title,
    song.artist,
    song.origKey,
    song.key,
    song.churchKey,
    song.leader,
    song.folder,
    song.content
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(normalize(query));
}

/* =========================================================
   SONG CARDS
   ========================================================= */

function createSongCard(song, options = {}) {
  const card = document.createElement("div");

  card.className = "song-card";

  const selectedSet =
    options.selectionSet || selectedSongs;

  if (selectedSet.has(song.id)) {
    card.classList.add("selected");
  }

  const favorite = store.favorites.includes(song.id);

  const originalKey =
    song.origKey || song.key || "—";

  const churchKey =
    song.churchKey || "—";

  card.innerHTML = `
    <div class="song-card-main">

      <div class="song-card-title">
        ${escapeHTML(song.title)}
        ${favorite ? '<span class="favorite-mark">♥</span>' : ""}
      </div>

      <div class="song-card-artist">
        ${escapeHTML(song.artist || "Unknown artist")}
      </div>

      <div class="song-card-meta">
        <span>Orig: ${escapeHTML(originalKey)}</span>
        <span>Church: ${escapeHTML(churchKey)}</span>
        ${
          song.leader
            ? `<span>By: ${escapeHTML(song.leader)}</span>`
            : ""
        }
        ${
          song.folder
            ? `<span>${escapeHTML(song.folder)}</span>`
            : ""
        }
      </div>

    </div>

    <span class="song-card-arrow">›</span>
  `;

  const openSong = () => {
    if (longPressTriggered) {
      longPressTriggered = false;
      return;
    }

    if (options.selectionMode) {
      toggleSongSelection(
        song.id,
        selectedSet,
        card,
        options.selectionCallback
      );

      return;
    }

    openViewer(song);
  };

  card.addEventListener("click", openSong);

  attachLongPress(card, () => {
    longPressTriggered = true;

    if (options.selectionMode) {
      toggleSongSelection(
        song.id,
        selectedSet,
        card,
        options.selectionCallback
      );

      return;
    }

    openSongAction(song);
  });

  return card;
}

/* =========================================================
   LONG PRESS
   ========================================================= */

function attachLongPress(element, callback) {
  let timer = null;
  let fired = false;

  const start = (event) => {
    if (event.type === "mousedown" && event.button !== 0) {
      return;
    }

    fired = false;

    timer = setTimeout(() => {
      fired = true;
      longPressTriggered = true;
      callback();
    }, 550);
  };

  const cancel = () => {
    clearTimeout(timer);
  };

  element.addEventListener("touchstart", start, {
    passive: true
  });

  element.addEventListener("touchend", cancel);

  element.addEventListener("touchmove", cancel);

  element.addEventListener("touchcancel", cancel);

  element.addEventListener("mousedown", start);

  element.addEventListener("mouseup", cancel);

  element.addEventListener("mouseleave", cancel);

  element.addEventListener("contextmenu", (event) => {
    if (fired) {
      event.preventDefault();
    }
  });
}

/* =========================================================
   MY SONGS
   ========================================================= */

function renderSongs(filter = "") {
  const list = $("#songList");
  const empty = $("#emptyState");

  if (!list || !empty) return;

  list.innerHTML = "";

  const filtered = store.songs.filter((song) =>
    songMatches(song, filter)
  );

  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  filtered.forEach((song) => {
    list.appendChild(
      createSongCard(song, {
        selectionMode: selectedSongs.size > 0,
        selectionSet: selectedSongs,
        selectionCallback: updateSongSelectionBar
      })
    );
  });

  updateSongSelectionBar();
}

/* =========================================================
   SONG ACTIONS
   ========================================================= */

function getSongActionContext() {
  if (currentFolder && $("#page-folder")?.classList.contains("active")) {
    return "folder";
  }

  if ($("#page-fav")?.classList.contains("active")) {
    return "favorites";
  }

  if ($("#page-history")?.classList.contains("active")) {
    return "history";
  }

  return "songs";
}

function getContextSongs() {
  const context = getSongActionContext();

  if (context === "folder") {
    return store.songs.filter(
      (song) =>
        (song.folder || "General") === currentFolder
    );
  }

  if (context === "favorites") {
    return store.favorites
      .map((id) =>
        store.songs.find(
          (song) => String(song.id) === String(id)
        )
      )
      .filter(Boolean);
  }

  if (context === "history") {
    return store.history
      .map((id) =>
        store.songs.find(
          (song) => String(song.id) === String(id)
        )
      )
      .filter(Boolean);
  }

  const query = $("#searchInput")?.value || "";

  return store.songs.filter((song) =>
    songMatches(song, query)
  );
}

function selectAllCurrentContext() {
  const context = getSongActionContext();
  const songs = getContextSongs();

  if (context === "folder") {
    folderSelectionMode = true;
    selectedFolderSongs.clear();

    songs.forEach((song) => {
      selectedFolderSongs.add(song.id);
    });

    renderCurrentFolder();
    updateFolderSelectionBar();
    return;
  }

  selectedSongs.clear();

  songs.forEach((song) => {
    selectedSongs.add(song.id);
  });

  if (context === "favorites") {
    renderFavorites();
  } else if (context === "history") {
    renderHistory();
  } else {
    renderSongs($("#searchInput")?.value || "");
  }

  updateSongSelectionBar();
}

function unselectAllCurrentContext() {
  const context = getSongActionContext();

  if (context === "folder") {
    selectedFolderSongs.clear();
    folderSelectionMode = false;

    renderCurrentFolder();
    updateFolderSelectionBar();
    return;
  }

  selectedSongs.clear();

  if (context === "favorites") {
    renderFavorites();
  } else if (context === "history") {
    renderHistory();
  } else {
    renderSongs($("#searchInput")?.value || "");
  }

  updateSongSelectionBar();
}

function renderCurrentSongContext() {
  const context = getSongActionContext();

  if (context === "folder") {
    renderCurrentFolder();
    updateFolderSelectionBar();
  } else if (context === "favorites") {
    renderFavorites();
    updateSongSelectionBar();
  } else if (context === "history") {
    renderHistory();
    updateSongSelectionBar();
  } else {
    renderSongs($("#searchInput")?.value || "");
    updateSongSelectionBar();
  }
}

function openSongAction(song) {
  const context = getSongActionContext();
  const inCurrentFolder = context === "folder";

  const actions = [
    {
      label: "Select",
      action: () => {
        closeModal("#actionModal");

        if (inCurrentFolder) {
          startFolderSelection(song.id);
        } else {
          startSelectionWithSong(song.id);
        }
      }
    },
    {
      label: "Edit",
      action: () => {
        closeModal("#actionModal");
        openEditSongModal(song);
      }
    },
    {
      label: "Move to Folder",
      action: () => {
        closeModal("#actionModal");

        if (inCurrentFolder) {
          selectedFolderSongs.clear();
          selectedFolderSongs.add(song.id);
          folderSelectionMode = true;

          openMoveModal(true);
        } else {
          selectedSongs.clear();
          selectedSongs.add(song.id);

          openMoveModal(false);
        }
      }
    },
    {
      label: isFavorite(song.id)
        ? "Remove from Favorite"
        : "Add to Favorite",
      action: () => {
        closeModal("#actionModal");

        toggleFavorite(song.id);

        renderCurrentSongContext();
      }
    },
    {
      label: "Delete",
      danger: true,
      action: () => {
        closeModal("#actionModal");

        if (inCurrentFolder) {
          openConfirmModal(
            "Delete song?",
            `"${song.title}" will be permanently deleted.`,
            "Delete",
            () => {
              const id = song.id;

              store.songs =
                store.songs.filter(
                  (item) =>
                    String(item.id) !== String(id)
                );

              store.favorites =
                store.favorites.filter(
                  (item) =>
                    String(item) !== String(id)
                );

              store.history =
                store.history.filter(
                  (item) =>
                    String(item) !== String(id)
                );

              selectedFolderSongs.delete(id);

              save();

              updateCounts();
              renderFolders();
              renderCurrentFolder();
              updateFolderSelectionBar();

              toast("Song deleted");
            }
          );
        } else {
          deleteSongs([song.id]);
        }
      }
    }
  ];

  openActionModal(song.title, actions);
}/* =========================================================
   SONG CONTEXT HELPERS
   ========================================================= */

/* =========================================================
   SONG SELECTION
   ========================================================= */

function toggleSongSelection(
  id,
  set = selectedSongs,
  card = null,
  callback = updateSongSelectionBar
) {
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }

  if (set === selectedFolderSongs) {
    renderCurrentFolder();
    updateFolderSelectionBar();
    return;
  }

  if (card) {
    card.classList.toggle(
      "selected",
      set.has(id)
    );
  }

  callback();

  renderCurrentSongContext();
  updateSongSelectionBar();
}

function startSelectionWithSong(id) {
  selectedSongs.clear();
  selectedSongs.add(id);

  renderCurrentSongContext();
  updateSongSelectionBar();
}

function updateSongSelectionBar() {
  const bar = $("#songSelectionBar");

  if (!bar) return;

  const active = selectedSongs.size > 0;

  bar.classList.toggle("hidden", !active);

  const count = $("#selectedCount");

  if (count) {
    count.textContent =
      `${selectedSongs.size} selected`;
  }

  let selectAllBtn = $("#selectAllSongsBtn");
  let unselectAllBtn = $("#unselectAllSongsBtn");

  if (selectAllBtn && !unselectAllBtn) {
    unselectAllBtn = document.createElement("button");

    unselectAllBtn.type = "button";
    unselectAllBtn.id = "unselectAllSongsBtn";
    unselectAllBtn.className =
      selectAllBtn.className;

    unselectAllBtn.textContent = "Unselect All";

    selectAllBtn.insertAdjacentElement(
      "afterend",
      unselectAllBtn
    );

    unselectAllBtn.addEventListener(
      "click",
      () => {
        selectedSongs.clear();

        renderCurrentSongContext();
        updateSongSelectionBar();
      }
    );
  }

  if (selectAllBtn) {
    selectAllBtn.style.display =
      active ? "" : "none";
  }

  if (unselectAllBtn) {
    unselectAllBtn.style.display =
      active ? "" : "none";
  }

  if (active) {
    document
      .querySelectorAll(".song-card")
      .forEach((card) => {
        const title =
          card.querySelector(".song-card-title");

        if (!title) return;

        const song = store.songs.find(
          (item) =>
            normalize(item.title) ===
            normalize(
              title.textContent.replace("♥", "")
            )
        );

        if (song) {
          card.classList.toggle(
            "selected",
            selectedSongs.has(song.id)
          );
        }
      });
  }
}

function startSelectionMode() {
  if (!store.songs.length) return;

  if (!selectedSongs.size) {
    selectedSongs.add(store.songs[0].id);
  }

  renderCurrentSongContext();
  updateSongSelectionBar();
}

$("#selectAllSongsBtn")?.addEventListener("click", () => {
  selectAllCurrentContext();
});

$("#cancelSelectionBtn")?.addEventListener("click", () => {
  selectedSongs.clear();

  renderCurrentSongContext();
  updateSongSelectionBar();
});

$("#deleteSelectedBtn")?.addEventListener("click", () => {
  if (!selectedSongs.size) return;

  deleteSongs([...selectedSongs]);
});

$("#moveSelectedBtn")?.addEventListener("click", () => {
  if (!selectedSongs.size) return;

  openMoveModal();
});

/* =========================================================
   DELETE SONGS
   ========================================================= */

function deleteSongs(ids) {
  if (!ids.length) return;

  openConfirmModal(
    "Delete song?",
    `Delete ${ids.length} song${ids.length > 1 ? "s" : ""}?`,
    "Delete",
    () => {
      const idSet = new Set(
        ids.map((id) => String(id))
      );

      store.songs = store.songs.filter(
        (song) => !idSet.has(String(song.id))
      );

      store.favorites = store.favorites.filter(
        (id) => !idSet.has(String(id))
      );

      store.history = store.history.filter(
        (id) => !idSet.has(String(id))
      );

      selectedSongs.clear();

      save();

      updateCounts();

      renderCurrentSongContext();
      updateSongSelectionBar();
    }
  );
}

/* =========================================================
   MOVE SONGS
   ========================================================= */

let folderMoveMode = false;

function openMoveModal(isFolderMove = false) {
  folderMoveMode = isFolderMove;

  const sourceSet =
    folderMoveMode
      ? selectedFolderSongs
      : selectedSongs;

  if (!sourceSet.size) {
    folderMoveMode = false;
    return;
  }

  let defaultFolder = store.folders[0];

  if (folderMoveMode && currentFolder) {
    const otherFolder = store.folders.find(
      (folder) => folder !== currentFolder
    );

    if (!otherFolder) {
      toast("Create another folder first");
      folderMoveMode = false;
      return;
    }

    defaultFolder = otherFolder;
  }

  populateFolderSelect(
    $("#moveFolderInput"),
    defaultFolder
  );

  if (
    folderMoveMode &&
    currentFolder
  ) {
    const select = $("#moveFolderInput");

    if (select) {
      Array.from(select.options).forEach(
        (option) => {
          option.disabled =
            option.value === currentFolder;
        }
      );

      if (select.value === currentFolder) {
        const next = Array.from(
          select.options
        ).find(
          (option) =>
            !option.disabled
        );

        if (next) {
          select.value = next.value;
        }
      }
    }
  }

  openModal("#moveModal");
}

function cancelMoveModal() {
  selectedSongs.clear();
  selectedFolderSongs.clear();
  folderMoveMode = false;

  closeModal("#moveModal");

  if (currentFolder) {
    renderCurrentFolder();
    updateFolderSelectionBar();
  } else {
    renderSongs($("#searchInput")?.value || "");
    updateSongSelectionBar();
  }
}

$("#closeMoveModalBtn")?.addEventListener("click", cancelMoveModal);
$("#cancelMoveBtn")?.addEventListener("click", cancelMoveModal);

$("#confirmMoveBtn")?.addEventListener("click", () => {
  const destination =
    $("#moveFolderInput")?.value;

  if (!destination) return;

  const sourceSet =
    folderMoveMode
      ? selectedFolderSongs
      : selectedSongs;

  if (!sourceSet.size) return;

  if (
    folderMoveMode &&
    currentFolder &&
    destination === currentFolder
  ) {
    toast("Choose another folder");
    return;
  }

  const ids = new Set(
    [...sourceSet].map(
      (id) => String(id)
    )
  );

  store.songs.forEach((song) => {
    if (ids.has(String(song.id))) {
      song.folder = destination;
    }
  });

  sourceSet.clear();

  const wasFolderMove = folderMoveMode;

  folderMoveMode = false;

  save();

  closeModal("#moveModal");

  updateCounts();
  renderFolders();

  if (wasFolderMove && currentFolder) {
    renderCurrentFolder();
    updateFolderSelectionBar();

    toast(
      `${ids.size} song${ids.size > 1 ? "s" : ""} moved to "${destination}"`
    );
  } else {
    renderCurrentSongContext();
    updateSongSelectionBar();

    toast(
      `${ids.size} song${ids.size > 1 ? "s" : ""} moved to "${destination}"`
    );
  }
});

/* =========================================================
   FAVORITES
   ========================================================= */

function isFavorite(songId) {
  return store.favorites.includes(songId);
}

function toggleFavorite(songId) {
  if (isFavorite(songId)) {
    store.favorites = store.favorites.filter(
      (id) => id !== songId
    );
  } else {
    store.favorites.push(songId);
  }

  save();

  updateCounts();

  renderSongs($("#searchInput")?.value || "");
  renderFavorites();

  if (viewingSong?.id === songId) {
    updateViewerFavoriteButton();
  }
}

function renderFavorites() {
  const list = $("#favoriteList");
  const empty = $("#favoriteEmpty");

  if (!list || !empty) return;

  list.innerHTML = "";

  const songs = store.favorites
    .map((id) =>
      store.songs.find((song) => song.id === id)
    )
    .filter(Boolean);

  if (!songs.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  songs.forEach((song) => {
    list.appendChild(
      createSongCard(song, {
        selectionMode: selectedSongs.size > 0,
        selectionSet: selectedSongs,
        selectionCallback: updateSongSelectionBar
      })
    );
  });

  updateSongSelectionBar();
}

function updateViewerFavoriteButton() {
  const button = $("#favoriteViewerBtn");

  if (!button || !viewingSong) return;

  button.textContent = isFavorite(viewingSong.id)
    ? "♥"
    : "♡";
}

$("#favoriteViewerBtn")?.addEventListener("click", () => {
  if (!viewingSong) return;

  toggleFavorite(viewingSong.id);
});

/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(songId) {
  store.history = store.history.filter(
    (id) => id !== songId
  );

  store.history.unshift(songId);

  store.history = store.history.slice(0, 50);

  save();

  updateCounts();
}

function renderHistory() {
  const list = $("#historyList");
  const empty = $("#historyEmpty");

  if (!list || !empty) return;

  list.innerHTML = "";

  const songs = store.history
    .map((id) =>
      store.songs.find((song) => song.id === id)
    )
    .filter(Boolean);

  if (!songs.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  songs.forEach((song) => {
    list.appendChild(
      createSongCard(song, {
        selectionMode: selectedSongs.size > 0,
        selectionSet: selectedSongs,
        selectionCallback: updateSongSelectionBar
      })
    );
  });

  updateSongSelectionBar();
}

$("#clearHistoryBtn")?.addEventListener("click", () => {
  if (!store.history.length) return;

  openConfirmModal(
    "Clear history?",
    "All song history will be permanently cleared.",
    "Clear",
    () => {
      store.history = [];

      save();

      updateCounts();
      renderHistory();
    }
  );
});

/* =========================================================
   VIEWER
   ========================================================= */

const pageViewer = $("#page-viewer");
const viewTitle = $("#viewTitle");
const viewMeta = $("#viewMeta");
const lyricsEl = $("#lyrics");

function openViewer(song, addToHistory = true) {
  viewerReturnFolder = currentFolder;

  if ($("#page-folder")?.classList.contains("active")) {
    viewerReturnPage = "folder";
  } else if ($("#page-fav")?.classList.contains("active")) {
    viewerReturnPage = "fav";
  } else if ($("#page-history")?.classList.contains("active")) {
    viewerReturnPage = "history";
  } else {
    viewerReturnPage = "songs";
  }

  viewingSong = song;
  transpose = 0;

  $("#transposeLabel").textContent = "0";

  viewTitle.textContent = song.title;

  const originalKey =
    song.origKey || song.key || "—";

  const churchKey =
    song.churchKey || "—";

  viewMeta.innerHTML = `
    <span class="count">
      ${escapeHTML(song.artist || "Unknown artist")}
    </span>

    <span class="count">
      Orig: ${escapeHTML(originalKey)}
    </span>

    <span class="count">
      Church: ${escapeHTML(churchKey)}
    </span>

    ${
      song.leader
        ? `
          <span class="count">
            By: ${escapeHTML(song.leader)}
          </span>
        `
        : ""
    }

    ${
      song.folder
        ? `
          <span class="count">
            ${escapeHTML(song.folder)}
          </span>
        `
        : ""
    }
  `;

  renderSongContent();

  updateViewerFavoriteButton();

  if (addToHistory) {
    addHistory(song.id);
  }

  navigate("viewer");

  pageViewer.scrollTop = 0;
}

function closeViewerState() {
  if (!$("#page-viewer")?.classList.contains("active")) {
    viewingSong = null;
  }
}

function closeViewer() {
  viewingSong = null;

  const returnFolder = viewerReturnFolder;
  const returnPage = viewerReturnPage;

  viewerReturnFolder = null;
  viewerReturnPage = "songs";

  if (returnPage === "folder" && returnFolder) {
    currentFolder = returnFolder;
    navigate("folder");
    updateFolderSelectionBar();
  } else if (returnPage === "fav") {
    currentFolder = null;
    navigate("fav");
  } else if (returnPage === "history") {
    currentFolder = null;
    navigate("history");
  } else {
    currentFolder = null;
    navigate("songs");
  }
}

$("#backBtn")?.addEventListener(
  "click",
  closeViewer
);

/* CHORDIPOT ANDROID BACK BRIDGE */

window.handleAndroidBack = function() {

  const viewer =
    $("#page-viewer");

  if (
    viewer &&
    viewer.classList.contains("active")
  ) {
    closeViewer();

    return true;
  }

  return false;
};

$("#editSongBtn")?.addEventListener("click", () => {
  if (!viewingSong) return;

  openEditSongModal(viewingSong);
});

function renderSongContent() {
  if (!viewingSong) return;

  const content = viewingSong.content || "";

  // Keep the existing 3-newline separation exactly as it is.
  const blocks = content.split("\n \n \n");

  const renderedBlocks = blocks.map((block) => {
    const lines = block.split("\n");

    return lines
      .map((line) => {
        const html = escapeHTML(line).replace(
          /&lt;([^&<>]+)&gt;/g,
          (match, chord) => {
            const originalChord = chord.trim();

            const displayChord = transposeChord(
              originalChord,
              transpose
            );

/*            return `
              <span
                class="chord"
                data-chord="${escapeHTML(originalChord)}"
                title="View chord"
              >${escapeHTML(displayChord)}</span>
            `;*/
/*            return `<span class="chord" data-chord="${escapeHTML(originalChord)}" title="View chord">${escapeHTML(displayChord)}</span>`; */
              return `<span class="chord" data-chord="${escapeHTML(displayChord)}" title="View chord"><span class="chord-hidden">&lt;</span>${escapeHTML(displayChord)}<span class="chord-hidden">&gt;</span></span>`;
          }
        );

/*        return `
          <div class="lyrics-line">
            ${html || "&nbsp;"}
          </div>
        `;*/
        return `<div class="lyrics-line">${html || "&nbsp;"}</div>`;
      })
      .join("");
  });

  lyricsEl.innerHTML = renderedBlocks.join("");

  lyricsEl.querySelectorAll(".chord").forEach((chordEl) => {
    chordEl.addEventListener("click", (event) => {
      event.stopPropagation();

      openChordViewer(
        chordEl.dataset.chord
      );
    });
  });
}

/* =========================================================
   TRANSPOSE
   ========================================================= */

const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11
};

const NOTES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

function transposeChord(chord, amount) {
  if (!chord || !amount) return chord;

  const parts = String(chord).trim().split("/");

  // Main chord: A, Am7, C#maj7, etc.
  const mainChord = parts[0].trim();

  // Bass note of slash chord: C#, Bb, etc.
  const bassNote = parts.length > 1
    ? parts[1].trim()
    : null;

  function transposeNote(note, steps) {
    const match = String(note).match(/^([A-Ga-g](?:#|b)?)(.*)$/);

    if (!match) return note;

    const root = match[1];
    const suffix = match[2] || "";

    if (NOTE_INDEX[root] === undefined) {
      return note;
    }

    let nextIndex =
      (NOTE_INDEX[root] + steps) % 12;

    if (nextIndex < 0) {
      nextIndex += 12;
    }

    return NOTES_SHARP[nextIndex] + suffix;
  }

  // Transpose the main chord.
  const transposedMain =
    transposeNote(mainChord, amount);

  // Normal chord: A, Bm7, C#maj7
  if (!bassNote) {
    return transposedMain;
  }

  // Slash chord: transpose the bass note too.
  const transposedBass =
    transposeNote(bassNote, amount);

  return `${transposedMain}/${transposedBass}`;
}

$("#transposeDown")?.addEventListener("click", () => {
  if (transpose > -6) {
    transpose--;
    renderSongContent();}

  $("#transposeLabel").textContent =
    transpose > 0 ? `+${transpose}` : `${transpose}`;

  renderSongContent();
});

$("#transposeUp")?.addEventListener("click", () => {
  if (transpose < 6) {
    transpose++;
    renderSongContent();}

  $("#transposeLabel").textContent =
    transpose > 0 ? `+${transpose}` : `${transpose}`;

  renderSongContent();
});

$("#transposeReset")?.addEventListener("click", () => {
  transpose = 0;

  $("#transposeLabel").textContent = "0";

  renderSongContent();
});


function openConfirmModal(title, message, confirmText, onConfirm) {
  const existing = document.querySelector("#confirmModal");

  if (existing) {
    existing.remove();
  }

  const modal = document.createElement("div");

  modal.id = "confirmModal";
  modal.className = "modal";

  modal.innerHTML = `
    <div class="confirm-modal-box">

      <div class="confirm-modal-header">
        <b>${escapeHTML(title)}</b>

        <button
          type="button"
          class="confirm-close-btn"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div class="confirm-modal-body">

        <div class="confirm-icon">
          !
        </div>

        <div class="confirm-message">
          ${escapeHTML(message)}
        </div>

      </div>

      <div class="confirm-modal-footer">

        <button
          type="button"
          class="confirm-cancel-btn"
        >
          Cancel
        </button>

        <button
          type="button"
          class="confirm-danger-btn"
        >
          ${escapeHTML(confirmText)}
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove("open");

    setTimeout(() => {
      modal.remove();
    }, 160);
  };

  modal
    .querySelector(".confirm-close-btn")
    ?.addEventListener("click", close);

  modal
    .querySelector(".confirm-cancel-btn")
    ?.addEventListener("click", close);

  modal
    .querySelector(".confirm-danger-btn")
    ?.addEventListener("click", () => {
      close();

      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close();
    }
  });

  requestAnimationFrame(() => {
    modal.classList.add("open");
  });
}

/* =========================================================
   CHORD LIBRARY
   ========================================================= */

function renderChords(filter = "") {
  const list = $("#chordsList");
  const empty = $("#chordEmpty");

  if (!list || !empty) return;

  list.innerHTML = "";

  const query = normalize(filter);

  const chords = store.chords.filter((chord) => {
    return (
      normalize(chord.name).includes(query) ||
      normalize(chord.type).includes(query) ||
      normalize(chord.tab).includes(query)
    );
  });

  if (!chords.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  chords.forEach((chord) => {
    const card = document.createElement("div");

    card.className = "chord-card";

    const displayName = formatChordName(chord.name);

    card.innerHTML = `
      <div class="chord-card-top">

        <span class="chord-card-name">
          ${escapeHTML(displayName)}
        </span>

        <button
          class="chord-card-edit"
          type="button"
          aria-label="Edit chord"
        >
          ✎
        </button>

      </div>

      <div class="chord-card-tab">
        ${escapeHTML(chord.tab || "")}
      </div>

      <div class="chord-card-type">
        ${escapeHTML(chord.type || "Chord")}
      </div>
    `;

    card.addEventListener("click", (event) => {
      if (event.target.closest(".chord-card-edit")) {
        return;
      }

      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }

      openChordViewer(chord.name);
    });

    card
      .querySelector(".chord-card-edit")
      .addEventListener("click", (event) => {
        event.stopPropagation();
        openChordEdit(chord);
      });

    attachLongPress(card, () => {
      openActionModal(
        displayName,
        [
          {
            label: "Edit",
            action: () => {
              closeModal("#actionModal");
              openChordEdit(chord);
            }
          },
          {
            label: "Delete",
            danger: true,
            action: () => {
              closeModal("#actionModal");

              openConfirmModal(
                "Delete chord?",
                `"${displayName}" will be permanently removed from the chord library.`,
                "Delete",
                () => {
                  store.chords = store.chords.filter(
                    (item) => item.id !== chord.id
                  );

                  save();

                  renderChords(
                    $("#chordSearchInput")?.value || ""
                  );
                }
              );
            }
          }
        ]
      );
    });

    list.appendChild(card);
  });
}

function findChord(name) {
  const wanted = normalize(name);

  return (
    store.chords.find(
      (chord) => normalize(chord.name) === wanted
    ) || generateChordFallback(name)
  );
}

function generateChordFallback(name) {
  const match = String(name || "").match(
    /^([A-G](?:#|b)?)(.*)$/
  );

  if (!match) {
    return null;
  }

  const root = match[1];
  const suffix = match[2] || "";

  const quality =
    CHORD_QUALITIES.find(
      (item) => item === suffix
    ) || suffix;

  return {
    id: `generated-${normalize(name)}`,
    name,
    type: quality || "Major",
    strings: ["—", "—", "—", "—", "—", "—"],
    tab: "Not in library"
  };
}

function openChordViewer(name) {
  const chord = findChord(name);

  if (!chord) {
    alert("Chord not found.");
    return;
  }

  const displayName = formatChordName(chord.name);

  $("#chordModalTitle").textContent =
    displayName;

  $("#chordModalContent").innerHTML = `
    <div class="chord-big-name">
      ${escapeHTML(displayName)}
    </div>

    <div class="chord-tab-grid">

      <div class="chord-string-row">
        <span>E -</span>
        <strong>${escapeHTML(chord.strings?.[0] || "—")}</strong>
      </div>

      <div class="chord-string-row">
        <span>A -</span>
        <strong>${escapeHTML(chord.strings?.[1] || "—")}</strong>
      </div>

      <div class="chord-string-row">
        <span>D -</span>
        <strong>${escapeHTML(chord.strings?.[2] || "—")}</strong>
      </div>

      <div class="chord-string-row">
        <span>G -</span>
        <strong>${escapeHTML(chord.strings?.[3] || "—")}</strong>
      </div>

      <div class="chord-string-row">
        <span>B -</span>
        <strong>${escapeHTML(chord.strings?.[4] || "—")}</strong>
      </div>

      <div class="chord-string-row">
        <span>e -</span>
        <strong>${escapeHTML(chord.strings?.[5] || "—")}</strong>
      </div>

    </div>

    <div class="chord-tab-format">
      ${escapeHTML(chord.tab || "—")}
    </div>
  `;

  $("#editChordFromViewerBtn")?.addEventListener(
    "click",
    () => {
      closeModal("#chordModal");
      openChordEdit(chord);
    }
  );

  openModal("#chordModal");
}

$("#closeChordModalBtn")?.addEventListener(
  "click",
  () => closeModal("#chordModal")
);

/* =========================================================
   ADD / EDIT CHORD
   ========================================================= */

function openChordEdit(chord = null) {
  editingChordId = chord?.id || null;

  $("#chordEditTitle").textContent =
    chord ? "Edit chord" : "Add chord";

  $("#chordNameInput").value =
    chord?.name || "";

  $("#chordE1").value =
    chord?.strings?.[0] || "";

  $("#chordA").value =
    chord?.strings?.[1] || "";

  $("#chordD").value =
    chord?.strings?.[2] || "";

  $("#chordG").value =
    chord?.strings?.[3] || "";

  $("#chordB").value =
    chord?.strings?.[4] || "";

  $("#chordE2").value =
    chord?.strings?.[5] || "";

  $("#chordTabInput").value =
    chord?.tab || "";

  openModal("#chordEditModal");
}

$("#addChordBtn")?.addEventListener(
  "click",
  () => openChordEdit()
);

$("#closeChordEditBtn")?.addEventListener(
  "click",
  () => closeModal("#chordEditModal")
);

$("#cancelChordEditBtn")?.addEventListener(
  "click",
  () => closeModal("#chordEditModal")
);

$("#saveChordBtn")?.addEventListener("click", () => {
  const name = formatChordName($("#chordNameInput").value.trim());

  if (!name) {
    alert("Enter a chord name.");
    return;
  }

  const strings = [
    $("#chordE1").value.trim() || "—",
    $("#chordA").value.trim() || "—",
    $("#chordD").value.trim() || "—",
    $("#chordG").value.trim() || "—",
    $("#chordB").value.trim() || "—",
    $("#chordE2").value.trim() || "—"
  ];

  const tab =
    $("#chordTabInput").value.trim() ||
    strings.join("");

  const type = detectChordType(name);

  const existing = store.chords.find(
    (chord) =>
      normalize(chord.name) === normalize(name)
  );

  if (
    existing &&
    editingChordId === null
  ) {
    alert("That chord already exists.");
    return;
  }

  const chordData = {
    id:
      editingChordId ||
      `chord-${Date.now()}`,
    name,
    type,
    strings,
    tab
  };

  if (editingChordId) {
    const index = store.chords.findIndex(
      (chord) => chord.id === editingChordId
    );

    if (index !== -1) {
      store.chords[index] = chordData;
    } else {
      // Generated/fallback chord: save it as a new library chord.
      store.chords.push(chordData);
    }
  } else {
    store.chords.push(chordData);
  }

  save();

  closeModal("#chordEditModal");

  editingChordId = null;

  renderChords($("#chordSearchInput")?.value || "");
});

function detectChordType(name) {
  const match = String(name).match(
    /^[A-G](?:#|b)?(.*)$/
  );

  if (!match) {
    return "Chord";
  }

  const suffix = match[1];

  const types = {
    "": "Major",
    m: "Minor",
    sus2: "Sus2",
    sus4: "Sus4",
    "5": "Power",
    dim: "Diminished",
    aug: "Augmented",
    maj7: "Major 7",
    maj9: "Major 9",
    maj11: "Major 11",
    "7": "Dominant 7",
    "9": "Dominant 9",
    "11": "Dominant 11",
    m7: "Minor 7",
    m9: "Minor 9",
    m11: "Minor 11"
  };

  return types[suffix] || suffix || "Chord";
}

/* =========================================================
   FOLDER VIEW
   ========================================================= */

function renderCurrentFolder() {
  const list = $("#folderSongList");
  const empty = $("#folderEmpty");

  if (!list || !empty || !currentFolder) return;

  const songs = store.songs.filter(
    (song) =>
      (song.folder || "General") === currentFolder
  );

  list.innerHTML = "";

  $("#folderPageCount").textContent =
    `${songs.length} song${songs.length === 1 ? "" : "s"}`;

  if (!songs.length) {
    empty.style.display = "block";
    updateFolderSelectionBar();
    return;
  }

  empty.style.display = "none";

  songs.forEach((song) => {
    list.appendChild(
      createSongCard(song, {
        selectionMode: folderSelectionMode,
        selectionSet: selectedFolderSongs,
        selectionCallback: updateFolderSelectionBar
      })
    );
  });

  updateFolderSelectionBar();
}

function startFolderSelection(songId = null) {
  if (!currentFolder) return;

  folderSelectionMode = true;

  selectedFolderSongs.clear();

  if (songId !== null) {
    selectedFolderSongs.add(songId);
  }

  renderCurrentFolder();
  updateFolderSelectionBar();
}

function updateFolderSelectionBar() {
  const bar = $("#folderSelectionBar");

  if (!bar) return;

  const active =
    folderSelectionMode &&
    selectedFolderSongs.size > 0;

  bar.classList.toggle(
    "hidden",
    !active
  );

  const count = $("#folderSelectedCount");

  if (count) {
    count.textContent =
      `${selectedFolderSongs.size} selected`;
  }

  let selectAllBtn = $("#selectAllFolderBtn");
  let unselectAllBtn = $("#unselectAllFolderBtn");

  if (selectAllBtn && !unselectAllBtn) {
    unselectAllBtn = document.createElement("button");

    unselectAllBtn.type = "button";
    unselectAllBtn.id = "unselectAllFolderBtn";
    unselectAllBtn.className =
      selectAllBtn.className;

    unselectAllBtn.textContent = "Unselect All";

    selectAllBtn.insertAdjacentElement(
      "afterend",
      unselectAllBtn
    );

    unselectAllBtn.addEventListener(
      "click",
      () => {
        selectedFolderSongs.clear();
        folderSelectionMode = false;

        renderCurrentFolder();
        updateFolderSelectionBar();
      }
    );
  }

  if (selectAllBtn) {
    selectAllBtn.style.display =
      active ? "" : "none";
  }

  if (unselectAllBtn) {
    unselectAllBtn.style.display =
      active ? "" : "none";
  }
}

$("#folderBackBtn")?.addEventListener("click", () => {
  selectedFolderSongs.clear();
  folderSelectionMode = false;

  selectedSongs.clear();

  currentFolder = null;

  updateFolderSelectionBar();
  updateSongSelectionBar();

  navigate("songs");
});

$("#selectAllFolderBtn")?.addEventListener("click", () => {
  if (!currentFolder) return;

  folderSelectionMode = true;

  selectedFolderSongs.clear();

  store.songs
    .filter(
      (song) =>
        (song.folder || "General") === currentFolder
    )
    .forEach((song) => {
      selectedFolderSongs.add(song.id);
    });

  renderCurrentFolder();
  updateFolderSelectionBar();
});

$("#cancelFolderSelectionBtn")?.addEventListener("click", () => {
  selectedFolderSongs.clear();
  folderSelectionMode = false;

  renderCurrentFolder();
  updateFolderSelectionBar();
});

$("#deleteFolderSongsBtn")?.addEventListener("click", () => {
  const ids = [...selectedFolderSongs];

  if (!ids.length) return;

  deleteSongs(ids);

  selectedFolderSongs.clear();
  folderSelectionMode = false;

  renderCurrentFolder();
  updateFolderSelectionBar();
});

/* =========================================================
   ACTION MODAL
   ========================================================= */

function openActionModal(title, actions) {
  $("#actionTitle").textContent = title;

  const container = $("#actionButtons");

  container.innerHTML = "";

  actions.forEach((item) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "action-btn" +
      (item.danger ? " danger" : "");

    button.textContent = item.label;

    button.addEventListener("click", item.action);

    container.appendChild(button);
  });

  openModal("#actionModal");
}

$("#closeActionBtn")?.addEventListener(
  "click",
  () => closeModal("#actionModal")
);

/* =========================================================
   FOLDER LONG PRESS / ACTIONS
   ========================================================= */

/* =========================================================
   COMPATIBILITY WITH OLD DATA
   ========================================================= */

function migrateOldData() {
  try {
    const oldSongs = JSON.parse(
      localStorage.getItem("chordipot_songs") || "null"
    );

    if (
      Array.isArray(oldSongs) &&
      oldSongs.length &&
      !store.songs.length
    ) {
      store.songs = oldSongs.map((song) => ({
        ...song,
        origKey: song.origKey || song.key || "",
        churchKey: song.churchKey || "",
        folder: song.folder || "General",
        referenceLink: song.referenceLink || ""
      }));

      save();
    }
  } catch (error) {
    /* Ignore old storage errors */
  }
}

migrateOldData();

/* =========================================================
   INITIAL LOAD
   ========================================================= */

populateFolderSelect(
  folderInput,
  store.folders[0]
);

populateFolderSelect(
  $("#moveFolderInput"),
  store.folders[0]
);

renderFolders();
renderSongs();
renderFavorites();
renderHistory();
renderChords();

updateCounts();

applyTheme();

/* =========================================================
   EXTRA: keep page UI updated when folder/song data changes
   ========================================================= */

window.addEventListener("storage", () => {
  store = loadStore();

  applyTheme();
  updateCounts();
  renderSongs($("#searchInput")?.value || "");
  renderFavorites();
  renderHistory();
  renderChords($("#chordSearchInput")?.value || "");

  if (currentFolder) {
    renderCurrentFolder();
  }
});

/* CHORDIPOT LYRICS ONLY PINCH ZOOM JS */

(function initLyricsPinchZoom() {

  const lyrics = document.getElementById("lyrics");

  if (!lyrics) {
    return;
  }

  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  const MIN_ZOOM = 0.75;
  const MAX_ZOOM = 2.00;

  function getDistance(touch1, touch2) {

    const dx =
      touch2.clientX -
      touch1.clientX;

    const dy =
      touch2.clientY -
      touch1.clientY;

    return Math.sqrt(
      (dx * dx) +
      (dy * dy)
    );
  }

  function getZoom() {

    const value =
      parseFloat(
        getComputedStyle(lyrics)
          .getPropertyValue("--lyrics-zoom")
      );

    return Number.isFinite(value)
      ? value
      : 1;

  }

  function setZoom(value) {

    const zoom =
      Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          value
        )
      );

    lyrics.style.setProperty(
      "--lyrics-zoom",
      zoom.toFixed(2)
    );

  }

  lyrics.addEventListener(
    "touchstart",
    function(event) {

      if (event.touches.length !== 2) {
        return;
      }

      pinchStartDistance =
        getDistance(
          event.touches[0],
          event.touches[1]
        );

      pinchStartZoom =
        getZoom();

    },
    {
      passive: false
    }
  );

  lyrics.addEventListener(
    "touchmove",
    function(event) {

      if (event.touches.length !== 2) {
        return;
      }

      event.preventDefault();

      const currentDistance =
        getDistance(
          event.touches[0],
          event.touches[1]
        );

      if (!pinchStartDistance) {
        return;
      }

      const scale =
        currentDistance /
        pinchStartDistance;

      setZoom(
        pinchStartZoom *
        scale
      );

    },
    {
      passive: false
    }
  );

  lyrics.addEventListener(
    "touchend",
    function(event) {

      if (event.touches.length < 2) {
        pinchStartDistance = 0;
      }

    },
    {
      passive: false
    }
  );

})();

