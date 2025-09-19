import { 
    timeZones, 
    currentIndex, 
    dialItemWidth, 
    infoWrapper,
    changeTimeZone, 
    showToast, 
    updateStaticInfo, 
    updateDialPosition,
    updateDialSelection
} from './time_v1.2.js';

export function setupGestures() {
    const dialContainer = document.getElementById('dial-container');
    const dialTrack = document.getElementById('dial-track');
    
    const dialHammer = new Hammer(dialContainer);

    dialHammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    dialHammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    
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
            const currentOffset = parseFloat(dialTrack.dataset.initialOffset) + ev.deltaX;
            
            let visibleItemIndex = Math.round(-currentOffset / dialItemWidth);
            
            const visibleItems = dialTrack.querySelectorAll('.dial-item');
            visibleItemIndex = Math.max(0, Math.min(visibleItems.length - 1, visibleItemIndex));

            const targetItem = visibleItems[visibleItemIndex];
            if (targetItem) {
                const originalIndex = parseInt(targetItem.dataset.index, 10);
                updateDialSelection(originalIndex);
            }
        }
    });

    dialHammer.on('swipedown', () => {
        const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localIndex = timeZones.findIndex(tz => tz.iana === localIana);
        if (localIndex !== -1) {
            changeTimeZone(localIndex);
        }
    });

    dialHammer.on('swipeup', () => {
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
}
