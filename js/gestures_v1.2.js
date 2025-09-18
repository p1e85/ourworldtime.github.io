function setupGestures() {
    const clockContainer = document.getElementById('clock-container');
    const dialContainer = document.getElementById('dial-container');
    const dialTrack = document.getElementById('dial-track');

    const clockHammer = new Hammer(clockContainer);
    // Only listen for vertical swipes on the main clock
    clockHammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

    clockHammer.on('swipedown', () => {
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            changeTimeZone(localIndex);
        }
    });

    clockHammer.on('swipeup', () => {
        // Disable favoriting in dashboard view
        if (!infoWrapper.classList.contains('hidden')) {
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
        }
    });

    const dialHammer = new Hammer(dialContainer);
    dialHammer.on('panstart panmove panend', (ev) => {
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
            const itemWidth = dialItemWidth;
            const currentOffset = parseFloat(dialTrack.dataset.initialOffset) + ev.deltaX;
            let newIndex = Math.round(-currentOffset / itemWidth);
            newIndex = Math.max(0, Math.min(timeZones.length - 1, newIndex));
            if (ev.velocityX < -0.5) {
                newIndex = Math.min(timeZones.length - 1, newIndex + 1);
            } else if (ev.velocityX > 0.5) {
                newIndex = Math.max(0, newIndex - 1);
            }
            changeTimeZone(newIndex);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupGestures);
