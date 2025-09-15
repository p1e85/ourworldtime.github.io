function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const hammer = new Hammer(clockContainer);
    
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    hammer.on('swiperight', () => {
        isLocalTime = false;
        currentIndex = (currentIndex - 1 + timeZones.length) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]);
        startClock();
        updateDialPosition();
    });

    hammer.on('swipeleft', () => {
        isLocalTime = false;
        currentIndex = (currentIndex + 1) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]);
        startClock();
        updateDialPosition();
    });

    hammer.on('swipedown', () => {
        isLocalTime = true;
        displayLocalTime();
        startClock();
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            currentIndex = localIndex;
            updateDialPosition();
        }
    });

    // REWRITTEN swipeup handler
    hammer.on('swipeup', () => {
        if (isLocalTime) {
            showToast("Cannot favorite your local time.");
            return;
        }

        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        const currentZone = timeZones[currentIndex];

        if (favoriteIana === currentZone.iana) {
            // It's already the favorite, so unfavorite it
            localStorage.removeItem('favoriteTimeZone');
            showToast("⭐ Favorite removed.");
        } else {
            // It's not the favorite, so set it
            localStorage.setItem('favoriteTimeZone', currentZone.iana);
            showToast(`⭐ Favorite set to ${currentZone.name}.`);
        }

        // Instantly update the UI to reflect the change
        displayTimeForZone(currentZone);
        updateDialPosition();
    });
}

document.addEventListener('DOMContentLoaded', setupGestures);
