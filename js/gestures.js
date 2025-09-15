// This function sets up all the Hammer.js gesture listeners.
function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const dialContainer = document.getElementById('dial-container');
    const dialTrack = document.getElementById('dial-track');

    // --- Set up gestures for the main clock (Up/Down swipes) ---
    const clockHammer = new Hammer(clockContainer);
    clockHammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    clockHammer.on('swipedown', () => {
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            changeTimeZone(localIndex);
        }
    });

    clockHammer.on('swipeup', () => {
        const favoriteIana = localStorage.getItem('favoriteTimeZone');
        const currentZone = timeZones[currentIndex];
        if (favoriteIana === currentZone.iana) {
            localStorage.removeItem('favoriteTimeZone');
            showToast("⭐ Favorite removed.");
        } else {
            localStorage.setItem('favoriteTimeZone', currentZone.iana);
            showToast(`⭐ Favorite set to ${currentZone.name}.`);
        }
        updateStaticInfo(currentZone);
        updateDialPosition();
    });

    // --- NEW: Set up gestures for the dial (Pan/Drag) ---
    const dialHammer = new Hammer(dialContainer);
    dialHammer.on('panstart panmove panend', (ev) => {
        // When panning, we want to temporarily remove the smooth CSS transition
        // so the dial moves in real-time with the user's finger.
        dialTrack.style.transition = 'none';

        if (ev.type === 'panstart') {
            // Store the initial position of the dial when the drag starts
            const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(dialTrack).transform);
            dialTrack.dataset.initialOffset = currentTransform.m41;
        }

        if (ev.type === 'panmove') {
            // Move the dial track by the initial offset plus the drag distance
            const initialOffset = parseFloat(dialTrack.dataset.initialOffset) || 0;
            const newOffset = initialOffset + ev.deltaX;
            dialTrack.style.transform = `translateX(${newOffset}px)`;
        }

        if (ev.type === 'panend') {
            // Re-enable the smooth CSS transition for the snap-back
            dialTrack.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            const itemWidth = 200;
            const currentOffset = parseFloat(dialTrack.dataset.initialOffset) + ev.deltaX;
            
            // Calculate the nearest time zone index based on the final drag position
            let newIndex = Math.round(-currentOffset / itemWidth);

            // Ensure the new index is within bounds (0 to 23)
            newIndex = Math.max(0, Math.min(timeZones.length - 1, newIndex));

            // If the user also swiped with velocity, move one more index
            if (ev.velocityX < -0.5) { // Fast swipe left
                newIndex = Math.min(timeZones.length - 1, newIndex + 1);
            } else if (ev.velocityX > 0.5) { // Fast swipe right
                newIndex = Math.max(0, newIndex - 1);
            }

            // Call the central function to update everything
            changeTimeZone(newIndex);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupGestures);
