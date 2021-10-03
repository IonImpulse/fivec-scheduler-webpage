// ***** 
// Startup scripts to generate schedule 
// *****

// Runs all startup scripts
async function startup() {
    // Website generation
    generateGridTimes();
    generateDays();
    generateLines();
    window.addEventListener('resize', updateScheduleSizing);
    updateScheduleSizing();

    await update_database(full=true);
    update_loop();
    updateSchedule();
    // Then, check if site was loaded from
    // from QR code w/ course list code
    loadPossibleCourseList();
    generateAllDescriptions();
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
        time.style.gridRowStart = 2 + ((i - 7) * 20);
        time.style.gridRowEnd = 2 + ((i - 6) * 20);
        element.appendChild(time);
    }

    for (let i = 13; i <= 22; i++) {
        let time = document.createElement("div");
        time.className = "time";
        time.id = "time-" + i;
        time.innerHTML = (i - 12) + ":00 PM";
        time.style.gridColumnStart = 1;
        time.style.gridColumnEnd = 2;
        time.style.gridRowStart = 2 + ((i - 7) * 20);
        time.style.gridRowEnd = 2 + ((i - 6) * 20);
        element.appendChild(time);
    }
}

// Generates days of the week
function generateDays() {
    element = document.getElementById("schedule-table");
    
    let divs = element.getElementsByClassName("day");
    while (divs.length > 0) {
        divs[0].remove()
    }
    
    let days_short = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    let days_full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    if (vertical_layout) {
        days = days_short;
    } else {
        days = days_full;
    }

    for (let i = 0; i < days.length; i++) {
        let day = document.createElement("div");
        day.className = "day";
        day.id = "day-" + i;
        day.innerHTML = days[i];
        day.style.gridColumnStart = i + 2;
        day.style.gridColumnEnd = i + 3;
        day.style.gridRowStart = 1;
        day.style.gridRowEnd = 2;
        element.appendChild(day);
    }
}
function updateScheduleSizing() {
    let current_layout = vertical_layout;

    if (current_layout != isVerticalLayout()) {
        generateDays();
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
        line.style.gridRowStart = 2 + (i * 20);
        line.style.gridRowEnd = 2 + (i * 20);
        element.appendChild(line);
    }

    for (let i = 0; i < 5; i++) {
        let line = document.createElement("div");
        line.className = "highlight";
        line.id = "v-line-" + i;
        line.style.gridColumnStart = i + 2;
        line.style.gridColumnEnd = i + 2;
        line.style.gridRowStart = 2;
        line.style.gridRowEnd = 2 + (16 * 20);


        element.appendChild(line);
    }
}

function updateSchedule() {
    max_grid_rows = 0;

    clearSchedule();
    updateLoadedCourses();
    updateLoadedCourseLists();

    if (max_grid_rows == 0) {
        max_grid_rows = 350;
    } else {
        max_grid_rows = Math.min(350, max_grid_rows + 20);
    }

    document.getElementById("schedule-table").style.gridTemplateRows = `35px repeat(${max_grid_rows}, 1fr)`;

}

function clearSchedule() {
    let course_schedule_grid = document.getElementById("schedule-table");

    let course_divs = course_schedule_grid.getElementsByClassName("course-schedule-block");

    while (course_divs[0]) {
        course_divs[0].parentNode.removeChild(course_divs[0]);
    }
}

function removeAllChildren(element) {
    while (element.firstChild != null) {
        element.removeChild(element.firstChild);
    }
}

function updateLoadedCourses() {
    let course_list_table = document.getElementById("course-table");

    removeAllChildren(course_list_table);

    if (loaded_local_courses.length > 0) {
        for (let i = 0; i < loaded_local_courses.length; i++) {
            course_list_table.appendChild(createLoadedCourseDiv(loaded_local_courses[i].identifier, loaded_local_courses[i].title, colors[i % colors.length]));
        }
    }

    let course_schedule_grid = document.getElementById("schedule-table");

    // Add new course divs
    let i = 0;

    for (let course of loaded_local_courses) {
        let course_div_list = createScheduleGridDiv(course, colors[i % colors.length], set_max_grid_rows = true);

        for (let course_div of course_div_list) {
            course_schedule_grid.appendChild(course_div);
        }

        i++;
    }
}

function timeToGrid(time) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let return_list = [];

    for (let day of time.days) {
        // Get the day
        let day_index = days.indexOf(day);
        let start_column = day_index + 2;
        let end_column = day_index + 3;

        // Get the start and end times
        let start_time_array = time.start_time.split(":").map((x) => parseInt(x));
        let end_time_array = time.end_time.split(":").map((x) => parseInt(x));

        // Days start at 7:00 AM, so we need to adjust the start time
        // Each hour is 20 grid units long
        // Each 3 minutes is 1 grid unit
        let start_row = ((start_time_array[0] - 7) * 20) + (Math.round(start_time_array[1] / 3)) + 2;
        let end_row = ((end_time_array[0] - 7) * 20) + (Math.round(end_time_array[1] / 3)) + 2;

        // Add the time slot to the return list
        return_list.push({
            start_column: start_column,
            end_column: end_column,
            start_row: start_row,
            end_row: end_row,
        });
    }

    return return_list;
}

function updateLoadedCourseLists() {
    let el = document.getElementById("course-list-table");
    removeAllChildren(el);

    el.appendChild(createLoadedDiv("<b>Local Courses</b>", colors[0]));

    if (loaded_course_lists.length > 0) {
        for (let i = 0; i < loaded_course_lists.length; i++) {
            el.appendChild(createLoadedCourseListDiv(loaded_course_lists[i].code, colors[i + 1 % colors.length]));
        }
    }

    let course_schedule_grid = document.getElementById("schedule-table");

    for (let course_list of loaded_course_lists) {
        let i = 0;
        for (let course of course_list.courses) {
            let course_div_list = createScheduleGridDiv(course, colors[i % colors.length] + "66", set_max_grid_rows = true, low_z_index = true);

            for (let course_div of course_div_list) {
                course_schedule_grid.appendChild(course_div);
            }

            i++;
        }
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
                window.location.href = window.location.href.split("?")[0];
                if (data != null) {
                    const course_list_result = addToCourseLists(data);

                    if (course_list_result == true) {
                        Toast.fire({
                            title: 'Loaded course list',
                            icon: 'success'
                        });
                    } else {
                        Toast.fire({
                            title: 'Course list already loaded',
                            icon: 'error'
                        });
                    }
                }
            });
    }
}

startup();