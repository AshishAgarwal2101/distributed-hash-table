import { HASH_NUM_OF_BITS } from "../util/Constants";
import { getHash } from "../util/Util";
import { getClient } from "../remote/RemoteClient";


interface NodeDetails {
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
    successors: Array<NodeDetails> = [{id: 1120, host: "localhost", port: 4009}];
    predecessor: NodeDetails = NULL_NODE_DETAILS;
    fingers: Array<NodeDetails> = [{id: 1050, host: "localhost", port: 4003}];

    constructor(host: string, port: number){
        this.nodeDetails = {
            //id: 1000,
            id: getHash(`$host:$port`,0,0),
            host: host,
            port: port
        }

       
    }

    getHash(str: String,counter : number,hash : number){
        while(true){
            if (str.length === 0) return hash;
            
            for (let i = 0; i < str.length; i++) 
            {
                let chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            let hashId=hash% Math.pow(2, HASH_NUM_OF_BITS)
            if (this.successors[0].id==hashId){
                let newString=str+("" +(counter++))
                getHash(newString,counter++,0) 
            }
            else{
                return hashId
            }
        }

    }

    isItMyNode(nodeDetails: NodeDetails): boolean {
        if(nodeDetails.id == this.nodeDetails.id) return true;
        return false;
    }

    async findSuccessor(id: number): Promise<NodeDetails> {
        if(id > this.nodeDetails.id && this.successors.length > 0 && id < this.successors[0].id){
            return this.successors[0];
        }

        let closestPrecedingNodeForId = await this.closestPrecedingNode(id);
        return await this.findSuccessorRemote(id, closestPrecedingNodeForId);
    }

    async join(refNode:NodeDetails): Promise<void> {

        this.predecessor = null;
        this.successors[0]= await this.findSuccessorRemote(this.nodeDetails.id,refNode);
    }

    async findSuccessorRemote(id: number, closestPrecedingNode: NodeDetails): Promise<NodeDetails> {
        try {
            let closestPrecedingClient = getClient(closestPrecedingNode.host, closestPrecedingNode.port);
            let succ = await closestPrecedingClient.getSuccessorRemote({id});
            console.log(`Found successor with ${succ.id} ${succ.host}:${succ.port}`);
            return succ;
        } catch(error) {
            console.error(`Error while trying to find successor from remote node ${closestPrecedingNode.id}`);
        }
    }

    async stabilize(): Promise<void> {
        if (this.successors.length==0){
            return;
        }
        
        let successorClient= getClient(this.successors[0].host,this.successors[0].port);
        successorClient.notifyRemote({predecessor: this.nodeDetails});
    }

    async notify(refNode:NodeDetails): Promise<void> {

        if (this.predecessor==null || (refNode.id<this.nodeDetails.id && refNode.id > this.predecessor.id)){
            this.predecessor=refNode;
        } 

    }

    async closestPrecedingNode(id: number): Promise<NodeDetails> {
        for(let i=this.fingers.length-1; i>=0; i--){
            let fingerId = this.fingers[i].id;
            if(fingerId > this.nodeDetails.id && fingerId < id){
                console.log(`Returning Finger ${this.fingers[i].host}:${this.fingers[i].port}`);
                return this.fingers[i];
            }
        }
        return this.nodeDetails;
    }

    async joinCluster(): Promise<void> {
        let bitSize = HASH_NUM_OF_BITS;
    };
}

export default ChordNode;