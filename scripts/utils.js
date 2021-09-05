function toggle_theme() {
    if (document.documentElement.getAttribute("data-theme") != "dark") {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem("theme", "dark");
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem("theme", "light");
    }
}