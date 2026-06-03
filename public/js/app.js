const API_BASE = "/api/v1";

let currentPage = 1;
let resourcesCache = [];

// Perform a JSON API request
async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Request failed");
    }

    return data.data;
}

// Show a form success or error message
function showMessage(text, type = "success") {
    const el = document.getElementById("form-message");
    el.textContent = text;
    el.className = `message ${type}`;
}

// Format date for display
function formatDate(value) {
    if (!value) return "-";
    return String(value).substring(0, 10);
}

// Format time for display
function formatTime(value) {
    if (!value) return "-";
    return String(value).substring(0, 5);
}

// Load resources into selects and resource cards
async function loadResources() {
    resourcesCache = await apiRequest("/resources");

    const resourceSelect = document.getElementById("resource_id");
    const filterResource = document.getElementById("filter-resource");
    const resourcesList = document.getElementById("resources-list");

    resourceSelect.innerHTML = resourcesCache
        .map((r) => `<option value="${r.id}">${r.name} (${r.type})</option>`)
        .join("");

    filterResource.innerHTML = `<option value="">كل الموارد</option>` +
        resourcesCache.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");

    resourcesList.innerHTML = resourcesCache.map((r) => `
        <article class="resource-card">
            <h3>${r.name}</h3>
            <p>${r.type} — ${r.description || "No description"}</p>
        </article>
    `).join("");
}

// Load bookings with current filters and pagination
async function loadBookings(page = 1) {
    currentPage = page;

    const params = new URLSearchParams({ page, limit: 8 });

    const status = document.getElementById("filter-status").value;
    const date = document.getElementById("filter-date").value;
    const resourceId = document.getElementById("filter-resource").value;
    const search = document.getElementById("filter-search").value.trim();

    if (status) params.set("status", status);
    if (date) params.set("date", date);
    if (resourceId) params.set("resource_id", resourceId);
    if (search) params.set("search", search);

    const result = await apiRequest(`/bookings?${params.toString()}`);
    const list = document.getElementById("bookings-list");
    const pagination = document.getElementById("pagination");

    if (!result.bookings.length) {
        list.innerHTML = `<p class="empty">لا توجد حجوزات</p>`;
    } else {
        list.innerHTML = result.bookings.map((b) => `
            <article class="booking-item">
                <div>
                    <strong>#${b.id} — ${b.name}</strong>
                    <div class="booking-meta">
                        ${b.resource_name} | ${formatDate(b.booking_date)}
                        ${formatTime(b.start_time)} - ${formatTime(b.end_time)}
                        ${b.email ? ` | ${b.email}` : ""}
                    </div>
                    ${b.notes ? `<div class="booking-meta">${b.notes}</div>` : ""}
                </div>
                <div class="booking-actions">
                    <span class="status ${b.status}">${b.status}</span>
                    ${b.status !== "confirmed" ? `<button class="btn small" data-action="confirm" data-id="${b.id}">تأكيد</button>` : ""}
                    ${b.status !== "cancelled" ? `<button class="btn small danger" data-action="cancel" data-id="${b.id}">إلغاء</button>` : ""}
                    <button class="btn small danger" data-action="delete" data-id="${b.id}">حذف</button>
                </div>
            </article>
        `).join("");
    }

    pagination.innerHTML = "";

    for (let i = 1; i <= result.pagination.totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "btn small";
        btn.textContent = i;
        btn.disabled = i === result.pagination.page;
        btn.addEventListener("click", () => loadBookings(i));
        pagination.appendChild(btn);
    }
}

// Handle booking form submission
async function handleCreateBooking(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value || null,
        resource_id: parseInt(document.getElementById("resource_id").value, 10),
        booking_date: document.getElementById("booking_date").value,
        start_time: document.getElementById("start_time").value,
        end_time: document.getElementById("end_time").value,
        notes: document.getElementById("notes").value || null
    };

    try {
        await apiRequest("/bookings", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showMessage("تم إنشاء الحجز بنجاح", "success");
        event.target.reset();
        document.getElementById("start_time").value = "09:00";
        document.getElementById("end_time").value = "10:00";
        await loadBookings(currentPage);
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// Handle booking action buttons (confirm, cancel, delete)
async function handleBookingAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    try {
        if (action === "delete") {
            await apiRequest(`/bookings/${id}`, { method: "DELETE" });
        } else {
            const status = action === "confirm" ? "confirmed" : "cancelled";
            await apiRequest(`/bookings/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status })
            });
        }

        await loadBookings(currentPage);
    } catch (error) {
        alert(error.message);
    }
}

// Set minimum booking date to today
function setMinDate() {
    const dateInput = document.getElementById("booking_date");
    const today = new Date().toISOString().substring(0, 10);
    dateInput.min = today;
    dateInput.value = today;
}

// Initialize the application
async function init() {
    setMinDate();

    document.getElementById("booking-form").addEventListener("submit", handleCreateBooking);
    document.getElementById("apply-filters").addEventListener("click", () => loadBookings(1));
    document.getElementById("bookings-list").addEventListener("click", handleBookingAction);

    try {
        await loadResources();
        await loadBookings();
    } catch (error) {
        document.getElementById("bookings-list").innerHTML =
            `<p class="empty">تعذر الاتصال بالخادم. تأكد من تشغيل السيرفر وتطبيق migrations.</p>`;
        showMessage(error.message, "error");
    }
}

init();
