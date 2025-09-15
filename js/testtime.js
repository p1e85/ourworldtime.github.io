// A constant list of our 24 chosen time zones
const timeZones = [
    { name: "Samoa, Midway", iana: "Pacific/Samoa", offset: "UTC-11" },
    { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu", offset: "UTC-10" },
    { name: "Alaska, Anchorage", iana: "America/Anchorage", offset: "UTC-9" },
    { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles", offset: "UTC-8" },
    { name: "Denver, Phoenix", iana: "America/Denver", offset: "UTC-7" },
    { name: "Chicago, Mexico City", iana: "America/Chicago", offset: "UTC-6" },
    { name: "New York, Lima", iana: "America/New_York", offset: "UTC-5" },
    { name: "Halifax, Santiago", iana: "America/Halifax", offset: "UTC-4" },
    { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo", offset: "UTC-3" },
    { name: "South Georgia", iana: "Atlantic/South_Georgia", offset: "UTC-2" },
    { name: "Azores, Cape Verde", iana: "Atlantic/Azores", offset: "UTC-1" },
    { name: "London, Dublin", iana: "Europe/London", offset: "UTC+0" },
    { name: "Paris, Rome", iana: "Europe/Paris", offset: "UTC+1" },
    { name: "Cairo, Johannesburg", iana: "Africa/Cairo", offset: "UTC+2" },
    { name: "Moscow, Istanbul", iana: "Europe/Moscow", offset: "UTC+3" },
    { name: "Dubai, Baku", iana: "Asia/Dubai", offset: "UTC+4" },
    { name: "Karachi, Tashkent", iana: "Asia/Karachi", offset: "UTC+5" },
    { name: "Dhaka, Almaty", iana: "Asia/Dhaka", offset: "UTC+6" },
    { name: "Bangkok, Jakarta", iana: "Asia/Bangkok", offset: "UTC+7" },
    { name: "Shanghai, Perth", iana: "Asia/Shanghai", offset: "UTC+8" },
    { name: "Tokyo, Seoul", iana: "Asia/Tokyo", offset: "UTC+9" },
    { name: "Sydney, Guam", iana: "Australia/Sydney", offset: "UTC+10" },
    { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok", offset: "UTC+11" },
    { name: "Auckland, Fiji", iana: "Pacific/Auckland", offset: "UTC+12" }
];

// Variable to track which time zone we are currently displaying
let currentIndex;

// --- DOM ELEMENTS ---
const cityNameElement = document.getElementById('city-name');
const timeDisplayElement = document.getElementById('time-display');
const utcOffsetElement = document.getElementById('utc-offset');

// --- FUNCTIONS ---

// Displays the time for a given time zone object
function displayTimeForZone(zone) {
    const options = {
        timeZone: zone.iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    };

    const timeString = new Date().toLocaleTimeString('en-US', options);
    
    cityNameElement.textContent = zone.name;
    timeDisplayElement.textContent = timeString;
    utcOffsetElement.textContent = zone.offset;

    // Also update the background based on the displayed time's hour
    const hour = parseInt(timeString.substring(0, 2));
    updateBackground(hour);
}

function updateBackground(hour) {
    const body = document.body;
    let newClass = '';
    if (hour >= 5 && hour < 11) { newClass = 'morning'; }
    else if (hour >= 11 && hour < 17) { newClass = 'day'; }
    else if (hour >= 17 && hour < 21) { newClass = 'evening'; }
    else { newClass = 'night'; }
    if (body.className !== newClass) { body.className = newClass; }
}

// Main loop that runs every second
function clockLoop() {
    displayTimeForZone(timeZones[currentIndex]);
    setTimeout(clockLoop, 1000);
}

// --- INITIALIZATION ---

// This code runs once when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Detect user's local time zone
    const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Find the index of the user's time zone in our list
    let initialIndex = timeZones.findIndex(tz => tz.iana === localIana);

    // If not found, default to London (UTC+0)
    if (initialIndex === -1) {
        initialIndex = timeZones.findIndex(tz => tz.iana === "Europe/London");
    }

    currentIndex = initialIndex;
    
    // Start the clock
    clockLoop();
});
