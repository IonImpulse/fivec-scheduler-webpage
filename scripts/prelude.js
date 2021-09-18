/*
Contains variable/functions that need to be defined/run
before HTML and other scripts are loaded

Contains ALL global variables used.
*/

// *****
// Global Variables
// *****
var all_courses_global = [];
var all_desc_global = [];
var fuzzy_searcher = [];
var selected_courses = [];

var overlay_status = { status: false, course_identifier: null };
var loaded_local_courses = [];
var loaded_course_lists = [];

const colors = [
    "#4f6fac", 
    "#396F34", 
    "#ac4f4f", 
    "#86378d", 
    "#b86c25", 
    "#ac4f8d",
    "#B88700",
    "#26507d",
    "#499112",
    "#9B2608",
];

// *****
// Prelude functions
// *****
function getTheme() {
    let theme = localStorage.getItem("theme");
    if (theme == null) {
        theme = "light";
    } else {
        if (theme == "light") {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme == "dark") {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

getTheme();