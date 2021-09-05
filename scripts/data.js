// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5cheduler.com/"
const FULL_UPDATE = "fullupdate";
const UPDATE_IF_STALE = function(timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSES_LIST_BY_CODE = function(code) { return "getCoursesListByCode/" + code; }

function load_json_data(name) {
    let data = localStorage.getItem(name);
    if (data != null && data != "" && data != "null" && data != "undefined" && data != "NaN" && data != undefined) {
        return JSON.parse(data);
    } else {
        return null;
    }
}

function save_json_data(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
}

async function update_database() {
    console.log("Updating database...");

    let current_data = load_json_data("course_data");

    let response;

    if (current_data === null || Object.entries(current_data).length === 0) {
        response = fetch(`${API_URL}${FULL_UPDATE}`);
    } else {
        response = fetch(`${API_URL}${UPDATE_IF_STALE(current_data[0])}`);

    }

    const data = await response.then(response => response.json());

    if (data != "No update needed") {
        save_json_data("course_data", data);
    }
}

function update_loop() {
    setTimeout(function() {
        update_database();
        update_loop();
    }, 60000)
}

function setup_course_lists() {
    let course_lists = load_json_data("course_lists");

    if (course_lists == null) {
        save_json_data("course_lists", []);
    }
}

setup_course_lists();
update_database();
update_loop();
