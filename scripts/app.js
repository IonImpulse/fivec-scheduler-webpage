// *****
// Title button functions
// *****

function buttonLoad() {
	Swal.fire({
		title: 'Load Course Code',
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
	}).then((result) => {
		if (result.value == "Invalid code") {
			Toast.fire({
				title: 'Invalid code',
				icon: 'error'
			});
		} else if (result.value != undefined) {
			const course_list_result = addToCourseLists(result.value);

			if (course_list_result == true) {
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

function buttonExport() {
	Swal.fire({
		title: 'Export',
		icon: 'success',
		html: '<canvas id="export-holder" alt="schedule"></canvas><br>Right click on the image above and select "Save Image As..." to download',
		customClass: 'swal-medium-wide',
	});

	Swal.showLoading();

	canvas = document.getElementById("export-holder");
	source = document.getElementById("schedule-box");
	screenshotToCanvas(canvas, source);
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
	setTimeout(function() {
		printWin.print();
		printWin.document.close();
		printWin.close();
	},200);     

	Toast.fire({
		icon: 'info',
		title: `Print dialogue opened`
	});
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
		all_courses_global = courses.courses;
		generateAllDescriptions();

		Swal.fire({
			title: 'Search Courses',
			icon: 'info',
			html: `<div><input class="swal2-input" id="course-input" onKeyUp="updateCourseSearch()"></div>` +
				`<div id="course-search-box"><div id="course-search-results"></div><div id="course-search-desc" class="course-desc"></div></div><br>`,
			showCloseButton: true,
			showCancelButton: true,
			confirmButtonText:
				`<span>Add <span id="course-add-num">0</span> course<span id="multiple-course-s">s</span></span>`,
			cancelButtonText:
				'Cancel',
			customClass: 'swal-wide',
		}).then((result) => {
			if (result.isConfirmed) {
				let num_courses = addCourses();

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
		document.getElementById("course-search-results").addEventListener("keydown", function(event) {
			if (event.code === "Enter") {
				document.activeElement.click();
			}
		});
		input.focus();
		input.addEventListener("keydown", function(event) {
			// Number 13 is the "Enter" key on the keyboard
			if (event.code === "Enter") {
			  // Cancel the default action, if needed
			  event.preventDefault();
			  // Trigger the button element with a click
			  expensiveCourseSearch();
			}
		}); 

		expensiveCourseSearch();
	}
}

const Toast = Swal.mixin({
	toast: true,
	position: 'top-end',
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
			body: JSON.stringify(loaded_local_courses)
		});

		const code = await response.json();

		const qr_data = `https://www.5cheduler.com/?load=${code}`;

		const QRC = qrcodegen.QrCode;
		const qr = QRC.encodeText(qr_data, QRC.Ecc.HIGH);
		const svg = toSvgString(qr, 2, "#FFFFFF", "#000000");

		Swal.fire({
			title: 'Share',
			icon: 'success',
			html: `<div class="code-share">${code}</div><div class="code-explain">or</div><div id="code-link" class="unselectable">Copy Link</div><div class="qr-code">${svg}</div>`,
		});

		document.getElementById("code-link").addEventListener("click", function() {
			let el = document.getElementById("code-link");
			navigator.clipboard.writeText(qr_data);
			el.className = "code-copied unselectable";
			el.innerHTML = "Copied!";
		});
	}
}

function buttonTheme() {
	toggle_theme();
}

function buttonAbout() {
	Swal.fire({
		title: 'About',
		imageUrl: 'img/favicon.png',
		imageWidth: 100,
		imageHeight: 100,
		html: `<div id="about-desc"> Created By: <b>Ethan Vazquez</b> HMC '25<BR>` +
			`Send comments/questions/bug reports to: <b>edv121@outlook.com</b><BR><BR>` +
			`Webpage Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>` +
			`API Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<BR><BR>` +
			`<b><u>Credits:</b></u><BR>` +
			`<b>fuse.js</b><br>Created by Kiro Risk.<br>Licensed under the Apache License 2.0.<br>` +
			`<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>` +
			`<b>qrcodegen.js</b><br>Created by Nayuki.<br>Licensed under the MIT License.<br>` +
			`<b>rasterizeHTML.js</b><br>Created by cburgmer.<br>Licensed under the MIT License.<br></div>`
	});
}

function debounce(func, timeout = 600) {
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

	if (output == null) {
		return
	}
	removeAllChildren(output);

	if (input.value == "") {

		for (let i = 0; i < all_courses_global.length; i++) {
			let course = all_courses_global[i];

			let course_div = createResultDiv(course, colors[i % colors.length], i);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("add-course-selected");
			}

			output.appendChild(course_div)

		}

		setCourseDescription(0);

	} else {
		let search_term = tweakSearch(input.value);

		console.info(`INFO: search changed from "${input.value}" => "${search_term}"`);

		let results = fuzzy_searcher.search(search_term);

		for (let i = 0; i < results.length; i++) {
			let course = results[i].item;

			let course_div = createResultDiv(course, colors[i % colors.length], results[i].refIndex);

			if (selected_courses.includes(course.identifier)) {
				course_div.classList.add("add-course-selected");
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
		el.className = "course-search-result unselectable add-course-selected";
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

function addCourses() {
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

	save_json_data("loaded_local_courses", loaded_local_courses);

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
		// JS is horrible, to see if a string is a number or no
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

function addToCourseLists(course_list) {
	let found = false;

	for (let l_course of loaded_course_lists) {
		if (l_course.code == course_list.code) {
			found = true;
			break;
		}
	}

	if (!found) {
		loaded_course_lists.push(course_list);
		save_json_data("loaded_course_lists", loaded_course_lists);
		updateSchedule();

		return true;
	} else {
		return false;
	}
}

function deleteCourse(identifier) {
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
		save_json_data("loaded_local_courses", loaded_local_courses);
		updateSchedule();
	}
}

function deleteCourseList(code) {
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
		save_json_data("loaded_course_lists", loaded_course_lists);
		updateSchedule();
	}
}

function mergeCourseList(code) {
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
		save_json_data("loaded_course_lists", loaded_course_lists);
		save_json_data("loaded_local_courses", loaded_local_courses);
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
		showCourseOverlay(identifier, override=true);
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
		showCourseOverlay(identifier, override=true);
	}
}

function showCourseOverlay(identifier, override=false) {
	if (overlay.locked == false || override == true) {
		if (all_desc_global.length == 0) {
			generateAllDescriptions();
		}

		// get index of course
		let index = 0;
		for (let course of all_courses_global) {
			if (course.identifier == identifier) {
				break;
			}
			index++;
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