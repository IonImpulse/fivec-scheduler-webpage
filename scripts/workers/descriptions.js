function convertTime(time) {
	let return_time = time.substring(0, 5);
	let first_two = parseInt(time.substring(0, 2));

	if (first_two > 12) {
		return (first_two - 12) + return_time.substring(2) + " PM";
	} else {
		return return_time + " AM";
	}
}

function generateAllDescriptions(all_desc_global, all_courses_global, loaded_custom_courses, full=true) {
    if (full == true) {
        all_desc_global = [];
    }
	for (let i = all_desc_global.length; i < all_courses_global.length + loaded_custom_courses.length; i++) {
        let course;

        if (i < all_courses_global.length) {
            course = all_courses_global[i];
        } else {
            course = loaded_custom_courses[i - all_courses_global.length];
        }

		let course_desc_node = "";

		let title_node = "<div";
		title_node += " class=\"title\">";
		title_node += `${course.title}</div>`;

		let subtitle_node = "<div";
		subtitle_node += " class=\"subtitle\">";
		subtitle_node += `${course.identifier}</div>`;

		let status_node = "<div";
		status_node += ` class=\"course-status ${course.status}\">`;
		status_node += `${course.status} - ${course.seats_taken}/${course.max_seats}</div>`;

		course_desc_node += title_node;
		course_desc_node += subtitle_node;
		course_desc_node += status_node;

		for (let time of course.timing) {
			let timing_node = "<div";
			timing_node += " class=\"timing\">";

			let day_str = time.days.join(', ');
			let start_time = convertTime(time.start_time);
			let end_time = convertTime(time.end_time);
			let local = time.location;

			timing_node += `<b>${start_time} - ${end_time}:</b> ${day_str}<br>@ `;
			timing_node += `<span class="clickable-text" onclick="addSearchFilter(\'at:${local.school}'\)">${local.school}</span>`;
			timing_node += `, ${local.building}, Room ${local.room}</div>`;

			course_desc_node += timing_node;
		}

		let credit_node = "<div";
		credit_node += " class=\"credits\">";
		credit_node += `<br><b>Credits:</b> <span class="clickable-text" onclick="addSearchFilter(\'credits:${(course.credits/100)}\')">${(course.credits/100).toFixed(2)}</span></div>`;

		let instructor_node = "<div";
		instructor_node += " class=\"instructors\">";
		instructor_node += `<br><b>Instructors:</b> <i>`;

		for (let instructor of course.instructors) {
			instructor_node += `<span class="clickable-text" onclick="addSearchFilter(\'with:${instructor.trim().replace(/\s/g, "-")}\')">${instructor}</span>`;
			if (instructor != course.instructors.at(-1) && course.instructors.length > 1) {
				instructor_node += `, `;
			}
		}
		
		instructor_node += `</i></div>`;

		let desc_node = "<div";
		desc_node += " class=\"description\">";
		desc_node += `<b>Description:</b>\n${course.description}</div>`;

        let notes_node = "<div";
		notes_node += " class=\"notes\">";
		notes_node += `<b>Notes:</b> <i>${course.notes}</i></div>`;

		course_desc_node += credit_node;
		course_desc_node += instructor_node;
		course_desc_node += desc_node;
        course_desc_node += notes_node;

		all_desc_global.push(course_desc_node);
	}

    return all_desc_global;
}

onmessage = function(e) {
    let all_desc_global = generateAllDescriptions(e.data[0], e.data[1], e.data[2], e.data[3]);

    postMessage(all_desc_global);
}
  