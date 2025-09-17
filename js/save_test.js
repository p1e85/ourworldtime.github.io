const timeZones = [ { name: "Samoa, Midway", iana: "Pacific/Samoa" }, { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu" }, { name: "Alaska, Anchorage", iana: "America/Anchorage" }, { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles" }, { name: "Denver, Phoenix", iana: "America/Denver" }, { name: "Chicago, Mexico City", iana: "America/Chicago" }, { name: "New York, Lima", iana: "America/New_York" }, { name: "Halifax, Santiago", iana: "America/Halifax" }, { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo" }, { name: "South Georgia", iana: "Atlantic/South_Georgia" }, { name: "Azores, Cape Verde", iana: "Atlantic/Azores" }, { name: "London, Dublin", iana: "Europe/London" }, { name: "Paris, Rome", iana: "Europe/Paris" }, { name: "Cairo, Johannesburg", iana: "Africa/Cairo" }, { name: "Moscow, Istanbul", iana: "Europe/Moscow" }, { name: "Dubai, Baku", iana: "Asia/Dubai" }, { name: "Karachi, Tashkent", iana: "Asia/Karachi" }, { name: "Dhaka, Almaty", iana: "Asia/Dhaka" }, { name: "Bangkok, Jakarta", iana: "Asia/Bangkok" }, { name: "Shanghai, Perth", iana: "Asia/Shanghai" }, { name: "Tokyo, Seoul", iana: "Asia/Tokyo" }, { name: "Sydney, Guam", iana: "Australia/Sydney" }, { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok" }, { name: "Auckland, Fiji", iana: "Pacific/Auckland" } ];

let currentIndex;
let clockInterval;
let dialItemWidth = 250;
let savedDashboardClocks = []; // For clocks saved in localStorage
let tempDashboardClocks = []; // For clocks in the current editing session
let localUserIana = '';

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
const addClockBtn = document.getElementById('add-clock-btn');

function updateStaticInfo(zone) { if (!zone) return; const now = new Date(); const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' }; const dateString = now.toLocaleDateString('en-US', dateOptions); const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset' }); const offsetString = timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName').value; utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC'); cityNameTextElement.textContent = zone.name; dateDisplayElement.textContent = dateString; const favoriteIana = localStorage.getItem('favoriteTimeZone'); mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana); const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: zone.iana, hour: '2-digit', hour12: false })); updateBackground(hour); }
function updateBackground(hour) { const body = document.body; let newClass = ''; if (hour >= 5 && hour < 11) { newClass = 'morning'; } else if (hour >= 11 && hour < 17) { newClass = 'day'; } else if (hour >= 17 && hour < 21) { newClass = 'evening'; } else { newClass = 'night'; } if (body.className !== newClass) { body.className = newClass; } }
function updateDialPosition() { const itemWidth = dialItemWidth; const containerWidth = dialContainer.offsetWidth; const offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth); dialTrack.style.transform = `translateX(${offset}px)`; const allItems = document.querySelectorAll('.dial-item'); const favoriteIana = localStorage.getItem('favoriteTimeZone'); allItems.forEach((item, index) => { const zone = timeZones[index]; item.classList.toggle('active', index === currentIndex); item.querySelector('.dial-favorite-star').classList.toggle('hidden', zone.iana !== favoriteIana); }); }
function buildDial() { timeZones.forEach((zone, index) => { const item = document.createElement('div'); item.className = 'dial-item'; item.dataset.index = index; const star = document.createElement('span'); star.className = 'dial-favorite-star hidden'; star.textContent = '⭐'; const name = document.createElement('span'); name.className = 'dial-item-name'; name.textContent = zone.name; item.appendChild(star); item.appendChild(name); item.addEventListener('click', () => changeTimeZone(index)); dialTrack.appendChild(item); }); }
function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }

function createMiniClock(zone) {
    const clockEl = document.createElement('div'); clockEl.className = 'mini-clock';
    const nameEl = document.createElement('h3'); nameEl.textContent = zone.name;
    const timeEl = document.createElement('div'); timeEl.className = 'mini-time'; timeEl.dataset.iana = zone.iana;
    const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-clock-btn'; deleteBtn.innerHTML = '&times;'; deleteBtn.title = `Remove ${zone.name}`;
    deleteBtn.addEventListener('click', () => removeClockFromStaging(zone.iana));
    const leftSide = document.createElement('div'); leftSide.appendChild(nameEl);
    const rightSide = document.createElement('div'); rightSide.style.display = 'flex'; rightSide.style.alignItems = 'center';
    rightSide.appendChild(timeEl);
    if (zone.iana !== localUserIana) { rightSide.appendChild(deleteBtn); }
    clockEl.appendChild(leftSide); clockEl.appendChild(rightSide);
    return clockEl;
}

function renderDashboard(clockList) {
    multiClockGrid.innerHTML = '';
    clockList.forEach(iana => {
        const zoneData = timeZones.find(tz => tz.iana === iana);
        if (zoneData) {
            const clockEl = createMiniClock(zoneData);
            multiClockGrid.appendChild(clockEl);
        }
    });
}

function updateAllClocks() {
    updateTime(timeZones[currentIndex]); // Update the main single clock view time
    const clockList = clockContainer.classList.contains('multi-view-active') ? tempDashboardClocks : savedDashboardClocks;
    clockList.forEach(iana => {
        const timeEl = multiClockGrid.querySelector(`.mini-time[data-iana="${iana}"]`);
        if (timeEl) {
            const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            timeEl.textContent = new Date().toLocaleTimeString('en-US', timeOptions);
        }
    });
}
function updateTime(zone) { if (!zone) return; const timeOptions = { timeZone: zone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; timeDisplayElement.textContent = new Date().toLocaleTimeString('en-US', timeOptions); }

function addClockToStaging() {
    const selectedZone = timeZones[currentIndex];
    if (tempDashboardClocks.includes(selectedZone.iana)) { showToast(`${selectedZone.name} is already in the list.`); return; }
    if (tempDashboardClocks.length >= 4) { showToast("Dashboard is full (max 4 clocks)."); return; }
    tempDashboardClocks.push(selectedZone.iana);
    renderDashboard(tempDashboardClocks);
}

function removeClockFromStaging(ianaToRemove) {
    if (ianaToRemove === localUserIana) { showToast("Your local time cannot be removed."); return; }
    tempDashboardClocks = tempDashboardClocks.filter(iana => iana !== ianaToRemove);
    renderDashboard(tempDashboardClocks);
}

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

function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateAllClocks, 1000); }

document.addEventListener('DOMContentLoaded', () => {
    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromStorage = JSON.parse(localStorage.getItem('savedDashboardClocks'));
    savedDashboardClocks = (fromStorage && fromStorage.length > 0) ? fromStorage : [localUserIana];
    
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
        const isMultiView = clockContainer.classList.contains('multi-view-active');
        if (isMultiView) {
            // -- SAVE AND EXIT --
            savedDashboardClocks = [...tempDashboardClocks];
            localStorage.setItem('savedDashboardClocks', JSON.stringify(savedDashboardClocks));
            showToast("Dashboard saved!");
            clockContainer.classList.remove('multi-view-active');
            addClockBtn.classList.add('hidden');
            viewToggleBtn.textContent = '▦';
            viewToggleBtn.title = 'View Dashboard';
        } else {
            // -- ENTER DASHBOARD MODE --
            const currentSelectedZone = timeZones[currentIndex];
            tempDashboardClocks = [currentSelectedZone.iana]; // Start with the currently selected clock
            renderDashboard(tempDashboardClocks);
            clockContainer.classList.add('multi-view-active');
            addClockBtn.classList.remove('hidden');
            viewToggleBtn.textContent = '💾';
            viewToggleBtn.title = 'Save and Exit Dashboard';
        }
    });
    addClockBtn.addEventListener('click', addClockToStaging);
});
