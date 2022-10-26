
// *****
// Functions to get and handle data from the server
// *****

const API_URL = "https://api.5scheduler.io/"
const FULL_UPDATE = "fullUpdate";
const UPDATE_IF_STALE = function (timestamp) { return "updateIfStale/" + timestamp; }
const GET_UNIQUE_CODE = "getUniqueCode";
const GET_COURSE_LIST_BY_CODE = function (code) { return "getCourseListByCode/" + code; }
const GET_LOCATIONS = "getLocations"
const STATUS = "status"

async function load_json_data(name) {
    return localforage.getItem(name);
}

async function save_json_data(name, data) {
    return localforage.setItem(name, data);
}

async function getState() {
    return await load_json_data("state");
}

async function saveState() {
    return await save_json_data("state", state);
}

async function update_database() {
    console.debug("Updating database...");

    let location_update = update_locations();

    let response;
    let json;

    try {
        if (state.courses === null || state.last_updated == 0 || Object.entries(state.courses).length === 0) {
            console.debug("No data found, requesting full update...");
            response = fetch(`${API_URL}${FULL_UPDATE}`);
        } else {
            console.debug("Found data, requesting update if stale...");
            response = fetch(`${API_URL}${UPDATE_IF_STALE(state.last_updated)}`);
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

    state.locations = await location_update;    

    if (json != "No update needed" && json != undefined) {
        console.debug("New data found...");
        t_state.search_results = "";
        state.courses = json.courses;
        state.last_updated = json.timestamp;
        state.term = json.term;
        updateDescAndSearcher();

        await saveState();
    }

    // Update courses that might be invalid
    hydrateCoursesFromState()

    if (state.schedules.length == 0) {
        state.schedules = [
            {
                name: "Main",
                courses: [],
                color: undefined
            }
        ];

        state.loaded = 0;
    }

    console.log(
        `Total Courses Loaded: ${state.courses.length}\nTotal Local Courses Loaded: ${getLoadedCourses().length}\nTotal Course Lists Loaded: ${state.schedules.length}\nTotal Custom Courses Loaded: ${state.custom_courses.length}\nLocations Loaded: ${Object.keys(state.locations).length}`
    );
}

function hydrateCoursesFromState() {
    for (let s of state.schedules) {
        for (let c of s.courses) {
            c = hydrateCourse(c)
        }
    }
}

function hydrateCourse(course) {
    let main_course = state.courses.find(c => c.identifier == course.identifier);

    if (main_course != undefined) {
        main_course.color = course.color;
        return main_course;
    } else {
        return course;
    }
}        

async function update_locations() {
    let response = fetch(`${API_URL}${GET_LOCATIONS}`);
    let data = await response;

    if (data.status == 200) {
        let json = await data.json();

        return json;
    }
}

function update_loop() {
    setTimeout(function () {
        update_database();
        updateSchedule();
        update_loop();
    }, 60000)
}