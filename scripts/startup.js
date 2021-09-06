// ***** 
// Startup scripts to generate schedule 
// *****

// Runs all startup scripts
function startup() {
    generate_grid_times();
    generate_days();
    generate_lines();
}

// Generates and sets divs for timeslots
function generate_grid_times() {
    element = document.getElementById("schedule-table");

    for (let i = 7; i <= 12; i++) {
        let time = document.createElement("div");
        time.className = "time";
        time.id = "time-" + i;
        time.innerHTML = i + ":00 AM";
        time.style.gridColumnStart = 1;
        time.style.gridColumnEnd = 2;
        time.style.gridRowStart = 17 + ((i - 7) * 20);
        time.style.gridRowEnd = 17 + ((i - 6) * 20);
        element.appendChild(time);
    }

    for (let i = 13; i <= 22; i++) {
        let time = document.createElement("div");
        time.className = "time";
        time.id = "time-" + i;
        time.innerHTML = (i - 12) + ":00 PM";
        time.style.gridColumnStart = 1;
        time.style.gridColumnEnd = 2;
        time.style.gridRowStart = 17 + ((i - 7) * 20);
        time.style.gridRowEnd = 17 + ((i - 6) * 20);
        element.appendChild(time);
    }
}

// Generates days of the week
function generate_days() {
    element = document.getElementById("schedule-table");
    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let i = 0; i < days.length; i++) {
        let day = document.createElement("div");
        day.className = "day";
        day.id = "day-" + i;
        day.innerHTML = days[i];
        day.style.gridColumnStart = i + 2;
        day.style.gridColumnEnd = i + 3;
        day.style.gridRowStart = 1;
        day.style.gridRowEnd = 20;
        element.appendChild(day);
    }
}

function generate_lines() {
    element = document.getElementById("schedule-table");

    for (let i = 0; i < 16; i++) {
        let line = document.createElement("div");
        line.className = "line";
        line.id = "h-line-" + i;
        line.style.gridColumnStart = 2;
        line.style.gridColumnEnd = 7;
        line.style.gridRowStart = 20 + (i * 20);
        line.style.gridRowEnd = 20 + (i * 20);
        element.appendChild(line);
    }

    for (let i = 0; i < 5; i++) {
        let line = document.createElement("div");
        line.className = "highlight";
        line.id = "v-line-" + i;
        line.style.gridColumnStart = i + 2;
        line.style.gridColumnEnd = i + 2;
        line.style.gridRowStart = 20;
        line.style.gridRowEnd = 20 + (16 * 20);


        element.appendChild(line);
    }
}

startup();