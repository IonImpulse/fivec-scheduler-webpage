/*
Contains variable/functions that need to be defined/run
before HTML and other scripts are loaded

Contains ALL global variables used.
*/

// Version number
// Will delete localStorage variables when updating
const current_version = '1.17.0';

// Average paces for distance calcs
const walking_feet_per_minute = 328;
const skateboarding_feet_per_minute = 616;
const biking_feet_per_minute = 880;

// *****
// Global Variables
// that need to be saved
// upon reload
// *****
var state = {
    // Storage
    last_updated: 0,
    courses: [],
    term: "Loading...",
    descriptions: [],
    locations: {},

    // loaded points to index in schedules
    loaded: 0,
    // schedules is a list of schedules
    // schedules are formatted as:
    // {
    //     name: "Schedule Name",
    //     courses: [course1, course2, ...]
    //     color: "#hex color"
    // }
    schedules: [
        {
            name: "Main",
            courses: [],
            color: undefined
        }
    ],
    // custom courses
    custom_courses: [],
    starred_courses: [],
    hidden_courses: [],
    hidden_course_lists: [],


    // Settings
    settings: {
        hmc_mode: false,
        show_time_line: true,
    },
};

// *****
// Global Variables
/// that can be lost
// upon reload
// *****
var t_state = {
    selected: [],
    overlay: { identifier: null, locked: false },
    button_filters: [],
    vertical_layout: false,
    show_changelog: false,
    last_description: 0,
    max_grid_rows: 0,
    search_results: [],
    permutations: [],
    current_permutation: 0,
};


// Day names for various sets
const days_full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdays_full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdays_short = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Web workers:
var searcher_worker;
var desc_worker;
var searching_worker;
var permutation_worker;

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
    "#3871AF",
    "#5AB117",
    "#D88232",
    "#CF5D5D",
    "#AD48B6",
    "#D364AE",
    "#BB4444",
    "#4D9747",
    "#52A3C4",
];


/// *****
/// Common course area categories
/// *****
const category_stem = [
    "AISS",
    "AS",
    "ALS",
    "ASTR",
    "BIOL",
    "CHEM",
    "CLES",
    "COGS",
    "CSMT",
    "CSCI",
    "CL",
    "DSCI",
    "EA",
    "GEOG",
    "LGCS",
    "MCBI",
    "MATH",
    "MOBI",
    "NEUR",
    "PHYS",
];

const category_lookup = {
    "STEM": category_stem,
    "PE": ["PE"],
    "Languages": ["ALAN"],
    "Mudd HSA": ["4HSA"],
    "Mudd Writ Intensive": ["4WRT"],
    "Pomona Writ Intensive": ["1WIR"],
    "Pomona Area 1": ["1A1"],
    "Pomona Area 2": ["1A2"],
    "Pomona Area 3": ["1A3"],
    "Pomona Area 4": ["1A4"],
    "Pomona Area 5": ["1A5"],
    "Pomona Area 6": ["1A6"],
}

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

function isVerticalLayout() {
    t_state.vertical_layout = window.matchMedia("only screen and (max-width: 760px)").matches;
    return t_state.vertical_layout;
}

function getVersion() {
    let old_version = localStorage.getItem("version");

    if (old_version == null) {
        old_version = 0;
    }

    if (old_version != current_version) {
        localStorage.setItem("version", current_version);
        t_state.show_changelog = true;
    } else {
        t_state.show_changelog = false;
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