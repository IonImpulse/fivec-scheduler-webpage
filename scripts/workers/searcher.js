importScripts("../libs/fuzzysort.js");

function create_searcher(all_courses_global) {
    all_courses_global.forEach((t, index) => t.descIndex = index);
    all_courses_global.forEach(t => t.instructorString = t.instructors.join(" "));
    all_courses_global.forEach(t => t.filePrepared = fuzzysort.prepare(t.file));
    return all_courses_global;
}

onmessage = function(e) {
    console.info("Searcher worker started");
    const all_courses_global = e.data[0];
    const fuzzysort = e.data[1];
    
    let searcher = create_searcher(all_courses_global, fuzzysort);

	console.info("Searcher worker finished!")

    postMessage(searcher);
}