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
    Swal.fire({
		title: 'Print',
		icon: 'success',
		text: 'Print dialogue was opened...',
    })

	let divContents = document.getElementById("schedule-box");
	PrintElements.print([divContents]);
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

function buttonAbout() {
	Swal.fire({
		title: 'About',
		icon: 'info',
		html: `Created By: <b>Ethan Vazquez</b> HMC 25'<BR>` +
		`Send comments/questions/bug reports to: <b>edv121@outlook.com</b><BR><BR>` +
		`Webpage Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-webpage">fivec-scheduler-webpage</a><br>` +
		`API Repo: <a href="https://github.com/IonImpulse/fivec-scheduler-server">fivec-scheduler-server</a>.<BR><BR>` +
		`<b><u>Credits:</b></u><BR>` +
		`<b>html2canvas.js</b><br>Created by Niklas von Hertzen.<br>Licensed under the MIT License.<br>` +
		`<b>sweetalert2.js</b><br>Created by Tristan Edwards & Limon Monte.<br>Licensed under the MIT License.<br>`
	});
}