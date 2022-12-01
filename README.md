# distributed-hash-table

### Setup
1. Install NodeJS v14.18.2
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
    npm start -- localhost 4007 localhost 4002 7 <br />
3. Start Express Server in another terminal: <br />
    npm run startExpress localhost 3000
3. Wait for all fingers to fix
4. Hit the below endpoint: <br />
    "http://localhost:3000/fingers?knownHost=localhost&knownPort=4001" which is of the format "http://localhost:3000/fingers?knownHost={any-known-host}&knownPort={any-node-with-known-port}" <br />  <br />

    This endpoint would return the finger entries for all the three nodes: <br />
    Node with Id 1 (port 4001): Fingers 2, 7, 7 <br /> 
    Node with Id 2 (port 4002): Fingers 7, 7, 7 <br />
    Node with Id 7 (port 4007): Fingers 1, 1, 7 <br />
5. To insert Key-Value in the Distributed Hash Table (DHT), hit the below endpoint: <br/>
    "http://localhost:3000/put?knownHost=localhost&knownPort=4001&key=3&val=num3" which is of the format "http://localhost:3000/put?knownHost={any-known-host}&knownPort={any-node-with-known-port}&key={key}&val={val}" <br />
6. To retrieve a given key's value from DHT, hit the below endpoint: <br/>
    "http://localhost:3000/get?knownHost=localhost&knownPort=4001&key=3" which is of the format "http://localhost:3000/get?knownHost={any-known-host}&knownPort={any-node-with-known-port}&key={key}" <br />
7. To test whether the right keys get transferred to the right nodes, do the following steps: <br/>
    a. Start another server with id between node 2 and 7: <br/>
        npm start -- localhost 4005 localhost 4002 5 <br/>
    b. Wait for some time such that fingers gets fixed. <br/>
    c. Hit the below endpoint to retrieve value of key: <br/>
    "http://localhost:3000/get?knownHost=localhost&knownPort=4001&key=3" <br/>
    This would return retrievedFrom as node 5 (and NOT node 7) <br/>