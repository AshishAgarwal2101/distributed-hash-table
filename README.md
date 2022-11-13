# distributed-hash-table

### Setup
1. Install NodeJS (optionally from here: https://nodejs.org/en/download/).
2. Make sure npm is properly setup in the PATH variable. To check, run "npm -v" in the terminal. This should return the npm version installed.
1. Open terminal and go to the project root directory.
2. Run command: "npm install".

### Build
1. Run command: "npm run build"

### Starting the Server (Currently in development, not working)
1. Run command: "npm start -- \<host> \<port>" <br />
    e.g. npm start -- localhost 4003


### For our testing, start the server in port 4003 and then run the test script in port 4002
1. If you are using a Windows system, go to package.json file and modify the build script as follows: <br />
    "npx tsc && npm run copyWindows:assets"
2. Complete the Setup and Build steps using the above mentioned instructions.
3. In first terminal, run the following command, "npm start -- localhost 4003"
4. In second terminal, run the following command, "npm run testServer -- localhost 4002"
