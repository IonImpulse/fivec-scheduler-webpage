// *****
// Title button functions
// *****

function buttonImport() {
    Swal.fire({
        title: 'Import Course Code',
        html: `<div><input maxlength='7' id="code-input"></div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Load',
        showLoaderOnConfirm: true,
        preConfirm: () => {
          return fetch(`${API_URL}${GET_COURSES_LIST_BY_CODE(document.getElementById("code-input"))}`)
            .then(response => {
              if (!response.ok) {
                throw new Error(response.statusText)
              }
              return response.json()
            })
            .catch(error => {
              Swal.showValidationMessage(
                `Invalid Code! ${error}`
              )
            })
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: `Loaded courses!`
          })
        }
      })
}

function buttonExport() {
    html2canvas(document.querySelector("#schedule-box"), {
        
    }).then(function(canvas) {   
        
        Swal.fire({
            title: 'Export',
            icon: 'success',
            html:
              '<div id="share-image"></div><br>' +
              'To download, right click the image above and click "Save Image As...',
        })

        document.querySelector("#share-image").appendChild(canvas);
        
    });
}

function buttonPrint() {

}

async function buttonShare() {
    let current_courses = load_json_data("local_course_list")

    if (current_courses == null) {
        Swal.fire({
            title: 'No courses have been locally loaded!',
            icon: 'error'
        })
    } else {
        let response = await fetch(`${API_URL}${GET_UNIQUE_CODE}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(user)
        });
    
        Swal.fire({
            title: 'Export',
            icon: 'success',
            html:
              '<div id="share-image"></div><br>' +
              'To download, right click the image above and click "Save Image As...',
        })
    }
}

function buttonTheme() {
    toggle_theme();
}