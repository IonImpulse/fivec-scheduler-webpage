// ***** 
// Startup scripts to generate schedule 
// *****

// Runs all startup scripts
async function startup() {
    // First, check if site was loaded from
    // as a PWA *before* attempting to load
    // assets/data
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('../sw.js', {scope: '../'})
        .then((reg) => {
          // registration worked
          console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch((error) => {
          // registration failed
          console.log('Registration failed with ' + error);
        });
    }
    // Then, call an update request
    let update = update_database(full=false);
    // Website generation
    generateGridTimes();
    generateDays();
    generateLines();
    window.addEventListener('resize', updateScheduleSizing);
    updateScheduleSizing();

    await update;
    update_loop();
    updateSchedule();
    // Then, check if site was loaded from
    // from QR code w/ course list code
    loadPossibleCourseList();

    // Remove fade-in class
    let fader = document.getElementById("fader")
    fader.classList.add('fade-out');

    // Create reusable web worker threads
    desc_worker = new Worker('scripts/workers/descriptions.js' + '?' + Math.random());
    searcher_worker = new Worker('scripts/workers/searcher.js' + '?' + Math.random());
	searching_worker = new Worker('scripts/workers/courseSearch.js' + '?' + Math.random());

    // Start worker threads to generate descriptions + searcher
    updateDescAndSearcher(false);
}

async function updateDescAndSearcher(full=true) {
    desc_worker.onmessage = function(e) {
        all_desc_global = e.data;
    }

    searcher_worker.onmessage = function(e) {
        all_courses_global = e.data;
    }

    desc_worker.postMessage([[], all_courses_global, loaded_custom_courses, full]);
    searcher_worker.postMessage([all_courses_global]);
}

// Generates and sets divs for timeslots
function generateGridTimes() {
    element = document.getElementById("schedule-table");

    for (let i = 7; i <= 12; i++) {
        let time = document.createElement("div");
        time.className = "time";
        time.id = "time-" + i;
        if (i == 12) {
            time.innerHTML = i + ":00 PM";
        } else {
            time.innerHTML = i + ":00 AM";
        }
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
    updateLoadedCustomCourses();
    updateLoadedCourseLists();
    updateStarredCourses();
    updateDistanceLines();

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

    let timing_lines = course_schedule_grid.getElementsByClassName("popup-holder");
    while (timing_lines[0]) {
        timing_lines[0].parentNode.removeChild(timing_lines[0]);
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

    let sanitized_courses = sanitizeCourseList(loaded_local_courses);

    for (let course of sanitized_courses) {
        if (course.timing[0].days[0] != "NA") {
            let course_div_list = createScheduleGridDiv(course, colors[i % colors.length], set_max_grid_rows = true);

            for (let course_div of course_div_list) {
                course_schedule_grid.appendChild(course_div);
            }

            i++;
        }
    }
}

function updateLoadedCustomCourses() {
    let course_schedule_grid = document.getElementById("schedule-table");
    let i = 0;

    let sanitized_courses = sanitizeCourseList(loaded_custom_courses);

    for (let course of sanitized_courses) {
        if (course.timing[0].days[0] != "NA") {
            let course_div_list = createScheduleGridDiv(course, colors[i % colors.length], set_max_grid_rows = true);

            for (let course_div of course_div_list) {
                course_schedule_grid.appendChild(course_div);
            }

            i++;
        }
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
        let sanitized_courses = sanitizeCourseList(course_list.courses);
        for (let course of sanitized_courses) {
            let course_div_list = createScheduleGridDiv(course, colors[i % colors.length], set_max_grid_rows = true, low_z_index = true);

            for (let course_div of course_div_list) {
                course_schedule_grid.appendChild(course_div);
            }

            i++;
        }
    }
}

function updateStarredCourses() {
    for (let identifier of starred_courses) {
        showStarCourse(identifier);
    }
}

function distanceLatLon(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
    if (unit=="F") { dist = dist * 5280}
	return dist
}

function updateDistanceLines() {
    // First, create a nested array of all locations using displayed times
    let line_list = [[], [], [], [], []];
    let courses_with_timing = loaded_local_courses.filter((course) => course.displayed_timing != undefined);
    for (let course of courses_with_timing) {
        for (let timing of course.displayed_timing) {
            let days = [];
            
            for (let day of timing.days) {
                days.push(dayToIndex(day) - 1)
            }

            for (let day of days) {
                line_list[day].push({
                    course: course,
                    timing: timing,
                    index: day,
                });
            }
        }
    }

    // Now, sort each day's list by start time
    for (let day_list of line_list) {
        day_list.sort((a, b) => {
            return parseInt(a.timing.start_time.replace(":", "")) - parseInt(b.timing.start_time.replace(":", ""));
        });
    }

    // Create a line for each course that has a course after it
    for (let day of line_list) {
        for (let i = 0; i < day.length - 1; i++) {
            let course_a = day[i];
            let course_a_key = `${course_a.timing.locations[0].school}-${course_a.timing.locations[0].building}`;
            let course_a_loc = locations[course_a_key];

            let course_b = day[i + 1];
            let course_b_key = `${course_b.timing.locations[0].school}-${course_b.timing.locations[0].building}`;
            let course_b_loc = locations[course_b_key];
            
            if (course_a_loc[0] != undefined && course_b_loc[0] != undefined) {
                if (course_a_loc[0] != "" && course_b_loc[0] != "") {
                    let distance = distanceLatLon(course_a_loc[0], course_a_loc[1], course_b_loc[0], course_b_loc[1], "F");
                    generateTimeLine(course_a, course_b, distance);
                }
            } else {
                console.warn(`Location key ${course_a_key} is ${course_a_loc}\nLocation key ${course_b_key} is ${course_b_loc}\n`);
            }
            
        }
    }
}

function generateTimeLine(course_a, course_b, distance) {
    let schedule = document.getElementById("schedule-table");
    let el_a = document.getElementById(`${course_a.course.identifier}|${course_a.index}`);
    let el_b = document.getElementById(`${course_b.course.identifier}|${course_b.index}`);

    let grid_column = el_a.style.gridColumnStart;
    let grid_row_start = el_a.style.gridRowEnd;
    let grid_row_end = el_b.style.gridRowStart;

    let line_div = document.createElement("div");
    line_div.classList.add("line-v");
    line_div.classList.add("popup-holder");

    let id = `distance-info-${grid_column}-${grid_row_start}-${grid_row_end}`;
    line_div.style.gridColumnStart = grid_column;
    line_div.style.gridColumnEnd = grid_column;
    line_div.style.gridRowStart = grid_row_start;
    line_div.style.gridRowEnd = grid_row_end;

    // Create info popup
    let displayed_distance = Math.ceil(Math.round(distance * 15)/10);

    if (displayed_distance < 100) {
        displayed_distance = "less than 100";
    } else {
        displayed_distance = `about ${displayed_distance}`;
    }

    let info_div_text = document.createElement("span");
    info_div_text.id = id;
    info_div_text.classList.add("popup-text");
    if (grid_column > 4) {
        info_div_text.classList.add("other-side");
    }
    let info_div_title = document.createElement("div");
    info_div_title.classList.add("popup-title");
    info_div_title.innerText = `Distance: ${displayed_distance} feet`
    info_div_text.appendChild(info_div_title);
    info_div_text.innerHTML += `<i>Approximate timings if...</i><br>`;

    let walking_time = Math.ceil((distance * 1.5)/walking_feet_per_minute);
    let skateboarding_time = Math.ceil((distance * 1.5)/skateboarding_feet_per_minute);
    let biking_time = Math.ceil((distance * 1.5)/biking_feet_per_minute);

    info_div_text.innerHTML += `Walking: ~<b>${walking_time}</b> minutes<br>`;
    info_div_text.innerHTML += `Skateboarding: ~<b>${skateboarding_time}</b> minutes<br>`;
    info_div_text.innerHTML += `Biking: ~<b>${biking_time}</b> minutes<br>`;

    

    line_div.insertBefore(info_div_text, line_div.firstChild);

    line_div.onmouseenter = function () {
        showPopup(`#${id}`)
    };
    line_div.onmouseleave = function () {
        hidePopup(`#${id}`)
    };

    schedule.appendChild(line_div);
}

async function intakeCourseData(data) {
    let course_list = {
        code: data.code,
        courses: data.courses.local_courses,
    };

    let custom_courses = data.courses.custom_courses;

    const course_list_result = await addToCourseLists(course_list);
    const custom_list_result = await addToCustomCourseList(custom_courses);

    if (course_list_result) {
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

    if (custom_list_result == 0) {
        Toast.fire({
            title: 'Loaded custom courses',
            icon: 'success'
        });
    } else {
        Toast.fire({
            title: `Custom courses loaded with ${custom_list_result} conflicts`,
            icon: 'warn'
        });
    }
}

async function loadPossibleCourseList() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const code = urlParams.get('load');

    // TODO: rewrite as async await
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
            }).then(async data => {
                if (data != null) {
                    await intakeCourseData(data);
                }

                window.location.href = window.location.href.split("?")[0];

            });
    }
}

startup();