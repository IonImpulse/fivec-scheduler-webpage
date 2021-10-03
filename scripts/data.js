
// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5cheduler.com/"
const FULL_UPDATE = "fullUpdate";
const UPDATE_IF_STALE = function (timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSE_LIST_BY_CODE = function (code) { return "getCourseListByCode/" + code; }

async function load_json_data(name) {
    console.info(`Loading ${name}...`);
    return localforage.getItem(name);
}

async function save_json_data(name, data) {
    console.info(`Saving ${name}...`);
    return localforage.setItem(name, data);
}

async function update_database(full=false) {
    console.debug("Updating database...");
    let current_data = await load_json_data("course_data");
   
    loaded_local_courses = await load_json_data("loaded_local_courses");
    loaded_course_lists = await load_json_data("loaded_course_lists");

    if (loaded_local_courses == null) {
        loaded_local_courses = [];
    }

    if (loaded_course_lists == null) {
        loaded_course_lists = [];
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
        console.log(
            `Total Courses Loaded: ${all_courses_global.length}\nTotal Local Courses Loaded: ${loaded_local_courses.length}\nTotal Course Lists Loaded: ${loaded_course_lists.length}`
        );
        create_searcher();
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
    const options = {
        isCaseSensitive: false,
        shouldSort: true,
        minMatchCharLength: 2,
        threshold: 0.7,
        keys: [
            {
                name: "identifier",
                weight: 2,
            },
            "id",
            "code",
            "dept",
            "title",
            "instructors",
            "description",
        ]
    };

    fuzzy_searcher = new Fuse(all_courses_global, options);
}