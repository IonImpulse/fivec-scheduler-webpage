/*
Contains variable/functions that need to be defined/run
before HTML and other scripts are loaded

Contains ALL global variables used.
*/

// Version number
// Will delete localStorage variables when updating
const current_version = '1.11.0';

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
var last_course_desc = 0;
var loaded_schedule = {};

// Default settings
var settings = {
    hmc_mode: false,
    show_time_line: true,
};

// Day names for various sets
const days_full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdays_full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdays_short = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Web workers:
var searcher_worker;
var desc_worker;
var searching_worker;

var all_course_results_html = [];

var colors;

const colors_light = [
    "#2177de",
    "#63c721",
    "#e48a2e",
    "#d6625e",
    "#c94cce",
    "#cb439a",
    "#d84f55",
    "#3bc44f",
    "#59b0d1",
];

const colors_dark = [
    "#2c5b8e",
    "#499112",
    "#b86c25",
    "#ac4f4f",
    "#86378d",
    "#ac4f8d",
    "#933535",
    "#396F34",
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
        colors = colors_light;
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        colors = colors_dark;
    }
}

function getSettings() {
    let loaded_settings = JSON.parse(localStorage.getItem("settings"));

    if (loaded_settings != null) {
        settings = loaded_settings;
    }
}

function isVerticalLayout() {
    vertical_layout = window.matchMedia("only screen and (max-width: 760px)").matches;
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

getSettings();
getVersion();
getTheme();
isVerticalLayout();