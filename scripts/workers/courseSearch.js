importScripts("../libs/fuzzysort.js");

onmessage = function(e) {
    let course_divs = expensiveCourseSearch(e.data[0], e.data[1], e.data[2]);

    postMessage(course_divs);
}

function createResultDiv(course, color, index) {
	let identifier = course.identifier;

	let course_div = "<div";
	course_div += " class=\"course-search-result unselectable\"";

	course_div += ` id="${identifier}"`;
    course_div += " tabindex=\"0\"";

	course_div += ` onclick="toggleCourseSelection(\'${identifier}\')"`;
    course_div += ` onmouseenter="setCourseDescription(\'${index}\')"`;
	course_div += ` style="background-color: ${color};">`;

	let course_code = `<b>${course.identifier}</b>`;
	let status = `<span class="status-highlight ${course.status}">${course.status}</span>`;
	// Put the course code and status in a div on the right
	let num_students = `<span class="align-right" ><b>${course.seats_taken}/${course.max_seats} ${status}</b></span>`;

	course_div += `${course_code}: ${course.title} ${num_students}`;
    course_div += "</div>";

	return course_div;
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

function search_courses(query, all_courses_global) {
    const options = {
        limit: 100, // don't return more results than you need!
        allowTypo: true, // if you don't care about allowing typos
        threshold: -10000, // don't return bad results
        keys: ['identifier', 'title', 'instructorString',], // keys to search
    }

    let results = [];

    if (query.includes(" ")) {
        const terms = query.split(" ");
        for (let search_term of terms) {
            let temp_results = fuzzysort.go(search_term.trim(), all_courses_global, options);
            
            if (results.length > 0) {
                results = results.filter(t => temp_results.map(t => t.obj.identifier).includes(t.obj.identifier));
            } else {
                results = temp_results;
            }
        }

        if (results.length < 10) {
            const results_dash = fuzzysort.go(terms.join("-"), all_courses_global, options);
            const results_norm = fuzzysort.go(query, all_courses_global, options);
            // Join results for all unique results
            const results_combined = join_results(results_dash, results_norm);
            results = join_results(results_combined, results);
        }
        
        results = results.sort((a, b) => b.score - a.score);
        
    } else {
        results = fuzzysort.go(query, all_courses_global, options);
    }


    return results;
}

function join_results(arr1, arr2) {
    return arr1.concat(arr2.filter((t, i) => !arr1.map(t => t.obj.identifier).includes(t.obj.identifier)))
}

function expensiveCourseSearch(input, all_courses_global, colors) {
    let results = [];

    if (input == "") {
        results = all_courses_global;
	} else {
		const search_term = tweakSearch(input);

		results = search_courses(search_term, all_courses_global);
	}

    let output = "";

    for (let i = 0; i < results.length; i++) {
        let course = results[i].obj ?? results[i];
        let course_div = createResultDiv(course, colors[i % colors.length], course.descIndex);

        output += course_div;
    }

    return output;
}