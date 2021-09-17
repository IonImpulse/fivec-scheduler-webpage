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
    updateSchedule();

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
    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

function updateLoadedCourses() {
    let course_list_table = document.getElementById("course-table");
    let output = "";

    if (loaded_local_courses.length > 0) {
        for (let i = 0; i < loaded_local_courses.length; i++) {
            output += `\n<div class="course-search-result course-loaded" style="background-color: ${colors[i % colors.length]};"><div class="course-info"><b>${loaded_local_courses[i].identifier}:</b> ${loaded_local_courses[i].title}</div><div class="delete-course" onclick="deleteCourse('${loaded_local_courses[i].identifier}')"></div></div>`;
        }
    }

    course_list_table.innerHTML = output;

    let course_schedule_grid = document.getElementById("schedule-table");

    // Add new course divs
    let i = 0;

    for (let course of loaded_local_courses) {
        let course_div_list = createScheduleGridDiv(course, colors[i % colors.length], set_max_grid_rows=true);

        for (let course_div of course_div_list) {
            course_schedule_grid.appendChild(course_div);
        }

        i++;
    }
}

function createScheduleGridDiv(course, color, set_max_grid_rows = false) {
    let time_index = 0;
    let return_list = [];
    // Have to create one for each time slot it's in
    for (let time of course.timing) {
        // Create the div
        let course_div = document.createElement("div");
        course_div.className = "course-schedule-block unselectable";
        course_div.style.backgroundColor = `${color}`;

        // Create the course title
        let course_title = document.createElement("div");
        course_title.className = "name";
        course_title.innerHTML = course.title;

        // Create the course identifier
        let course_identifier = document.createElement("div");
        course_identifier.className = "identifier";
        course_identifier.innerHTML = course.identifier;

        // Create the course room
        let course_room = document.createElement("div");
        course_room.className = "room";
        course_room.innerHTML = `${time.location.building} ${time.location.room}`;

        // Append all the elements
        course_div.appendChild(course_title);
        course_div.appendChild(course_identifier);
        course_div.appendChild(course_room);

        // Set course behavior
        course_div.onclick = function () {
            toggleCourseOverlay(course.identifier, time_index)
        };
        course_div.onmouseenter = function () {
            showCourseOverlay(course.identifier, time_index, true)
        };
        course_div.onmouseleave = function () {
            showCourseOverlay(course.identifier, time_index, false)
        };

        // Div has been created, now we need to place it on the grid
        // Call timeToGrid to get an list of x and y coordinates, and
        // create a div for each of them

        const grid_layout = timeToGrid(time);

        for (let layout of grid_layout) {
            // Get the time slot
            course_div.style.gridRowStart = layout.start_row;
            course_div.style.gridRowEnd = layout.end_row;

            if (set_max_grid_rows) {
                max_grid_rows = Math.max(max_grid_rows, layout.end_row);
            }

            // Get the day
            course_div.style.gridColumnStart = layout.start_column;
            course_div.style.gridColumnEnd = layout.end_column;

            // Add the div to the grid
            return_list.push(course_div.cloneNode(true))
        }
        time_index++;
    }

    return return_list;
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
    let output = `
    <div class="course-search-result" style="background-color: ${colors[0]};"><b>- Local -</b></div>
    `;

    if (loaded_course_lists.length > 0) {
        for (let i = 0; i < loaded_course_lists.length; i++) {
            output += `\n<div class="course-search-result .course-loaded" style="background-color: ${colors[i + 1 % colors.length]};"><div class="course-info"><b>${loaded_course_lists[i].code}</b></div><div class="delete-course" onclick="deleteCourseList('${loaded_course_lists[i].code}')"></div><div class="merge-course" onclick="mergeCourseList('${loaded_course_lists[i].code}')"></div></div>`;
        }
    }
    
    el.innerHTML = output;

    let course_schedule_grid = document.getElementById("schedule-table");
    
    for (let course_list of loaded_course_lists) {
        let i = 0;
        for (let course of course_list.courses) {
            let course_div_list = createScheduleGridDiv(course, colors[i % colors.length] + "66", set_max_grid_rows=true);
    
            for (let course_div of course_div_list) {
                course_schedule_grid.appendChild(course_div);
            }
    
            i++;
        }
    }
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
                    updateSchedule();
                }
            });
    }
}

startup();