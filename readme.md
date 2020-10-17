# Forॐ - Just a recursive forum

## How to use it ?

- Clone this repository.
- Install build tools if you don't have it.
    - Windows: To install the necessary prerequisites on Windows, the easiest is to simply run the following command, under an administrative command prompt or powershell: `npm i -g --add-python-to-path --vs2015 --production windows-build-tools`.
    - Linux: As for the C++ build tools, that's installed using the simple command: `sudo apt-get install build-essential`.
    - Mac:
        - Install [XCode](https://developer.apple.com/xcode/download/).
        - Once XCode is installed, go to **Preferences**, **Downloads**, and install the **Command Line Tools**.
- Install dependencies with npm.
- Make a **.env** file with this lines inside:
    - `HASH_SALT=...`
    - `SESSION_SECRET=...`
    - `PORT=...`
    - `ADMIN_USERNAME=...`
    - `ADMIN_PASSWORD=...`
- Run as dev with `npm run start` or `npm run watch`.
- Run on prod with `npm run build && <your_process_manager> dist/server.js`.

## Todo list

- paginate admin page ⚠️
- mail confirmation using [nodemailer](https://nodemailer.com/about/) ⚠️
- implement socket.io for mention notifications (using mention API)
- implement a live private chat between members (using socket.io too)
- add fixtures for dev tests
- add report button on posts and on users profile
- show a preview of post content in post-card
- make settings page (CRUD & RGPD, themes dark/light & theme color)
- remove bootstrap and make a real SCSS theme from scratch
- fix redirection (make a real History class to manage it)
- allow user own custom shortcuts
- implement right click on items (copy url, edit, delete, share, send to DM, copy ID)
- implement right click on blank (open compact version of settings)
- allow shortcuts to be public and private
- make a "get" button on public shortcuts to get it
- allow searching of shortcuts in search page
- add a js tool page (regex tester, css selector tester, color picker, etc...)
- adapt for mobile
- on profile of other user, show mutual friends
- use the maximum of place for posts
- use javascript algorithme to wrap posts
- add brand and favicon
- remove the last apostroph of pseudo whan display it like `Ghom's thing`
- make a deploy script on gulpfile: send a Discord webhook with deployed branch/commit links and deployed site url
- add dropdowns on header
- add fixed side-bar with friend list
- add fixed chat-boxes (facebook-like) on bottom-right of viewport
- replace Ghom copyright by just "Ɠɧॐ"
