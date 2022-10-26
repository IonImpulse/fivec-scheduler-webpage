onmessage = function(e) {
    const schedule_to_permute = e.data[0];
    const all_courses_global = e.data[1];

    const time_now = new Date();
    const results = permuteSchedule(all_courses_global, schedule_to_permute);
    const time_after = new Date();

    console.log(`Permutation took ${time_after - time_now} ms`);

    this.setTimeout(() => {
        // If it takes too long, just return an empty array
        postMessage({results: [], time: 10000});
    }, 10000);
    
    postMessage({results: results, time: time_after - time_now});
}

function permuteSchedule(all_courses_global, schedule_to_permute) {
    const results = [];

    // First, find section alternatives for each course
    const all_sections = findAlternatives(all_courses_global, schedule_to_permute);

    // Build intersection dict
    const intersection_dict = createIntersectionDict(all_sections);

    // Now, permute the sections
    const permutations = permute(all_sections, intersection_dict);

    return permutations;
}

function findAlternatives(all_courses_global, course_list) {
    let courses_list = [];

    course_list.forEach(to_find => {
        const to_find_id = to_find.identifier.split("-").slice(0,3).join("-");
        const found_courses = all_courses_global.filter(course => course.identifier.startsWith(to_find_id));

        courses_list.push(found_courses);
    });

    return courses_list;
}

function createIntersectionDict(sections) {
    let dict = {};

    for (let courses of sections) {
        for (let courses_alt of sections) {
            for (let section of courses) {
                for (let section_alt of courses_alt) {
                    if (section.identifier !== section_alt.identifier) {
                        if (checkForConflicts(section, section_alt)) {
                            dict[`${section.identifier}-${section_alt.identifier}`] = true;
                            dict[`${section_alt.identifier}-${section.identifier}`] = true;
                        } else {
                            dict[`${section.identifier}-${section_alt.identifier}`] = false;
                            dict[`${section_alt.identifier}-${section.identifier}`] = false;
                        }
                    }
                }
            }
        }
    }

    return dict;
}

function checkForConflicts(course, course_alt) {
    if (course_alt.timing == undefined || course.timing == undefined) {
        return false;
    }

    for (let j = 0; j < course_alt.timing.length; j++) {
        for (let k = 0; k < course.timing.length; k++) {
            if (course_alt.timing[j].days.some(x => course.timing[k].days.includes(x))) {
                let load_start = timeToMinutes(course_alt.timing[j].start_time);
                let load_end = timeToMinutes(course_alt.timing[j].end_time);

                let course_start = timeToMinutes(course.timing[k].start_time);
                let course_end = timeToMinutes(course.timing[k].end_time);

                if (load_start <= course_end && course_start <= load_end) {
                    return true;
                }
            }
        }
	}

	return false;
}

function timeToMinutes(time) {
	let time_split = time.split(":");
	let minutes = parseInt(time_split[0]) * 60 + parseInt(time_split[1]);

	return minutes;
}

function permute(all_sections, intersection_dict) {
    let valid_permutations = [];

    let permutation_keys = [];

    for (let i = 0; i < all_sections.length; i++) {
        permutation_keys.push(0);
    }

    let iterations = 0;

    // Don't run forever, just in case
    while (iterations < 100000000) {
        const current_permutation = getPermutation(all_sections, permutation_keys);

        // Check if permutation is valid
        const is_valid = checkValidPermutation(current_permutation, intersection_dict);

        if (is_valid) {
            valid_permutations.push(current_permutation);
        }

        // Increment permutation
        permutation_keys = incrementPermutationKeys(permutation_keys, all_sections);

        if (permutation_keys.every(x => x === 0)) {
            break;
        }

        iterations++;
    }

    return valid_permutations;
}

function getPermutation(all_sections, permutation_keys) {
    let permutation = [];

    for (let i = 0; i < permutation_keys.length; i++) {
        permutation.push(all_sections[i][permutation_keys[i]]);
    }

    return permutation;
}


function checkValidPermutation(permutation, intersection_dict) {
    for (let i = 0; i < permutation.length; i++) {
        for (let j = 0; j < permutation.length; j++) {
            if (i !== j) {
                if (intersection_dict[`${permutation[i].identifier}-${permutation[j].identifier}`]) {
                    return false;
                }
            }
        }
    }

    return true;
}

function incrementPermutationKeys(permutation_keys, all_sections) {
    permutation_keys[0] += 1;

    let valid = false;

    while (valid == false) {
        for (let i = 0; i < permutation_keys.length; i++) {
            if (permutation_keys[i] >= all_sections[i].length) {
                permutation_keys[i] = 0;

                if (i === permutation_keys.length - 1) {
                    // We've reached the end of the permutation
                    // Reset the keys and return
                    for (let j = 0; j < permutation_keys.length; j++) {
                        permutation_keys[j] = 0;
                    }

                    return permutation_keys;

                } else {
                    permutation_keys[i + 1] += 1;
                }
            }
        }

        // Check to see if each key is less than the length of the array
        valid = true;

        for (let i = 0; i < permutation_keys.length; i++) {
            if (permutation_keys[i] >= all_sections[i].length) {
                valid = false;
            }
        }
    }

    return permutation_keys;
}