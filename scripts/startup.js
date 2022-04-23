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
    await update_from_local();
    // Add PWA install prompt

    // Website generation
    generateGridTimes();
    generateDays();
    generateLines();
    timeLineLoop();
    window.addEventListener('resize', updateScheduleSizing);
    updateScheduleSizing();

    updateSchedule();

    // Remove fade-in class
    let fader = document.getElementById("fader")
    fader.classList.add('fade-out');

    // New version? Show changelog
    if (show_changelog) {
        showChangelog();
    }
   
    await update;
    update_loop();

    // Create reusable web worker threads
    desc_worker = new Worker('scripts/workers/descriptions.js?v=1.14.0');
    searcher_worker = new Worker('scripts/workers/searcher.js?v=1.14.0');
	searching_worker = new Worker('scripts/workers/courseSearch.js?v=1.14.0');

    // Start worker threads to generate descriptions + searcher
    updateDescAndSearcher(false);
    updateSchedule();

    // Then, check if site was loaded from
    // from QR code w/ course list code
    await loadPossibleParams();
}

var installEvent;
const install_holder = document.querySelector("#pwa-prompt-box");
const install_button = document.querySelector(".install");
const close_button = document.querySelector("#hide-install");
const schedule_element = document.getElementById("schedule-table");

function timeLineLoop() {
    setTimeout(function() {
        updateTimeLine();
        timeLineLoop();
    }, 100);
}

function updateTimeLine() {
    let el = document.getElementById("current-time-line");

    if (el != null) {
        el.remove()
    }

    if (!settings.show_time_line) {
        return;
    }

    let current_time = new Date();
    let current_day = current_time.getDay();
    let current_hour = current_time.getHours();
    let current_min = current_time.getMinutes();

    if (current_day == 0 || current_day == 6 || current_hour < 7 || current_hour > 22) {
        return;
    }

    let current_time_line = document.createElement("div");
    current_time_line.id = "current-time-line";
    current_time_line.className = "line";
    current_time_line.style.gridColumnStart = current_day + 1;
    let row = ((current_hour - 7) * 20) + (Math.round(current_min / 3)) + 2;
    current_time_line.style.gridRowStart = row;

    let current_time_line_circle = document.createElement("div");
    current_time_line_circle.id = "time-circle";

    current_time_line.appendChild(current_time_line_circle);

    schedule_element.appendChild(current_time_line);
}

function getVisited() {
    return localStorage.getItem('install-prompt');
}

function setVisited() {
    localStorage.setItem('install-prompt', true);
}

async function updateDescAndSearcher(full=true) {
    desc_worker.onmessage = function(e) {
        all_desc_global = e.data;
    }

    searcher_worker.onmessage = function(e) {
        all_courses_global = e.data;
    }

    desc_worker.postMessage([[], all_courses_global, loaded_custom_courses, settings.hmc_mode, full]);
    searcher_worker.postMessage([all_courses_global]);
}

// Generates and sets divs for timeslots
function generateGridTimes() {
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
        schedule_element.appendChild(time);
    }

    for (let i = 13; i <= 23; i++) {
        let time = document.createElement("div");
        time.className = "time";
        time.id = "time-" + i;
        time.innerHTML = (i - 12) + ":00 PM";
        time.style.gridColumnStart = 1;
        time.style.gridColumnEnd = 2;
        time.style.gridRowStart = 2 + ((i - 7) * 20);
        time.style.gridRowEnd = 2 + ((i - 6) * 20);
        schedule_element.appendChild(time);
    }
}

// Generates days of the week
function generateDays() {    
    let divs = schedule_element.getElementsByClassName("day");
    while (divs.length > 0) {
        divs[0].remove()
    }

    if (vertical_layout) {
        days = weekdays_short;
    } else {
        days = weekdays_full;
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
        schedule_element.appendChild(day);
    }
}
function updateScheduleSizing() {
    let current_layout = vertical_layout;

    if (current_layout != isVerticalLayout()) {
        generateDays();
    }
}
function generateLines() {
    for (let i = 0; i < 17; i++) {
        let line = document.createElement("div");
        line.className = "line";
        line.id = "h-line-" + i;
        line.style.gridColumnStart = 2;
        line.style.gridColumnEnd = 7;
        line.style.gridRowStart = 2 + (i * 20);
        line.style.gridRowEnd = 2 + (i * 20);
        schedule_element.appendChild(line);
    }

    for (let i = 0; i < 5; i++) {
        let line = document.createElement("div");
        line.className = "highlight";
        line.id = "v-line-" + i;
        line.style.gridColumnStart = i + 2;
        line.style.gridColumnEnd = i + 2;
        line.style.gridRowStart = 2;
        line.style.gridRowEnd = 2 + (17 * 20);
        schedule_element.appendChild(line);
    }
}

function updateSchedule(play_animation=false) {

    max_grid_rows = 0;

    clearSchedule(play_animation).then(() => {
        updateLoadedCourses(play_animation);
        updateDistanceLines(play_animation);
        updateLoadedCustomCourses(play_animation);

        updateLoadedCourseLists();
        updateStarredCourses();
        updateCredits();
    
        if (max_grid_rows == 0) {
            max_grid_rows = 350;
        } else {
            max_grid_rows = Math.min(350, max_grid_rows + 20);
        }

        // Delete the last few timings
        let lines_to_delete = (350 - max_grid_rows)/20 - 1;
        for (let i = 0; i < lines_to_delete; i++) {
            let time_label = document.getElementById("time-" + (23 - i));
            if (time_label != undefined) {
                time_label.remove();
            }
        }
    
        //max_grid_rows = 350;
    
        schedule_element.style.gridTemplateRows = `35px repeat(${max_grid_rows}, 1fr) repeat(${350 - max_grid_rows}, .1fr)`;  
    });
}

async function clearSchedule(play_animation) {
    let course_divs = schedule_element.getElementsByClassName("course-schedule-block");
    let timing_lines = schedule_element.getElementsByClassName("popup-holder");
    

    if (play_animation) {
        // First add remove animation class
        for (let i = 0; i < course_divs.length; i++) {
            course_divs[i].classList.add("remove-animation");
        }

        for (let i = 0; i < timing_lines.length; i++) {
            timing_lines[i].classList.add("remove-animation");
        }

        // Wait for animation to finish
        await sleep(100)
    }
    

    while (course_divs[0]) {
        course_divs[0].parentNode.removeChild(course_divs[0]);
    }

    while (timing_lines[0]) {
        timing_lines[0].parentNode.removeChild(timing_lines[0]);
    }
}

function removeAllChildren(element) {
    while (element.firstChild != null) {
        element.removeChild(element.firstChild);
    }
}

function createScheduleGridDivs(courses, loaded, filter_hidden=false, play_animation) {
    // Add new course divs
    let sanitized_courses = sanitizeCourseList(courses);
    if (filter_hidden) { 
        sanitized_courses = sanitized_courses.filter(course => !hidden_courses.includes(course.identifier)); 
    }
    let slow_index = 0;
    for (let i = 0; i < courses.length && slow_index < sanitized_courses.length; i++) {
        if (courses[i].identifier == sanitized_courses[slow_index].identifier) {
            let color = colors[i % colors.length];

            if (loaded) {
                color += "CC";
            }

            let course_div_list = createScheduleGridDiv(sanitized_courses[slow_index], color, set_max_grid_rows = true, low_z_index=false, play_animation);

            for (let course_div of course_div_list) {
                schedule_element.appendChild(course_div);
            }

            slow_index++;
        }
    }
}

function updateLoadedCourses(play_animation) {
    let course_list_table = document.getElementById("course-table");

    removeAllChildren(course_list_table);

    if (loaded_local_courses.length > 0) {
        for (let i = 0; i < loaded_local_courses.length; i++) {

            course_list_table.appendChild(createLoadedCourseDiv(loaded_local_courses[i].identifier, loaded_local_courses[i].title, colors[i % colors.length]));
        }
    }

    createScheduleGridDivs(loaded_local_courses, false, true, play_animation);
    
}

function updateLoadedCustomCourses() {
    createScheduleGridDivs(loaded_custom_courses);
}

function timeToGrid(time) {
    let return_list = [];

    for (let day of time.days) {
        // Get the day
        let day_index = weekdays_full.indexOf(day);
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

    let elements_to_remove = el.getElementsByClassName("course-loaded");

    while (elements_to_remove[0]) {
        elements_to_remove[0].parentNode.removeChild(elements_to_remove[0]);
    }

    let schedule_button = document.getElementById("add-schedule");
    if (schedule_button) {
        schedule_button.remove();
    };

    let new_schedule = document.createElement("div");
    new_schedule.className = "default-button noselect";
    new_schedule.id = "add-schedule";
    new_schedule.innerText = "Add new schedule...";
    new_schedule.onclick = () => {
        addNewSchedule();
    };  

    
    for (let i = 0; i < loaded_course_lists.length + 1; i++) {
        if (i == loaded_schedule.index) {
            el.appendChild(createLoadedCourseListDiv(loaded_schedule.code, loaded_schedule.color ?? colors[i % colors.length]));

            document.getElementById("schedule-indicator").style.top = `${el.lastChild.offsetTop}px`;
            document.getElementById("schedule-indicator").style.height = `${el.lastChild.offsetHeight}px`;
        } else  {
            let index = i;
            if (i > loaded_schedule.index) {
                index = i - 1;
            }
            el.appendChild(createLoadedCourseListDiv(loaded_course_lists[index].code, loaded_course_lists[index].color ?? colors[i % colors.length]));
        }
    }

    el.appendChild(new_schedule);
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

function updateDistanceLines(play_animation) {
    // First, create a nested array of all locations using displayed times
    let line_list = [[], [], [], [], []];
    let courses_with_timing = loaded_local_courses.filter((course) => course.displayed_timing != undefined && !hidden_courses.includes(course.identifier));
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
            
            if (course_a_loc != undefined && course_b_loc != undefined) {
                if (course_a_loc[0] != undefined && course_b_loc[0] != undefined) {
                    if (course_a_loc[0] != "" && course_b_loc[0] != "") {
                        let distance = distanceLatLon(course_a_loc[0], course_a_loc[1], course_b_loc[0], course_b_loc[1], "F");
                        generateTimeLine(course_a, course_b, distance, play_animation);
                    }
                }
            } else {
                console.warn(`Location key ${course_a_key} is ${course_a_loc}\nLocation key ${course_b_key} is ${course_b_loc}\n`);
            }
            
        }
    }
}

function generateTimeLine(course_a, course_b, distance, play_animation) {
    let el_a = document.getElementById(`${course_a.course.identifier}|${course_a.index}`);
    let el_b = document.getElementById(`${course_b.course.identifier}|${course_b.index}`);

    let grid_column = el_a.style.gridColumnStart;
    let grid_row_start = el_a.style.gridRowEnd;
    let grid_row_end = el_b.style.gridRowStart;

    let line_div = document.createElement("div");
    line_div.classList.add("line-v");
    line_div.classList.add("popup-holder");

    if (play_animation) {
        line_div.classList.add("add-animation");
    }

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

    let walking_time = Math.ceil((distance * 1.5)/walking_feet_per_minute);
    let skateboarding_time = Math.ceil((distance * 1.5)/skateboarding_feet_per_minute);
    let biking_time = Math.ceil((distance * 1.5)/biking_feet_per_minute);

    // Calculate time between classes
    let time_end = course_a.timing.end_time;
    let time_start = course_b.timing.start_time;

    let time_diff = timeDiffMins(time_end, time_start);

    // If it's less then the time between classes, then turn the line red
    if (time_diff < walking_time + Math.max(2, walking_time/2)) {
        line_div.classList.add("red-line");
        info_div_text.innerHTML += `<b><i>Warning! There may not be enough time to walk between these classes!</i></b><br>`;
    }
    
    info_div_text.appendChild(info_div_title);

    info_div_text.innerHTML += `Time between classes: <b>${time_diff}</b> minutes<br><br>`;

    info_div_text.innerHTML += `<i>Approximate timings if...</i><br>`;
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
    
    
    schedule_element.appendChild(line_div);
}

function timeDiffMins(time_a, time_b) {
    let time_a_split = time_a.split(":");
    let time_b_split = time_b.split(":");


    // Calculate time difference in minutes
    let time_diff = (time_b_split[0] - time_a_split[0]) * 60;
    time_diff += (time_b_split[1] - time_a_split[1]);
    time_diff += (time_b_split[2] - time_a_split[2]) / 60;

    return time_diff;
}

function updateCredits() {
    const loaded_title = document.getElementById("loaded-courses-title");
    const lists_title = document.getElementById("loaded-course-lists-title");

    let local_credits = sumCredits(loaded_local_courses.filter(course => !hidden_courses.includes(course.identifier)));
    
    if (local_credits > 0) {
        let ending = "Credits";

        if (local_credits == 1) {
            ending = "Credit";
        }

        loaded_title.innerText = `Courses Loaded - ${local_credits} ${ending}`;
    } else {
        loaded_title.innerText = `Courses Loaded`;
    }
}

function sumCredits(courses) {
    let credits = 0;

    for (let course of courses) {
        if (settings.hmc_mode) {
            credits += course.credits_hmc ?? 0;
        } else {
            credits += course.credits ?? 0;
        }
    }

    if (credits > 0) {
        credits = (credits/100).toFixed(2);
    }

    return credits;
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

async function loadPossibleParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const code = urlParams.get('load');

    const search = urlParams.get('search');

    if (search != null) {
        addSearchFilter(search);
    }

    if (code != null) {
        let response = await fetch(`${API_URL}${GET_COURSE_LIST_BY_CODE(code.toUpperCase())}`)

        if (response.ok) {
            let data = await response.json();

            if (data != null) {
                await intakeCourseData(data);
            }
        } else {
            Swal.showValidationMessage(
                `Invalid Code! ${error}`
            )
        }

        // Reset url so bookmarks don't get messed up

        let obj = { Title: window.location.title, Url: window.location.href.split("?")[0] ?? window.location.href };  

        history.pushState(obj, obj.Title, obj.Url);  
    }
}

function showChangelog() {
    Swal.fire({
        title: 'Changelog',
        html: changelog_popup,
        showCloseButton: true,
        showConfirmButton: false,
        showCancelButton: false,
        focusConfirm: false,
        focusCancel: false,
        cancelButtonText: 'Close',
        icon: 'info',
        customClass: 'swal-small-wide',
    });
}

startup();