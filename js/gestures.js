// This function sets up all the Hammer.js gesture listeners.
function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const hammer = new Hammer(clockContainer);
    
    // Enable all swipe directions
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    // SWIPE RIGHT
    hammer.on('swiperight', () => {
        isLocalTime = false; // We are now navigating the list
        currentIndex = (currentIndex - 1 + timeZones.length) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]); // Update immediately
        startClock(); // Re-sync the clock
    });

    // SWIPE LEFT
    hammer.on('swipeleft', () => {
        isLocalTime = false;
        currentIndex = (currentIndex + 1) % timeZones.length;
        displayTimeForZone(timeZones[currentIndex]);
        startClock();
    });

    // SWIPE DOWN
    hammer.on('swipedown', () => {
        isLocalTime = true;
        displayLocalTime();
        startClock();
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

// --- INITIALIZATION ---
// Wait for the page to be fully loaded before setting up gestures.
document.addEventListener('DOMContentLoaded', setupGestures);
