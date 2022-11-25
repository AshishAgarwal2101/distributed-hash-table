import express from "express";
import { NodeDetails } from "./local/ChordNode";
import { getClient } from "./remote/RemoteClient";
//const express = require("express")
const app = express()

app.get("/", async (req, res) => {
    let textColor = getRandomColor();
    res.send(`<html><p style='color: ${textColor}'>Simple HTML Example with random color ${textColor}</p></html>`);
});

app.get("/:port", async (req, res) => {
    let reqNodePort = req.params['port'];
    let textColor = getRandomColor();

    let fingerTablePath = getCompleteFingerTablePath(reqNodePort);
    res.send("Work going on...");
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
    for(let [nodeId, nodeDetails] of allNodes){
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