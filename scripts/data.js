
// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5cheduler.com/"
const FULL_UPDATE = "fullUpdate";
const UPDATE_IF_STALE = function (timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSE_LIST_BY_CODE = function (code) { return "getCourseListByCode/" + code; }

async function load_json_data(name) {
    return localforage.getItem(name);
}

async function save_json_data(name, data) {
    return localforage.setItem(name, data);
}

async function update_database(full=true) {
    console.debug("Updating database...");
    let current_data = await load_json_data("course_data");
   
    loaded_local_courses = await load_json_data("loaded_local_courses");
    loaded_course_lists = await load_json_data("loaded_course_lists");

    starred_courses = await load_json_data("starred_courses");

    if (loaded_local_courses == null) {
        loaded_local_courses = [];
    }

    if (loaded_course_lists == null) {
        loaded_course_lists = [];
    }

    if (starred_courses == null) {
        starred_courses = [];
    }
    
    let response;

    if (current_data === null || current_data.timestamp == undefined || Object.entries(current_data).length === 0) {
        console.debug("No data found, requesting full update...");
        response = fetch(`${API_URL}${FULL_UPDATE}`);
    } else {
        console.debug("Found data, requesting update if stale...");
        response = fetch(`${API_URL}${UPDATE_IF_STALE(current_data.timestamp)}`);

    }

    const data = await response;
    const json = await data.json();

    if (json != "No update needed") {
        console.debug("New data found...");
        await save_json_data("course_data", json);
        all_courses_global = json.courses;
    
        // Update currently loaded courses
        loaded_local_courses = update_courses(all_courses_global, loaded_local_courses);
        for (let i = 0; i < loaded_course_lists.length; i++) {
            loaded_course_lists[i] = update_courses(all_courses_global, loaded_course_lists[i])
        }

        await save_json_data("loaded_local_courses", loaded_local_courses);
        await save_json_data("loaded_course_lists", loaded_course_lists);
    } else {
        all_courses_global = current_data.courses;
    }

    if (full || json != "No update needed") {
        generateAllDescriptions();
        create_searcher();
        console.log(
            `Total Courses Loaded: ${all_courses_global.length}\nTotal Local Courses Loaded: ${loaded_local_courses.length}\nTotal Course Lists Loaded: ${loaded_course_lists.length}`
        );
    }
}

function update_courses(source, target) {
    // Update local courses
    for (let i = 0; i < target.length; i++) {
        if (source.includes(target[i].identifier)) {
            target[i] = source[i];
        }
    }

    return target
}
function update_loop() {
    setTimeout(function () {
        update_database();
        updateSchedule();
        update_loop();
    }, 60000)
}

async function create_searcher() {
    all_courses_global.forEach((t, index) => t.descIndex = index);
    all_courses_global.forEach(t => t.instructorString = t.instructors.join(" "));
    all_courses_global.forEach(t => t.filePrepared = fuzzysort.prepare(t.file));
}

function search_courses(query) {
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