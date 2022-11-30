const course_regex = /([A-Z]+){1} ?([0-9]+[A-Z]*){1} ?([A-Z]{2})?/g;

function convertTime(time) {
	let return_time = time.substring(0, 5);
	let first_two = parseInt(time.substring(0, 2));

	if (first_two == 12) {
		return `12${return_time.substring(2)} PM`;
	} else if (first_two >= 12) {
		return (first_two - 12) + return_time.substring(2) + " PM";
	} else {
		return return_time + " AM";
	}
}

function generateAllDescriptions(all_desc_global, all_courses_global, loaded_custom_courses, hmc_mode, full=true) {
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

		let status = `<span class="status-highlight ${course.status}">${course.status}</span>`;

		let perm_count = "";
	
		if (true) {
			perm_count = `<span class="perms-highlight" onclick="addSearchFilter(\'perms<${course.perm_count}\')">Perms: ${course.perm_count}</span>`;
		}

		// Put the course code and status in a div on the right
		let status_node = `<span class="desc-statuses"><span class="seats-highlight">${course.seats_taken} / ${course.max_seats}</span><b>${status}${perm_count}</b></span>`;

		course_desc_node += subtitle_node;
		course_desc_node += title_node;
		course_desc_node += status_node;

		let timing = `<span class="desc-blob">`;
		let timing_done = [];

		for (let time of course.timing) {
			let time_str = `${time.days} ${convertTime(time.start_time)} ${convertTime(time.end_time)} ${time.location.school} ${time.location.building} ${time.location.room}`;

			if (!timing_done.includes(time_str)) {
				timing_done.push(time_str);
				
				let timing_node = "<div";
				timing_node += " class=\"timing\">";
	
				let day_str = time.days.join(', ');
				let start_time = convertTime(time.start_time);
				let end_time = convertTime(time.end_time);
				let local = time.location;
	
				timing_node += `<b>${start_time} - ${end_time}:</b> ${day_str}<br>`;
				timing_node += `<span class="clickable-text" onclick="addSearchFilter(\'at:${local.school}'\)">${schoolToReadable(local.school)}</span>`;
				timing_node += `, ${local.building}, Room ${local.room}</div>`;
	
				timing += timing_node;
			}		
		}

		timing += `<button class='default-button locate' onclick='buttonMap(course="${course.identifier}")'>Locate</button></span>`;

		course_desc_node += timing;

		course_desc_node += `<span class="desc-blob">`;

		let credit_node = "<div";
		credit_node += " class=\"credits\">";

		let credits;

		if (hmc_mode) {
			credits = course.credits_hmc/100;
		} else {
			credits = course.credits/100;
		}

		credit_node += `<b>Credits:</b> <span class="clickable-text" onclick="addSearchFilter(\'credits:${credits}\')">${credits.toFixed(2)}</span></div>`;

		let instructor_node = "<div";
		instructor_node += " class=\"instructors\">";
		instructor_node += `<b>Instructors:</b> `;

		for (let instructor of course.instructors) {
			instructor_node += `<span class="clickable-text" onclick="addSearchFilter(\'with:${instructor.trim().replace(/\s/g, "-")}\')"><i>${instructor}</i></span>`;
			instructor_node += "<span> | </span>";
			instructor_node += `<span class='clickable-text rmp' onclick='rmp("${instructor.trim()}", "${course.identifier}")'>RMP</span>`;

			if (instructor != course.instructors[course.instructors.length - 1] && course.instructors.length > 1) {
				if (course.instructors.length == 2) {
					instructor_node += " & ";
				} else {
					instructor_node += ", ";
				}
			}
		}
		
		instructor_node += `</div>`;

		let desc_node = "<div";
		desc_node += " class=\"description\">";
		desc_node += `<b>Description:</b>\n${findCourseLinks(course.description)}</div>`;

		let fulfulls_node = "<div";
		fulfulls_node += " class=\"fulfills\">";
		fulfulls_node += `<b>Fulfills:</b> `;
		for (let fulfills of course.fulfills) {
			fulfulls_node += `<span class="clickable-text" onclick="addSearchFilter(\'area:${fulfills.trim().replace(/\s/g, "-")}\')">${fulfills}</span>, `;
		}

		fulfulls_node = fulfulls_node.slice(0, -2);
		fulfulls_node += `</div>`;

		let prereq_node = "<div class=\"prerequisites\">";
		prereq_node += `<b>Prerequisites:</b>\n${findCourseLinks(course.prerequisites)}</div>`;

		let coreq_node = "<div class=\"corequisites\">";
		coreq_node += `<b>Corequisites:</b>\n${findCourseLinks(course.corequisites)}</div>`;

        let notes_node = "<div";
		notes_node += " class=\"notes\">";
		notes_node += `<b>Notes:</b> <i>${findCourseLinks(course.notes)}</i></div>`;
		
		course_desc_node += credit_node;
		course_desc_node += instructor_node;
		course_desc_node += desc_node;
		course_desc_node += fulfulls_node;
		course_desc_node += prereq_node;
		course_desc_node += coreq_node;
        course_desc_node += notes_node;

		course_desc_node += "</span>";

		all_desc_global.push(course_desc_node);
	}

    return all_desc_global;
}

function schoolToReadable(school) {
	switch (school) {
		case "HarveyMudd":
			return "Harvey Mudd";
		case "ClaremontMckenna":
			return "Claremont McKenna";
		case "Pomona":
			return "Pomona";
		case "Pitzer":
			return "Pitzer";
		case "Scripps":
			return "Scripps";
	}
}

function findCourseLinks(text) {
	let matches = (text ?? "").replaceAll(course_regex, function (match, p1, p2, p3) {
		let p3_str = " ";
		
		if (p3 != undefined) {
			p3_str = `-${p3}`;
		}

		return `<span class=\"clickable-text\" onclick=\"addSearchFilter(\'${p1}-${p2}${p3_str}\')\">${p1}-${p2}${p3_str}</span>`;		
	});

	return matches;
}

onmessage = function(e) {
    let all_desc_global = generateAllDescriptions(e.data[0], e.data[1], e.data[2], e.data[3], e.data[4]);

    postMessage(all_desc_global);
}
  