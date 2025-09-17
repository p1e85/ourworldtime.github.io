const timeZones = [ { name: "Samoa, Midway", iana: "Pacific/Samoa" }, { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu" }, { name: "Alaska, Anchorage", iana: "America/Anchorage" }, { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles" }, { name: "Denver, Phoenix", iana: "America/Denver" }, { name: "Chicago, Mexico City", iana: "America/Chicago" }, { name: "New York, Lima", iana: "America/New_York" }, { name: "Halifax, Santiago", iana: "America/Halifax" }, { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo" }, { name: "South Georgia", iana: "Atlantic/South_Georgia" }, { name: "Azores, Cape Verde", iana: "Atlantic/Azores" }, { name: "London, Dublin", iana: "Europe/London" }, { name: "Paris, Rome", iana: "Europe/Paris" }, { name: "Cairo, Johannesburg", iana: "Africa/Cairo" }, { name: "Moscow, Istanbul", iana: "Europe/Moscow" }, { name: "Dubai, Baku", iana: "Asia/Dubai" }, { name: "Karachi, Tashkent", iana: "Asia/Karachi" }, { name: "Dhaka, Almaty", iana: "Asia/Dhaka" }, { name: "Bangkok, Jakarta", iana: "Asia/Bangkok" }, { name: "Shanghai, Perth", iana: "Asia/Shanghai" }, { name: "Tokyo, Seoul", iana: "Asia/Tokyo" }, { name: "Sydney, Guam", iana: "Australia/Sydney" }, { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok" }, { name: "Auckland, Fiji", iana: "Pacific/Auckland" } ];

let currentIndex;
let clockInterval;
let dialItemWidth = 250;
let dashboardClocks = [];
let localUserIana = '';

// --- DOM Element Selectors ---
const clockContainer = document.getElementById('clock-container');
const infoWrapper = document.getElementById('clock-info-wrapper');
const multiClockGrid = document.getElementById('multi-clock-grid');
const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const dateDisplayElement = document.getElementById('date-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialContainer = document.getElementById('dial-container');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');

// --- Core Display Functions ---
function updateTime(zone) { const timeOptions = { timeZone: zone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; timeDisplayElement.textContent = new Date().toLocaleTimeString('EN-us', timeOptions); }
function updateStaticInfo(zone) { const now = new Date(); const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' }; const dateString = now.toLocaleDateString('EN-us', dateOptions); const timeZoneFormatter = new Intl.DateTimeFormat('EN-us', { timeZone: zone.iana, timeZoneName: 'shortOffset', }); const offsetString = timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName').value; utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC'); cityNameTextElement.textContent = zone.name; dateDisplayElement.textContent = dateString; const favoriteIana = localStorage.getItem('favoriteTimeZone'); mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana); const hour = parseInt(now.toLocaleTimeString('EN-us', { timeZone: zone.iana, hour: '2-digit', hour12: false })); updateBackground(hour); }
function updateBackground(hour) { const body = document.body; let newClass = ''; if (hour >= 5 && hour < 11) { newClass = 'morning'; } else if (hour >= 11 && hour < 17) { newClass = 'day'; } else if (hour >= 17 && hour < 21) { newClass = 'evening'; } else { newClass = 'night'; } if (body.className !== newClass) { body.className = newClass; } }

// --- Dial Functions ---
function updateDialPosition() { const itemWidth = dialItemWidth; const containerWidth = dialContainer.offsetWidth; const offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth); dialTrack.style.transform = `translateX(${offset}px)`; const allItems = document.querySelectorAll('.dial-item'); const favoriteIana = localStorage.getItem('favoriteTimeZone'); allItems.forEach((item, index) => { const zone = timeZones[index]; item.classList.toggle('active', index === currentIndex); item.querySelector('.dial-favorite-star').classList.toggle('hidden', zone.iana !== favoriteIana); }); }
function buildDial() { timeZones.forEach((zone, index) => { const item = document.createElement('div'); item.className = 'dial-item'; item.dataset.index = index; const star = document.createElement('span'); star.className = 'dial-favorite-star hidden'; star.textContent = '⭐'; const name = document.createElement('span'); name.className = 'dial-item-name'; name.textContent = zone.name; item.appendChild(star); item.appendChild(name); item.addEventListener('click', () => changeTimeZone(index)); dialTrack.appendChild(item); }); }

// --- Multi-Clock Functions ---
function buildMultiClockGrid() {
    multiClockGrid.innerHTML = ''; // Clear grid
    // Build the saved dashboard clocks
    dashboardClocks.forEach(iana => {
        const zoneData = timeZones.find(tz => tz.iana === iana);
        const clockEl = createMiniClock(zoneData, false);
        multiClockGrid.appendChild(clockEl);
    });
    // Build the preview clock if space is available
    if (dashboardClocks.length < 4) {
        const previewZone = timeZones[currentIndex];
        const previewEl = createMiniClock(previewZone, true);
        multiClockGrid.appendChild(previewEl);
    }
}

function createMiniClock(zone, isPreview) {
    const clockEl = document.createElement('div');
    clockEl.className = 'mini-clock';
    if (isPreview) {
        clockEl.classList.add('preview-clock');
        clockEl.id = 'preview-clock'; // Add ID for easy selection
    }
    const nameEl = document.createElement('h3');
    nameEl.textContent = zone.name;
    const timeEl = document.createElement('div');
    timeEl.className = 'mini-time';
    // Use a data attribute for the IANA, which is more reliable than an ID
    timeEl.dataset.iana = zone.iana;
    clockEl.appendChild(nameEl);
    clockEl.appendChild(timeEl);
    return clockEl;
}

function updateAllClocks() {
    // Update single view clock
    updateTime(timeZones[currentIndex]);
    // Update all mini clocks in the grid (dashboard + preview)
    const miniClocks = multiClockGrid.querySelectorAll('.mini-time');
    miniClocks.forEach(timeEl => {
        const iana = timeEl.dataset.iana;
        const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        timeEl.textContent = new Date().toLocaleTimeString('en-US', timeOptions);
    });
}

function renderView() {
    if (dashboardClocks.length > 1) {
        clockContainer.classList.add('multi-view-active');
        buildMultiClockGrid(); // Rebuild the grid to show correct number of clocks + preview
    } else {
        clockContainer.classList.remove('multi-view-active');
    }
}

function handleClockInteraction() {
    const selectedZone = timeZones[currentIndex];
    const indexInDashboard = dashboardClocks.indexOf(selectedZone.iana);
    if (indexInDashboard > -1) {
        if (selectedZone.iana === localUserIana) { showToast("Your local time cannot be removed from the dashboard."); return; }
        dashboardClocks.splice(indexInDashboard, 1);
        showToast(`${selectedZone.name} removed from dashboard.`);
    } else {
        if (dashboardClocks.length >= 4) { showToast("Dashboard is full (max 4 clocks)."); return; }
        dashboardClocks.push(selectedZone.iana);
        showToast(`${selectedZone.name} added to dashboard.`);
    }
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    renderView();
}

function changeTimeZone(newIndex) {
    currentIndex = newIndex;
    updateDialPosition();
    // In single view, animate and update. In multi view, just update the preview clock.
    if (!clockContainer.classList.contains('multi-view-active')) {
        const zone = timeZones[newIndex];
        infoWrapper.classList.add('slide-out');
        setTimeout(() => {
            updateStaticInfo(zone);
            updateTime(zone);
            infoWrapper.classList.remove('slide-out');
            infoWrapper.classList.add('slide-in');
            setTimeout(() => infoWrapper.classList.remove('slide-in'), 300);
        }, 150);
    } else {
        buildMultiClockGrid(); // Rebuild grid to update the preview clock
    }
}

// --- Utility & Initialization ---
function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }
function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateAllClocks, 1000); }

document.addEventListener('DOMContentLoaded', () => {
    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const savedClocks = JSON.parse(localStorage.getItem('dashboardClocks'));
    if (savedClocks && savedClocks.length > 0) {
        dashboardClocks = savedClocks;
    } else {
        dashboardClocks = [localUserIana];
    }
    if (!dashboardClocks.includes(localUserIana)) { dashboardClocks.unshift(localUserIana); }

    buildDial();
    const firstDialItem = dialTrack.querySelector('.dial-item');
    if (firstDialItem) { dialItemWidth = firstDialItem.offsetWidth; }

    let initialIndex = timeZones.findIndex(tz => tz.iana === dashboardClocks[0]);
    if (initialIndex === -1) initialIndex = 11;
    currentIndex = initialIndex;

    renderView();
    updateStaticInfo(timeZones[currentIndex]);
    updateDialPosition();
    startClock();
    setTimeout(() => { dialTrack.classList.add('nudge'); setTimeout(() => { dialTrack.classList.remove('nudge'); }, 500); }, 1500);
});
