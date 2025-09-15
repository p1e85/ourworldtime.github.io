function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const hammer = new Hammer(clockContainer);
    
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    hammer.on('swiperight', () => {
        const newIndex = (currentIndex - 1 + timeZones.length) % timeZones.length;
        changeTimeZone(newIndex);
    });

    hammer.on('swipeleft', () => {
        const newIndex = (currentIndex + 1) % timeZones.length;
        changeTimeZone(newIndex);
    });

    hammer.on('swipedown', () => {
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            changeTimeZone(localIndex);
        }
    });

    hammer.on('swipeup', () => {
        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        const currentZone = timeZones[currentIndex];

        if (favoriteIana === currentZone.iana) {
            localStorage.removeItem('favoriteTimeZone');
            showToast("⭐ Favorite removed.");
        } else {
            localStorage.setItem('favoriteTimeZone', currentZone.iana);
            showToast(`⭐ Favorite set to ${currentZone.name}.`);
        }
        updateStaticInfo(currentZone); // Instantly update star on main display
        updateDialPosition(); // Instantly update star on dial
    });
}

document.addEventListener('DOMContentLoaded', setupGestures);
