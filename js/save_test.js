// Data: List of all available time zones
const timeZones = [ { name: "Samoa, Midway", iana: "Pacific/Samoa" }, { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu" }, { name: "Alaska, Anchorage", iana: "America/Anchorage" }, { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles" }, { name: "Denver, Phoenix", iana: "America/Denver" }, { name: "Chicago, Mexico City", iana: "America/Chicago" }, { name: "New York, Lima", iana: "America/New_York" }, { name: "Halifax, Santiago", iana: "America/Halifax" }, { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo" }, { name: "South Georgia", iana: "Atlantic/South_Georgia" }, { name: "Azores, Cape Verde", iana: "Atlantic/Azores" }, { name: "London, Dublin", iana: "Europe/London" }, { name: "Paris, Rome", iana: "Europe/Paris" }, { name: "Cairo, Johannesburg", iana: "Africa/Cairo" }, { name: "Moscow, Istanbul", iana: "Europe/Moscow" }, { name: "Dubai, Baku", iana: "Asia/Dubai" }, { name: "Karachi, Tashkent", iana: "Asia/Karachi" }, { name: "Dhaka, Almaty", iana: "Asia/Dhaka" }, { name: "Bangkok, Jakarta", iana: "Asia/Bangkok" }, { name: "Shanghai, Perth", iana: "Asia/Shanghai" }, { name: "Tokyo, Seoul", iana: "Asia/Tokyo" }, { name: "Sydney, Guam", iana: "Australia/Sydney" }, { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok" }, { name: "Auckland, Fiji", iana: "Pacific/Auckland" } ];

// State: Variables to track the application's state
let currentIndex;
let clockInterval;
let dialItemWidth = 250;
let dashboardClocks = []; // This will hold the IANA strings of clocks in the dashboard
let localUserIana = '';

// DOM Elements: Store references to HTML elements
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
const viewToggleBtn = document.getElementById('view-toggle-btn');
const saveClockBtn = document.getElementById('save-clock-btn');

/** Updates the text for the main, single clock view */
function updateStaticInfo(zone) {
    if (!zone) return;
    const now = new Date();
    const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset' });
    const offsetString = timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName').value;
    
    utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC');
    cityNameTextElement.textContent = zone.name;
    dateDisplayElement.textContent = dateString;

    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana);
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: zone.iana, hour: '2-digit', hour12: false }));
    updateBackground(hour);
}

/** Updates the background gradient based on the hour */
function updateBackground(hour) { const body = document.body; let newClass = ''; if (hour >= 5 && hour < 11) { newClass = 'morning'; } else if (hour >= 11 && hour < 17) { newClass = 'day'; } else if (hour >= 17 && hour < 21) { newClass = 'evening'; } else { newClass = 'night'; } if (body.className !== newClass) { body.className = newClass; } }

/** Builds the items in the bottom dial */
function buildDial() { timeZones.forEach((zone, index) => { const item = document.createElement('div'); item.className = 'dial-item'; item.dataset.index = index; const star = document.createElement('span'); star.className = 'dial-favorite-star hidden'; star.textContent = '⭐'; const name = document.createElement('span'); name.className = 'dial-item-name'; name.textContent = zone.name; item.appendChild(star); item.appendChild(name); item.addEventListener('click', () => changeTimeZone(index)); dialTrack.appendChild(item); }); }

/** Updates the position of the bottom dial */
function updateDialPosition() { const itemWidth = dialItemWidth; const containerWidth = dialContainer.offsetWidth; const offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth); dialTrack.style.transform = `translateX(${offset}px)`; const allItems = document.querySelectorAll('.dial-item'); const favoriteIana = localStorage.getItem('favoriteTimeZone'); allItems.forEach((item, index) => { const zone = timeZones[index]; item.classList.toggle('active', index === currentIndex); item.querySelector('.dial-favorite-star').classList.toggle('hidden', zone.iana !== favoriteIana); }); }

/** Re-draws the dashboard with the current list of clocks */
function renderDashboard() {
    multiClockGrid.innerHTML = '';
    dashboardClocks.forEach(iana => {
        const zoneData = timeZones.find(tz => tz.iana === iana);
        if (zoneData) {
            const clockEl = createMiniClock(zoneData);
            multiClockGrid.appendChild(clockEl);
        }
    });
}

/** Creates a single mini clock element for the dashboard */
function createMiniClock(zone) {
    const clockEl = document.createElement('div');
    clockEl.className = 'mini-clock';
    const nameEl = document.createElement('h3');
    nameEl.textContent = zone.name;
    const timeEl = document.createElement('div');
    timeEl.className = 'mini-time';
    timeEl.dataset.iana = zone.iana; // Use data attribute to find later
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-clock-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = `Remove ${zone.name}`;
    deleteBtn.addEventListener('click', () => removeClockFromDashboard(zone.iana));
    
    const leftSide = document.createElement('div');
    leftSide.appendChild(nameEl);
    
    const rightSide = document.createElement('div');
    rightSide.style.display = 'flex';
    rightSide.style.alignItems = 'center';
    rightSide.appendChild(timeEl);
    if (zone.iana !== localUserIana) {
        rightSide.appendChild(deleteBtn);
    }

    clockEl.appendChild(leftSide);
    clockEl.appendChild(rightSide);
    return clockEl;
}

/** Updates the time text on all visible clocks */
function updateAllClocks() {
    // Update the main single clock view
    updateTime(timeZones[currentIndex]);
    // Update the dashboard clocks
    dashboardClocks.forEach(iana => {
        const timeEl = multiClockGrid.querySelector(`.mini-time[data-iana="${iana}"]`);
        if (timeEl) {
            const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            timeEl.textContent = new Date().toLocaleTimeString('en-US', timeOptions);
        }
    });
}
function updateTime(zone) {
    const timeOptions = { timeZone: zone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    timeDisplayElement.textContent = new Date().toLocaleTimeString('en-US', timeOptions);
}

/** Adds the currently selected timezone to the dashboard */
function addClockToDashboard() {
    const selectedZone = timeZones[currentIndex];
    if (dashboardClocks.includes(selectedZone.iana)) { showToast(`${selectedZone.name} is already in the dashboard.`); return; }
    if (dashboardClocks.length >= 4) { showToast("Dashboard is full (max 4 clocks)."); return; }
    dashboardClocks.push(selectedZone.iana);
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    showToast(`${selectedZone.name} added to dashboard.`);
    renderDashboard();
}

/** Removes a specific timezone from the dashboard */
function removeClockFromDashboard(ianaToRemove) {
    if (ianaToRemove === localUserIana) { showToast("Your local time cannot be removed."); return; }
    dashboardClocks = dashboardClocks.filter(iana => iana !== ianaToRemove);
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    const zone = timeZones.find(tz => tz.iana === ianaToRemove);
    showToast(`${zone.name} removed from dashboard.`);
    renderDashboard();
}

/** Animates the change of the main single clock view */
function changeTimeZone(newIndex) {
    currentIndex = newIndex;
    updateDialPosition();
    if (!clockContainer.classList.contains('multi-view-active')) {
        const zone = timeZones[newIndex];
        infoWrapper.classList.add('slide-out');
        setTimeout(() => {
            updateStaticInfo(zone);
            infoWrapper.classList.remove('slide-out');
            infoWrapper.classList.add('slide-in');
            setTimeout(() => infoWrapper.classList.remove('slide-in'), 300);
        }, 150);
    }
}

function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }
function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateAllClocks, 1000); }

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const savedClocks = JSON.parse(localStorage.getItem('dashboardClocks'));
    dashboardClocks = (savedClocks && savedClocks.length > 0) ? savedClocks : [localUserIana];
    if (!dashboardClocks.includes(localUserIana)) { dashboardClocks.unshift(localUserIana); }

    buildDial();
    const firstDialItem = dialTrack.querySelector('.dial-item');
    if (firstDialItem) { dialItemWidth = firstDialItem.offsetWidth; }

    let initialIndex = timeZones.findIndex(tz => tz.iana === localUserIana);
    if (initialIndex === -1) initialIndex = 11;
    currentIndex = initialIndex;

    updateStaticInfo(timeZones[currentIndex]);
    updateDialPosition();
    startClock();

    viewToggleBtn.addEventListener('click', () => {
        clockContainer.classList.toggle('multi-view-active');
        saveClockBtn.classList.toggle('hidden');
        if (clockContainer.classList.contains('multi-view-active')) {
            renderDashboard();
            viewToggleBtn.textContent = '🔳';
            viewToggleBtn.title = 'Toggle Single Clock View';
        } else {
            viewToggleBtn.textContent = '▦';
            viewToggleBtn.title = 'Toggle Dashboard View';
        }
    });
    saveClockBtn.addEventListener('click', addClockToDashboard);
});
