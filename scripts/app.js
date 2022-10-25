// Here we can adjust defaults for all color pickers on page:
jscolor.presets.default = {
	position: 'right',
	palette: colors,
	//paletteCols: 12,
	//hideOnPaletteClick: true,
};

// *****
// Title button functions
// *****

function buttonLoad() {
	Swal.fire({
		title: 'Load Schedule',
		html: `<i>Enter a saved schedule code.<br>To add courses, exit and click the "Search" button.</i><div><input maxlength='7' id="code-input" oninput="checkIfFull()"></div>`,
		focusConfirm: false,
		showCancelButton: true,
		confirmButtonText: 'Load',
		showLoaderOnConfirm: true,
		customClass: {
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
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

			updateSchedule(play_animation=true);
		}
	})
}

function checkIfFull() {
	if (document.getElementById("code-input").value.length == 7) {
		document.getElementsByClassName("confirm")[0].focus();
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
		customClass: {
			popup: 'swal-medium-wide',
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
	}).then(async (result) => {

		await saveState();

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
		if (state.custom_courses.length > 0) {
			el.innerHTML = "";

			let i = 0;
			for (let course of state.custom_courses) {
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
	let re = new RegExp(/[<>'"]/ig);
	const title = document.getElementById("course-title").value.replaceAll(re, "") ?? " ";
	let identifier = document.getElementById("course-identifier").value.replaceAll(re, "") ?? " ";
	const instructors = document.getElementById("course-instructors").value.replaceAll(re, "") ?? " ";
	const description = document.getElementById("course-description").value.replaceAll(re, "") ?? " ";
	const notes = document.getElementById("course-notes").value.replaceAll(re, "") ?? " ";
	const start_time = document.getElementById("course-start-time").value.replaceAll(re, "") ?? " ";
	const end_time = document.getElementById("course-end-time").value.replaceAll(re, "") ?? " ";
	const location = document.getElementById("course-location").value.replaceAll(re, "") ?? " ";

	let days = [];
	for (let day_name of weekdays_full) {
		if (document.getElementById(`${day_name.toLowerCase()}-check`).checked) {
			days.push(day_name);
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

		let exists = state.custom_courses.findIndex(course => course.identifier == new_course.identifier);

		if (exists != -1) {
			state.custom_courses[exists] = new_course;
		} else {
			state.custom_courses.push(new_course);
		}

		await saveState();

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

		const course = state.custom_courses.find(course => course.identifier == course_id);

		populateField("course-title", course.title);
		populateField("course-identifier", course.identifier);
		populateField("course-instructors", course.instructors[0]);
		populateField("course-description", course.description);
		populateField("course-notes", course.notes);
		populateField("course-start-time", course.timing[0].start_time.substring(0, 5));
		populateField("course-end-time", course.timing[0].end_time.substring(0, 5));
		populateField("course-location", course.timing[0].location.room);

		for (let day_name of weekdays_full) {
			if (course.timing[0].days.includes(day_name)) {
				document.getElementById(`${day_name.toLowerCase()}-check`).checked = true;
			}
		}
	}
}

function buttonExport() {
	Swal.fire({
		title: 'Save As Image',
		icon: 'success',
		html: '<canvas id="export-holder" alt="schedule"></canvas><br><b>Viewing preview<br>Downloading full resolution image...</b>',
		customClass: {
			popup: 'swal-medium-wide',
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
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
	let date_string = date.toLocaleString('en-US');
	date_string = date_string.replace(/,/g, "").replace(/ /g, "_").replace(/:/g, "-").replace(/\//g, "-");
	link.download = `schedule-${date_string}.png`;
	link.href = document.getElementById('export-holder').toDataURL()
	link.click();
}

function screenshotToCanvas(canvas, source) {
	target = source.cloneNode(true);

	let x = source.offsetWidth * 4;
	let y = source.offsetHeight * 4;

	copyStyle(target, source);

	let line_v = target.getElementsByClassName("line-v");

	for (let line of line_v) {
		line.style.display = "none";
	}

	let current_time = target.getElementsByClassName("line");

	current_time[current_time.length - 1].style.display = "none";

	rasterizeHTML.drawHTML(target.innerHTML, canvas, {
		width: `${x}`,
		height: `${y}`,
	})
		.then(function success(renderResult) {
			canvas.width = x;
			canvas.height = y;
			canvas.style.width = `${x / 8}px`;
			canvas.style.height = `${y / 8}px`;
			context = canvas.getContext('2d');
			context.drawImage(renderResult.image, 0, 0, width = x * 4, height = y * 4);
			Swal.hideLoading();
		}, function error(e) {
			Swal.fire({
				title: 'Export',
				icon: 'error',
				html:
					`Error: ${e.message}`,
				customClass: {
					confirmButton: 'default-button swal confirm',
					cancelButton: 'default-button swal cancel',
				},
				buttonsStyling: false,
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

async function buttonSearch() {
	state.selected = [];

	if (state.courses == null) {
		Swal.fire({
			title: 'Error fetching courses!',
			icon: 'error',
			customClass: {
				confirmButton: 'default-button swal confirm',
				cancelButton: 'default-button swal cancel',
			},
			buttonsStyling: false,
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
			customClass: {
				popup: 'swal-wide',
				confirmButton: 'default-button swal confirm',
				cancelButton: 'default-button swal cancel',
			},
			buttonsStyling: false,
		}).then(async (result) => {
			document.removeEventListener("keydown", focusAndInput);

			// Reset url so bookmarks don't get messed up

			let obj = { Title: window.location.title, Url: window.location.href.split("?")[0] ?? window.location.href };  

			history.pushState(obj, obj.Title, obj.Url);  

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
		// Set hmc credit mode:
		let hmc_credit_mode = document.getElementById("hmc-credits");

		hmc_credit_mode.checked = state.settings.hmc_mode;

		let input = document.getElementById("course-input");
		document.getElementById("course-search-results").addEventListener("keydown", function (event) {
			if (event.code === "Enter") {
				document.activeElement.click();
			}
		});

		input.focus();

		state.button_filters = [];

		// Update area filters
		const filter_areas = document.getElementById("filter-area");

		for (let key of Object.keys(category_lookup)) {
			// Create element
			const to_append = `<option value="${key}">${key}</option>`;

			// Append to filter
			filter_areas.innerHTML += to_append;
		}


		// For screenreaders/text browsers, we need to make the content available to the user in a non-visual way.
		input.addEventListener("keyup", function (event) {
			if (event.code === "Enter") {
				// Cancel the default action, if needed
				event.preventDefault();
				// Trigger the button element with a click
				backgroundCourseSearch();
			}

			if (event.getModifierState("Control")
				|| event.key.includes("Arrow")) {
				return;
			}

			backgroundCourseSearch();

		});

		setTimeout(function () {
			backgroundCourseSearch();
		}, 350);

		// Create stats
		let term_div = document.getElementById("term-container");
		term_div.innerHTML = `<b>Term:</b> ${state.term}`;
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
	position: 'bottom',
	showConfirmButton: false,
	timer: 3000,
	timerProgressBar: true,
	didOpen: (toast) => {
		toast.addEventListener('mouseenter', Swal.stopTimer)
		toast.addEventListener('mouseleave', Swal.resumeTimer)
	}
})

function toggleFilters() {
	let el = document.getElementById("filter-container");
	el.classList.toggle("hidden");

	if (el.classList.contains("hidden")) {
		el.removeEventListener("click", updateButtonFilters);
		el.removeEventListener("keyup", updateButtonFilters);
	} else {
		el.addEventListener("click", updateButtonFilters);
		el.addEventListener("keyup", updateButtonFilters);
		updateButtonFilters();
	}	
}

async function updateButtonFilters() {
	let filters = [];

	// Get status filters
	let open_check = document.getElementById("open-check").checked;
	let closed_check = document.getElementById("closed-check").checked;
	let reopened_check = document.getElementById("reopened-check").checked;

	if (open_check || closed_check || reopened_check) {
		let filter = {
			key: "status",
			value: "",
			type: ":"
		}

		if (open_check) {
			filter.value += "open,";
		}

		if (closed_check) {
			filter.value += "closed,";
		}

		if (reopened_check) {
			filter.value += "reopened,";
		}

		filter.value = filter.value.slice(0, -1);

		filters.push(filter);
	}

	// Get time filters
	let time_after = document.getElementById("filter-time-after").value;
	let time_before = document.getElementById("filter-time-before").value;

	if (time_after) {
		filters.push({
			key: "after",
			value: time_after,
			type: ":"
		});
	}

	if (time_before) {
		filters.push({
			key: "before",
			value: time_before,
			type: ":"
		});
	}

	// Get school filters
	let hm_check = document.getElementById("filter-hmc").checked;
	let po_check = document.getElementById("filter-pomona").checked;
	let sc_check = document.getElementById("filter-scripps").checked;
	let pz_check = document.getElementById("filter-pitzer").checked;
	let cm_check = document.getElementById("filter-cmc").checked;

	if (hm_check || po_check || sc_check || pz_check || cm_check) {
		let filter = {
			key: "at",
			value: "",
			type: ":"
		}

		if (hm_check) {
			filter.value += "hmc,";
		}

		if (po_check) {
			filter.value += "po,";
		}

		if (sc_check) {
			filter.value += "sc,";
		}

		if (pz_check) {
			filter.value += "pz,";
		}

		if (cm_check) {
			filter.value += "cm,";
		}

		filter.value = filter.value.slice(0, -1);

		filters.push(filter);
	}


	// Get days of week filters
	let monday_check = document.getElementById("monday-check").checked;
	let tuesday_check = document.getElementById("tuesday-check").checked;
	let wednesday_check = document.getElementById("wednesday-check").checked;
	let thursday_check = document.getElementById("thursday-check").checked;
	let friday_check = document.getElementById("friday-check").checked;

	if (monday_check || tuesday_check || wednesday_check || thursday_check || friday_check) {
		let filter = {
			key: "on",
			value: "",
			type: ":"
		}

		if (monday_check) {
			filter.value += "m,";
		}

		if (tuesday_check) {
			filter.value += "t,";
		}

		if (wednesday_check) {
			filter.value += "w,";
		}

		if (thursday_check) {
			filter.value += "r,";
		}

		if (friday_check) {
			filter.value += "f,";
		}

		filter.value = filter.value.slice(0, -1);

		filters.push(filter);
	}

	// Get instructor filters
	let instructor_input = document.getElementById("filter-instructor").value;
	if (instructor_input.trim() != "") {
		filters.push({
			key: "with",
			value: instructor_input,
			type: ":"
		});
	}

	// Get location filters
	let location_input = document.getElementById("filter-location").value;
	if (location_input.trim() != "") {
		filters.push({
			key: "location",
			value: location_input,
			type: ":"
		});
	}

	// Get credits filters
	let credits_input = document.getElementById("filter-credits").value;
	if (credits_input.trim() != "") {
		filters.push({
			key: "credits",
			value: credits_input,
			type: ":"
		});
	}


	// Get conflict check
	let conflict_check = document.getElementById("hide-conflicts-check").checked;

	if (conflict_check) {
		filters.push({
			key: "conflicts",
			value: "none",
			type: ":"
		});
	}

	// Get area filters
	let area_input = document.getElementById("filter-area").value;
	if (area_input.trim() != "") {
		filters.push({
			key: "area",
			value: area_input,
			type: ":"
		});
	}

	state.button_filters = filters;
	await backgroundCourseSearch();
}

async function buttonShare() {

	if (getLoadedCourses().length == 0) {
		Swal.fire({
			title: 'No courses have been locally loaded!',
			icon: 'error',
			customClass: {
				confirmButton: 'default-button swal confirm',
				cancelButton: 'default-button swal cancel',
			},
			buttonsStyling: false,
		})
	} else {
		let response = await fetch(`${API_URL}${GET_UNIQUE_CODE}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify([getLoadedCourses(), state.custom_courses])
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
			customClass: {
				confirmButton: 'default-button swal confirm',
				cancelButton: 'default-button swal cancel',
			},
			buttonsStyling: false,
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
	if (getLoadedCourses().length == 0) {
		Swal.fire({
			title: 'No courses have been locally loaded!',
			icon: 'error'
		})
	} else {
		ical_all = generateICal(getLoadedCourses());
		ical_starred = generateICal(getLoadedCourses().filter(course => state.starred_courses.includes(course.identifier)));
		ical_nstarred = generateICal(getLoadedCourses().filter(course => !state.starred_courses.includes(course.identifier)));

		Swal.fire({
			title: 'Save as iCal',
			icon: 'success',
			customClass: {
				confirmButton: 'default-button swal confirm',
				cancelButton: 'default-button swal cancel',
			},
			buttonsStyling: false,
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
					<div onclick="downloadICal(ical_all)" class="default-button dl"></div>
					Download all courses
				</div>
				<div class="ical-dl-holder">
					<div onclick="downloadICal(ical_starred)" class="default-button dl"></div>
					Download starred courses
				</div>
				<div class="ical-dl-holder">
					<div onclick="downloadICal(ical_nstarred)" class="default-button dl"></div>
					Download unstarred courses
				</div>
			</div>`,
		});
	}
}

function downloadICal(ical) {
	ical.download("courses");
}

function dayToIndex(day_name) {
	return days_full.indexOf(day_name);
}

function nextDate(day_name) {
	let day_index = dayToIndex(day_name);

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

function parseUnixTime(unix_time) {
	let d = new Date(unix_time * 1000);

	let day = d.getDate();
	let month = d.getMonth() + 1;
	let year = d.getFullYear();

	let hour = d.getHours();
	let minute = d.getMinutes();

	if (day < 10) {
		day = `0${day}`;
	}

	if (month < 10) {
		month = `0${month}`;
	}

	if (hour < 10) {
		hour = `0${hour}`;
	}

	if (minute < 10) {
		minute = `0${minute}`;
	}

	return `${year}-${month}-${day} ${hour}:${minute}`;
}

async function buttonSettings() {
	Swal.fire({
		title: 'Settings',
		customClass: {
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
			popup: 'swal-medium-wide',
		},
		buttonsStyling: false,
		html: settings_popup
	}).then(() => {
		Toast.fire({
			title: 'Settings saved!',
			icon: 'success',
		})		
	});

	let statuses = document.getElementsByClassName("status");
	
	let status = await fetch(`${API_URL}${STATUS}`).then(async res => await res.json());

	statuses[0].innerHTML = `<b>API Status:</b> ${status.alive ? `<span class='green'>Online: ${parseUnixTime(state.last_updated)}</span>` : "<span class='red'>Offline</span>"}`;

	statuses[1].innerHTML = `<b>Total Courses Loaded:</b> ${state.courses.length}`;

	statuses[2].innerHTML = `<b>Loaded Local Courses:</b> ${getLoadedCourses().length}`;

	statuses[3].innerHTML = `<b>Loaded Custom Courses:</b> ${state.custom_courses.length}`;

	statuses[4].innerHTML = `<b>Loaded Schedules:</b> ${state.schedules.length}`;

	statuses[5].innerHTML = `<b>Locations:</b> ${Object.keys(state.locations).length}`;

	let time = document.getElementById("show-current-time")
	time.checked = state.settings.show_time_line;
	time.addEventListener("click", () => {
		state.settings.show_time_line = time.checked;
		saveSettings();
	});

	let credits = document.getElementById("hmc-credits")
	credits.checked = state.settings.hmc_mode;
	credits.addEventListener("click", () => {
		state.settings.hmc_mode = credits.checked;
		saveSettings();
	});
}

function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(state.settings));
	updateSchedule();
}

async function backgroundCourseSearch(full=false) {
	let input = document.getElementById("course-input");
	let output = document.getElementById("course-search-results");

	if (output == null) {
		return;
	}

	if (input.value == "" && t_state.search_results.length > 0 && state.button_filters.length == 0) {
		appendCourseHTML(t_state.search_results, document.getElementById("course-input").value, full);

		postProcessSearch(input.value, t_state.search_results);

		return;
	}

	searching_worker.onmessage = function (e) {
		const html_courses = e.data;

		appendCourseHTML(html_courses, document.getElementById("course-input").value, full);

		postProcessSearch(document.getElementById("course-input").value, html_courses);
	}

	searching_worker.postMessage([input.value, state.courses, colors, state.settings.hmc_mode, getLoadedCourses(), state.button_filters, category_lookup]);
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function showAllCourses() {
	await backgroundCourseSearch(full=true);
	setTimeout(() => {
		let el = document.getElementById("course-search-results");
		el.getElementsByClassName("course-search-result")[300].scrollIntoView(alignToTop=false,scrollIntoViewOptions={behavior: "smooth"});
	}, 100);
}

function appendCourseHTML(courses, query, full=false) {
	let output = document.getElementById("course-search-results");

	if (courses.length == 0) {
		output.innerHTML = `<b>No results found</b><br><br>Search for this course on <b><a class="clickable-text" href='https://www.5catalog.io/?search=${encodeURIComponent(query)}' target='_blank'>5catalog.io</a></b>`;

		return;
	} else {
		let s = "s";

		if (courses.length == 1) {
			s = "";
		}

		if (courses[0].startsWith("<b>")) {
			courses.shift();
		}

		courses.unshift(`<b>${courses.length >= 100 ? "100+" : courses.length} course${s} found. Click on a course to select and add it.</b>`);

		if (courses.length > 300 && full == false) {
			// Append the first 100 courses
			let first = courses.slice(0, 300);
			
			// Add button to show all courses
			first.push(`<br><a class="clickable-text"  onclick="showAllCourses()">Show all courses</a><br>`);

			replaceHtml(output, first.join("\n"));
		} else {
			replaceHtml(output, courses.join("\n"));
		}
		
		for (let s of state.selected) {
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

function postProcessSearch(input, html) {
	if (input == "") {
		setCourseDescription(0);

		if (t_state.search_results == []) {
			t_state.search_results = html;
		}
	}
}

function toggleCourseSelection(identifier) {
	// First, find in selected courses
	let index = state.selected.indexOf(identifier);

	if (index > -1) {
		state.selected.splice(index, 1);
	} else {
		state.selected.push(identifier);
	}

	let el = document.getElementById(identifier);

	if (el != null) {
		el.classList.toggle("selected");
	}

	let num_courses = document.getElementById("course-add-num");
	num_courses.innerText = state.selected.length;

	let num_courses_s = document.getElementById("multiple-course-s");

	if (state.selected.length == 1) {
		num_courses_s.innerText = "";
	} else {
		num_courses_s.innerText = "s";
	}

	updateCart();
}

function updateCart() {
	let cart = document.getElementById("course-search-cart");
	cart.innerHTML = "";

	for (let s = 0; s < state.selected.length; s++) {
		cart.innerHTML += `<div class="cart-item" style="background-color:${colors[s % colors.length]};" onclick="toggleCourseSelection('${state.selected[s]}')">${state.selected[s]}</div>`;
	}
}

function setCourseDescription(index) {
	t_state.last_description = index;
	let course_search_desc = document.getElementById("course-search-desc");
	let course_info = state.descriptions[index];

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
	for (let course of state.selected) {
		courses.push(state.courses.filter(e => e.identifier == course)[0]);
	}

	let num_courses = 0;

	for (let course of courses) {
		let found = false;
		for (let l_course of getLoadedCourses()) {
			if (l_course.identifier == course.identifier) {
				found = true;
				break;
			}
		}

		if (!found) {
			addToLoadedCourses(course);
			num_courses++;
		}
	}

	await saveState();

	updateSchedule();

	setTimeout(() => {
		// Get courses added as html elements
		for (let course of state.selected) {
			let els = document.getElementsByClassName(`${course}-loaded`);

			for (let el of els) {
				el.classList.add("added-from-search-animation");
			}
		}
	}, 10);
	

	return num_courses;
}

async function addToCourseLists(course_list) {
	let found = false;

	for (let l_course of state.schedules) {
		if (l_course.name == course_list.name) {
			found = true;
			break;
		}
	}

	if (!found) {
		state.schedules.push(course_list);
		await saveState();

		return true;
	} else {
		return false;
	}
}

async function addToCustomCourseList(custom_courses) {
	let number_of_conflicts = 0;
	for (let course of custom_courses) {
		if (state.custom_courses.filter(x => x.identifier == course.identifier) > 0) {
			number_of_conflicts++;
		} else {
			state.custom_courses.push(course);
		}
	}

	if (custom_courses.length - number_of_conflicts > 0) {
		await updateDescAndSearcher(false);
		await saveState();
	}

	return number_of_conflicts;
}

async function deleteCourse(identifier) {
	let found = false;

	for (let i = 0; i < getLoadedCourses().length; i++) {
		let course = getNthLoadedCourse(i);

		if (course.identifier == identifier) {
			found = true;

			if (course.identifier == t_state.overlay.identifier && t_state.overlay.status) {
				t_state.overlay.locked = false;
				t_state.overlay.identifier = "";

				// Remove the highlight
				removeHighlightCourses(identifier);
			}
			deleteNthLoadedCourse(i);
			break;
		}
	}

	if (found) {
		await saveState();
		updateSchedule();
		return;
	}

	found = false;

	for (let i = 0; i < state.custom_courses.length; i++) {
		let course = state.custom_courses[i];

		if (course.identifier == identifier) {
			found = true;
			state.custom_courses.splice(i, 1);
			break;
		}
	}

	if (found) {
		await saveState();
		updateCustomCourseList();
		updateSchedule();
		return;
	}
}

async function toggleCourseVisibility(identifier) {
	// Stop bubbling onclick event
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	let el = document.querySelector(`.course-loaded.${identifier}-loaded`);

	el.firstElementChild.classList.toggle("visible");

	if (state.hidden_courses.includes(identifier)) {
		state.hidden_courses.splice(state.hidden_courses.indexOf(identifier), 1);
	} else {
		state.hidden_courses.push(identifier);
	}

	updateSchedule();

	await saveState();
}

async function setLoadedSchedule(name) {
	// If it's the currently loaded schedule, return
	if (state.schedules[state.loaded].name == name) {
		return;
	}

	// Get from course lists
	for (let i = 0; i < state.schedules.length; i++) {
		if (state.schedules[i].name == name) {
			state.loaded = i;
			break;
		}
	}

	await saveState();

	updateSchedule(play_animation=true);

	// Scroll to clicked on schedule
	let el = document.getElementById("course-list-table");

	el.children[state.loaded].scrollIntoView({
		behavior: "instant",
		block: "center",
		inline: "center"
	});

}

async function deleteCourseList(e = false, name) {
	if (e) {
		// Stop bubbling onclick event
		if (!e) var e = window.event;
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
	}

	if (state.schedules[state.loaded].name == name) {
		await setLoadedSchedule(state.schedules[Math.max(0, state.loaded - 1)].name);

		await saveState()
	}

	for (let i = 0; i < state.schedules.length; i++) {
		let course_list = state.schedules[i];

		if (course_list.name == name) {
			state.schedules.splice(i, 1);

			await saveState();

			await setLoadedSchedule("Main");

			break;
		}
	}

	updateLoadedCourseLists();
}

async function showCourseListSettings(e, name, color) {
	if (e) {
		// Stop bubbling onclick event
		if (!e) var e = window.event;
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
	}

	Swal.fire({
		title: "Edit Schedule",
		html: new_schedule_popup,
		showCancelButton: true,
		confirmButtonText: "Save",
		customClass: {
			popup: 'swal-short',
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
		preConfirm: async () => {
			try {
				let new_code = document.getElementById("schedule-name").value;
				let color = document.getElementById("schedule-color").value;
	
				if (new_code == "") {
					throw new Error("Please enter a valid name");
				}
	
				return {
					new_code: new_code,
					color: color,
				}
	
			} catch (error) {
				Swal.showValidationMessage(
					`${error}`
				)
			}
	
		},
	}).then(async (result) => {
		if (result != undefined) {
			if (state.schedules[state.loaded].name == name) {
				state.schedules[state.loaded].name = result.value.new_code;
				state.schedules[state.loaded].color = result.value.color;
				await saveState();
			} else {
				// Find in loaded_course_lists
				for (let i = 0; i < state.schedules.length; i++) {
					if (state.schedules[i].name == name) {
						state.schedules[i].name = result.value.new_code;
						state.schedules[i].color = result.value.color;
						await saveState();
						break;
					}
				}
			}
	
			updateSchedule();
			Toast.fire({
				title: `Changes Saved!`,
				icon: 'success',
			});
		}
	});

	document.getElementById("schedule-name").value = name;
	document.getElementById("schedule-color").value = color;

	document.getElementById("schedule-copy").remove();
	// Remove the label, it doesn't have an ID so we have to 
	// find by tag and remove the 3rd (2nd index) element
	document.getElementsByTagName("label")[2].remove();
	document.getElementById("schedule-color").setAttribute("data-jscolor", `{preset: '${localStorage.getItem("theme") == 'dark' ? 'dark' : ''}'}`);
	jscolor.install();
}

async function mergeCourseList(name) {
	let found = false;

	for (let i = 0; i < state.schedules.length; i++) {
		let course_list = state.schedules[i];

		if (course_list.name == name) {
			found = true;

			for (let course of course_list.courses) {
				if (!getLoadedCourses().map((el) => el.identifier).includes(course.identifier)) {
					addToLoadedCourses(course);
				}
			}

			state.schedules.splice(i, 1);
			break;
		}
	}

	if (found) {
		await saveState();
		updateSchedule(play_animation);
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
	if (t_state.overlay.locked == false) {
		t_state.overlay.locked = true;
		t_state.overlay.identifier = identifier;

		// Highlight the courses
		highlightCourses(identifier);
		showCourseOverlay(identifier, override = true);
	}
	// Case two: we're already showing the overlay, and it's the same course
	else if (t_state.overlay.locked == true && t_state.overlay.identifier == identifier) {
		t_state.overlay.locked = false;
		t_state.overlay.identifier = "";

		// Remove the highlight
		removeHighlightCourses(identifier);
	}
	// Case three: we're already showing the overlay, and it's a different course
	else if (t_state.overlay.locked == true && t_state.overlay.identifier != identifier) {
		// Remove the highlight
		removeHighlightCourses(t_state.overlay.identifier);

		t_state.overlay.locked = true;
		t_state.overlay.identifier = identifier;

		// Highlight the courses
		highlightCourses(identifier);
		showCourseOverlay(identifier, override = true);
	}
}

function showCourseOverlay(identifier, override = false) {
	if (state.descriptions == undefined || state.descriptions.length == 0) {
		return
	}

	if (t_state.overlay.locked == false || override == true) {
		if (state.descriptions.length == 0) {
			updateDescAndSearcher();
		}

		let index = state.courses.findIndex((el) => el.identifier == identifier);

		if (index == -1) {
			index = state.custom_courses.findIndex((el) => el.identifier == identifier);
			index += state.courses.length;
		}

		let course_info = state.descriptions[index];

		let course_info_table = document.getElementById("course-info-table");

		if (course_info_table.firstChild != null) {
			course_info_table.removeChild(course_info_table.firstChild);
		}

		let node_to_append = document.createElement("div")
		node_to_append.innerHTML = course_info;

		try {
			course_info_table.appendChild(node_to_append);
			course_info_table.scrollTop = 0;
		} catch (e) {
			// Do nothing
		}
	}
}

function starCourse(identifier) {
	// Stop bubbling onclick event
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	if (state.starred_courses.includes(identifier)) {
		state.starred_courses.splice(state.starred_courses.indexOf(identifier), 1);
	} else {
		state.starred_courses.push(identifier);
	}

	save_json_data("starred_courses", state.starred_courses);

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
		colors = colors_dark
		localStorage.setItem("theme", "dark");
	}
	else {
		document.documentElement.setAttribute('data-theme', 'light');
		colors = colors_light
		localStorage.setItem("theme", "light");
	}

	updateSchedule();
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

function addSearchFilter(filter, e=false) {
	// Stop bubbling onclick event
	if (!(e??true)) {
		var e = window.event;
		if (e != undefined) {
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
		}
	}

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

function showPopup(query) {
	let el = document.querySelector(query);
	el.classList.add("show");
}

function hidePopup(query) {
	let el = document.querySelector(query);
	el.classList.remove("show");
}

function toggleCreditMode() {
	if (state.settings.hmc_mode) {
		state.settings.hmc_mode = false;
	} else {
		state.settings.hmc_mode = true;
	}

	updateCredits();
	updateDescAndSearcher(full = true).then(() => {
		setCourseDescription(t_state.last_description);
	});

	localStorage.setItem("settings", JSON.stringify(state.settings));
}

function addNewSchedule() {
	Swal.fire({
		title: 'New Schedule',
		html: new_schedule_popup,
		showCancelButton: true,
		customClass: {
			popup: 'swal-short',
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
		confirmButtonText:
			`Add`,
		preConfirm: async () => {
			try {
				let name = document.getElementById("schedule-name").value;
				let color = document.getElementById("schedule-color").value;
				let copy = document.getElementById("schedule-copy").checked;

				if (name == "") {
					throw new Error("Please enter a name for the schedule.")
				}

				if (state.schedules[state.loaded].name == name || state.custom_courses.map((x) => x.name).includes(name)) {
					throw new Error("Schedule must have unique name.");
				}

				return {
					schedule: {
						name: name,
						color: color == "#FFFFFF" ? undefined : color,
						courses: [],
					},
					copy: copy,
				}

			} catch (error) {
				Swal.showValidationMessage(
					`${error}`
				)
			}
		},
	}).then(async (result) => {
		if (result.value) {
			let new_schedule = result.value.schedule;

			if (result.value.copy) {
				new_schedule.courses = JSON.parse(JSON.stringify(getLoadedCourses()));
			}

			state.schedules.push(new_schedule);

			await saveState();

			setLoadedSchedule(new_schedule.name);

			Toast.fire({
				title: 'New Schedule Added!',
				icon: 'success',
			});
		}
	});

	document.getElementById("schedule-color").setAttribute("data-jscolor", `{preset: '${localStorage.getItem("theme") == 'dark' ? 'dark' : ''}'}`);
	jscolor.install();
}

async function clearCourses() {
	setLoadedCourses([]);
	await saveState();
	updateSchedule(play_animation=true);

	Toast.fire({
		title: 'Courses Cleared!',
		icon: 'success',
	});
}

async function clearSchedules() {
	await setLoadedSchedule("Main");
	state.schedules = [
		{
            name: "Main",
            courses: [],
            color: undefined
        }
	];
	await saveState();
	updateSchedule(play_animation=true);

	Toast.fire({
		title: 'Schedules Cleared!',
		icon: 'success',
	});
}

async function clearAllData() {
	Swal.fire({
		title: 'Are you sure?',
		text: "This will permanently clear all data from this site. Shared course codes will not be effected.",
		icon: 'warning',
		showCancelButton: true,
		customClass: {
			popup: 'swal-short',
			confirmButton: 'default-button swal confirm',
			cancelButton: 'default-button swal cancel',
		},
		buttonsStyling: false,
		confirmButtonText:
			`Delete All Data`,
		cancelButtonText:
			`Cancel`
	}).then((result) => {
		if (result.value) {
			indexedDB.deleteDatabase("localforage");
			localStorage.clear();
			location.reload();
		}
	});
}

function buttonPermute() {
	permutation_worker.onmessage = function(e) {
		console.log(e.data);
	}

	permutation_worker.postMessage([getLoadedCourses(), state.courses]);
}

function showInfoHover(id, info_text) {
	Swal.fire({
		title: `Info for ${id}`,
		text: info_text,
	})
}


// *****
// HTML Popups
// *****

const settings_popup = 
`
<div class="settings-box">
	<div id="settings-panel" class="settings-zone">
		<div class="settings-zone">
			<h2><u>Status</u></h2>
			<div class="status"><b>API:</b> Waiting...</div>
			<div class="status"><b>Total Courses Loaded:</b> Waiting...</div>
			<div class="status"><b>Loaded Local Courses:</b> Waiting...</div>
			<div class="status"><b>Loaded Custom Courses:</b> Waiting...</div>
			<div class="status"><b>Loaded Schedules:</b> Waiting...</div>
			<div class="status"><b>Locations:</b> Waiting...</div>
		</div>

		<div class="settings-zone">
			<h2><u>General</u></h2>
			<label for="show-current-time">Show current time line</label>
			<input type="checkbox" class="day-checkbox" id="show-current-time"><br>
			<label for="hmc-credits">HMC Credits</label>
			<input type="checkbox" class="day-checkbox" id="hmc-credits"><br>
		</div>

		<div class="settings-zone">
			<h2><u>Danger Zone</u></h2>
			<button class="default-button swal cancel settings-button unselectable" onclick="clearCourses()">Delete Loaded Courses</button>
			<button class="default-button swal cancel settings-button unselectable" onclick="clearSchedules()">Delete All Schedules</button>
			<button class="default-button swal cancel settings-button unselectable" onclick="clearAllData()">Delete All Data</button>
		</div>
	</div>

	<div class="settings-zone about-desc"> 
		<h2><u>About</u></h2>
		<p>
		Created By: <b>Ethan Vazquez</b> HMC '25<BR>
		Send comments/questions/bug reports to:<BR><b>support@5scheduler.io</b><BR><BR>
		<b>Webpage Repo:</b> <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>
		Built using <a href="https://www.javatpoint.com/what-is-vanilla-javascript">JavaScript</a><br>
		<b>API Repo:</b> <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<br>
		Built using <a href="https://www.rust-lang.org/">Rust</a><BR><BR>
		<b><u>Credits:</b></u><BR>
		<b>fuzzysort.js</b><br>Created by Stephen Kamenar.<br>Licensed under the MIT License.<br>
		<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>
		<b>qrcodegen.js</b><br>Created by Nayuki.<br>Licensed under the MIT License.<br>
		<b>rasterizeHTML.js</b><br>Created by cburgmer.<br>Licensed under the MIT License.<br>
		</p>
	</div>
</div>
`;

const custom_course_popup = `
<div class="custom-course-manager">
    <div class="course-box">
        <div class="header">Custom Courses</div>
        <div id="custom-course-list" class="list">
            No custom courses have been created yet! <br>
            Click the "Create New" button to start. <br>
            Custom courses will be automatically added to your schedule.
        </div>
    </div>
    <div class="create-course-form">
        <div class="header">Create New Course</div>
        <div class="form-group">
            <div>
                <label for="course-title">Title*</label>
                <input type="text" id="course-title" class="input custom-course-input" placeholder="Title" required>
            </div>
            
            <div>
                <label for="course-days">Days*</label>
                <div class="day-checkboxes">
                    <label class="small-label" for="monday-check">Mon</label>
                    <input id="monday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="tuesday-check">Tue</label>
                    <input id="tuesday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="wednesday-check">Wed</label>
                    <input id="wednesday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="thursday-check">Thu</label>
                    <input id="thursday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="friday-check">Fri</label>
                    <input id="friday-check" type="checkbox" class="day-checkbox">
                </div>
            </div>

            <div>
                <label for="course-start-time">Start Time > 7:00AM*</label>
                <input type="time" min="07:00" max="22:00" id="course-start-time" class="input custom-course-input" placeholder="7:00" required>
            </div>

            <div>
                <label for="course-end-time">End Time < 10:00PM*</label>
                <input type="time" min="07:00" max="22:00" id="course-end-time" class="input custom-course-input" placeholder="22:00" required>
            </div>

            <div>
                <label for="course-location">Location*</label>
                <input type="text" id="course-location" class="input custom-course-input" placeholder="Location" required>
            </div>

            <div>
                <label for="course-identifier">Identifier</label>
                <input type="text" id="course-identifier" class="input custom-course-input" placeholder="Identifier">
            </div>

            <div>
                <label for="course-instructors">Instructors</label>
                <input type="text" id="course-instructors" class="input custom-course-input" placeholder="Instructor">
            </div>

            <div>
                <label for="course-description">Description</label>
                <input type="text" id="course-description" class="input custom-course-input" placeholder="Description">
            </div>

            <div>
                <label for="course-notes">Notes</label>
                <input type="text" id="course-notes" class="input custom-course-input" placeholder="Notes">
            </div>
        </div>

        <div class="button-group">
            <button tabindex="0" id="add-new-course" class="default-button unselectable" onclick="submitNewCourse()">Add</button>
            <button tabindex="0" id="cancel-new-course" class="default-button unselectable" onclick="cancelNewCourse()">Cancel</button>
        </div>
    </div>
    <div class="right-panel">
        <button id="create-course" class="default-button unselectable course-button" onclick="createNewCourse()">Create New</button>
        <button id="edit-course" class="default-button unselectable course-button" onclick="editCourse()">Edit</button>
    </div>
</div>
`.replace("\n", '');


const search_popup = `
<div id="search-container">
	<div id="hmc-credits-search">
		<label id="hmc-credits-label" for="hmc-credits">HMC Credits</label>
		<input id="hmc-credits" type="checkbox" class="day-checkbox" onclick="toggleCreditMode()">
	</div>

    <input class="input" id="course-input" placeholder="Search by course code, title, or instructor...">

	<span id="filter-button" class="default-button filters unselectable" onclick="toggleFilters()"></span>

    <span id="term-container"></span>
</div>

<div id="filter-container" class="hidden">
		<div class="filter-item">
			<label class="filter-label" for="filter-time-after">After</label>
			<input min="07:00" max="22:00" type="time" id="filter-time-after" class="filter-input" placeholder="7:00">
		</div>

		<div class="filter-item">
			<label class="filter-label" for="filter-time-before">Before</label>
			<input min="07:00" max="22:00" type="time" id="filter-time-before" class="filter-input" placeholder="22:00">		
		</div>	

		<div class="filter-item">
			<div class="filter-checkboxes">
				<div>
					<label class="filter-label" for="monday-check">Mon</label>
					<input id="monday-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="tuesday-check">Tue</label>
					<input id="tuesday-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="wednesday-check">Wed</label>
					<input id="wednesday-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="thursday-check">Thu</label>
					<input id="thursday-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="friday-check">Fri</label>
					<input id="friday-check" type="checkbox" class="filter-checkbox">
				</div>
			</div>		
		</div>

		<div class="filter-item">
			<div class="filter-checkboxes schools">
				<div>
					<label class="filter-label" for="filter-hmc">HM</label>
					<input id="filter-hmc" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="filter-pomona">PO</label>
					<input id="filter-pomona" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="filter-cmc">CM</label>
					<input id="filter-cmc" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="filter-scripps">SC</label>
					<input id="filter-scripps" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="filter-pitzer">PZ</label>
					<input id="filter-pitzer" type="checkbox" class="filter-checkbox">
				</div>
			</div>
		</div>
		
		<div class="filter-item">
			<div class="filter-checkboxes status">
				<div>
					<label class="filter-label" for="open-check">Open</label>
					<input id="open-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="reopened-check">Reopened</label>
					<input id="reopened-check" type="checkbox" class="filter-checkbox">
				</div>
				<div>
					<label class="filter-label" for="closed-check">Closed</label>
					<input id="closed-check" type="checkbox" class="filter-checkbox">
				</div>
			</div>
		</div>

		<div class="filter-item">
			<label class="filter-label" for="filter-instructor">Instructor</label>
			<input type="text" id="filter-instructor" class="filter-input" placeholder="Instructor">
		</div>

		<div class="filter-item">
			<label class="filter-label" for="filter-location">Location</label>
			<input type="text" id="filter-location" class="filter-input" placeholder="Shan, Estella, etc.">
		</div>

		<div class="filter-item">
			<label class="filter-label" for="filter-credits">Credits</label>
			<input type="number" id="filter-credits" class="filter-input" placeholder="Credits">
		</div>

		<div class="filter-item">
			<label class="filter-label" for="filter-course-area">Area</label>
			<select id="filter-area" class="filter-input">
				<option class="option-class" value="">All</option>
			</select>
		</div>

		<div class="filter-item">
			<div class="filter-checkboxes">
				<div id="hide-conflicts-container">
					<label class="filter-label" for="hide-conflicts-check">Hide Conflicts</label>
					<input id="hide-conflicts-check" type="checkbox" class="filter-checkbox">
				</div>
			</div>
		</div>

	</div>
</div>

<div id="course-search-box">
    <div id="course-search-results">
        <b>Loading...</b>
    </div>
    <div id="course-search-desc" class="course-desc">
    </div>
</div>
<div id="course-search-cart">
</div>`;

const filter_help = `
<span id="filter-help" class="popup-holder unselectable" onmouseenter="showPopup(\'#filter-help-text\')" onmouseleave="hidePopup(\'#filter-help-text\')">
        ?
        <span>
            <div id="filter-help-text" class="popup-text other-side" >
                <div class="popup-title">Filter Options</div>
                Combine filters with searches to narrow your results.<br><br>
                For example, searching <b>"math status:open credits:1"</b> would only return
                classes relevent to math with 1 credit that are currently open.
                <br><br>
                <div>
                    <b>By school: "at:[school]"</b>
                    Ex: at:pomona
                    <br><br>
                    All initialisms (cmc, hmc, po, etc.), partial names (mudd), and full names (HarveyMudd) are supported
                    <br><br>
                </div>
                <div>
                    <b>By instructor: "with:[name]"</b>
                    Ex: with:James-Smith
                </div>
                <br>
                <div>
                    <b>By credits: "credits:[number]"</b>
                    Ex: credits:3
                </div>
                <br>
                <div>
                    <b>By day: "on:[weekday(s)]"</b>
                    Ex: on:tuesday,friday
                </div>
				<br>
				<div>
					<b>By time: "after:[hour]", "before:[hour]"</b>
					<br>
					Ex: after:8, after:8am, before:22, before:10pm
					<br>
					"after" checks start time, "before" checks end time
					<br>
					If combined with "on", only checks time for that day
				</div>
                <br>
				<div>
					<b>By perms, prereqs, and coreqs</b>
					<br>
					<b>perms:[number, some, none], prereqs:[number, some, none], coreqs:[number, some, none]</b>
					<br>
					Ex: perms<=15, prereqs=2, coreqs:none
				</div>
				<br>
                <div>
                    <b>By status: "status:[open, reopened, closed]"</b>
                    Ex: status:open
                </div>
                <br>
				<div>
					<b>By location: "location:[name]"</b>
					Ex: location:McGregor
				</div>
                <br>
                <div>
                    <b>By section: "section:[number]"</b>
                    Ex: section:3
                </div>
				<br>
                <div>
                    <b>By code: "code:[code-id]"</b>
                    Ex: code:afri
                </div>
                <br>
                <div>
                    <b>By ID: "id:[id]"</b>
                    Ex: id:010A
                </div>
                <br>
                <div>
                    <b>By department: "dept:[dept-id]"</b>
                    Ex: dept:af
                </div>
            </div>
        </span>
    </span>
`;

const new_schedule_popup = `
<div id="new-schedule-container">
	<div class="custom-course-manager">
		<div class="create-schedule-form">
			<div class="header">Name</div>
			<div class="form-group">

				<div>
					<label for="schedule-name">Name</label>
					<input type="text" id="schedule-name" class="input custom-course-input" placeholder="Name">
				</div>

				<div>
					<label for="schedule-color">Color (optional)</label>
					<input data-jscolor="{}" id="schedule-color" class="input custom-course-input">
				</div>

				<div>
					<label for="schedule-copy">Copy courses from current schedule (optional)</label>
					<input type="checkbox" id="schedule-copy" class="day-checkbox">
				</div>
			</div>
	</div>
</div>		
`;


const changelog_popup = `
<div id="changelog-container">
	<b>v1.15 Beta</b>
	<ul>
		<li>Added even more filters: school, prof, location, credits, and areas</li>
		<li>Added course areas! You can now sort by Writing Intensives, HSAs, and Pomona Area Reqs.</li>
		<li>Added permutation creator code, permutation editor coming soon!</li>
	</ul>
</div>
`;