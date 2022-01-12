
// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5scheduler.io/"
const FULL_UPDATE = "fullUpdate";
const UPDATE_IF_STALE = function (timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSE_LIST_BY_CODE = function (code) { return "getCourseListByCode/" + code; }
const GET_LOCATIONS = "getLocations"

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
    loaded_custom_courses = await load_json_data("loaded_custom_courses");
    starred_courses = await load_json_data("starred_courses");
    hidden_courses = await load_json_data("hidden_courses");
    hidden_course_lists = await load_json_data("hidden_course_lists");

    let location_update = update_locations();

    if (loaded_local_courses == null) {
        loaded_local_courses = [];
    }

    if (loaded_course_lists == null) {
        loaded_course_lists = [];
    }

    if (loaded_custom_courses == null) {
        loaded_custom_courses = [];
    }

    if (starred_courses == null) {
        starred_courses = [];
    }

    if (hidden_courses == null) {
        hidden_courses = [];
    }

    if (hidden_course_lists == null) {
        hidden_course_lists = [];
    }
    

    let response;
    let json;

    try {
        if (current_data === null || current_data.timestamp == undefined || Object.entries(current_data).length === 0) {
            console.debug("No data found, requesting full update...");
            response = fetch(`${API_URL}${FULL_UPDATE}`);
        } else {
            console.debug("Found data, requesting update if stale...");
            response = fetch(`${API_URL}${UPDATE_IF_STALE(current_data.timestamp)}`);
            
        }
    
        let data = await response;

        if (data.status != 408) {
            json = await data.json();
        } else {
            json = "No update needed";
        }

    } catch (error) {
        console.warn(`${error}\nError occurred while fetching data, falling back on local cache...`);
        json = "No update needed";
    }
    

    if (json != "No update needed") {
        console.debug("New data found...");
        all_course_results_html = "";
        await save_json_data("course_data", json);
        all_courses_global = json.courses;

        await save_json_data("loaded_local_courses", loaded_local_courses);
        await save_json_data("loaded_course_lists", loaded_course_lists);
    } else {
        all_courses_global = current_data.courses;
    }

    // Update courses that might be invalid
    loaded_local_courses = update_courses(all_courses_global, loaded_local_courses);
    for (let i = 0; i < loaded_course_lists.length; i++) {
        loaded_course_lists[i] = update_courses(all_courses_global, loaded_course_lists[i])
    }

    if (full || json != "No update needed") {
        updateDescAndSearcher();
    }
    
    await location_update;

    locations = await load_json_data("locations");
    
    if (locations == null) {
        locations = {};
    }

    console.log(
        `Total Courses Loaded: ${all_courses_global.length}\nTotal Local Courses Loaded: ${loaded_local_courses.length}\nTotal Course Lists Loaded: ${loaded_course_lists.length}\nTotal Custom Courses Loaded: ${loaded_custom_courses.length}\nLocations Loaded: ${Object.keys(locations).length}`
    );
}

async function update_locations() {
    response = fetch(`${API_URL}${GET_LOCATIONS}`);
    let data = await response;
    if (data.status != 408) {
        let json = await data.json();
        await save_json_data("locations", json);        
    }
}

function update_courses(source_list, target_list) {

    // Update courses
    for (let i = 0; i < target_list.length; i++) {
        let main_course = source_list.find(course => course.identifier == target_list[i].identifier);

        if (main_course != undefined) {
            target_list[i] = main_course;
        }
    }

    return target_list
}
function update_loop() {
    setTimeout(function () {
        update_database();
        updateSchedule();
        update_loop();
    }, 60000)
}