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


### Testing
1. Complete the Setup and Build steps using the above mentioned instructions.
2. Run the following commands in three different terminals: <br />
    npm start -- localhost 4001 <br />
    npm start -- localhost 4002 localhost 4001 2 <br />
    npm start -- localhost 4003 localhost 4001 3 <br />
3. Start Express Server in another terminal: <br />
    npm run startExpress localhost 3000
3. Wait for all fingers to fix
4. Hit the below endpoint: <br />
    "http://localhost:3000/4001" which is of the format "http://localhost:3000/<any-node with known port>" <br />  <br />

    This endpoint would return the finger entries for all the three nodes: <br />
    Node with Id 1 (port 4001): Fingers 2, 7, 7 <br /> 
    Node with Id 2 (port 4002): Fingers 7, 7, 7 <br />
    Node with Id 7 (port 4007): Fingers 1, 1, 7 <br />
5. To insert Key-Value in the Distributed Hash Table (DHT), hit the below endpoint: <br/>
    "http://localhost:3000/put/4001?key=1&val=num1" which is of the format "http://localhost:3000/get/<any-node with known port>?key=<key>" <br />
6. To retrieve a given key's value from DHT, hit the below endpoint: <br/>
    "http://localhost:3000/get/4001?key=1&val=num1" which is of the format "http://localhost:3000/get/<any-node with known port>?key=<key>" <br />
    
