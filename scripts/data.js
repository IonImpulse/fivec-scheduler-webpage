// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5cheduler.com/"
const FULL_UPDATE = "fullUpdate";
const UPDATE_IF_STALE = function (timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSE_LIST_BY_CODE = function (code) { return "getCourseListByCode/" + code; }

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
    let current_data = load_json_data("course_data");

    let response;

    if (current_data === null || Object.entries(current_data).length === 0) {
        response = fetch(`${API_URL}${FULL_UPDATE}`);
    } else {
        response = fetch(`${API_URL}${UPDATE_IF_STALE(current_data.timestamp)}`);

    }

    const data = await response.then(response => response.json());

    if (data != "No update needed") {
        save_json_data("course_data", data);
        create_searcher();
    }
}

function update_loop() {
    setTimeout(function () {
        update_database();
        update_loop();
    }, 60000)
}

async function create_searcher() {
    let current_data = load_json_data("course_data");

    if (current_data == null) {
        await update_database();
        current_data = load_json_data("course_data");
    }
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

    fuzzy_searcher = new Fuse(current_data.courses, options);
}

update_database();
update_loop();
create_searcher();