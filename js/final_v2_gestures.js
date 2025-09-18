// Data: List of all available time zones
const timeZones = [ { name: "Samoa, Midway", iana: "Pacific/Samoa" }, { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu" }, { name: "Alaska, Anchorage", iana: "America/Anchorage" }, { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles" }, { name: "Denver, Phoenix", iana: "America/Denver" }, { name: "Chicago, Mexico City", iana: "America/Chicago" }, { name: "New York, Lima", iana: "America/New_York" }, { name: "Halifax, Santiago", iana: "America/Halifax" }, { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo" }, { name: "South Georgia", iana: "Atlantic/South_Georgia" }, { name: "Azores, Cape Verde", iana: "Atlantic/Azores" }, { name: "London, Dublin", iana: "Europe/London" }, { name: "Paris, Rome", iana: "Europe/Paris" }, { name: "Cairo, Johannesburg", iana: "Africa/Cairo" }, { name: "Moscow, Istanbul", iana: "Europe/Moscow" }, { name: "Dubai, Baku", iana: "Asia/Dubai" }, { name: "Karachi, Tashkent", iana: "Asia/Karachi" }, { name: "Dhaka, Almaty", iana: "Asia/Dhaka" }, { name: "Bangkok, Jakarta", iana: "Asia/Bangkok" }, { name: "Shanghai, Perth", iana: "Asia/Shanghai" }, { name: "Tokyo, Seoul", iana: "Asia/Tokyo" }, { name: "Sydney, Guam", iana: "Australia/Sydney" }, { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok" }, { name: "Auckland, Fiji", iana: "Pacific/Auckland" } ];

// State: Variables to track the application's state
let currentIndex;
let clockInterval;
let dialItemWidth = 250;
let dashboardClocks = []; // The list of clocks saved to the dashboard
let localUserIana = '';

// DOM Elements: Store references to HTML elements
const clockContainer = document.getElementById('clock-container');
const infoWrapper = document.getElementById('clock-info-wrapper');
const multiClockGrid = document.getElementById('multi-clock-grid');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const dateDisplayElement = document.getElementById('date-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialContainer = document.getElementById('dial-container');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');

/** Updates the text for the main, single clock view */
function updateStaticInfo(zone) {
    if (!zone) return;
    const now = new Date();
    const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' };
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset' });
    const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || '';

    cityNameTextElement.textContent = zone.name;
    dateDisplayElement.textContent = now.toLocaleDateString('en-US', dateOptions);
    utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC');
    
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

/** Animates the change of the main single clock view */
function changeTimeZone(newIndex) {
    currentIndex = newIndex;
    updateDialPosition();
    const zone = timeZones[newIndex];
    infoWrapper.classList.add('slide-out');
    setTimeout(() => {
        updateStaticInfo(zone);
        infoWrapper.classList.remove('slide-out');
        infoWrapper.classList.add('slide-in');
        setTimeout(() => infoWrapper.classList.remove('slide-in'), 300);
    }, 150);
}

/** Creates a single mini clock element for the dashboard */
function createMiniClock(zone) {
    const clockEl = document.createElement('div'); clockEl.className = 'mini-clock';
    const nameEl = document.createElement('h3'); nameEl.textContent = zone.name;
    const timeEl = document.createElement('div'); timeEl.className = 'mini-time'; timeEl.dataset.iana = zone.iana;
    const dateEl = document.createElement('p'); dateEl.className = 'mini-date';
    const utcEl = document.createElement('p'); utcEl.className = 'mini-utc';
    const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-clock-btn'; deleteBtn.innerHTML = '&times;'; deleteBtn.title = `Remove ${zone.name}`;
    deleteBtn.addEventListener('click', () => removeClockFromDashboard(zone.iana));
    
    clockEl.appendChild(nameEl);
    clockEl.appendChild(timeEl);
    clockEl.appendChild(dateEl);
    clockEl.appendChild(utcEl);
    if (zone.iana !== localUserIana) { clockEl.appendChild(deleteBtn); }
    return clockEl;
}

/** Clears and redraws the dashboard based on the dashboardClocks array */
function renderDashboard() {
    multiClockGrid.innerHTML = '';
    const now = new Date();
    dashboardClocks.forEach(iana => {
        const zoneData = timeZones.find(tz => tz.iana === iana);
        if (zoneData) {
            const clockEl = createMiniClock(zoneData);
            // Populate static info
            const dateOptions = { timeZone: zoneData.iana, month: 'long', day: 'numeric' };
            clockEl.querySelector('.mini-date').textContent = now.toLocaleDateString('en-US', dateOptions);
            const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zoneData.iana, timeZoneName: 'shortOffset' });
            const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || '';
            clockEl.querySelector('.mini-utc').textContent = offsetString.replace('GMT', 'UTC');
            multiClockGrid.appendChild(clockEl);
        }
    });
}

/** Toggles a clock's presence in the dashboard */
function toggleDashboardClock(iana) {
    const indexInDashboard = dashboardClocks.indexOf(iana);
    if (indexInDashboard > -1) {
        // Remove it, but not if it's the last one
        if (dashboardClocks.length === 1) { showToast("Dashboard must contain at least one clock."); return; }
        dashboardClocks.splice(indexInDashboard, 1);
        const zone = timeZones.find(tz => tz.iana === iana);
        showToast(`${zone.name} removed from dashboard.`);
    } else {
        // Add it
        if (dashboardClocks.length >= 4) { showToast("Dashboard is full (max 4 clocks)."); return; }
        dashboardClocks.push(iana);
        const zone = timeZones.find(tz => tz.iana === iana);
        showToast(`${zone.name} added to dashboard.`);
    }
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
}

/** Removes a clock when its 'X' button is clicked */
function removeClockFromDashboard(ianaToRemove) {
    if (dashboardClocks.length <= 1) { showToast("Dashboard must contain at least one clock."); return; }
    dashboardClocks = dashboardClocks.filter(iana => iana !== ianaToRemove);
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    renderDashboard(); // Re-render the view immediately
    const zone = timeZones.find(tz => tz.iana === ianaToRemove);
    showToast(`${zone.name} removed from dashboard.`);
}

/** Updates the time text on all visible clocks every second */
function updateAllClocks() {
    const now = new Date();
    if (!infoWrapper.classList.contains('hidden')) {
        const mainZone = timeZones[currentIndex];
        if(mainZone) {
            const timeOptions = { timeZone: mainZone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            timeDisplayElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
        }
    } else {
        dashboardClocks.forEach(iana => {
            const timeEl = multiClockGrid.querySelector(`.mini-clock .mini-time[data-iana="${iana}"]`);
            if (timeEl) {
                const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                timeEl.textContent = now.toLocaleTimeString('en-US', timeOptions);
            }
        });
    }
}

function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateAllClocks, 1000); }
function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaultClocks = [localUserIana, 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
    try {
        const savedClocks = JSON.parse(localStorage.getItem('dashboardClocks'));
        dashboardClocks = (savedClocks && savedClocks.length > 0) ? savedClocks : [...new Set(defaultClocks)];
    } catch (e) {
        dashboardClocks = [...new Set(defaultClocks)];
    }
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
        const isSingleViewActive = !infoWrapper.classList.contains('hidden');
        if (isSingleViewActive) {
            renderDashboard();
            infoWrapper.classList.add('hidden');
            multiClockGrid.classList.remove('hidden');
            viewToggleBtn.innerHTML = '🔳';
            viewToggleBtn.title = 'View Single Clock';
        } else {
            infoWrapper.classList.remove('hidden');
            multiClockGrid.classList.add('hidden');
            viewToggleBtn.innerHTML = '▦';
            viewToggleBtn.title = 'View Dashboard';
        }
    });
    
    setTimeout(() => { dialTrack.classList.add('nudge'); setTimeout(() => { dialTrack.classList.remove('nudge'); }, 500); }, 1500);
});
