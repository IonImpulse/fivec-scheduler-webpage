// ***** 
// Startup scripts to generate schedule 
// *****

// Runs all startup scripts
function startup() {
    // Website generation
    generateGridTimes();
    generateDays();
    generateLines();
    loadCourseData();
    updateLoadedCourses();
    updateLoadedCourseLists();

    // Then, check if site was loaded from
    // from QR code w/ course list code
    loadPossibleCourseList();
}

// Generates and sets divs for timeslots
function generateGridTimes() {
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
function generateDays() {
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

function generateLines() {
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

function updateLoadedCourses() {
    let el = document.getElementById("course-table");
    let output = "";

    if (loaded_local_courses.length > 0) {
        for (let i = 0; i < loaded_local_courses.length; i++) {
            output += `\n<div class="course-search-result course-loaded" style="background-color: var(--course-${colors[i % colors.length]});"><b>${loaded_local_courses[i].identifier}:</b> ${loaded_local_courses[i].title}</div>`;
        }
    }

    el.innerHTML = output;
}

function updateLoadedCourseLists() {
    let el = document.getElementById("course-list-table");
    let output = `
    <div class="course-search-result" style="background-color: var(--course-blue);"><b>- Local -</b></div>
    `;

    if (loaded_course_lists.length > 0) {
        for (let i = 0; i < loaded_course_lists.length; i++) {
            output += `\n<div class="course-search-result .course-loaded" style="background-color: var(--course-${colors[i + 1 % colors.length]});"><b>${loaded_course_lists[i].code}</b></div>`;
        }
    }

    el.innerHTML = output;
}

function loadCourseData() {
    loaded_local_courses = load_json_data("loaded_local_courses");
    loaded_course_lists = load_json_data("loaded_course_lists");

    if (loaded_local_courses == null) {
        loaded_local_courses = [];
    }

    if (loaded_course_lists == null) {
        loaded_course_lists = [];
    }

}

function loadPossibleCourseList() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const code = urlParams.get('load');

    if (code != null) {
        fetch(`${API_URL}${GET_COURSE_LIST_BY_CODE(code.toUpperCase())}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText)
                }
                return response.json()
            })
            .catch(error => {
                Swal.showValidationMessage(
                    `Invalid Code! ${error}`
                )
            }).then(data => {
                if (data != null) {
                    loaded_course_lists.push(data);
                    save_json_data("loaded_course_lists", loaded_course_lists);
                }
            });
    }
}

startup();