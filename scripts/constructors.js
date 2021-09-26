function generateAllDescriptions() {
	all_desc_global = [];
	for (let i = 0; i < all_courses_global.length; i++) {
		let course = all_courses_global[i];

		let course_desc_node = document.createElement("div");

		let title_node = document.createElement("div");
		title_node.className = "title";
		title_node.innerHTML += course.title;

		let subtitle_node = document.createElement("div");
		subtitle_node.className = "subtitle";
		subtitle_node.innerHTML += course.identifier;

		let status_node = document.createElement("div");
		status_node.className = `course-status ${course.status}`;
		status_node.innerHTML += `${course.status} - ${course.seats_taken}/${course.max_seats}`;

		course_desc_node.appendChild(title_node);
		course_desc_node.appendChild(subtitle_node);
		course_desc_node.appendChild(status_node);

		for (let time of course.timing) {
			let timing_node = document.createElement("div");
			timing_node.className = "timing";

			let day_str = time.days.join(', ');
			let start_time = convertTime(time.start_time);
			let end_time = convertTime(time.end_time);
			let local = time.location;

			timing_node.innerHTML += `<b>${start_time} - ${end_time}:</b> ${day_str}<br>@ ${local.school}, ${local.building}, Room ${local.room}`;

			course_desc_node.appendChild(timing_node);
		}

		let instructor_node = document.createElement("div");
		instructor_node.className = "instructors";
		instructor_node.innerHTML += `<br><b>Instructors:</b> <i>${course.instructors.join(' & ')}</i>`;

		let desc_node = document.createElement("div");
		desc_node.className = "description";
		desc_node.innerHTML += `<b>Description:</b>\n${course.description}`;

        let notes_node = document.createElement("div");
		notes_node.className = "notes";
		notes_node.innerHTML += `<b>Notes:</b> <i>${course.notes}</i>`;

		course_desc_node.appendChild(instructor_node);
		course_desc_node.appendChild(desc_node);
        course_desc_node.appendChild(notes_node);

		all_desc_global.push(course_desc_node);
	}
}

function createScheduleGridDiv(course, color, set_max_grid_rows = false, low_z_index=false) {
    let time_index = 0;
    let return_list = [];
    // Have to create one for each time slot it's in
    for (let time of course.timing) {
        // Create the div
        let course_div = document.createElement("div");
        course_div.className = "course-schedule-block unselectable";
        course_div.style.backgroundColor = color;

        if (low_z_index) {
            course_div.className += " from-course-list";
        }
        
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
            let cloned_div = course_div.cloneNode(true);
            // Set course behavior
            cloned_div.onclick = function () {
                toggleCourseOverlay(course.identifier, time_index)
            };
            cloned_div.onmouseenter = function () {
                showCourseOverlay(course.identifier, time_index, true)
            };
            cloned_div.onmouseleave = function () {
                showCourseOverlay(course.identifier, time_index, false)
            };
            return_list.push(cloned_div);
        }
        time_index++;
    }

    return return_list;
}


function createLoadedDiv(text, color) {
    let div = document.createElement("div");
    div.className = "course-search-result course-loaded";
    div.style.backgroundColor = color;
    let info = document.createElement("div");
    info.className = "course-info";
    info.innerHTML = text;

    div.appendChild(info);
    return div;
}

function createLoadedCourseListDiv(code, color) {
    let div = createLoadedDiv(`<b>${code}</b>`, color);
    
    let delete_button = document.createElement("div");
    delete_button.className = "delete-course";
    delete_button.onclick = function () {
        deleteCourseList(code);
    };

    let merge_button = document.createElement("div");
    merge_button.className = "merge-course";
    merge_button.onclick = function () {
        mergeCourseList(code);
    };

    div.appendChild(delete_button);
    div.appendChild(merge_button);

    return div;
}

function createLoadedCourseDiv(identifier, title, color) {
    let div = createLoadedDiv(`<b>${identifier}: </b>${title}`, color);
    
    let delete_button = document.createElement("div");
    delete_button.className = "delete-course";
    delete_button.onclick = function () {
        deleteCourse(identifier);
    };

    div.appendChild(delete_button);

    return div;
}

function createResultDiv(course, color, index) {
	let identifier = course.identifier;

	let course_div = document.createElement("div");
	course_div.className = "course-search-result unselectable";
	course_div.id = identifier;
	course_div.onclick = function () {
		toggleCourseSelection(identifier)
	};
	course_div.onmouseenter = function () {
		setCourseDescription(index)
	};
	
	course_div.style.backgroundColor = color;
	let course_code = `<b>${course.identifier}</b>`;
	let status = `<span class="status-highlight ${course.status}">${course.status}</span>`;
	// Put the course code and status in a div on the right
	let num_students = `<span class="align-right" ><b>${course.seats_taken}/${course.max_seats} ${status}</b></span>`;

	course_div.innerHTML = `${course_code}: ${course.title} ${num_students}`;

	return course_div;
}