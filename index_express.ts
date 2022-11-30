import express from "express";
import { NodeDetails } from "./local/ChordNode";
import { getClient } from "./remote/RemoteClient";
import { HASH_NUM_OF_BITS } from "./util/Constants";
//const express = require("express")
const app = express()

app.get("/", async (req, res) => {
    let textColor = getRandomColor();
    res.send(`<html><p style='color: ${textColor}'>Simple HTML Example with random color ${textColor}</p></html>`);
});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/:port", async (req, res) => {
    let reqNodePort = req.params['port'];
    let textColor = getRandomColor();

    console.log(`Retuning finger table by querying node at port ${reqNodePort}`);
    let fingerTablePath = await getCompleteFingerTablePath(reqNodePort);
    res.send(constructFingersHtml(fingerTablePath));
});

let constructFingersHtml = (fingerTablePath: {number: {nodeDetails: NodeDetails, figers: NodeDetails[]}}) => {
    let nodeFingers = [];
    let html = "<html><style> table {margin-bottom: 50px;}</style><body><div>";
    for(let key in fingerTablePath){
        let nodeDetails = fingerTablePath[key].nodeDetails;
        let fingers = fingerTablePath[key].fingers;
        nodeFingers.push({nodeDetails, fingers});

        html = html + "<div>Details for Node with Id " + nodeDetails.id + "</div><table><tr><th>Finger Id</th><th>Node Id</th><th>Host</th><th>Port</th></tr>";
        fingers.forEach((finger, index) => {
            html = html + "<tr><td>" + index + "</td>" + "<td>" + finger.id + "</td>" + "<td>" + finger.host + "</td>" + "<td>" + finger.port + "</td></tr>";
        });
        html = html + "</table>";
    }

    html = html + "</div></body></html>";
    return html;
};

app.get("/put/:port", async (req, res) => {
    let reqNodePort = req.params['port'];
    let key = parseInt(req.query.key);
    key = key % (2 ** HASH_NUM_OF_BITS);
    let val = req.query.val;
    console.log(`Putting key-val: ${key + "-" + val}. Sending request to node with port ${reqNodePort}`);
    try{
        let nodeClient = getClient("localhost", reqNodePort);
        let putResponse = await nodeClient.putRemote({key, val});
        let insertedAt = putResponse.insertedAt;
        let result = "<div>Inserted at below node</div>";
        if(insertedAt){
            result = result + "<table><tr><th>Node Id</th><th>Host</th><th>Port</th></tr><tr><td>" + 
                insertedAt.id + "</td><td>" + insertedAt.host + "</td><td>" + insertedAt.port + 
                "</td></tr></table>";
        }
        res.send(result);
    }catch(e){
        res.send(`Error while trying to insert key-val. Error: ${e}`);
    }
});

app.get("/get/:port", async (req, res) => {
    let reqNodePort = req.params['port'];
    let key = parseInt(req.query.key);
    key = key % (2 ** HASH_NUM_OF_BITS);
    console.log(`Getting val from key: ${key}. Sending request to node with port ${reqNodePort}`);
    try{
        let nodeClient = getClient("localhost", reqNodePort);
        let getResponse = await nodeClient.getRemote({key});
        let result = "<div>Returned Value: " + (getResponse.val ? getResponse.val : "") + "</div><div>Retrieved from below node</div>";
        if(getResponse.retrievedFrom){
            result = result + "<table><tr><th>Node Id</th><th>Host</th><th>Port</th></tr><tr><td>" + 
            getResponse.retrievedFrom.id + "</td><td>" + getResponse.retrievedFrom.host + "</td><td>" + getResponse.retrievedFrom.port + 
                "</td></tr></table>";
        }
        res.send(result);
    }catch(e){
        res.send(`Error while trying to get value from key. Error: ${e}`);
    }
});

const getCompleteFingerTablePath = async (reqNodePort: number): Promise<{number: {nodeDetails: NodeDetails, figers: NodeDetails[]}}> => {
    let initialNodeClient = getClient("localhost", reqNodePort);
    let fingerDetails = await initialNodeClient.getFingerTableRemote();
    let initialNodeDetails: NodeDetails = fingerDetails.currNode;
    let initialNodeFingerTable: Array<NodeDetails> = fingerDetails.fingers;
    let nodeFingerAllMap = {};
    addToNodeMap(nodeFingerAllMap, initialNodeFingerTable);
    let nodeFingerIteratedSet: Set<number> = new Set();
    nodeFingerIteratedSet.add(initialNodeDetails.id);

    let fingerTablePath = {[initialNodeDetails.id]: {nodeDetails: initialNodeDetails, fingers: initialNodeFingerTable}};

    return getCompleteFingerTablePathFromInitNode(fingerTablePath, nodeFingerAllMap, nodeFingerIteratedSet);
};

const getCompleteFingerTablePathFromInitNode = async (
        fingerTablePath, 
        nodeFingerAllMap, 
        nodeFingerIteratedSet: Set<number>
    ): Promise<{number: {nodeDetails: NodeDetails, figers: NodeDetails[]}}> => {
    let allNodes = {...nodeFingerAllMap};
    for(let nodeIdStr in allNodes){
        let nodeId = parseInt(nodeIdStr);
        let nodeDetails = allNodes[nodeId]
        if(!nodeFingerIteratedSet.has(nodeId)){
            let nodeClient = getClient("localhost", nodeDetails.port);
            let fingerDetails = await nodeClient.getFingerTableRemote();
            let nodeFingerTable: Array<NodeDetails> = fingerDetails.fingers;
            addToNodeMap(nodeFingerAllMap, nodeFingerTable);
            nodeFingerIteratedSet.add(nodeDetails.id);
            fingerTablePath[nodeDetails.id] = {nodeDetails, fingers: nodeFingerTable};
        }
    }

    let mapLen = Object.keys(nodeFingerAllMap).length;
    if(mapLen > nodeFingerIteratedSet.size){
        return getCompleteFingerTablePathFromInitNode(fingerTablePath, nodeFingerAllMap, nodeFingerIteratedSet);
    }

    return fingerTablePath;
}

const addToNodeMap = (nodeMap: any, fingerTable: Array<NodeDetails>) => {
    fingerTable.forEach((finger) => {
        nodeMap[finger.id] = finger;
    });
};

const getRandomColor = () => {
    const firstTwo = Math.floor(Math.random() * 89) + 10;
    const secondTwo = Math.floor(Math.random() * 89) + 10;
    const thirdTwo = Math.floor(Math.random() * 89) + 10;

    return "#" + firstTwo + secondTwo + thirdTwo;
};

async function main() {
    console.log(`Length of Arguments: ${process.argv.length}`);

    let host = process.argv[2];
    let port = Number(process.argv[3]);
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);

    app.listen(port, () => {
        console.log(`Express Server started on port ${port}`);
    });
}

main();