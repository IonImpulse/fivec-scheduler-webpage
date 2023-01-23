function generateSchedule() {
    generateDays();
    generateLines();
    timeLineLoop();
    window.addEventListener('resize', updateScheduleSizing);
    updateScheduleSizing();
}

function sanitizeCourseList(courses) {
    let sanitized = [];
    for (let course of courses.filter(course => course.timing[0].start_time != "00:00:00" && !course.timing.some(d => d.days.some(x => ["Saturday", "Sunday"].includes(x))) && course.timing[0].days[0] != "NA")) {
        let displayed_timing = [];

        for (let time of course.timing) {
            // The days equality section is a bit of a hack
            let search = displayed_timing.findIndex(x => `${x.days}` == `${time.days}` && x.start_time == time.start_time && x.end_time == time.end_time);
            if (search != -1) {
                displayed_timing[search].locations.push(time.location);
            } else {
                displayed_timing.push({
                    days: time.days,
                    start_time: time.start_time,
                    end_time: time.end_time,
                    locations: [time.location]
                });
            }
        }

        let sanitized_course = course;
        sanitized_course.displayed_timing = displayed_timing;

        sanitized.push(sanitized_course);
    }

    return sanitized;
}

function createScheduleGridDiv(course, color, set_max_grid_rows = false, low_z_index=false, play_animation) {
    let return_list = [];
    // Have to create one for each time slot it's in
    //
    // But first, we need to figure out if there are duplicate times
    // for multiple rooms
    for (let time of course.displayed_timing) {
        // Create the div
        let course_div = document.createElement("div");

        course_div.className += `${course.identifier}-loaded course-schedule-block unselectable`;

        // If half-semester, add the class
        if (course.sub_term != "None") {
            course_div.className += ` sub_term-${course.sub_term}`;
        }

        if (play_animation) {
            course_div.className += " add-animation";
        }

        
        course_div.style.backgroundColor = color;

        if (low_z_index) {
            course_div.className += " from-course-list";
        }
        
        // Create and append checkbox element first
        let checkbox = document.createElement("div");
        checkbox.className = "checkbox";
        course_div.appendChild(checkbox);

        // Create the course title
        let course_title = document.createElement("div");
        course_title.className = "name";
        course_title.innerHTML = course.title;
        
                
        // Create the course identifier
        let course_identifier = document.createElement("div");
        course_identifier.className = "identifier";

        course_identifier.innerHTML = course.identifier;

        // Create the course room(s)
        let course_room = document.createElement("div");
        course_room.className = "room";

        let course_rooms = [];

        console.log(time);

        for (let location of time.locations) {
            let found = false;

            for (let i = 0; i < course_rooms.length; i++) {
                if (course_rooms[i].building == location.building) {
                    course_rooms[i].room = `${course_rooms[i].room}, ${location.room}`;
                    found = true;
                    break;
                }
            }

            if (!found) {
                course_rooms.push(location);
            }
        }

        course_rooms = course_rooms.map(x => `${x.building} ${x.room}`);

        // Remove duplicates
        course_rooms = [...new Set(course_rooms)];
        
        course_room.innerHTML = course_rooms.join("<br>");

        // Append all the elements
        course_div.appendChild(course_identifier);
        course_div.appendChild(course_title);
        course_div.appendChild(course_room);

        // Div has been created, now we need to place it on the grid
        // Call timeToGrid to get an list of x and y coordinates, and
        // create a div for each of them

        const grid_layout = timeToGrid(time);

        for (let layout of grid_layout) {
            // Get the time slot
            course_div.style.gridRowStart = layout.start_row;
            course_div.style.gridRowEnd = layout.end_row;

            if (set_max_grid_rows) {
                t_state.max_grid_rows = Math.max(t_state.max_grid_rows, layout.end_row);
            }

            // Get the day
            course_div.style.gridColumnStart = layout.start_column;
            course_div.style.gridColumnEnd = layout.end_column;

            course_div.id = `${course.identifier}|${layout.start_column - 2}`;
            
            // Add the div to the grid
            let cloned_div = course_div.cloneNode(true);
            cloned_div.className += ` course-day-${layout.start_column - 2}`;

            // Set course behavior
            cloned_div.onclick = function () {
                toggleCourseOverlay(course.identifier)
            };
            cloned_div.onmouseenter = function () {
                showCourseOverlay(course.identifier)
            };

            // Create the star div
            let star_button = document.createElement("div");
            star_button.className = "star-course on-grid top-right";
            star_button.onclick = function () {
                starCourse(course.identifier);
            };

            // Create the delete button
            let delete_button = document.createElement("div");
            delete_button.className = "delete-course on-grid bottom-right";
            delete_button.onclick = function () {
                deleteCourse(event, course.identifier);
            };
    
            cloned_div.appendChild(star_button);
            cloned_div.appendChild(delete_button);

            return_list.push(cloned_div);
        }
    }

    return return_list;
}


function createLoadedDiv(text, color) {
    let div = document.createElement("div");
    // Create and append checkbox element first
    let checkbox = document.createElement("div");
    checkbox.className = "checkbox";
    div.appendChild(checkbox);

    div.className = "course-search-result course-loaded unselectable";
    div.style.backgroundColor = color;
    let info = document.createElement("div");
    info.className = "course-info";
    info.innerHTML = text;

    div.appendChild(info);
    return div;
}

function createLoadedCourseListDiv(code, color) {
    let div = createLoadedDiv(`<b>${code}</b>`, color);
    
    div.classList.add("course-list");
    div.id = `course-list-${code}`;

    let delete_button = document.createElement("div");
    delete_button.className = "delete-course course-list";
    delete_button.onclick = function () {
        deleteCourseList(event, code);
    };

    let settings_button = document.createElement("div");
    settings_button.className = "settings-course course-list";
    settings_button.onclick = function () {
        showCourseListSettings(event, code, color);
    };

    if (code != "Main") {
        div.appendChild(settings_button);
        div.appendChild(delete_button);
    }

    div.onclick = function () {
        setLoadedSchedule(code);
    };
    return div;
}

function createLoadedCourseDiv(identifier, title, color) {
    let div = createLoadedDiv(`<b>${identifier}: </b>${title}`, color);
    
    div.classList.add(`${identifier}-loaded`);

    div.onclick = function () {
        toggleCourseOverlay(identifier)
    };
    div.onmouseenter = function () {
        showCourseOverlay(identifier)
    };

    let visibility_button = document.createElement("div");
    visibility_button.className = "visibility-button";
    if (!state.hidden_courses.includes(identifier)) {
        visibility_button.classList.add("visible");
    }
    visibility_button.onclick = function () {
        toggleCourseVisibility(identifier);
    };

    let delete_button = document.createElement("div");
    delete_button.className = "delete-course";
    delete_button.onclick = function () {
        deleteCourse(event, identifier);
    };

    let star_button = document.createElement("div");
    star_button.className = "star-course";
    star_button.onclick = function () {
        starCourse(identifier);
    };
    
    div.appendChild(delete_button);
    div.insertBefore(star_button,div.firstChild);
    div.insertBefore(visibility_button,div.firstChild);

    return div;
}