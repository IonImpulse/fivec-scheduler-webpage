# ![Logo](https://raw.githubusercontent.com/IonImpulse/fivec-scheduler-webpage/main/img/favicons/favicon-32x32.png) 5scheduler.io - Course Scheduler for the 5Cs
***Currently in Beta***

5scheduler.io is a fast, responsive, and modern course scheduler for the five Claremont Colleges (the 5Cs).

Live at [www.5scheduler.io](https://www.5scheduler.io/)


## Features
- 🚀 Fast, intelligent searching of all courses at the Claremont Colleges
- 📊 Variety of filters to narrow down courses
- 🎓 Displays prereqs, coreqs, PERMs, etc. for all courses
- 🚨 Dynamic conflict awareness & resizing
- 🗺 Mapping & class distance calculation
- 🔍 Ability to locate class building on map
- 💭 Customizable custom courses support
- 📤 Variety of export options: png, iCal, gCal, print, link, QR code
- 📱 Mobile optimized view & offline support
- 💳 HMC and 4C credit system switching
- 🌓 Light & Dark modes

## Screenshots
![image](https://user-images.githubusercontent.com/24578597/201518896-949719ad-8ccb-4347-a3c9-10a6e5b95e4d.png)
![image](https://user-images.githubusercontent.com/24578597/201519064-d5b1a021-d780-4d6d-8dd8-786b15deba3d.png)

![Screen Shot 2022-11-13 at 03 16 29](https://user-images.githubusercontent.com/24578597/201518997-a3fa1339-65e3-4896-9b6c-56b9bdc8bcbe.png)



## Contributing/Modifying
1. Clone this repo using Git.
2. Open VSCode, install the extension "Live Server".
3. Open the repo in VSCode and click the "Go Live" button.
4. Press Ctrl + Shift + R to display new changes.



## Stats for Nerds
- Built using plain JS, CSS, & HTML5
- API repo at [fivec-scheduler-server](https://github.com/IonImpulse/fivec-scheduler-server), built using Rust
- Website first run size is ~739 KB, subsequent runs are ~2 KB. Compressed using GZip
- Scored 99/100 for all tests in Google Lighthouse
- Speed index of 2.5s for first run, 0.9s for repeat runs with 0s blocking time on WebPageTest
