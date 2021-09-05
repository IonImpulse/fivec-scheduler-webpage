function get_theme() {
    let theme = localStorage.getItem("theme");
    if (theme == null) {
        theme = "light";
    } else {
        if (theme == "light") {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme == "dark") {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
}

get_theme();