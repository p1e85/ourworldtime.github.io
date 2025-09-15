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

let currentIndex;
let isLocalTime = true;
let clockInterval;

const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialContainer = document.getElementById('dial-container');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');

function displayTimeForZone(zone) {
    const options = { timeZone: zone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeString = new Date().toLocaleTimeString('en-US', options);
    
    cityNameTextElement.textContent = zone.name;
    timeDisplayElement.textContent = timeString;
    utcOffsetElement.textContent = zone.offset;
    
    // Show/hide the main favorite icon
    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    if (favoriteIana === zone.iana) {
        mainFavoriteIcon.classList.remove('hidden');
    } else {
        mainFavoriteIcon.classList.add('hidden');
    }
    
    const hour = parseInt(timeString.substring(0, 2));
    updateBackground(hour);
}

function displayLocalTime() {
    const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let localZone = timeZones.find(tz => tz.iana === localIana);
    
    if (!localZone) localZone = { name: "Your Local Time", iana: localIana, offset: "" };
    
    displayTimeForZone(localZone);
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

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
        if (isLocalTime) {
            displayLocalTime();
        } else {
            displayTimeForZone(timeZones[currentIndex]);
        }
    }, 1000);
}

function updateDialPosition() {
    const itemWidth = 200;
    const containerWidth = dialContainer.offsetWidth;
    const offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth);
    
    dialTrack.style.transform = `translateX(${offset}px)`;

    const allItems = document.querySelectorAll('.dial-item');
    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    allItems.forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
        const star = item.querySelector('.dial-favorite-star');
        star.classList.toggle('hidden', timeZones[index].iana !== favoriteIana);
    });
}

function buildDial() {
    timeZones.forEach((zone, index) => {
        const item = document.createElement('div');
        item.className = 'dial-item';
        item.dataset.index = index;

        const star = document.createElement('span');
        star.className = 'dial-favorite-star hidden';
        star.textContent = '⭐';

        const name = document.createElement('span');
        name.textContent = zone.name;
        
        item.appendChild(star);
        item.appendChild(name);

        item.addEventListener('click', () => {
            isLocalTime = false;
            currentIndex = index;
            displayTimeForZone(timeZones[currentIndex]);
            updateDialPosition();
            startClock();
        });
        dialTrack.appendChild(item);
    });
}

// NEW: Shows a message in a toast notification
function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove('hidden');
    toastElement.style.animation = 'fadeinout 4s ease-in-out';
    
    // Hide the element after the animation is done
    setTimeout(() => {
        toastElement.classList.add('hidden');
        toastElement.style.animation = 'none'; // Reset animation
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    buildDial();

    const savedFavoriteIana = localStorage.getItem('favoriteTimeZone');
    let initialIndex = -1;

    if (savedFavoriteIana) {
        isLocalTime = false;
        initialIndex = timeZones.findIndex(tz => tz.iana === savedFavoriteIana);
    } 
    
    if (initialIndex === -1) {
        isLocalTime = true;
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        initialIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (initialIndex === -1) initialIndex = 11;
        displayLocalTime();
    } else {
        displayTimeForZone(timeZones[initialIndex]);
    }
    
    currentIndex = initialIndex;
    updateDialPosition();
    startClock();
});
