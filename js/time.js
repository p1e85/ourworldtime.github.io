// Run the clock function once the page is ready
document.addEventListener('DOMContentLoaded', startTime);

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  
  // Add a leading zero to numbers less than 10
  m = checkTime(m);
  s = checkTime(s);
  
  // Update the clock text
  document.getElementById('txt').innerHTML =
  h + ":" + m + ":" + s;
  
  // Update the background based on the hour
  updateBackground(h);
  
  // Run this function again in 1 second
  var t = setTimeout(startTime, 1000);
}

function checkTime(i) {
  if (i < 10) {i = "0" + i};
  return i;
}

// NEW FUNCTION to set the background
function updateBackground(hour) {
  const body = document.body;
  
  // This only updates the class if it needs to, preventing constant changes
  let newClass = '';

  if (hour >= 5 && hour < 11) { // 5:00 AM to 10:59 AM
    newClass = 'morning';
  } else if (hour >= 11 && hour < 17) { // 11:00 AM to 4:59 PM
    newClass = 'day';
  } else if (hour >= 17 && hour < 21) { // 5:00 PM to 8:59 PM
    newClass = 'evening';
  } else { // 9:00 PM to 4:59 AM
    newClass = 'night';
  }
  
  // Only change the class if it's different from the current one
  if (body.className !== newClass) {
      body.className = newClass;
  }
}

