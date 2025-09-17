// Data: List of all available time zones
const timeZones = [ { name: "Chicago, Mexico City", iana: "America/Chicago" }, { name: "New York, Lima", iana: "America/New_York" }, { name: "London, Dublin", iana: "Europe/London" }, { name: "Paris, Rome", iana: "Europe/Paris" }, { name: "Moscow, Istanbul", iana: "Europe/Moscow" }, { name: "Dubai, Baku", iana: "Asia/Dubai" }, { name: "Tokyo, Seoul", iana: "Asia/Tokyo" }, { name: "Sydney, Guam", iana: "Australia/Sydney" } ];

// State: A hardcoded list of clocks to display
const dashboardClocks = ["America/New_York", "Europe/London", "Asia/Tokyo"];

// DOM Elements
const multiClockGrid = document.getElementById('multi-clock-grid');

/** Creates a single mini clock element */
function createMiniClock(zone) {
    const clockEl = document.createElement('div');
    clockEl.className = 'mini-clock';
    const nameEl = document.createElement('h3');
    nameEl.textContent = zone.name;
    const timeEl = document.createElement('div');
    timeEl.className = 'mini-time';
    timeEl.dataset.iana = zone.iana; // Use data attribute to find later
    
    clockEl.appendChild(nameEl);
    clockEl.appendChild(timeEl);
    return clockEl;
}

/** Clears and redraws the dashboard */
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

/** Updates the time text on all visible clocks */
function updateClocks() {
    dashboardClocks.forEach(iana => {
        const timeEl = multiClockGrid.querySelector(`.mini-time[data-iana="${iana}"]`);
        if (timeEl) {
            const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            timeEl.textContent = new Date().toLocaleTimeString('en-US', timeOptions);
        }
    });
}

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        renderDashboard(); // Initial render
        updateClocks(); // Initial time update
        setInterval(updateClocks, 1000); // Update every second
    } catch (error) {
        // If an error happens, display it on the screen
        document.body.innerHTML = `<h1 style="color:red;">An error occurred:</h1><pre style="color:white; font-size: 1.2em;">${error.stack}</pre>`;
        console.error("Critical Error:", error);
    }
});
