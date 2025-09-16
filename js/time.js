const timeZones = [
    { name: "Samoa, Midway", iana: "Pacific/Samoa" },
    { name: "Hawaii, Honolulu", iana: "Pacific/Honolulu" },
    { name: "Alaska, Anchorage", iana: "America/Anchorage" },
    { name: "Los Angeles, Vancouver", iana: "America/Los_Angeles" },
    { name: "Denver, Phoenix", iana: "America/Denver" },
    { name: "Chicago, Mexico City", iana: "America/Chicago" },
    { name: "New York, Lima", iana: "America/New_York" },
    { name: "Halifax, Santiago", iana: "America/Halifax" },
    { name: "São Paulo, Buenos Aires", iana: "America/Sao_Paulo" },
    { name: "South Georgia", iana: "Atlantic/South_Georgia" },
    { name: "Azores, Cape Verde", iana: "Atlantic/Azores" },
    { name: "London, Dublin", iana: "Europe/London" },
    { name: "Paris, Rome", iana: "Europe/Paris" },
    { name: "Cairo, Johannesburg", iana: "Africa/Cairo" },
    { name: "Moscow, Istanbul", iana: "Europe/Moscow" },
    { name: "Dubai, Baku", iana: "Asia/Dubai" },
    { name: "Karachi, Tashkent", iana: "Asia/Karachi" },
    { name: "Dhaka, Almaty", iana: "Asia/Dhaka" },
    { name: "Bangkok, Jakarta", iana: "Asia/Bangkok" },
    { name: "Shanghai, Perth", iana: "Asia/Shanghai" },
    { name: "Tokyo, Seoul", iana: "Asia/Tokyo" },
    { name: "Sydney, Guam", iana: "Australia/Sydney" },
    { name: "Vladivostok, Solomon Is.", iana: "Asia/Vladivostok" },
    // FIX: Corrected a typo here from "name:g" to "name:"
    { name: "Auckland, Fiji", iana: "Pacific/Auckland" }
];

let currentIndex;
let clockInterval;

const infoWrapper = document.getElementById('clock-info-wrapper');
const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const dateDisplayElement = document.getElementById('date-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialContainer = document.getElementById('dial-container');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');
const markTimezoneBtn = document.getElementById('mark-timezone-btn');

function updateTime(zone) { const timeOptions = { timeZone: zone.iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; timeDisplayElement.textContent = new Date().toLocaleTimeString('en-US', timeOptions); }
function updateStaticInfo(zone) { const now = new Date(); const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' }; const dateString = now.toLocaleDateString('en-US', dateOptions); const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset', }); const offsetString = timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName').value; utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC'); cityNameTextElement.textContent = zone.name; dateDisplayElement.textContent = dateString; const favoriteIana = localStorage.getItem('favoriteTimeZone'); mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana); const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: zone.iana, hour: '2-digit', hour12: false })); updateBackground(hour); }
function updateBackground(hour) { const body = document.body; let newClass = ''; if (hour >= 5 && hour < 11) { newClass = 'morning'; } else if (hour >= 11 && hour < 17) { newClass = 'day'; } else if (hour >= 17 && hour < 21) { newClass = 'evening'; } else { newClass = 'night'; } if (body.className !== newClass) { body.className = newClass; } }
function startClock() { if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(() => { updateTime(timeZones[currentIndex]); }, 1000); }
function changeTimeZone(newIndex) { currentIndex = newIndex; const zone = timeZones[currentIndex]; infoWrapper.classList.add('slide-out'); setTimeout(() => { updateStaticInfo(zone); updateTime(zone); updateDialPosition(); infoWrapper.classList.remove('slide-out'); infoWrapper.classList.add('slide-in'); setTimeout(() => infoWrapper.classList.remove('slide-in'), 300); }, 150); }

function updateDialPosition() {
    const itemWidth = 250;
    const containerWidth = dialContainer.offsetWidth;
    const offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * itemWidth);
    dialTrack.style.transform = `translateX(${offset}px)`;
    const allItems = document.querySelectorAll('.dial-item');
    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    const markedZones = JSON.parse(localStorage.getItem('markedTimeZones')) || [];
    allItems.forEach((item, index) => {
        const zone = timeZones[index];
        item.classList.toggle('active', index === currentIndex);
        item.querySelector('.dial-favorite-star').classList.toggle('hidden', zone.iana !== favoriteIana);
        item.querySelector('.dial-visited-mark').classList.toggle('hidden', !markedZones.includes(zone.iana));
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
        const mark = document.createElement('span');
        mark.className = 'dial-visited-mark hidden';
        mark.textContent = '✔️';
        const name = document.createElement('span');
        name.className = 'dial-item-name';
        name.textContent = zone.name;
        item.appendChild(star);
        item.appendChild(name);
        item.appendChild(mark);
        item.addEventListener('click', () => changeTimeZone(index));
        dialTrack.appendChild(item);
    });
}

function showToast(message) { toastElement.textContent = message; toastElement.className = 'show'; setTimeout(() => { toastElement.className = 'hidden'; }, 3900); }

markTimezoneBtn.addEventListener('click', () => {
    const currentZone = timeZones[currentIndex];
    let markedZones = JSON.parse(localStorage.getItem('markedTimeZones')) || [];
    if (markedZones.includes(currentZone.iana)) {
        markedZones = markedZones.filter(iana => iana !== currentZone.iana);
        showToast(`✔️ Unmarked ${currentZone.name}`);
    } else {
        markedZones.push(currentZone.iana);
        showToast(`✔️ Marked ${currentZone.name} as visited!`);
    }
    localStorage.setItem('markedTimeZones', JSON.stringify(markedZones));
    updateDialPosition();
});

document.addEventListener('DOMContentLoaded', () => {
    buildDial();
    const savedFavoriteIana = localStorage.getItem('favoriteTimeZone'); let initialIndex = timeZones.findIndex(tz => tz.iana === savedFavoriteIana); if (initialIndex === -1) { const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone; initialIndex = timeZones.findIndex(tz => tz.iana === localIana); if (initialIndex === -1) initialIndex = 11; } currentIndex = initialIndex; updateStaticInfo(timeZones[currentIndex]); updateTime(timeZones[currentIndex]); updateDialPosition(); startClock();
    setTimeout(() => { dialTrack.classList.add('nudge'); setTimeout(() => { dialTrack.classList.remove('nudge'); }, 500); }, 1500);
});
