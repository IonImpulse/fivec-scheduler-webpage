# ![Logo](https://raw.githubusercontent.com/IonImpulse/fivec-scheduler-webpage/main/img/favicons/favicon-32x32.png) 5scheduler.io - Course Scheduler for the 5Cs
***Currently in Beta***

5scheduler.io is a fast, responsive, and modern course scheduler for the five Claremont Colleges (the 5Cs).

Live at [www.5scheduler.io](https://www.5scheduler.io/)


## Features
- 🚀 **SUPERFAST** everything - tested to be the fastest course scheduler for the 5Cs
- 🔍 **Fast** & **Smart** typo-resistant search engine for all courses at the [Claremont Colleges](https://www.claremont.edu/)
- 🌗 Light & **Dark** Mode
- 📧 **Share and load** schedules as a code, link, or QR code
- ⚙ Add **Custom** courses
- 📸 **Export** schedule as image
- 🖨 **Print schedule** directly 
- 📱 **Mobile**-optimized mode
- 🔰 Works as a ***Progressive Web App*** (PWA)
   - 📲 Installs as an app on your phone/desktop
   - 💾 Can be run entirely **offline**

## Screenshots
![Screenshot Desktop](https://raw.githubusercontent.com/IonImpulse/fivec-scheduler-webpage/main/img/theme_change_screenshot.png)

![Screenshot Mobile](https://raw.githubusercontent.com/IonImpulse/fivec-scheduler-webpage/main/img/mobile_screenshot.png)



## Contributing/Modifying
Unfortunately, due to security policies in browsers, you cannot just open the index.html to view a working version of the website. However, it's quite simple to get up and running.

1. Clone this repo using Git.
2. Make sure you have Python 3 installed. 
3. Then, run the included **debug.bat** or **debug.bash** (.bat for Windows, .bash for Linux/Mac) file to start a local webserver.
4. Navigate to **localhost:8000** on your web browser of choice and you should see a working version of the website.
5. After you make a change, be sure to refresh the page using `Ctrl + Shift + R` or `Ctrl + F5`. This clears the browser's cache for localhost:8000 and forces the content to update.



## Stats for Nerds
- Built using plain JS, CSS, & HTML5
- API repo at [fivec-scheduler-server](https://github.com/IonImpulse/fivec-scheduler-server), built using Rust
- Website first run size is ~758 KB, subsequent runs are <1 KB. Compressed using GZip
   - Course data: 423 KB
   - Fonts: 127 KB
   - Images: 115 KB
   - JS: 68 KB
   - CSS: 8 KB
   - HTML: 3 KB
- Scored 100/100 for all tests in Google Lighthouse
- Speed index of 2.6s for first run, 1.2s for repeat runs on WebPageTest
