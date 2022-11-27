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
    //successors: Array<NodeDetails> = [{id: 1120, host: "localhost", port: 4009}];
    successors: Array<NodeDetails> = [];
    predecessor: NodeDetails = null;
    //fingers: Array<NodeDetails> = [{id: 1050, host: "localhost", port: 4003}];
    fingers: Array<NodeDetails> = [];
    // fingers: Array<NodeDetails> = [
    //     NULL_NODE_DETAILS
    // ];
    next: number = -1;

    constructor(host: string, port: number, hashId: number){
        console.log(`HashId 1 ==== ${hashId}`);
        console.log(`HashId 2 ==== ${(hashId ? hashId : 1)}`);
        this.nodeDetails = {
            id: (hashId ? hashId : 1),
            //id: getHash(`$host:$port`),
            host: host,
            port: port
        }
        
        this.isItMyNode = this.isItMyNode.bind(this);
        this.findSuccessor = this.findSuccessor.bind(this);
        this.findSuccessorRemote = this.findSuccessorRemote.bind(this);
        this.create = this.create.bind(this);
        this.join = this.join.bind(this);
        this.stabilize = this.stabilize.bind(this);
        this.notify = this.notify.bind(this);
        this.closestPrecedingNode = this.closestPrecedingNode.bind(this);
        this.fixFingers = this.fixFingers.bind(this);
        this.findFingerTable = this.findFingerTable.bind(this);

        setInterval(this.stabilize, 6000); //called every 6 seconds
    }

    isItMyNode(nodeDetails: NodeDetails): boolean {
        if(nodeDetails.id == this.nodeDetails.id) return true;
        return false;
    }

    async findSuccessor(id: number): Promise<NodeDetails> {
        if(this.successors.length > 0 && isIdInBetween(this.nodeDetails.id, this.successors[0].id, id)){
            return this.successors[0];
        }
        if(this.fingers.length == 0){
            return this.nodeDetails;
        }

        let closestPrecedingNodeForId = await this.closestPrecedingNode(id);
        return await this.findSuccessorRemote(id, closestPrecedingNodeForId);
    }

    async findSuccessorRemote(id: number, closestPrecedingNode: NodeDetails): Promise<NodeDetails> {
        try {
            let closestPrecedingClient = getClient(closestPrecedingNode.host, closestPrecedingNode.port);
            let succ = await closestPrecedingClient.getSuccessorRemote({id});
            console.log(`Node ${constructNodeStr(this.nodeDetails)} => Found successor ${constructNodeStr(succ)}`);
            return succ;
        } catch(error) {
            console.error(`Node ${constructNodeStr(this.nodeDetails)} => Error while trying to find successor from remote node ${constructNodeStr(closestPrecedingNode)}`);
        }
    }

    async closestPrecedingNode(id: number): Promise<NodeDetails> {
        for(let i=this.fingers.length-1; i>=0; i--){
            let fingerId = this.fingers[i].id;
            if(isIdInBetween(this.nodeDetails.id, id, fingerId)){
                console.log(`Node ${constructNodeStr(this.nodeDetails)} => Returning Finger ${this.fingers[i].host}:${this.fingers[i].port}`);
                return this.fingers[i];
            }
        }
        return this.nodeDetails;
    }

    async create(): Promise<void> {
        this.predecessor = null;
        this.successors[0] = this.nodeDetails;
        this.fingers = [];
        this.next =  -1;
        setInterval(this.fixFingers, 5000); //called every 5 seconds
    }

    async join(refNode:NodeDetails): Promise<void> {
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Node joining the cluster`);
        this.predecessor = null;
        this.successors[0] = await this.findSuccessorRemote(this.nodeDetails.id, refNode);
        this.fingers[0] = this.successors[0];
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Node's successor and first finger: ${constructNodeStr(this.successors[0])}`);
        this.next =  0;
        setInterval(this.fixFingers, 5000); //called every 5 seconds
    }

    async stabilize(): Promise<void> {
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Stabilize called`);
        if (this.successors.length == 0 || this.successors[0] === this.nodeDetails){
            return;
        }
        
        let successorClient = getClient(this.successors[0].host, this.successors[0].port);
        let succPredecessor: NodeDetails = await successorClient.getPredecessorRemote();
        if(succPredecessor && isIdInBetween(this.nodeDetails.id, this.successors[0].id, succPredecessor.id)){
            this.successors[0] = succPredecessor;
            successorClient = getClient(this.successors[0].host, this.successors[0].port);
        }
        successorClient.notifyRemote({predecessor: this.nodeDetails});
    }

    async notify(refNode:NodeDetails): Promise<void> {
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Notify called with refNode  ${constructNodeStr(refNode)}`);
        if(!this.predecessor || (isIdInBetween(this.predecessor.id, this.nodeDetails.id, refNode.id))){
            this.predecessor = refNode;
        } 
    }

    async fixFingers(): Promise<void> {
        this.next = (this.next + 1) % HASH_NUM_OF_BITS;
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Fixing finger ${this.next}`);
        let fixedFinger = await this.findSuccessor(this.nodeDetails.id + (2 ** this.next));
        this.fingers[this.next] = fixedFinger ? fixedFinger : this.fingers[this.next];
        console.log(`Node ${constructNodeStr(this.nodeDetails)} => Finger ${this.next} set to ${constructNodeStr(this.fingers[this.next])}`);
    }

    findFingerTable(): { currNode: NodeDetails, fingers: NodeDetails[] } {
        return {
            currNode: this.nodeDetails,
            fingers: this.fingers
        };
    }

    findPredecessor(): NodeDetails {
        return this.predecessor;
    }
}

export default ChordNode;