function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const hammer = new Hammer(clockContainer);
    
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    // SWIPE RIGHT
    hammer.on('swiperight', () => {
        isLocalTime = false;
        currentIndex = (currentIndex - 1 + timeZones.length) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]);
        startClock();
        updateDialPosition(); // Sync the dial
    });

    // SWIPE LEFT
    hammer.on('swipeleft', () => {
        isLocalTime = false;
        currentIndex = (currentIndex + 1) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]);
        startClock();
        updateDialPosition(); // Sync the dial
    });

    // SWIPE DOWN
    hammer.on('swipedown', () => {
        isLocalTime = true;
        displayLocalTime();
        startClock();

        // Also move the dial to the local time zone's position
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            currentIndex = localIndex;
            updateDialPosition();
        }
    });

    // SWIPE UP (Favorite)
    hammer.on('swipeup', () => {
        if (isLocalTime) {
            alert("Cannot save local time. Please select a time zone from the list first.");
            return;
        }

        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        const currentZone = timeZones[currentIndex];

        if (favoriteIana && favoriteIana === currentZone.iana) {
            alert("This is already your favorite time zone.");
            return;
        }

        if (favoriteIana) {
            if (confirm("Overwrite your saved favorite time zone?")) {
                localStorage.setItem('favoriteTimeZone', currentZone.iana);
                alert(`Favorite set to ${currentZone.name}!`);
            }
        } else {
            localStorage.setItem('favoriteTimeZone', currentZone.iana);
            alert(`Favorite set to ${currentZone.name}!`);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupGestures);
