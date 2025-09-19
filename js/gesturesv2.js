// IMPORT the gestures setup function from the other file
import { setupGestures } from './gestures_v1.2.js';

// EXPORT the variables and functions needed by other files
export let timeZones = [];
export let currentIndex;
export let dialItemWidth = 250;
export const infoWrapper = document.getElementById('clock-info-wrapper');

let clockInterval;
let dashboardClocks = [];
let localUserIana = '';
let dashboardElementsCache = {};
let use12HourFormat = false; // Default to 24-hour format

const multiClockGrid = document.getElementById('multi-clock-grid');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const dateDisplayElement = document.getElementById('date-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');
const addClockBtn = document.getElementById('add-clock-btn');
const dialContainer = document.getElementById('dial-container');

export function updateStaticInfo(zone) { if (!zone) return; const now = new Date(); const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' }; const dateString = now.toLocaleDateString('en-US', dateOptions); const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset' }); const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || ''; utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC'); cityNameTextElement.textContent = zone.name; dateDisplayElement.textContent = dateString; const favoriteIana = localStorage.getItem('favoriteTimeZone'); mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana); const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: zone.iana, hour: '2-digit', hour12: false })); updateBackground(hour); }
function updateBackground(hour) { const body = document.body; let newClass = ''; if (hour >= 5 && hour < 11) { newClass = 'morning'; } else if (hour >= 11 && hour < 17) { newClass = 'day'; } else if (hour >= 17 && hour < 21) { newClass = 'evening'; } else { newClass = 'night'; } if (body.className !== newClass) { body.className = newClass; } }
export function updateDialPosition() {
  
    // We now use the width of the dialContainer, not the infoWrapper.
    const containerWidth = dialContainer.offsetWidth; 
    
    const offset = (containerWidth / 2) - (dialItemWidth / 2) - (currentIndex * dialItemWidth);
    dialTrack.style.transform = `translateX(${offset}px)`;
    
    const allItems = document.querySelectorAll('.dial-item');
    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    
    allItems.forEach((item, index) => {
        const zone = timeZones[index];
        item.classList.toggle('active', index === currentIndex);
        item.querySelector('.dial-favorite-star').classList.toggle('hidden', zone.iana !== favoriteIana);
    });
}

//function buildDial() { timeZones.forEach((zone, index) => { const item = document.createElement('div'); item.className = 'dial-item'; item.dataset.index = index; const star = document.createElement('span'); star.className = 'dial-favorite-star hidden'; star.textContent = '⭐'; const name = document.createElement('span'); name.className = 'dial-item-name'; name.textContent = zone.name; item.appendChild(star); item.appendChild(name); item.addEventListener('click', () => changeTimeZone(index)); dialTrack.appendChild(item); }); }
function renderDial(zonesToDisplay) {
    dialTrack.innerHTML = ''; // Clear the current dial
    zonesToDisplay.forEach(zone => {
        // Find the original index to keep everything linked correctly
        const originalIndex = timeZones.findIndex(tz => tz.iana === zone.iana);

        const item = document.createElement('div');
        item.className = 'dial-item';
        item.dataset.index = originalIndex; // Use the original index
        
        const star = document.createElement('span');
        star.className = 'dial-favorite-star hidden';
        star.textContent = '⭐';
        
        const name = document.createElement('span');
        name.className = 'dial-item-name';
        name.textContent = zone.name;
        
        item.appendChild(star);
        item.appendChild(name);
        item.addEventListener('click', () => changeTimeZone(originalIndex));
        dialTrack.appendChild(item);
    });
    // After rebuilding, we need to update the dial's position
    updateDialPosition();
}

export function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }
function createMiniClock(zone) { const clockEl = document.createElement('div'); clockEl.className = 'mini-clock'; const nameEl = document.createElement('h3'); nameEl.textContent = zone.name; const timeEl = document.createElement('div'); timeEl.className = 'mini-time'; const dateEl = document.createElement('p'); dateEl.className = 'mini-date'; const utcEl = document.createElement('p'); utcEl.className = 'mini-utc'; const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-clock-btn'; deleteBtn.innerHTML = '&times;'; deleteBtn.title = `Remove ${zone.name}`; deleteBtn.addEventListener('click', () => removeClockFromDashboard(zone.iana)); clockEl.appendChild(nameEl); clockEl.appendChild(timeEl); clockEl.appendChild(dateEl); clockEl.appendChild(utcEl); if (zone.iana !== localUserIana) { clockEl.appendChild(deleteBtn); } return clockEl; }
function renderDashboard() { multiClockGrid.innerHTML = ''; dashboardElementsCache = {}; dashboardClocks.forEach(iana => { const zoneData = timeZones.find(tz => tz.iana === iana); if (zoneData) { const clockEl = createMiniClock(zoneData); multiClockGrid.appendChild(clockEl); dashboardElementsCache[iana] = { time: clockEl.querySelector('.mini-time'), date: clockEl.querySelector('.mini-date'), utc: clockEl.querySelector('.mini-utc') }; } }); if (dashboardClocks.length < 6) { const placeholder = document.createElement('div'); placeholder.className = 'add-clock-placeholder'; placeholder.textContent = '+'; placeholder.title = 'Add a new clock'; placeholder.addEventListener('click', addClockToDashboard); multiClockGrid.appendChild(placeholder); } }
function updateAllClocks() {
    const now = new Date();
    
    // Update the main clock
    if (!infoWrapper.classList.contains('hidden')) {
        const mainZone = timeZones[currentIndex];
        if (mainZone) {
            const timeOptions = { 
                timeZone: mainZone.iana, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: use12HourFormat // ✅ The new dynamic option
            };
            timeDisplayElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
        }
    }
    
    // Update dashboard clocks
    for (const iana in dashboardElementsCache) {
        const elements = dashboardElementsCache[iana];
        if (elements) {
            const timeOptions = { 
                timeZone: iana, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: use12HourFormat // ✅ The new dynamic option
            };
            elements.time.textContent = now.toLocaleTimeString('en-US', timeOptions);

            // Date and UTC logic remains the same
            const dateOptions = { timeZone: iana, month: 'long', day: 'numeric' };
            elements.date.textContent = now.toLocaleDateString('en-US', dateOptions);
            const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'shortOffset' });
            const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || '';
            elements.utc.textContent = offsetString.replace('GMT', 'UTC');
        }
    }
}

function removeClockFromDashboard(ianaToRemove) { if (dashboardClocks.length <= 1) { showToast("Dashboard must contain at least one clock."); return; } dashboardClocks = dashboardClocks.filter(iana => iana !== ianaToRemove); delete dashboardElementsCache[ianaToRemove]; localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks)); renderDashboard(); const zone = timeZones.find(tz => tz.iana === ianaToRemove); showToast(`${zone.name} removed from dashboard.`); }
export function changeTimeZone(newIndex) { currentIndex = newIndex; updateDialPosition(); const zone = timeZones[newIndex]; infoWrapper.classList.add('slide-out'); setTimeout(() => { updateStaticInfo(zone); infoWrapper.classList.remove('slide-out'); infoWrapper.classList.add('slide-in'); setTimeout(() => infoWrapper.classList.remove('slide-in'), 300); }, 150); }
function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateAllClocks, 1000); }
function addClockToDashboard() { if (dashboardClocks.length >= 6) { showToast("Dashboard is full (max 6 clocks)."); return; } const currentZone = timeZones[currentIndex]; if (dashboardClocks.includes(currentZone.iana)) { showToast(`${currentZone.name} is already on the dashboard.`); return; } dashboardClocks.push(currentZone.iana); localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks)); showToast(`${currentZone.name} added to dashboard.`); renderDashboard(); }

document.addEventListener('DOMContentLoaded', async () => { 
    try { 
        const response = await fetch('timezones.json'); 
        if (!response.ok) { 
            throw new Error(`HTTP error! status: ${response.status}`); 
        } 
        timeZones = await response.json(); 
    } catch (error) { 
        console.error("Could not load timezones:", error); 
        return; 
    } 
    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone; 
    const defaultClocks = [localUserIana, 'America/New_York', 'Europe/London', 'Asia/Tokyo']; 
    try { 
        const savedClocks = JSON.parse(localStorage.getItem('dashboardClocks')); 
        dashboardClocks = (savedClocks && savedClocks.length > 0) ? savedClocks : [...new Set(defaultClocks)]; 
    } catch (e) { 
        dashboardClocks = [...new Set(defaultClocks)]; 
    } 
    if (!dashboardClocks.includes(localUserIana)) { 
        dashboardClocks.unshift(localUserIana); 
    } 

    //buildDial();
    renderDial(timeZones);

    // --- THIS IS THE FIX ---
    // After building the dial, measure the actual width of one of its items.
    const firstDialItem = dialTrack.querySelector('.dial-item');
    if (firstDialItem) {
        dialItemWidth = firstDialItem.offsetWidth;
    }
    // --- END FIX ---

    let initialIndex = timeZones.findIndex(tz => tz.iana === localUserIana); 
    if (initialIndex === -1) initialIndex = 11; 
    
    currentIndex = initialIndex; 
    updateStaticInfo(timeZones[currentIndex]); 
    updateDialPosition(); 
    startClock(); 
    setupGestures(); 

    const formatToggleBtn = document.getElementById('format-toggle-btn');

    // Function to update the button's text (e.g., "12h" or "24h")
    const updateFormatButtonText = () => {
        formatToggleBtn.textContent = use12HourFormat ? '24h' : '12h';
    };

    // Load the saved setting from localStorage when the app starts
    const savedFormat = localStorage.getItem('use12HourFormat');
    if (savedFormat !== null) {
        use12HourFormat = JSON.parse(savedFormat);
    }
    updateFormatButtonText(); // Set initial button text

    // Handle clicks on the toggle button
    formatToggleBtn.addEventListener('click', () => {
        use12HourFormat = !use12HourFormat; // Flip the setting
        localStorage.setItem('use12HourFormat', use12HourFormat); // Save the choice
        updateFormatButtonText(); // Update the button text
        updateAllClocks(); // Instantly refresh all clocks with the new format
    });
  
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
    
    addClockBtn.addEventListener('click', addClockToDashboard); 

    const dialSearchInput = document.getElementById('dial-search');
    dialSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm) {
            const filteredZones = timeZones.filter(zone => 
                zone.name.toLowerCase().includes(searchTerm)
            );
            renderDial(filteredZones);
        } else {
            // If search is cleared, render the full list
            renderDial(timeZones);
        }
    });
  
    setTimeout(() => { 
        dialTrack.classList.add('nudge'); 
        setTimeout(() => { 
            dialTrack.classList.remove('nudge'); 
        }, 500); 
    }, 1500); 
});
