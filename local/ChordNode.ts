import { HASH_NUM_OF_BITS } from "../util/Constants";
import { constructNodeStr, getHash, isIdInBetween } from "../util/Util";
import { getClient } from "../remote/RemoteClient";


export interface NodeDetails {
    id: number;
    host: string;
    port: number;
}

export const NULL_NODE_DETAILS: NodeDetails = {
    id: null,
    host: null,
    port: null
};

class ChordNode {
    nodeDetails: NodeDetails;
    successors: Array<NodeDetails> = [];
    predecessor: NodeDetails = null;
    fingers: Array<NodeDetails> = [];
    next: number = -1;
    localMap = {};

    constructor(host: string, port: number, hashId: number){
        console.log(`HashId 1 ==== ${hashId}`);
        console.log(`HashId 2 ==== ${(hashId ? hashId : 1)}`);
        this.nodeDetails = {
            id: (hashId ? hashId : 1),
            //id: getHash(`$host:$port`),
            host: host,
            port: port
        }
        
        this.findSuccessor = this.findSuccessor.bind(this);
        this.findSuccessorRemote = this.findSuccessorRemote.bind(this);
        this.create = this.create.bind(this);
        this.join = this.join.bind(this);
        this.stabilize = this.stabilize.bind(this);
        this.notify = this.notify.bind(this);
        this.closestPrecedingNode = this.closestPrecedingNode.bind(this);
        this.fixFingers = this.fixFingers.bind(this);
        this.findFingerTable = this.findFingerTable.bind(this);
        this.updateMap = this.updateMap.bind(this);

        setInterval(this.stabilize, 6000); //called every 6 seconds
    }

    async findSuccessor(id: number): Promise<NodeDetails> {
        try{
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finding successor for id ${id} - Current successor ${this.successors[0].id}`);
            if(this.successors.length > 0 && isIdInBetween(this.nodeDetails.id, this.successors[0].id, id)){
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finding successor => Finger for id ${id} found between ${this.nodeDetails.id} and ${this.successors[0].id}`);
                return this.successors[0];
            }
            if(this.fingers.length == 0 && (this.successors.length == 0 || this.successors[0] === this.nodeDetails)){
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finding successor => No finger or successor found - successor is itself`);
                return this.nodeDetails;
            }
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finding successor => Finding closestPrecedingNode`);
            let closestPrecedingNodeForId = await this.closestPrecedingNode(id);
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finding successor => closestPrecedingNode is ${constructNodeStr(closestPrecedingNodeForId)}`);
            if(closestPrecedingNodeForId.id === this.nodeDetails.id){
                return this.successors[0];
            }
            return await this.findSuccessorRemote(id, closestPrecedingNodeForId);
        }catch(e){
            console.log("Error while finding successor node local: ", e);
            return null;
        }
    }

    async findSuccessorRemote(id: number, closestPrecedingNode: NodeDetails): Promise<NodeDetails> {
        try {
            let closestPrecedingClient = getClient(closestPrecedingNode.host, closestPrecedingNode.port);
            let succ = await closestPrecedingClient.getSuccessorRemote({id});
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Found successor ${constructNodeStr(succ)}`);
            return succ;
        } catch(error) {
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Error while trying to find successor from remote node ${constructNodeStr(closestPrecedingNode)} => Error: ${error}`);
            return null;
        }
    }

    async closestPrecedingNode(id: number): Promise<NodeDetails> {
        try{
            for(let i=this.fingers.length-1; i>=0; i--){
                let fingerId = this.fingers[i].id;
                if(isIdInBetween(this.nodeDetails.id, id, fingerId)){
                    console.log(`Node ${constructNodeStr(this.nodeDetails)} => Returning Finger ${this.fingers[i].host}:${this.fingers[i].port}`);
                    return this.fingers[i];
                }
            }
            return this.nodeDetails;
        }catch(e){
            console.log("Error while finding closest preceding node: ", e);
            return null;
        }
    }

    async create(): Promise<void> {
        try{
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => A new cluster is being created`);
            this.predecessor = null;
            this.successors[0] = this.nodeDetails;
            this.fingers = [];
            this.next =  -1;
            setInterval(this.fixFingers, 5000); //called every 5 seconds
        }catch(e){
            console.log("Error during node create: ", e);
        }
    }

    async join(refNode:NodeDetails): Promise<void> {
        try {
            let successorMinimumId = (this.nodeDetails.id + 1) % (2 ** HASH_NUM_OF_BITS);
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Node joining the cluster`);
            this.predecessor = null;
            this.successors[0] = await this.findSuccessorRemote(successorMinimumId, refNode);
            this.fingers[0] = this.successors[0];
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Node's successor and first finger: ${constructNodeStr(this.successors[0])}`);
            this.next =  0;
            setInterval(this.fixFingers, 5000); //called every 5 seconds
        }catch(e){
            console.log("Error during node join: ", e);
        }
        
    }

    async stabilize(): Promise<void> {
        try{
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Stabilize called`);
            if (this.successors.length == 0 || this.successors[0] === this.nodeDetails){
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => No successor found to stabilize. Exiting.`);
                return;
            }
            
            let successorClient = getClient(this.successors[0].host, this.successors[0].port);
            let succPredecessor: NodeDetails = (await successorClient.getPredecessorRemote()).predecessor;
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Stabilize => Successor's predecessor is ${succPredecessor ? constructNodeStr(succPredecessor) : null}`);

            if(succPredecessor && isIdInBetween(this.nodeDetails.id, this.successors[0].id, succPredecessor.id)){
                this.successors[0] = succPredecessor;
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => Stabilize sets successor to ${constructNodeStr(this.successors[0])}`);
                successorClient = getClient(this.successors[0].host, this.successors[0].port);
            }
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Stabilize => Notifying remote with id ${this.successors[0].id}`);
            successorClient.notifyRemote({predecessor: this.nodeDetails});
        }catch(e){
            console.log("Error during node stabilize: ", e);
        }
    }

    async notify(refNode:NodeDetails): Promise<void> {
        try{
            let lastPredecessorId = this.predecessor?.id;
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Notify called with refNode  ${constructNodeStr(refNode)}`);
            if(!this.predecessor || (isIdInBetween(this.predecessor.id, this.nodeDetails.id, refNode.id))){
                this.predecessor = refNode;
                if(this.successors.length == 0 || this.successors[0] === this.nodeDetails){
                    this.successors[0] = refNode;
                }
                else if(lastPredecessorId !== this.predecessor.id) {
                    this.updateMap();
                }
            } 
        }catch(e){
            console.log("Error during node notify: ", e);
        }
    }

    async updateMap() {
        let toRemoveMap: Array< {key: number, val: string} > = [];
        for(let keyStr in this.localMap){
            let key = parseInt(keyStr);
            let val: string = this.localMap[key];
            if(key <= this.predecessor.id){
                toRemoveMap.push({key, val});
            }
        }

        let predecessorClient = getClient(this.predecessor.host, this.predecessor.port);
        await predecessorClient.copyMapRemote({toRemoveMap});

        toRemoveMap.forEach(({key, val}) => {
            delete this.localMap[key];
        });
    };

    async copyMap(copyMapData: Array< {key: number, val: string} >) {
        copyMapData.forEach(({key, val}) => {
            this.localMap[key] = val;
        });
    }

    async fixFingers(): Promise<void> {
        try{
            this.next = (this.next + 1) % HASH_NUM_OF_BITS;
            let nextId = (this.nodeDetails.id + (2 ** this.next)) % (2 ** HASH_NUM_OF_BITS);
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Fixing finger ${this.next}`);
            let fixedFinger = await this.findSuccessor(nextId);
            this.fingers[this.next] = fixedFinger ? fixedFinger : this.fingers[this.next];
            if(!fixedFinger){
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => Fixing finger ${this.next} returned null`);
            }
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finger ${this.next} set to ${constructNodeStr(this.fingers[this.next])}`);
        }catch(e){
            console.log("Error during fix fingers: ", e);
        }
    }

    findFingerTable(): { currNode: NodeDetails, fingers: NodeDetails[] } {
        return {
            currNode: this.nodeDetails,
            fingers: this.fingers
        };
    }

    findPredecessor(): NodeDetails {
        if(!this.predecessor){
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Returning predecessor null`);
            return this.predecessor;
        }

        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Returning predecessor ${constructNodeStr(this.predecessor)}`);
        return this.predecessor;
    }

    async put(key: number, val: string): Promise<{insertedAt: NodeDetails}> {
        console.log(`Node put request for key-val ${key + "-" + val}`);
        if(!key){
            return null;
        }
        key = key % (2 ** HASH_NUM_OF_BITS);
        try{
            if(key === this.nodeDetails.id 
                || (this.successors.length == 0 || this.successors[0] === this.nodeDetails)
                || isIdInBetween(this.predecessor.id, this.nodeDetails.id, key)){
                    this.localMap[key] = val;
                    console.log(`Node put request for key-val ${key + "-" + val} inserted in this node`);
                    return {insertedAt: this.nodeDetails};
            }

            let successor:NodeDetails = await this.findSuccessor(key);
            let successorClient = getClient(successor.host, successor.port);
            return await successorClient.putRemote({key, val});
        }catch(e){
            console.log(`Error during key value insertion: Key: ${key}, Val: ${val}`);
        }
    }

    async get(key: number): Promise< {val: number, retrievedFrom: NodeDetails} > {
        console.log(`Node queried for key ${key}. Locally found ${this.localMap[key]}`);
        if(!key){
            return {val: null, retrievedFrom: this.nodeDetails};
        }
        key = key % (2 ** HASH_NUM_OF_BITS);
        try{
            if(this.localMap[key]){
                return {val: this.localMap[key], retrievedFrom: this.nodeDetails};
            }
            if(key === this.nodeDetails.id 
                || (this.successors.length == 0 || this.successors[0] === this.nodeDetails)
                || isIdInBetween(this.predecessor.id, this.nodeDetails.id, key)){
                    return {val: null, retrievedFrom: this.nodeDetails};
            }

            let successor:NodeDetails = await this.findSuccessor(key);
            let successorClient = getClient(successor.host, successor.port);
            return await successorClient.getRemote({key});
        }catch(e){
            console.log(`Error during key value retrieval: Key: ${key}`);
        }
    }
}

export default ChordNode;