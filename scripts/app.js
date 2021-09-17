// *****
// Title button functions
// *****

function buttonLoad() {
	Swal.fire({
		title: 'Load Course Code',
		html: `<div><input maxlength='7' id="code-input"></div>`,
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

function addStyle(el) {
	let to_add = "<style>\n";
	let css_rules = document.styleSheets[0].cssRules;
	
	for (let rule of css_rules) {
		if (!rule.cssText.includes("url")) {
			to_add += rule.cssText + "\n";
		}
	}

	to_add += "</style>";
	return to_add + el;
}

function buttonExport() {
	Swal.fire({
		title: 'Export',
		icon: 'success',
		html:
			'<div id="share-image"></div><br>' +
			'To download, right click the image above and click "Save Image As...',
	})

	canvas = document.getElementById("share-image");

	rasterizeHTML.drawHTML(addStyle(document.getElementById("schedule-box").cloneNode(true).innerHTML), canvas,
		options = {
			width: "1920",
			height: "1080",
		}
	)
	.then(function success(renderResult) {
		document.querySelector("#share-image").appendChild(renderResult.image);
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
	let divContents = document.getElementById("schedule-box");
	PrintElements.print([divContents]);

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
				`<div id="course-search-box"><div id="course-search-results"></div><div id="course-search-desc"></div></div><br>`,
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

		document.getElementById("course-input").focus();

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

		const qr_data = `5cheduler.com/?load=${code}`;

		const QRC = qrcodegen.QrCode;
		const qr = QRC.encodeText(qr_data, QRC.Ecc.HIGH);
		const svg = toSvgString(qr, 2, "#FFFFFF", "#000000");

		Swal.fire({
			title: 'Share',
			icon: 'success',
			html: `<div class="code-share">${code}</div><br>${svg}`,
		})
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
		html: `Created By: <b>Ethan Vazquez</b> HMC '25<BR>` +
			`Send comments/questions/bug reports to: <b>edv121@outlook.com</b><BR><BR>` +
			`Webpage Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>` +
			`API Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<BR><BR>` +
			`<b><u>Credits:</b></u><BR>` +
			`<b>html2canvas.js</b><br>Created by Niklas von Hertzen.<br>Licensed under the MIT License.<br>` +
			`<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>`
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
		let search_term = tweakSearch(input.value);

		console.log(`INFO: search changed from "${input.value}" => "${search_term}"`);

		let results = fuzzy_searcher.search(search_term);
		
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
	let return_string = string;

	// Common replacements
	// Type can be "full" or "any"
	// Full only matches full tokens/words separated by spaces
	const replacements = [
		{type:"full", search:"cs", replace:"csci"},
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
		if (part.length == 2 && parseInt(part) != NaN) {
			num_corrected_string += ` 0${part}`;
		} else {
			num_corrected_string += ` ${part}`;
		}
	}

	return_string = num_corrected_string;

	return return_string;
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