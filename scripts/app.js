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
			await intakeCourseData(result.value);

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

		updateDescAndSearcher();
		updateCustomCourseList();
		updateSchedule();
	} else {

	}
}

async function editCourse() {
	const custom_course_list = document.getElementById("custom-course-list");
	let els = custom_course_list.getElementsByClassName("selected") ?? [];

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
		populateField("course-start-time", course.timing[0].start_time.substring(0,5));
		populateField("course-end-time", course.timing[0].end_time.substring(0,5));
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
		title: 'Save As Image',
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
			html: search_popup,
			showCloseButton: true,
			showCancelButton: true,
			confirmButtonText:
				`<span>Add <span id="course-add-num">0</span> course<span id="multiple-course-s">s</span></span>`,
			cancelButtonText:
				'Cancel',
			customClass: 'swal-wide',
		}).then(async (result) => {
			document.removeEventListener("keydown", focusAndInput);

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
				backgroundCourseSearch();
			}
		});

		document.getElementsByClassName("swal-wide")[0].onkeydown = focusAndInput;
		
		setTimeout(function () {
			backgroundCourseSearch();
		}, 350);
	}
}

function focusAndInput(event) {
	if (event.code.startsWith("Key") || event.code === "Backspace") {
		let input = document.getElementById("course-input");

		if (input != document.activeElement) {
			input.value = "";
			input.focus();
		}
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
		imageUrl: '/img/favicons/android-chrome-192x192.png',
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

const processChange = debounce(() => backgroundCourseSearch());

function debounce(func, time=debounce_timer) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func.apply(this, args); }, time);
	};
}

async function backgroundCourseSearch() {
	let input = document.getElementById("course-input");
	let output = document.getElementById("course-search-results");

	if (output == null) {
		return;
	}

	if (input.value == "" && all_course_results_html.length > 0) {
		appendCourseHTML(all_course_results_html);

		postProcessSearch(input.value, all_course_results_html);

		return;
	}

	searching_worker.onmessage = function(e) {
        const html_courses = e.data;

		appendCourseHTML(html_courses);
				
		postProcessSearch(document.getElementById("course-input").value, html_courses);
    }

    searching_worker.postMessage([input.value, all_courses_global, colors]);
}

 function appendCourseHTML(courses) {
	let output = document.getElementById("course-search-results");

	if (courses.length == 1) {
		output.innerHTML = "<b>No results found</b>";

		return;
	} else {
		// Superfast html updater
		replaceHtml(output, courses.join("\n"));
		for (let s of selected_courses) {
			let course = document.getElementById(s);

			if (course != null) {
				course.classList.add("selected");
			}
		}
	}
}

function replaceHtml(el, html) {
	var oldEl = typeof el === "string" ? document.getElementById(el) : el;
	/*@cc_on // Pure innerHTML is slightly faster in IE
		oldEl.innerHTML = html;
		return oldEl;
	@*/
	var newEl = oldEl.cloneNode(false);
	newEl.innerHTML = html;
	oldEl.parentNode.replaceChild(newEl, oldEl);
	/* Since we just removed the old element from the DOM, return a reference
	to the new element, which can be used to restore variable references. */
	return newEl;
};

async function postProcessSearch(input, html) {
	let output = document.getElementById("course-search-results");

	if (input == "") {
		setCourseDescription(0);

		if (all_course_results_html == []) {
			all_course_results_html = html;
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

function setCourseDescription(index) {
	let course_search_desc = document.getElementById("course-search-desc");
	let course_info = all_desc_global[index];

	if (course_search_desc.firstChild != null) {
		course_search_desc.removeChild(course_search_desc.firstChild);
	}

	let node_to_append = document.createElement("div")
	node_to_append.innerHTML = course_info;

	course_search_desc.appendChild(node_to_append);
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
		await updateDescAndSearcher(false);
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

			if (course.identifier == overlay.identifier) {
				toggleCourseOverlay(identifier);
			}
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
			updateDescAndSearcher();
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

		let node_to_append = document.createElement("div")
		node_to_append.innerHTML = course_info;

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

function addSearchFilter(filter) {
	// Stop bubbling onclick event
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	let el = document.getElementById("course-input");

	if (el == null) {
		buttonSearch();
		el = document.getElementById("course-input");
	}
	if (el.value.includes(filter.split(":")[0])) {
		let input = el.value.split(" ");
		input.forEach((el, index) => {
			if (el.includes(filter.split(":")[0])) {
				input[index] = filter;
			}
		});

		el.value = input.join(" ");
	} else {
		el.value += ` ${filter}`;
	}
	el.focus();
	backgroundCourseSearch();
}