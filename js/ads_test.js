// A simple function to show a ticking clock in the placeholder
function startTime() {
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            timeDisplay.textContent = timeString;
        }, 1000);
    }
}
