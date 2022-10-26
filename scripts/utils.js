function getLoadedCourses() {
    return (state.schedules[state.loaded] ?? {courses: []}).courses
}

function setLoadedCourses(courses) {
    state.schedules[state.loaded].courses = courses;
}

function addToLoadedCourses(course) {
    state.schedules[state.loaded].courses.push(course);
}

function getNthLoadedCourse(n) {
    return state.schedules[state.loaded].courses[n];
}

function deleteNthLoadedCourse(n) {
    state.schedules[state.loaded].courses.splice(n, 1);
}