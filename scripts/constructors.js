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

function createScheduleGridDiv(course, color, set_max_grid_rows = false, low_z_index=false) {
    let return_list = [];
    // Have to create one for each time slot it's in
    //
    // But first, we need to figure out if there are duplicate times
    // for multiple rooms
    for (let time of course.displayed_timing) {
        // Create the div
        let course_div = document.createElement("div");
        course_div.className = `${course.identifier}-loaded course-schedule-block unselectable`;
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
        course_room.innerHTML = time.locations.map(x => `${x.building} ${x.room}`).join("<br>");

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
                max_grid_rows = Math.max(max_grid_rows, layout.end_row);
            }

            // Get the day
            course_div.style.gridColumnStart = layout.start_column;
            course_div.style.gridColumnEnd = layout.end_column;

            course_div.id = `${course.identifier}|${layout.start_column - 2}`;
            
            // Add the div to the grid
            let cloned_div = course_div.cloneNode(true);
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
    
            cloned_div.appendChild(star_button);

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

    let visibility_button = document.createElement("div");
    visibility_button.className = "visibility-button";
    if (!hidden_course_lists.includes(code)) {
        visibility_button.classList.add("visible");
    }

    let delete_button = document.createElement("div");
    delete_button.className = "delete-course course-list";
    delete_button.onclick = function () {
        deleteCourseList(event, code);
    };

    div.insertBefore(visibility_button, div.firstChild);

    if (code != "Main") {
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
    if (!hidden_courses.includes(identifier)) {
        visibility_button.classList.add("visible");
    }
    visibility_button.onclick = function () {
        toggleCourseVisibility(identifier);
    };

    let delete_button = document.createElement("div");
    delete_button.className = "delete-course";
    delete_button.onclick = function () {
        deleteCourse(identifier);
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