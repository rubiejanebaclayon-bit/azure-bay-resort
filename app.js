const API_URL = "http://localhost/azure-bay-backend";

let authMode = "login";
let activeUser = localStorage.getItem("azureUser") || "";
let selectedRoomId = ""; 
let rooms = [];          
let reservations = [];   

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const els = {
  authPage: $("#authPage"),
  app: $("#app"),
  loginTab: $("#loginTab"),
  signupTab: $("#signupTab"),
  authForm: $("#authForm"),
  authTitle: $("#authTitle"),
  authSubmit: $("#authSubmit"),
  guestBtn: $("#guestBtn"),
  signupOnly: $$(".signup-only"),
  fullName: $("#fullName"),
  username: $("#username"),
  password: $("#password"),
  profileName: $("#profileName"),
  logoutBtn: $("#logoutBtn"),
  navButtons: $$("[data-page]"),
  homeCheckIn: $("#homeCheckIn"),
  roomGrid: $("#roomGrid"),
  roomSearch: $("#roomSearch"),
  typeFilter: $("#typeFilter"),
  reservationForm: $("#reservationForm"),
  reservationId: $("#reservationId"),
  guestName: $("#guestName"),
  email: $("#email"),
  phone: $("#phone"),
  roomSelect: $("#roomSelect"),
  reservationDate: $("#reservationDate"),
  checkoutDate: $("#checkoutDate"),
  guestCount: $("#guestCount"),
  purpose: $("#purpose"),
  formTitle: $("#formTitle"),
  submitBtn: $("#submitBtn"),
  clearBtn: $("#clearBtn"),
  formMessage: $("#formMessage"),
  summaryImage: $("#summaryImage"),
  summaryRoom: $("#summaryRoom"),
  summaryType: $("#summaryType"),
  summaryCapacity: $("#summaryCapacity"),
  summaryRate: $("#summaryRate"),
  searchInput: $("#searchInput"),
  dateFilter: $("#dateFilter"),
  reservationTable: $("#reservationTable"),
  totalReservations: $("#totalReservations"),
  availableRooms: $("#availableRooms"),
  reservedRooms: $("#reservedRooms"),
  roomModal: $("#roomModal"),
  modalClose: $("#modalClose"),
  modalBook: $("#modalBook"),
  modalMainImage: $("#modalMainImage"),
  modalThumbs: $("#modalThumbs"),
  modalType: $("#modalType"),
  modalTitle: $("#modalTitle"),
  modalDescription: $("#modalDescription"),
  modalDetails: $("#modalDetails"),
  modalServices: $("#modalServices")
};

const adminAccounts = [
  { username: "admin", password: "admin123" },
  { username: "ella", password: "1234" },
  { username: "manager", password: "azurebay" }
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await fetchRooms();
  await fetchReservations();
  setDates();
  bindEvents();
  if (activeUser) showApp();
}

async function fetchRooms() {
  try {
    const res = await fetch(`${API_URL}/rooms.php`);
    rooms = await res.json();
    populateRooms();
    if (rooms.length > 0 && !selectedRoomId) {
      selectedRoomId = rooms[0].id;
      updateSummary();
    }
  } catch (err) {
    console.error("Error fetching rooms:", err);
  }
}

async function fetchReservations() {
  try {
    const res = await fetch(`${API_URL}/reservations.php`);
    reservations = await res.json();
  } catch (err) {
    console.error("Error fetching reservations:", err);
  }
}

function bindEvents() {
  els.loginTab.addEventListener("click", () => setAuthMode("login"));
  els.signupTab.addEventListener("click", () => setAuthMode("signup"));
  els.authForm.addEventListener("submit", login);
  els.guestBtn.addEventListener("click", continueAsGuest);
  els.logoutBtn.addEventListener("click", logout);
  els.navButtons.forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  els.roomSearch.addEventListener("input", renderRooms);
  els.typeFilter.addEventListener("input", renderRooms);
  els.roomSelect.addEventListener("change", () => selectRoom(els.roomSelect.value, false));
  els.reservationForm.addEventListener("submit", saveReservation);
  els.clearBtn.addEventListener("click", resetForm);
  els.searchInput.addEventListener("input", renderReservations);
  els.dateFilter.addEventListener("input", renderReservations);
  window.addEventListener("scroll", updateActiveNav);
  els.modalClose.addEventListener("click", closeModal);
  els.modalBook.addEventListener("click", () => selectRoom(selectedRoomId, true));
  els.roomModal.addEventListener("click", (event) => {
    if (event.target === els.roomModal) closeModal();
  });
}

function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === "signup";

  els.loginTab.classList.toggle("active", !signingUp);
  els.signupTab.classList.toggle("active", signingUp);

  els.signupOnly.forEach((field) => field.classList.toggle("hidden", !signingUp));
  els.fullName.required = signingUp;

  if (signingUp) {
    els.authTitle.textContent = "Create Booking Account";
    document.querySelector(".auth-subtitle").textContent = "Sign up to book your resort stay.";
    els.authSubmit.textContent = "Sign Up to Book";
  } else {
    els.authTitle.textContent = "Admin Login";
    document.querySelector(".auth-subtitle").textContent = "Log in for admin access only.";
    els.authSubmit.textContent = "Admin Log In";
  }
}

function login(event) {
  event.preventDefault();
  const username = els.username.value.trim();
  const password = els.password.value.trim();

  if (authMode === "login") {
    const admin = adminAccounts.find((acc) => acc.username === username && acc.password === password);
    if (admin) {
      activeUser = "Administrator";
      localStorage.setItem("azureUser", activeUser);
      localStorage.setItem("isAdmin", "true");
      showApp();
    } else {
      alert("Invalid admin username or password");
    }
    return;
  }

  activeUser = els.fullName.value.trim();
  localStorage.setItem("azureUser", activeUser);
  localStorage.setItem("isAdmin", "false");
  showApp();
}

function continueAsGuest() {
  setAuthMode("signup");
  els.fullName.focus();
}

function logout() {
  localStorage.removeItem("azureUser");
  localStorage.removeItem("isAdmin");
  activeUser = "";
  els.authPage.classList.remove("hidden");
  els.app.classList.add("hidden");
}

function showApp() {
  els.authPage.classList.add("hidden");
  els.app.classList.remove("hidden");
  els.profileName.textContent = activeUser;

  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const reservationNav = document.querySelector('[data-page="reservations"]');
  const reservationSection = document.querySelector("#reservationsPage");

  if (!isAdmin) {
    reservationNav.style.display = "none";
    if (reservationSection) reservationSection.style.display = "none";
  } else {
    reservationNav.style.display = "inline-flex";
    if (reservationSection) reservationSection.style.display = "block";
  }

  renderAll();
}

function showPage(page) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (page === "reservations" && !isAdmin) {
    alert("Only admins can access reservations.");
    return;
  }

  $$(".nav-btn").forEach((button) =>
    button.classList.toggle("active", button.dataset.page === page)
  );

  const section = $(`#${page}Page`);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateActiveNav() {
  const current = [...$$(".page")].reduce((active, section) => {
    const distance = Math.abs(section.getBoundingClientRect().top - 110);
    return distance < active.distance ? { page: section.id.replace("Page", ""), distance } : active;
  }, { page: "home", distance: Infinity });

  $$(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === current.page);
  });
}

function populateRooms() {
  els.roomSelect.innerHTML = rooms.map((room) => `<option value="${room.id}">${room.name}</option>`).join("");
  if (selectedRoomId) els.roomSelect.value = selectedRoomId;
}

function setDates() {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  els.homeCheckIn.textContent = formatDate(today);
  els.reservationDate.min = today;
  els.checkoutDate.min = tomorrow;
  els.reservationDate.value ||= today;
  els.checkoutDate.value ||= tomorrow;
}

function renderAll() {
  renderRooms();
  renderReservations();
  renderStats();
  updateSummary();
}

function renderRooms() {
  const search = els.roomSearch.value.toLowerCase();
  const type = els.typeFilter.value;
  const reserved = getReservedRoomIds();

  const filtered = rooms.filter((room) => {
    const text = `${room.name} ${room.type} ${room.services.join(" ")}`.toLowerCase();
    return text.includes(search) && (type === "all" || room.type === type);
  });

  els.roomGrid.innerHTML = filtered.map((room) => `
    <article class="room-card">
      <img src="${room.images[0]}" alt="${room.name}" />
      <div class="room-body">
        <div class="room-title">
          <div>
            <span class="pill">${room.type}</span>
            <h3>${room.name}</h3>
          </div>
          <span class="status ${reserved.has(room.id) ? "reserved" : ""}">${reserved.has(room.id) ? "Reserved" : "Available"}</span>
        </div>
        <p>${room.description}</p>
        <div class="room-meta">
          <span>${room.capacity} guests</span>
          <span>${room.size}</span>
          <span>${room.rate}</span>
        </div>
        <div class="room-actions">
          <button class="outline-btn" type="button" onclick="openRoomDetails('${room.id}')">Room Details</button>
          <button class="primary-btn" type="button" onclick="selectRoom('${room.id}', true)">Book</button>
        </div>
      </div>
    </article>
  `).join("") || `<p class="empty">No room found.</p>`;
}

function renderStats() {
    // Calculate stats data arrays
    const reserved = getReservedRoomIds ? getReservedRoomIds() : new Set();
    
    // Safely update Total Reservations element if it exists
    if (els.totalReservations) {
        els.totalReservations.textContent = reservations.length;
    }
    
    // Safely update Reserved Rooms element if it exists
    if (els.reservedRooms) {
        els.reservedRooms.textContent = reserved.size;
    }
    
    // Safely update Available Rooms element if it exists
    if (els.availableRooms) {
        els.availableRooms.textContent = (rooms ? rooms.length : 0) - reserved.size;
    }
}

function renderReservations() {
  const search = els.searchInput.value.toLowerCase();
  const date = els.dateFilter.value;

  const filtered = reservations.filter((res) => {
    const matchesSearch = `${res.guest_name} ${res.room_name}`.toLowerCase().includes(search);
    const matchesDate = !date || res.check_in === date;
    return matchesSearch && matchesDate;
  });

  els.reservationTable.innerHTML = filtered.map((res) => `
    <tr>
      <td><strong>${res.guest_name}</strong><br><span>${res.email}</span></td>
      <td>${res.room_name}</td>
      <td>${formatDate(res.check_in)}</td>
      <td>${formatDate(res.check_out)}</td>
      <td>${res.guest_count}</td>
      <td><span class="status reserved">Reserved</span></td>
      <td>
        <button class="mini-btn" type="button" onclick="editReservation('${res.id}')">Edit</button>
        <button class="mini-btn danger" type="button" onclick="deleteReservation('${res.id}')">Delete</button>
      </td>
    </tr>
  `).join("") || `<tr><td class="empty" colspan="7">No reservations found.</td></tr>`;
}

function selectRoom(roomId, goToBook) {
  selectedRoomId = roomId;
  els.roomSelect.value = roomId;
  updateSummary();
  closeModal();
  if (goToBook) showPage("book");
}

function updateSummary() {
  const room = getRoom(selectedRoomId);
  if (!room) return;
  els.summaryImage.src = room.images[0];
  els.summaryRoom.textContent = room.name;
  els.summaryType.textContent = room.type;
  els.summaryCapacity.textContent = `${room.capacity} guests`;
  els.summaryRate.textContent = room.rate;
}

function openRoomDetails(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  selectedRoomId = roomId;
  els.modalType.textContent = room.type;
  els.modalTitle.textContent = room.name;
  els.modalDescription.textContent = room.description;
  els.modalMainImage.src = room.images[0];
  els.modalDetails.innerHTML = [
    ["Capacity", `${room.capacity} guests`],
    ["Rate", room.rate],
    ["Floor", room.floor],
    ["Size", room.size]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  els.modalServices.innerHTML = room.services.map((service) => `<li>${service}</li>`).join("");
  els.modalThumbs.innerHTML = room.images.map((image, index) => `
    <img src="${image}" alt="${room.name} photo ${index + 1}" class="${index === 0 ? "active" : ""}" onclick="setModalImage('${image}', this)" />
  `).join("");
  els.roomModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function setModalImage(image, thumb) {
  els.modalMainImage.src = image;
  $$("#modalThumbs img").forEach((item) => item.classList.remove("active"));
  thumb.classList.add("active");
}

function closeModal() {
  els.roomModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function saveReservation(event) {
  event.preventDefault();
  if (els.checkoutDate.value <= els.reservationDate.value) {
    showMessage("Check out must be later than check in.", true);
    return;
  }

  // Fallback guest UUID if logged out, or pull from your real user session tracking
  const currentUserId = localStorage.getItem("azureUserId") || "guest-user-uuid";

  const id = els.reservationId.value;
  const reservationData = {
    id: id || crypto.randomUUID(),
    userId: currentUserId, // ◄ Added this line
    roomId: els.roomSelect.value,
    checkIn: els.reservationDate.value,
    checkOut: els.checkoutDate.value,
    guestCount: Number(els.guestCount.value),
    purpose: els.purpose.value.trim()
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/reservations.php?id=${id}` : `${API_URL}/reservations.php`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    });

    const result = await response.json();

    if (!response.ok) {
      showMessage(result.message || "An error occurred.", true);
      return;
    }

    resetForm();
    await fetchReservations(); 
    renderAll();
    
    if (localStorage.getItem("isAdmin") === "true") {
      showPage("reservations");
    } else {
      showMessage("Reservation booked successfully!");
    }
  } catch (err) {
    showMessage("Failed to save reservation.", true);
  }
}



function editReservation(id) {
  const res = reservations.find((item) => item.id === id);
  if (!res) return;
  els.reservationId.value = res.id;
  els.guestName.value = res.guest_name;
  els.email.value = res.email;
  els.phone.value = res.phone;
  els.roomSelect.value = res.room_id;
  els.reservationDate.value = res.check_in;
  els.checkoutDate.value = res.check_out;
  els.guestCount.value = res.guest_count;
  els.purpose.value = res.purpose;
  selectedRoomId = res.room_id;
  els.formTitle.textContent = "Edit Reservation";
  els.submitBtn.textContent = "Update Reservation";
  updateSummary();
  showPage("book");
}

async function deleteReservation(id) {
  const res = reservations.find((item) => item.id === id);
  if (!res || !confirm(`Delete reservation for ${res.guest_name}?`)) return;

  try {
    const response = await fetch(`${API_URL}/reservations.php?id=${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await fetchReservations();
      renderAll();
    } else {
      alert("Failed to delete reservation.");
    }
  } catch (err) {
    console.error("Error deleting reservation:", err);
  }
}

function resetForm() {
  els.reservationForm.reset();
  els.reservationId.value = "";
  els.roomSelect.value = selectedRoomId;
  els.formTitle.textContent = "Make Reservation";
  els.submitBtn.textContent = "Save Reservation";
  els.formMessage.textContent = "";
  setDates();
  updateSummary();
}

function getReservedRoomIds() {
  const today = new Date().toISOString().slice(0, 10);
  return new Set(reservations.filter((item) => item.check_out >= today).map((item) => item.room_id));
}

function getRoom(roomId) {
  return rooms.find((room) => room.id === roomId) || rooms[0];
}

function showMessage(message, isError = false) {
  els.formMessage.textContent = message;
  els.formMessage.style.color = isError ? "#b64236" : "#147653";
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}