/*
Contains variable/functions that need to be defined/run
before HTML and other scripts are loaded

Contains ALL global variables used.
*/

// Version number
// Will delete localStorage variables when updating
const current_version = '1.6.3';

// Average paces for distance calcs
const walking_feet_per_minute = 328;
const skateboarding_feet_per_minute = 616;
const biking_feet_per_minute = 880;

// *****
// Global Variables
// *****
var timestamp_global = 0;
var all_courses_global = [];
var all_desc_global = [];
var selected_courses = [];
var starred_courses = [];
var hidden_courses = [];
var hidden_course_lists = [];
var locations = {};

var overlay = { identifier: null, locked: false };
var loaded_local_courses = [];
var loaded_course_lists = [];
var loaded_custom_courses = [];
var vertical_layout = false;
var show_changelog = true;

var debounce_timer = 10;

// Day names for various sets
const days_full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdays_full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdays_short = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
        localStorage.setItem("version", current_version);
        show_changelog = true;
    } else {
        show_changelog = false;
    }
}

document.addEventListener("keydown", function (event) {
    if (event.code === "Enter") {
        document.activeElement.click();
    }
});


getVersion();
getTheme();
isVerticalLayout();