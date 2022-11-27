# distributed-hash-table

### Setup
1. Install NodeJS (optionally from here: https://nodejs.org/en/download/).
2. Make sure npm is properly setup in the PATH variable. To check, run "npm -v" in the terminal. This should return the npm version installed.
1. Open terminal and go to the project root directory.
2. Run command: "npm install".

### Build
1. If you are using Windows, run command: "npm run buildWin".
2. If you are using Unix based system, run command: "npm run build".

### Starting the Server (Currently in development, not working)
1. Run command: "npm start -- \<host> \<port>" <br />
    e.g. npm start -- localhost 4003


### For our testing, start the server in port 4003 and then run the test script in port 4002
1. Complete the Setup and Build steps using the above mentioned instructions.
2. Run the following commands in four different terminals: <br />
    npm start -- localhost 4001 <br />
    npm start -- localhost 4002 localhost 4001 2 <br />
    npm start -- localhost 4003 localhost 4001 3 <br />
    npm start -- localhost 4011 localhost 4003 11 <br />
