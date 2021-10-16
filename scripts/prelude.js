/*
Contains variable/functions that need to be defined/run
before HTML and other scripts are loaded

Contains ALL global variables used.
*/

// Version number
// Will delete localStorage variables when updating
const current_version = 1.2;

// *****
// Global Variables
// *****
var timestamp_global = 0;
var all_courses_global = [];
var all_desc_global = [];
var selected_courses = [];
var starred_courses = [];

var overlay = { identifier: null, time_index: -1, locked: false };
var loaded_local_courses = [];
var loaded_course_lists = [];
var loaded_custom_courses = [];
var vertical_layout = false;

var debounce_timer = 10;

// Web workers:
var searcher_worker;
var desc_worker;
var searching_worker;

var all_course_results_html = [];

const colors = [
    "#2c5b8e",
    "#396F34",
    "#b86c25", 
    "#ac4f4f", 
    "#86378d",
    "#ac4f8d",
    "#933535",
    "#B88700",
    "#499112",
    "#3d7991",
];

// *****
// Prelude functions
// *****
function getTheme() {
    let theme = localStorage.getItem("theme");
    if (theme == null) {
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        if (darkThemeMq.matches) {
            theme = "dark";
        } else {
            theme = "light";
        }
        localStorage.setItem("theme", theme);
    }

    if (theme == "light") {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme == "dark") {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function isVerticalLayout() {
    vertical_layout = window.matchMedia("only screen and (max-width: 760px)").matches;
    debounce_timer = vertical_layout ? 300 : 10;
    return vertical_layout;
}

function getVersion() {
    let old_version = localStorage.getItem("version");

    if (old_version == null) {
        old_version = 0;
    }
    if (old_version != current_version) {
        localStorage.clear();
        localStorage.setItem("version", `${current_version}`)
    }
}

document.addEventListener("keydown", function(event) {
    if (event.code === "Enter") {
        document.activeElement.click();
    }
});


getVersion();
getTheme();
isVerticalLayout();


// *****
// HTML Popups
// *****

const custom_course_popup = `
<div class="custom-course-manager">
    <div class="course-box">
        <div class="header">Custom Courses</div>
        <div id="custom-course-list" class="list">
            No custom courses have been created yet! <br>
            Click the "Create New" button to start. <br>
            Custom courses will be automatically added to your schedule.
        </div>
    </div>
    <div class="create-course-form">
        <div class="header">Create New Course</div>
        <div class="form-group">
            <div>
                <label for="course-title">Title*</label>
                <input type="text" id="course-title" class="input custom-course-input" placeholder="Title" required>
            </div>
            
            <div>
                <label for="course-days">Days*</label>
                <div class="day-checkboxes">
                    <label class="small-label" for="monday-check">Mon</label>
                    <input id="monday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="tuesday-check">Tue</label>
                    <input id="tuesday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="wednesday-check">Wed</label>
                    <input id="wednesday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="thursday-check">Thu</label>
                    <input id="thursday-check" type="checkbox" class="day-checkbox">
                    <label class="small-label" for="friday-check">Fri</label>
                    <input id="friday-check" type="checkbox" class="day-checkbox">
                </div>
            </div>

            <div>
                <label for="course-start-time">Start Time > 7:00AM*</label>
                <input type="time" min="07:00" max="22:00" id="course-start-time" class="input custom-course-input placeholder="7:00" required>
            </div>

            <div>
                <label for="course-end-time">End Time < 10:00PM*</label>
                <input type="time" min="07:00" max="22:00" id="course-end-time" class="input custom-course-input" placeholder="22:00" required>
            </div>

            <div>
                <label for="course-location">Location*</label>
                <input type="text" id="course-location" class="input custom-course-input" placeholder="Location" required>
            </div>

            <div>
                <label for="course-identifier">Identifier</label>
                <input type="text" id="course-identifier" class="input custom-course-input" placeholder="Identifier">
            </div>

            <div>
                <label for="course-instructors">Instructors</label>
                <input type="text" id="course-instructors" class="input custom-course-input" placeholder="Instructor">
            </div>

            <div>
                <label for="course-description">Description</label>
                <input type="text" id="course-description" class="input custom-course-input" placeholder="Description">
            </div>

            <div>
                <label for="course-notes">Notes</label>
                <input type="text" id="course-notes" class="input custom-course-input" placeholder="Notes">
            </div>
        </div>

        <div class="button-group">
            <div tabindex="0" id="add-new-course" class="title-bar-button unselectable course-button" onclick="submitNewCourse()">Add</div>
            <div tabindex="0" id="cancel-new-course" class="title-bar-button unselectable course-button" onclick="cancelNewCourse()">Cancel</div>
        </div>
    </div>
    <div class="right-panel">
        <div id="create-course" class="title-bar-button unselectable course-button" onclick="createNewCourse()">Create New</div>
        <div id="edit-course" class="title-bar-button unselectable course-button" onclick="editCourse()">Edit</div>
    </div>
</div>
`.replace("\n",'');