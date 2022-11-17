function getLoadedCourses() {
    return (state.schedules[state.loaded] ?? {courses: []}).courses
}

function getCheckedCourses() {
	return (state.schedules[state.loaded] ?? {courses: []}).courses.filter(x => state.hidden_courses.indexOf(x.identifier) == -1);
}

function setLoadedCourses(courses) {
    state.schedules[state.loaded].courses = courses;
}

function addToLoadedCourses(course) {
    state.schedules[state.loaded].courses.push(course);
}

function getNthLoadedCourse(n) {
    return state.schedules[state.loaded].courses[n];
}

function deleteNthLoadedCourse(n) {
    state.schedules[state.loaded].courses.splice(n, 1);
}

function checkForConflicts(course, course_list) {
	let timing_conflicts = [];

	for (let i = 0; i < course_list.length; i++) {
		let loaded_course = course_list[i];

		if (loaded_course.identifier == course.identifier) {
			continue;
		}

		Loop:
		for (let j = 0; j < loaded_course.timing.length; j++) {
			for (let k = 0; k < course.timing.length; k++) {
				if (loaded_course.timing[j].days.some(x => course.timing[k].days.includes(x))) {
					let load_start = timeToMinutes(loaded_course.timing[j].start_time);
					let load_end = timeToMinutes(loaded_course.timing[j].end_time);

					let course_start = timeToMinutes(course.timing[k].start_time);
					let course_end = timeToMinutes(course.timing[k].end_time);

					if (load_start <= course_end && course_start <= load_end) {
						timing_conflicts.push(loaded_course);
						break Loop;
					}
				}
			}
		}
	}

	return timing_conflicts;
}

function timeToMinutes(time) {
	let time_split = time.split(":");
	let minutes = parseInt(time_split[0]) * 60 + parseInt(time_split[1]);

	return minutes;
}