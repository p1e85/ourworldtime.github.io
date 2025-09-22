// --- STATE MANAGEMENT ---
let timeZones = [];
let currentIndex;
let clockInterval;
let dialItemWidth = 250;
let isPro = false;
let currentView = 'free';

// --- CONSTANTS ---
const devCode = 'PRO2025';

// --- DOM ELEMENTS ---
const modeSwitchCheckbox = document.getElementById('mode-switch-checkbox');
const topControls = document.querySelector('.top-controls');
const infoWrapper = document.getElementById('clock-info-wrapper');
const cityNameTextElement = document.getElementById('city-name-text');
const timeDisplayElement = document.getElementById('time-display');
const dateDisplayElement = document.getElementById('date-display');
const utcOffsetElement = document.getElementById('utc-offset');
const mainFavoriteIcon = document.getElementById('main-favorite-icon');
const dialContainer = document.getElementById('dial-container');
const dialTrack = document.getElementById('dial-track');
const toastElement = document.getElementById('toast-notification');
const multiClockGrid = document.getElementById('multi-clock-grid');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const formatToggleBtn = document.getElementById('format-toggle-btn');
const unlockModal = document.getElementById('unlock-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const unlockCodeInput = document.getElementById('unlock-code-input');
const submitCodeBtn = document.getElementById('submit-code-btn');
const paymentBtn = document.getElementById('payment-btn');

// --- PRO FEATURE VARIABLES ---
let dashboardClocks = [];
let localUserIana = '';
let dashboardElementsCache = {};
let use12HourFormat = false;

// --- CORE FUNCTIONS ---
function updateStaticInfo(zone) {
    if (!zone) return;
    const now = new Date();
    const dateOptions = { timeZone: zone.iana, weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: zone.iana, timeZoneName: 'shortOffset' });
    const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || '';
    utcOffsetElement.textContent = offsetString.replace('GMT', 'UTC');
    cityNameTextElement.textContent = zone.name;
    dateDisplayElement.textContent = dateString;
    const favoriteIana = localStorage.getItem('favoriteTimeZone');
    mainFavoriteIcon.classList.toggle('hidden', favoriteIana !== zone.iana);
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: zone.iana, hour: '2-digit', hour12: false }));
    updateBackground(hour);
}

function updateBackground(hour) {
    const body = document.body;
    let newClass = '';
    if (hour >= 5 && hour < 11) newClass = 'morning';
    else if (hour >= 11 && hour < 17) newClass = 'day';
    else if (hour >= 17 && hour < 21) newClass = 'evening';
    else newClass = 'night';
    const timeClasses = ['morning', 'day', 'evening', 'night'];
    body.classList.remove(...timeClasses);
    body.classList.add(newClass);
}

function buildDial() {
    dialTrack.innerHTML = '';
    const zonesToDisplay = (currentView === 'pro') 
        ? timeZones 
        : timeZones.slice(0, 24);

    zonesToDisplay.forEach((zone) => {
        const item = document.createElement('div');
        item.className = 'dial-item';
        item.dataset.actualIndex = timeZones.findIndex(tz => tz.iana === zone.iana);
        
        const star = document.createElement('span');
        star.className = 'dial-favorite-star hidden';
        star.textContent = '⭐';
        
        const name = document.createElement('span');
        name.className = 'dial-item-name';
        name.textContent = zone.name;
        
        item.appendChild(star);
        item.appendChild(name);
        
        item.addEventListener('click', () => {
             changeTimeZone(parseInt(item.dataset.actualIndex));
        });
        dialTrack.appendChild(item);
    });
    
    const firstDialItem = dialTrack.querySelector('.dial-item');
    if (firstDialItem) dialItemWidth = firstDialItem.offsetWidth;
}

function updateDialPosition() {
    const zonesToDisplay = (currentView === 'pro') ? timeZones : timeZones.slice(0, 24);
    const displayIndex = zonesToDisplay.findIndex(tz => tz.iana === timeZones[currentIndex]?.iana);

    if (displayIndex === -1) return;

    const containerWidth = dialContainer.offsetWidth;
    const offset = (containerWidth / 2) - (dialItemWidth / 2) - (displayIndex * dialItemWidth);
    dialTrack.style.transform = `translateX(${offset}px)`;

    document.querySelectorAll('.dial-item').forEach(item => {
        const itemIndex = parseInt(item.dataset.actualIndex);
        item.classList.toggle('active', itemIndex === currentIndex);
        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        if (timeZones[itemIndex]) {
            item.querySelector('.dial-favorite-star').classList.toggle('hidden', timeZones[itemIndex].iana !== favoriteIana);
        }
    });
}

function showToast(message) {
    toastElement.textContent = message;
    toastElement.className = 'show';
    setTimeout(() => { toastElement.className = 'hidden'; }, 3900);
}

function changeTimeZone(newIndex) {
    if (newIndex < 0 || newIndex >= timeZones.length) return;
    currentIndex = newIndex;
    const zone = timeZones[newIndex];
    infoWrapper.classList.add('slide-out');
    setTimeout(() => {
        updateStaticInfo(zone);
        updateDialPosition();
        infoWrapper.classList.remove('slide-out');
        infoWrapper.classList.add('slide-in');
        setTimeout(() => infoWrapper.classList.remove('slide-in'), 300);
    }, 150);
}

function updateAllClocks() {
    const now = new Date();
    if (!infoWrapper.classList.contains('hidden') && timeZones[currentIndex]) {
        const is12Hour = isPro && use12HourFormat;
        const timeOptions = { timeZone: timeZones[currentIndex].iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: is12Hour };
        timeDisplayElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
    }
    if (isPro) {
        for (const iana in dashboardElementsCache) {
            const elements = dashboardElementsCache[iana];
            if (elements) {
                const timeOptions = { timeZone: iana, hour: '2-digit', minute: '2-digit', hour12: use12HourFormat };
                elements.time.textContent = now.toLocaleTimeString('en-US', timeOptions);
                const dateOptions = { timeZone: iana, month: 'long', day: 'numeric' };
                elements.date.textContent = now.toLocaleDateString('en-US', dateOptions);
                const timeZoneFormatter = new Intl.DateTimeFormat('en-US', { timeZone: iana, timeZoneName: 'shortOffset' });
                const offsetString = (timeZoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName') || {}).value || '';
                elements.utc.textContent = offsetString.replace('GMT', 'UTC');
            }
        }
    }
}

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateAllClocks, 1000);
}

function setupGestures() {
    const hammer = new Hammer(dialContainer);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    
    hammer.on('panstart panmove panend', (ev) => {
        dialTrack.style.transition = 'none';
        if (ev.type === 'panstart') {
            const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(dialTrack).transform);
            dialTrack.dataset.initialOffset = currentTransform.m41;
        }
        if (ev.type === 'panmove') {
            const initialOffset = parseFloat(dialTrack.dataset.initialOffset) || 0;
            const newOffset = initialOffset + ev.deltaX;
            dialTrack.style.transform = `translateX(${newOffset}px)`;
        }
        if (ev.type === 'panend') {
            dialTrack.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            const currentOffset = parseFloat(dialTrack.dataset.initialOffset) + ev.deltaX;
            
            // --- THIS IS THE CORRECTED LOGIC ---
            const visibleDialItems = dialTrack.querySelectorAll('.dial-item');
            const maxVisibleIndex = visibleDialItems.length - 1;

            let targetDisplayIndex = Math.round(-currentOffset / dialItemWidth);
            targetDisplayIndex = Math.max(0, Math.min(maxVisibleIndex, targetDisplayIndex));
            
            const targetDialItem = visibleDialItems[targetDisplayIndex];
            if (targetDialItem) {
                const actualIndex = parseInt(targetDialItem.dataset.actualIndex, 10);
                changeTimeZone(actualIndex);
            }
        }
    });

    hammer.on('swipedown', () => changeTimeZoneToLocal());
    hammer.on('swipeup', () => {
        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        const currentZone = timeZones[currentIndex];
        if (favoriteIana === currentZone?.iana) {
            localStorage.removeItem('favoriteTimeZone');
            showToast("⭐ Favorite removed.");
        } else if (currentZone) {
            localStorage.setItem('favoriteTimeZone', currentZone.iana);
            showToast(`⭐ Favorite set to ${currentZone.name}.`);
        }
        updateStaticInfo(currentZone);
        updateDialPosition();
    });
}

function changeTimeZoneToLocal() {
    const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
    if (localIndex !== -1) changeTimeZone(localIndex);
}

// --- MODAL & PAYWALL FUNCTIONS ---
function showUnlockModal() {
    unlockModal.classList.remove('hidden');
}

function hideUnlockModal() {
    unlockModal.classList.add('hidden');
}

function unlockProFeatures(code) {
    localStorage.setItem('isPro', 'true');
    localStorage.setItem('unlockCode', code);
    hideUnlockModal();
    localStorage.setItem('currentView', 'pro');
    window.location.reload();
}

function setupModalListeners() {
    closeModalBtn.addEventListener('click', hideUnlockModal);
    
    submitCodeBtn.addEventListener('click', () => {
        const enteredCode = unlockCodeInput.value.trim();
        const savedCode = localStorage.getItem('unlockCode');
        if (enteredCode.toUpperCase() === devCode.toUpperCase() || (savedCode && enteredCode === savedCode)) {
            showToast("✅ Welcome back! Pro features restored.");
            unlockProFeatures(enteredCode);
        } else {
            showToast("Invalid code. Please try again.");
        }
    });

    paymentBtn.addEventListener('click', () => {
        window.location.href = 'https://www.paypal.com/ncp/payment/47J78RQKMNVCJ';
    });
}

// --- PRO-ONLY FUNCTIONS ---
function createMiniClock(zone) {
    const clockEl = document.createElement('div');
    clockEl.className = 'mini-clock';
    const nameEl = document.createElement('h3');
    nameEl.textContent = zone.name;
    const timeEl = document.createElement('div');
    timeEl.className = 'mini-time';
    const dateEl = document.createElement('p');
    dateEl.className = 'mini-date';
    const utcEl = document.createElement('p');
    utcEl.className = 'mini-utc';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-clock-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = `Remove ${zone.name}`;
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeClockFromDashboard(zone.iana);
    });
    clockEl.appendChild(nameEl);
    clockEl.appendChild(timeEl);
    clockEl.appendChild(dateEl);
    clockEl.appendChild(utcEl);
    if (zone.iana !== localUserIana) clockEl.appendChild(deleteBtn);
    return clockEl;
}

function renderDashboard() {
    multiClockGrid.innerHTML = '';
    dashboardElementsCache = {};
    dashboardClocks.forEach(iana => {
        const zoneData = timeZones.find(tz => tz.iana === iana);
        if (zoneData) {
            const clockEl = createMiniClock(zoneData);
            multiClockGrid.appendChild(clockEl);
            dashboardElementsCache[iana] = { time: clockEl.querySelector('.mini-time'), date: clockEl.querySelector('.mini-date'), utc: clockEl.querySelector('.mini-utc') };
        }
    });
    if (dashboardClocks.length < 6) {
        const placeholder = document.createElement('div');
        placeholder.className = 'add-clock-placeholder';
        placeholder.textContent = '+';
        placeholder.title = 'Add current clock to dashboard';
        placeholder.addEventListener('click', addClockToDashboard);
        multiClockGrid.appendChild(placeholder);
    }
}

function addClockToDashboard() {
    if (dashboardClocks.length >= 6) {
        showToast("Dashboard is full (max 6 clocks).");
        return;
    }
    const currentZone = timeZones[currentIndex];
    if (dashboardClocks.includes(currentZone.iana)) {
        showToast(`${currentZone.name} is already on the dashboard.`);
        return;
    }
    dashboardClocks.push(currentZone.iana);
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    showToast(`${currentZone.name} added to dashboard.`);
    renderDashboard();
}

function removeClockFromDashboard(ianaToRemove) {
    if (dashboardClocks.length <= 1) {
        showToast("Dashboard must contain at least one clock.");
        return;
    }
    dashboardClocks = dashboardClocks.filter(iana => iana !== ianaToRemove);
    delete dashboardElementsCache[ianaToRemove];
    localStorage.setItem('dashboardClocks', JSON.stringify(dashboardClocks));
    renderDashboard();
    const zone = timeZones.find(tz => tz.iana === ianaToRemove);
    showToast(`${zone.name} removed from dashboard.`);
}


// --- INITIALIZATION ---
function setupButtonListeners() {
    if (isPro) {
        const savedFormat = localStorage.getItem('use12HourFormat');
        if (savedFormat !== null) use12HourFormat = JSON.parse(savedFormat);
        const updateFormatButtonText = () => { formatToggleBtn.textContent = use12HourFormat ? '24h' : '12h'; };
        updateFormatButtonText();
        formatToggleBtn.addEventListener('click', () => {
            use12HourFormat = !use12HourFormat;
            localStorage.setItem('use12HourFormat', use12HourFormat);
            updateFormatButtonText();
            updateAllClocks();
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
        const savedClocks = JSON.parse(localStorage.getItem('dashboardClocks'));
        const defaultClocks = [localUserIana, 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
        dashboardClocks = (savedClocks && savedClocks.length > 0) ? savedClocks : [...new Set(defaultClocks)];
        if (!dashboardClocks.includes(localUserIana)) dashboardClocks.unshift(localUserIana);
    } else {
        formatToggleBtn.textContent = '24h';
        topControls.addEventListener('click', () => {
            showToast("⭐ Please switch to Pro to use this feature!");
        });
    }
}

async function initialize() {
    isPro = localStorage.getItem('isPro') === 'true';
    currentView = localStorage.getItem('currentView') || 'free';
    if (!isPro) {
        currentView = 'free';
        localStorage.setItem('currentView', 'free');
    }
    document.body.classList.toggle('free-mode', !isPro);
    modeSwitchCheckbox.checked = currentView === 'pro';
    
    const jsonFileToLoad = isPro ? 'timezones_pro.json' : 'timezones_free.json';
    
    try {
        const response = await fetch(jsonFileToLoad);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        timeZones = await response.json();
    } catch (error) {
        console.error(`Fatal Error: Could not load ${jsonFileToLoad}.`, error);
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif;"><h1>Error</h1><p>Could not load data. Please try again.</p></div>`;
        return;
    }

    localUserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let initialIndex = timeZones.findIndex(tz => tz.iana === localUserIana);
    if (initialIndex === -1) initialIndex = timeZones.findIndex(tz => tz.iana === 'Europe/London') || 0;
    
    setupButtonListeners();
    setupModalListeners();
    buildDial();
    changeTimeZone(initialIndex);
    startClock();
    setupGestures();

    setTimeout(() => {
        dialTrack.classList.add('nudge');
        setTimeout(() => dialTrack.classList.remove('nudge'), 500);
    }, 1500);
}

modeSwitchCheckbox.addEventListener('change', () => {
    const wantsPro = modeSwitchCheckbox.checked;
    if (wantsPro) {
        if (isPro) {
            localStorage.setItem('currentView', 'pro');
            window.location.reload();
        } else {
            modeSwitchCheckbox.checked = false;
            showUnlockModal();
        }
    } else {
        localStorage.setItem('currentView', 'free');
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', initialize);

