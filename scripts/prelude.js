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
var fuzzy_searcher = [];
var selected_courses = [];
var starred_courses = [];

var overlay = { identifier: null, time_index: -1, locked: false };
var loaded_local_courses = [];
var loaded_course_lists = [];
var loaded_custom_courses = [];
var vertical_layout = false;

var debounce_timer = 100;

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