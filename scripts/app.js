// *****
// Title button functions
// *****

function buttonLoad() {
	Swal.fire({
		title: 'Load Course List',
		html: `<div><input maxlength='7' id="code-input" oninput="checkIfFull()"></div>`,
		focusConfirm: false,
		showCancelButton: true,
		confirmButtonText: 'Load',
		showLoaderOnConfirm: true,
		preConfirm: async () => {
			try {
				const response = await fetch(`${API_URL}${GET_COURSE_LIST_BY_CODE(document.getElementById("code-input").value.toUpperCase())}`)
				if (!response.ok) {
					throw new Error(response.statusText)
				}
				return await response.json()
			} catch (error) {
				Swal.showValidationMessage(
					`Invalid Code! ${error}`
				)
			}
		},
		allowOutsideClick: () => !Swal.isLoading()
	}).then(async (result) => {
		if (result.value == "Invalid code") {
			Toast.fire({
				title: 'Invalid code',
				icon: 'error'
			});
		} else if (result.value != undefined) {
			let tuple = result.value;

			let course_list = {
				code: tuple.code,
				courses: tuple.courses.local_courses,
			};

			let custom_courses = tuple.courses.custom_courses;

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

			updateSchedule();
		}
	})
}

function checkIfFull() {
	if (document.getElementById("code-input").value.length == 7) {
		document.getElementsByClassName("swal2-confirm swal2-styled")[0].focus();
	}
}

function copyStyle(target, source) {
	s = getComputedStyle(source);

	for (let key of s) {
		let prop = key.replace(/\-([a-z])/g, v => v[1].toUpperCase());
		target.style[prop] = s[key];
	}

	for (let i = 0; i < source.children.length; i++) {
		copyStyle(target.children[i], source.children[i]);
	}
}

function buttonCustomCourse() {
	Swal.fire({
		title: 'Custom Course Manager',
		icon: '',
		html: custom_course_popup,
		showCloseButton: true,
		showCancelButton: false,
		confirmButtonText:
			`Done`,
		customClass: 'swal-medium-wide',
	}).then(async (result) => {
		await save_json_data("loaded_custom_courses", loaded_custom_courses);

		Toast.fire({
			icon: 'success',
			title: `Saved custom course preferences`
		})
	});

	document.getElementsByClassName("custom-course-manager")[0].addEventListener("keydown", function (event) {
		if (event.code === "Enter") {
			document.activeElement.click();
		}
	});

	updateCustomCourseList();
}

function updateCustomCourseList() {
	try {
		const el = document.getElementById("custom-course-list");
		if (loaded_custom_courses.length > 0) {
			el.innerHTML = "";

			let i = 0;
			for (let course of loaded_custom_courses) {
				let course_div = createLoadedCourseDiv(course.identifier, course.title, colors[i % colors.length]);
				el.appendChild(course_div);
				i++;
			}

		} else {
			el.innerHTML = "No custom courses have been created yet! <br> Click the \"Create New\" button to start. <br> You can add courses to the schedule by clicking the \"Add\" button.";
		}
	} catch (error) {
		return;
	}

}

function createNewCourse() {
	const right_panel = document.getElementsByClassName("right-panel")[0];
	const course_form = document.getElementsByClassName("create-course-form")[0];

	right_panel.style.display = "none";
	course_form.style.display = "block";
}

function cancelNewCourse() {
	const right_panel = document.getElementsByClassName("right-panel")[0];
	const course_form = document.getElementsByClassName("create-course-form")[0];

	right_panel.style.display = "block";
	course_form.style.display = "none";
}

function populateField(element_name, value) {
	document.getElementById(element_name).value = value;
}

async function submitNewCourse() {
	const form = document.getElementsByClassName("form-group")[0];

	const title = document.getElementById("course-title").value ?? " ";
	let identifier = document.getElementById("course-identifier").value ?? " ";
	const instructors = document.getElementById("course-instructors").value ?? " ";
	const description = document.getElementById("course-description").value ?? " ";
	const notes = document.getElementById("course-notes").value ?? " ";
	const start_time = document.getElementById("course-start-time").value ?? " ";
	const end_time = document.getElementById("course-end-time").value ?? " ";
	const location = document.getElementById("course-location").value ?? " ";

	let days = [];
	let day_names = ["monday", "tuesday", "wednesday", "thursday", "friday",];
	for (let day_name of day_names) {
		if (document.getElementById(`${day_name}-check`).checked) {
			days.push(day_name.replace(/^\w/, (c) => c.toUpperCase()));
		}
	}

	if (title.trim() != "" && start_time.trim() != "" && end_time.trim() != "" && location.trim() != "" && days.length > 0) {
		if (identifier.trim() == "") {
			identifier = `CUSTOM-`;
			for (let part of title.split(" ")) {
				identifier += part.substring(0, 4).toUpperCase();
			}
		}

		const new_course = {
			title: title,
			identifier: identifier,
			instructors: [instructors],
			description: description,
			notes: notes,
			id: "",
			code: "",
			dept: "",
			section: "",
			max_seats: 0,
			seats_taken: 0,
			seats_remaining: 0,
			credits: 0,
			status: "Open",
			timing: [{
				days: days,
				start_time: `${start_time}:00`,
				end_time: `${end_time}:00`,
				location: {
					school: "NA",
					building: "",
					room: location,
				}
			}]
		}

		let exists = loaded_custom_courses.findIndex(course => course.identifier == new_course.identifier);

		if (exists != -1) {
			loaded_custom_courses[exists] = new_course;
		} else {
			loaded_custom_courses.push(new_course);
		}

		await save_json_data("loaded_custom_courses", loaded_custom_courses);

		const right_panel = document.getElementsByClassName("right-panel")[0];
		const course_form = document.getElementsByClassName("create-course-form")[0];

		right_panel.style.display = "block";
		course_form.style.display = "none";

		generateAllDescriptions();
		updateCustomCourseList();
		updateSchedule();
	} else {

	}
}

async function editCourse() {
	const custom_course_list = document.getElementById("custom-course-list");
	let els = custom_course_list.getElementsByClassName("selected") ?? [];
	console.log(els);

	if (els.length > 0) {
		let el = els[0];
		let course_id = el.classList[3].replace("-loaded", "");

		const right_panel = document.getElementsByClassName("right-panel")[0];
		const course_form = document.getElementsByClassName("create-course-form")[0];

		right_panel.style.display = "none";
		course_form.style.display = "block";

		const course = loaded_custom_courses.find(course => course.identifier == course_id);

		populateField("course-title", course.title);
		populateField("course-identifier", course.identifier);
		populateField("course-instructors", course.instructors[0]);
		populateField("course-description", course.description);
		populateField("course-notes", course.notes);
		populateField("course-start-time", course.timing[0].start_time.splice(0,5));
		populateField("course-end-time", course.timing[0].end_time.splice(0,5));
		populateField("course-location", course.timing[0].location.room);

		let day_names = ["monday", "tuesday", "wednesday", "thursday", "friday",];
		for (let day_name of day_names) {
			if (course.timing[0].days.includes(day_name.replace(/^\w/, (c) => c.toUpperCase()))) {
				document.getElementById(`${day_name}-check`).checked = true;
			}
		}
	}
}

function buttonExport() {
	Swal.fire({
		title: 'Export',
		icon: 'success',
		html: '<canvas id="export-holder" alt="schedule"></canvas><br><b>Downloading...</b>',
		customClass: 'swal-medium-wide',
	});

	Swal.showLoading();

	canvas = document.getElementById("export-holder");
	source = document.getElementById("schedule-box");
	screenshotToCanvas(canvas, source);
	setTimeout(download_link, 1000);
}

function download_link() {
	var link = document.createElement('a');
	let date = new Date();
	console.log(date.toLocaleString('en-US'));
	let date_string = date.toLocaleString('en-US');
	date_string = date_string.replace(/,/g, "").replace(/ /g, "_").replace(/:/g, "-").replace(/\//g, "-");
	console.log(date_string);
	link.download = `schedule-${date_string}.png`;
	link.href = document.getElementById('export-holder').toDataURL()
	link.click();
}

function screenshotToCanvas(canvas, source) {
	target = source.cloneNode(true);

	let x = source.offsetWidth;
	let y = source.offsetHeight;

	copyStyle(target, source);

	rasterizeHTML.drawHTML(target.innerHTML, canvas, {
		width: `${x}`,
		height: `${y}`,
	})
		.then(function success(renderResult) {
			canvas.width = x;
			canvas.height = y;
			canvas.style.width = `${x / 2}px`;
			canvas.style.height = `${y / 2}px`;
			context = canvas.getContext('2d');
			context.drawImage(renderResult.image, 0, 0, width = x, height = y);
			Swal.hideLoading();
		}, function error(e) {
			Swal.fire({
				title: 'Export',
				icon: 'error',
				html:
					`Error: ${e.message}`,
			})
		});
}

function buttonPrint() {
	let windowContent = '<!DOCTYPE html>';
	windowContent += '<html>';
	windowContent += '<head><title>Print canvas</title><style>';
	windowContent += '@page { size: auto;  margin: 0mm auto; }';
	windowContent += '</style></head>';
	windowContent += '<body>';
	windowContent += '<canvas id="print-holder"></canvas>';
	windowContent += '</body>';
	windowContent += '</html>';

	const printWin = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
	printWin.document.open();
	printWin.document.write(windowContent);
	source = document.getElementById("schedule-box");
	canvas = printWin.document.getElementById("print-holder");
	screenshotToCanvas(canvas, source);

	printWin.focus();
	setTimeout(function () {
		printWin.print();
		printWin.document.close();
		printWin.close();
	}, 200);

	Toast.fire({
		icon: 'info',
		title: `Print dialogue opened`
	});
}

function buttonSearch() {
	selected_courses = [];

	if (all_courses_global == null) {
		Swal.fire({
			title: 'Error fetching courses!',
			icon: 'error'
		});
	} else {
		Swal.fire({
			title: 'Search Courses',
			icon: '',
			html: `<div><input class="input" id="course-input" onKeyUp="processChange()"></div>` +
				`<div id="course-search-box"><div id="course-search-results"></div><div id="course-search-desc" class="course-desc"></div></div><br>`,
			showCloseButton: true,
			showCancelButton: true,
			confirmButtonText:
				`<span>Add <span id="course-add-num">0</span> course<span id="multiple-course-s">s</span></span>`,
			cancelButtonText:
				'Cancel',
			customClass: 'swal-wide',
		}).then(async (result) => {
			if (result.isConfirmed) {
				let num_courses = await addCourses();

				s = "s";

				if (num_courses == 1) {
					s = "";
				}

				Toast.fire({
					icon: 'success',
					title: `Added ${num_courses} Course${s}`
				})
			}
		});
		let input = document.getElementById("course-input");
		document.getElementById("course-search-results").addEventListener("keydown", function (event) {
			if (event.code === "Enter") {
				document.activeElement.click();
			}
		});
		input.focus();

		// For screenreaders/text browsers, we need to make the content available to the user in a non-visual way.
		input.addEventListener("keydown", function (event) {
			if (event.code === "Enter") {
				// Cancel the default action, if needed
				event.preventDefault();
				// Trigger the button element with a click
				expensiveCourseSearch();
			}
		});

		setTimeout(() => {
			expensiveCourseSearch()
		}, 100);
	}
}

const Toast = Swal.mixin({
	toast: true,
	position: 'bottom-end',
	showConfirmButton: false,
	timer: 3000,
	timerProgressBar: true,
	didOpen: (toast) => {
		toast.addEventListener('mouseenter', Swal.stopTimer)
		toast.addEventListener('mouseleave', Swal.resumeTimer)
	}
})

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
			body: JSON.stringify([loaded_local_courses, loaded_custom_courses])
		});

		const code = await response.json();

		const qr_data = `https://www.5scheduler.io/?load=${code}`;

		const QRC = qrcodegen.QrCode;
		const qr = QRC.encodeText(qr_data, QRC.Ecc.HIGH);
		const svg = toSvgString(qr, 2, "#FFFFFF", "#000000");

		Swal.fire({
			title: 'Share',
			icon: 'success',
			html: `<div class="code-share">${code}</div><div class="code-explain">or</div><div id="code-link" class="unselectable">Copy Link</div><div class="qr-code">${svg}</div>`,
		});

		document.getElementById("code-link").addEventListener("click", function () {
			let el = document.getElementById("code-link");
			navigator.clipboard.writeText(qr_data);
			el.className = "code-copied unselectable";
			el.innerHTML = "Copied!";
		});
	}
}

function buttonCal() {
	if (loaded_local_courses.length == 0) {
		Swal.fire({
			title: 'No courses have been locally loaded!',
			icon: 'error'
		})
	} else {
		ical_all = generateICal(loaded_local_courses);
		ical_starred = generateICal(loaded_local_courses.filter(course => starred_courses.includes(course.identifier)));
		ical_nstarred = generateICal(loaded_local_courses.filter(course => !starred_courses.includes(course.identifier)));

		Swal.fire({
			title: 'Save as iCal',
			icon: 'success',
			html: `<div class="ical-box">
			<div class="ical-explain">
			<b>Google Calendar:</b><br>
			1. Click on the <b>Settings</b> gear on the top right<br>
			2. Click on <b>Settings</b> and go to <b>Import & Export</b><br>
			3. Select the downloaded .ics file and click <b>Import</b><br>
			<br>
			<b>Apple Calendar:</b><br>
			1. With the calendar app open, go to <b>File > Import</b><br>
			2. Select the downloaded .ics file and click <b>Import</b><br>
			3. Select which calendars to add the events to<br> 
			</div>
				<div class="ical-dl-holder">
					<div onclick="downloadICal(ical_all)" class="title-bar-button dl"></div>
					Download all courses
				</div>
				<div class="ical-dl-holder">
					<div onclick="downloadICal(ical_starred)" class="title-bar-button dl"></div>
					Download starred courses
				</div>
				<div class="ical-dl-holder">
					<div onclick="downloadICal(ical_nstarred)" class="title-bar-button dl"></div>
					Download unstarred courses
				</div>
			</div>`,
		});
	}
}

function downloadICal(ical) {
	ical.download("courses");
}

function nextDate(day_name) {
	let day_index = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day_name);

	var today = new Date();
	today.setDate(today.getDate() + (day_index - 1 - today.getDay() + 7) % 7 + 1);
	return today;
}

function generateICal(courses) {
	let ical = ics();

	let sanitized_courses = sanitizeCourseList(courses);

	sanitized_courses.forEach(course => {
		course.timing.forEach(timing => {
			let next_valid_date = nextDate(timing.days[0]);

			let start_time = `${next_valid_date.getFullYear()}/${next_valid_date.getMonth()}/${next_valid_date.getDate()} ${timing.start_time}`;

			let end_time = `${next_valid_date.getFullYear()}/${next_valid_date.getMonth()}/${next_valid_date.getDate()} ${timing.end_time}`;

			let days = timing.days.map(day => day.toUpperCase().substring(0, 2));

			let location = `${timing.location.school} ${timing.location.building} ${timing.location.room}`;
			let rrule = {
				freq: 'WEEKLY',
				byday: days,
			};
			ical.addEvent(course.title, course.description, location, start_time, end_time, rrule);
		});
	});

	return ical;
}

function buttonTheme() {
	toggle_theme();
}

function buttonAbout() {
	Swal.fire({
		title: 'About',
		imageUrl: 'android-chrome-192x192.png?v=1.2',
		imageWidth: 100,
		imageHeight: 100,
		html: `<div id="about-desc"> Created By: <b>Ethan Vazquez</b> HMC '25<BR>` +
			`Send comments/questions/bug reports to: <b>edv121@outlook.com</b><BR><BR>` +
			`<b>Webpage Repo:</b> <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>` +
			`Built using <a href="https://www.javatpoint.com/what-is-vanilla-javascript">VanillaJS</a><br>` +
			`<b>API Repo:</b> <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<br>` +
			`Built using <a href="https://www.rust-lang.org/">Rust</a><BR><BR>` +
			`<b><u>Credits:</b></u><BR>` +
			`<b>fuzzysort.js</b><br>Created by Stephen Kamenar.<br>Licensed under the MIT License.<br>` +
			`<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>` +
			`<b>qrcodegen.js</b><br>Created by Nayuki.<br>Licensed under the MIT License.<br>` +
			`<b>rasterizeHTML.js</b><br>Created by cburgmer.<br>Licensed under the MIT License.<br></div>`
	});
}

const processChange = debounce(() => expensiveCourseSearch());

function debounce(func) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func.apply(this, args); }, debounce_timer);
	};
}

function expensiveCourseSearch() {
	let input = document.getElementById("course-input");
	let output = document.getElementById("course-search-results");

	if (output == null) {
		return
	}
	removeAllChildren(output);

	if (input.value == "") {

		for (let i = 0; i < all_courses_global.length; i++) {
			let course = all_courses_global[i];

			let course_div = createResultDiv(course, colors[i % colors.length], i);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("selected");
			}

			output.appendChild(course_div)

		}

		setCourseDescription(0);

	} else {
		const search_term = tweakSearch(input.value);

		const results = search_courses(search_term);

		for (let i = 0; i < results.length; i++) {
			let course = results[i].obj;

			let course_div = createResultDiv(course, colors[i % colors.length], course.descIndex);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("selected");
			}

			output.appendChild(course_div)
		}
	}

	output.scroll({ top: 0, behavior: 'smooth' });

}


function toggleCourseSelection(identifier) {
	let el = document.getElementById(identifier);

	if (el.className == "course-search-result unselectable") {
		selected_courses.push(el.id);
		el.className = "course-search-result unselectable selected";
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
	let course_info = all_desc_global[index];

	if (course_search_desc.firstChild != null) {
		course_search_desc.removeChild(course_search_desc.firstChild);
	}
	course_search_desc.appendChild(course_info.cloneNode(true));
}

async function addCourses() {
	let courses = [];

	// Find courses from identifier
	for (let course of selected_courses) {
		courses.push(all_courses_global.filter(e => e.identifier == course)[0]);
	}

	let num_courses = 0;

	for (let course of courses) {
		let found = false;
		for (let l_course of loaded_local_courses) {
			if (l_course.identifier == course.identifier) {
				found = true;
				break;
			}
		}

		if (!found) {
			loaded_local_courses.push(course);
			num_courses++;
		}
	}

	await save_json_data("loaded_local_courses", loaded_local_courses);

	updateSchedule();

	return num_courses;
}

function tweakSearch(string) {
	let return_string = string.toLowerCase();

	// Common replacements
	// Type can be "full" or "any"
	// Full only matches full tokens/words separated by spaces
	const replacements = [
		{ type: "full", search: "cs", replace: "csci" },
		{ type: "full", search: "hmc", replace: "HarveyMudd" },
		{ type: "full", search: "cmc", replace: "ClaremontMckenna" },
		{ type: "full", search: "harvey mudd", replace: "HarveyMudd" },
		{ type: "full", search: "claremont mckenna", replace: "ClaremontMckenna" },
	];

	for (replacement of replacements) {
		if (replacement.type == "full") {
			return_string = return_string.replace(new RegExp(`\\b${replacement.search}\\b`, 'g'), replacement.replace);
		} else if (replacement.type == "any") {
			return_string = return_string.replace(replacement.search, replacement.replace);
		}
	}

	// Add a 0 to the course number
	let num_corrected_string = "";

	for (part of return_string.split(" ")) {
		// JS is horrible, to see if a string is a number or not
		// I have to parse it then take the output and convert
		// that back to a string.
		//
		// Then I can compare it to the string value of "NaN" to see
		// if it's a number or not.
		if (part.length == 2 && `${parseInt(part)}` != "NaN") {
			num_corrected_string += ` 0${part}`;
		} else {
			num_corrected_string += ` ${part}`;
		}
	}

	return_string = num_corrected_string;

	return return_string.trim().toLowerCase();
}

async function addToCourseLists(course_list) {
	let found = false;

	for (let l_course of loaded_course_lists) {
		if (l_course.code == course_list.code) {
			found = true;
			break;
		}
	}

	if (!found) {
		loaded_course_lists.push(course_list);
		await save_json_data("loaded_course_lists", loaded_course_lists);

		return true;
	} else {
		return false;
	}
}

async function addToCustomCourseList(custom_courses) {
	let number_of_conflicts = 0;
	for (let course of custom_courses) {
		if (loaded_custom_courses.filter(x => x.identifier == course.identifier) > 0) {
			number_of_conflicts++;
		} else {
			loaded_custom_courses.push(course);
		}
	}

	if (custom_courses.length - number_of_conflicts > 0) {
		await generateAllDescriptions(false);
		await save_json_data("loaded_custom_courses", loaded_custom_courses);
	}

	return number_of_conflicts;
}

async function deleteCourse(identifier) {
	let found = false;

	for (let i = 0; i < loaded_local_courses.length; i++) {
		let course = loaded_local_courses[i];

		if (course.identifier == identifier) {
			found = true;
			loaded_local_courses.splice(i, 1);
			break;
		}
	}

	if (found) {
		await save_json_data("loaded_local_courses", loaded_local_courses);
		updateSchedule();
		return;
	}

	found = false;

	for (let i = 0; i < loaded_custom_courses.length; i++) {
		let course = loaded_custom_courses[i];

		if (course.identifier == identifier) {
			found = true;
			loaded_custom_courses.splice(i, 1);
			break;
		}
	}

	if (found) {
		await save_json_data("loaded_custom_courses", loaded_custom_courses);
		updateCustomCourseList();
		updateSchedule();
		return;
	}
}

async function deleteCourseList(code) {
	let found = false;

	for (let i = 0; i < loaded_course_lists.length; i++) {
		let course_list = loaded_course_lists[i];

		if (course_list.code == code) {
			found = true;
			loaded_course_lists.splice(i, 1);
			break;
		}
	}

	if (found) {
		await save_json_data("loaded_course_lists", loaded_course_lists);
		updateSchedule();
	}
}

async function mergeCourseList(code) {
	let found = false;

	for (let i = 0; i < loaded_course_lists.length; i++) {
		let course_list = loaded_course_lists[i];

		if (course_list.code == code) {
			found = true;

			for (let course of course_list.courses) {
				if (!loaded_local_courses.map((el) => el.identifier).includes(course.identifier)) {
					loaded_local_courses.push(course);
				}
			}

			loaded_course_lists.splice(i, 1);
			break;
		}
	}

	if (found) {
		await save_json_data("loaded_course_lists", loaded_course_lists);
		await save_json_data("loaded_local_courses", loaded_local_courses);
		updateSchedule();
	}
}

function highlightCourses(identifier) {
	let els = document.getElementsByClassName(`${identifier}-loaded`);

	for (let el of els) {
		el.classList.add("selected");
	}
}

function removeHighlightCourses(identifier) {
	let els = document.getElementsByClassName(`${identifier}-loaded`);

	for (let el of els) {
		el.classList.remove("selected");
	}
}

function toggleCourseOverlay(identifier) {
	// Case one: nothing has happened yet
	if (overlay.locked == false) {
		overlay.locked = true;
		overlay.identifier = identifier;

		// Highlight the courses
		highlightCourses(identifier);
		showCourseOverlay(identifier, override = true);
	}
	// Case two: we're already showing the overlay, and it's the same course
	else if (overlay.locked == true && overlay.identifier == identifier) {
		overlay.locked = false;
		overlay.identifier = "";

		// Remove the highlight
		removeHighlightCourses(identifier);
	}
	// Case three: we're already showing the overlay, and it's a different course
	else if (overlay.locked == true && overlay.identifier != identifier) {
		// Remove the highlight
		removeHighlightCourses(overlay.identifier);

		overlay.locked = true;
		overlay.identifier = identifier;

		// Highlight the courses
		highlightCourses(identifier);
		showCourseOverlay(identifier, override = true);
	}
}

function showCourseOverlay(identifier, override = false) {
	if (overlay.locked == false || override == true) {
		if (all_desc_global.length == 0) {
			generateAllDescriptions();
		}

		// get index of course
		let index = all_courses_global.findIndex((el) => el.identifier == identifier);

		if (index == -1) {
			index = loaded_custom_courses.findIndex((el) => el.identifier == identifier);
			index += all_courses_global.length;
		}

		let course_info = all_desc_global[index];

		let course_info_table = document.getElementById("course-info-table");

		if (course_info_table.firstChild != null) {
			course_info_table.removeChild(course_info_table.firstChild);
		}

		let node_to_append = course_info.cloneNode(true);

		node_to_append.childNodes[node_to_append.childNodes.length - 2].remove();

		course_info_table.appendChild(node_to_append);
	}
}

function starCourse(identifier) {
	// Stop bubbling onclick event
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	if (starred_courses.includes(identifier)) {
		starred_courses.splice(starred_courses.indexOf(identifier), 1);
	} else {
		starred_courses.push(identifier);
	}

	save_json_data("starred_courses", starred_courses);

	let els = document.getElementsByClassName(`${identifier}-loaded`);

	for (let el of els) {
		el.classList.toggle("starred-course");
		el.getElementsByClassName("star-course")[0].classList.toggle("filled");
	}
}

function showStarCourse(identifier) {
	let els = document.getElementsByClassName(`${identifier}-loaded`);

	for (let el of els) {
		el.classList.add("starred-course");
		el.getElementsByClassName("star-course")[0].classList.add("filled");
	}
}

function toggle_theme() {
	if (document.documentElement.getAttribute("data-theme") != "dark") {
		document.documentElement.setAttribute('data-theme', 'dark');
		localStorage.setItem("theme", "dark");
	}
	else {
		document.documentElement.setAttribute('data-theme', 'light');
		localStorage.setItem("theme", "light");
	}
}

function toSvgString(qr, border, lightColor, darkColor) {
	if (border < 0)
		throw "Border must be non-negative";
	let parts = [];
	for (let y = 0; y < qr.size; y++) {
		for (let x = 0; x < qr.size; x++) {
			if (qr.getModule(x, y))
				parts.push(`M${x + border},${y + border}h1v1h-1z`);
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + border * 2} ${qr.size + border * 2}" stroke="none">
<rect width="100%" height="100%" fill="${lightColor}"/>
<path d="${parts.join(" ")}" fill="${darkColor}"/>
</svg>
`
}