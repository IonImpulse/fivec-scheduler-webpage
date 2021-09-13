// *****
// Title button functions
// *****

function buttonImport() {
	Swal.fire({
		title: 'Import Course Code',
		html: `<div><input maxlength='7' id="code-input"></div>`,
		focusConfirm: false,
		showCancelButton: true,
		confirmButtonText: 'Load',
		showLoaderOnConfirm: true,
		preConfirm: () => {
			return fetch(`${API_URL}${GET_COURSE_LIST_BY_CODE(document.getElementById("code-input").value.toUpperCase())}`)
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
				})
		},
		allowOutsideClick: () => !Swal.isLoading()
	}).then((result) => {
		if (result.isConfirmed) {
			Swal.fire({
				title: `Loaded courses!`
			})
		}
	})
}

function buttonExport() {
	html2canvas(document.querySelector("#schedule-box"), {

	}).then(function (canvas) {

		Swal.fire({
			title: 'Export',
			icon: 'success',
			html:
				'<div id="share-image"></div><br>' +
				'To download, right click the image above and click "Save Image As...',
		})

		document.querySelector("#share-image").appendChild(canvas);

	});
}

function buttonPrint() {
	Swal.fire({
		title: 'Print',
		icon: 'success',
		text: 'Print dialogue was opened...',
	})

	let divContents = document.getElementById("schedule-box");
	PrintElements.print([divContents]);
}


function buttonSearch() {
	let courses = load_json_data("course_data");
	selected_courses = [];

	if (courses == null) {
		Swal.fire({
			title: 'Error fetching courses!',
			icon: 'error'
		});
	} else {
		all_courses_global = courses[1];
		generateAllDescriptions();

		Swal.fire({
			title: 'Search Courses',
			icon: 'info',
			html: `<div><input class="swal2-input" id="course-input" onKeyUp="updateCourseSearch()"></div>` +
				`<div id="course-search-box"><div id="course-search-results"></div><div id="course-search-desc"></div></div><br>`,
			showCloseButton: true,
			showCancelButton: true,
			confirmButtonText:
				`<span onclick="addCourses()">Add <span id="course-add-num">0</span> course<span id="multiple-course-s">s</span></span>`,
			cancelButtonText:
				'Cancel',
			customClass: 'swal-wide',
		});

		document.getElementById("course-input").focus();

		updateCourseSearch();
	}
}

async function buttonShare() {

	if (loaded_local_courses.length == 0) {
		Swal.fire({
			title: 'No courses have been locally loaded!',
			icon: 'error'
		})
	} else {
		let response = await fetch(`${API_URL}${GET_UNIQUE_CODE}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(loaded_local_courses)
		});

		let code = await response.json();

		Swal.fire({
			title: 'Share',
			icon: 'success',
			html: `<b>Code:<b><br><b>${code}<b>`,
		})
	}
}

function buttonTheme() {
	toggle_theme();
}

function buttonAbout() {
	Swal.fire({
		title: 'About',
		icon: 'info',
		html: `Created By: <b>Ethan Vazquez</b> HMC '25<BR>` +
			`Send comments/questions/bug reports to: <b>edv121@outlook.com</b><BR><BR>` +
			`Webpage Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>` +
			`API Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<BR><BR>` +
			`<b><u>Credits:</b></u><BR>` +
			`<b>html2canvas.js</b><br>Created by Niklas von Hertzen.<br>Licensed under the MIT License.<br>` +
			`<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>`
	});
}

function debounce(func, timeout = 300) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func.apply(this, args); }, timeout);
	};
}

const updateCourseSearch = debounce(() => expensiveCourseSearch());

function expensiveCourseSearch() {
	let input = document.getElementById("course-input");
	let output = document.getElementById("course-search-results");
	output.innerHTML = "";

	if (input.value == "") {

		for (let i = 0; i < all_courses_global.length; i++) {
			let course = all_courses_global[i];

			let course_div = createResultDiv(course, colors[i % colors.length], i);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("course-clicked");
			}

			output.appendChild(course_div)

		}

		setCourseDescription(0);

	} else {
		let results = fuzzy_searcher.search(input.value);

		console.log(results);
		
		for (let i = 0; i < results.length; i++) {
			let course = results[i].item;

			let course_div = createResultDiv(course, colors[i % colors.length], results[i].refIndex);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("course-clicked");
			}

			output.appendChild(course_div)
		}
	}

	output.scroll({top:0,behavior:'smooth'});

}

function createResultDiv(course, color, index) {
	let identifier = course.identifier;

	let course_div = document.createElement("div");
	course_div.className = "course-search-result unselectable";
	course_div.id = identifier;
	course_div.onclick = function () {
		toggleCourseSelection(identifier)
	};
	course_div.onmouseover = function () {
		setCourseDescription(index)
	};
	
	course_div.style.backgroundColor = `var(--course-${color})`;
	let course_code = `<b>${course.identifier}</b>`;
	let status = `<span class="status-highlight ${course.status}">${course.status}</span>`;
	// Put the course code and status in a div on the right
	let num_students = `<span class="align-right" ><b>${course.seats_taken}/${course.max_seats} ${status}</b></span>`;

	course_div.innerHTML = `${course_code}: ${course.title} ${num_students}`;

	return course_div;
}

function toggleCourseSelection(identifier) {
	let el = document.getElementById(identifier);

	if (el.className == "course-search-result unselectable") {
		selected_courses.push(el.id);
		el.className = "course-search-result unselectable course-clicked";
	} else {
		selected_courses.splice(selected_courses.indexOf(el.id), 1);
		el.className = "course-search-result unselectable";
	}

	el = document.getElementById("course-add-num");
	el.innerText = selected_courses.length;

	el = document.getElementById("multiple-course-s");

	if (selected_courses.length == 1) {
		el.innerText = "";
	} else {
		el.innerText = "s";
	}
}

function convertTime(time) {
	let return_time = time.substring(0, 5);
	let first_two = parseInt(time.substring(0, 2));

	if (first_two > 12) {
		return (first_two - 12) + return_time.substring(2) + " PM";
	} else {
		return return_time + " AM";
	}
}

function setCourseDescription(index) {
	let course_search_desc = document.getElementById("course-search-desc");
	let desc = all_desc_global[index];

	course_search_desc.innerHTML = desc;
}

function generateAllDescriptions() {
	all_desc_global = [];
	for (let i = 0; i < all_courses_global.length; i++) {
		let course = all_courses_global[i];

		let course_search_desc = "";

		course_search_desc += `
	<div class="title">${course.title}</div>
	<div class="subtitle">${course.identifier}</div>
	<div class="course-status ${course.status}">${course.status} - ${course.seats_taken}/${course.max_seats}</div>
	`;

		for (let time of course.timing) {
			let day_str = time.days.join(', ');
			let start_time = convertTime(time.start_time);
			let end_time = convertTime(time.end_time);
			let local = time.location;

			course_search_desc += `
	  <div class="timing"><b>${start_time}-${end_time}:</b> ${day_str} @ ${local.school}, ${local.building}, Room ${local.room}</div>`;

		}

		course_search_desc += `<div class="instructors"><i>${course.instructors.join(', ')}</i></div>`;

		course_search_desc += `
	<div class="description"><b>Description:</b>\n${course.description}</div>
	`;


		all_desc_global.push(course_search_desc);

	}
}

function addCourses() {
	console.log(selected_courses)
	let courses = [];
	
	// Find courses from identifier
	for (let course of selected_courses) {
		courses.push(all_courses_global.filter(e => e.identifier == course)[0]);
	}

	for (let course of courses) {
		if (!loaded_local_courses.includes(course)) {
			loaded_local_courses.push(course);
		}
	}

	console.log(loaded_local_courses);

	save_json_data("loaded_local_courses", loaded_local_courses);

	updateLoadedCourses();
}