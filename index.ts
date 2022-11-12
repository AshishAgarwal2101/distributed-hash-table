import { HASH_NUM_OF_BITS } from "./util/Constants";
import { getHash } from "./util/Util";


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
    successors: Array<NodeDetails> = [];
    predecessor: NodeDetails = NULL_NODE_DETAILS;
    fingers: Array<NodeDetails> = [];

    constructor(host: string, port: number){
        this.nodeDetails = {
            id: getHash(`$host:$port`),
            host: host,
            port: port
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

    async findSuccessorRemote(id: number, closestPrecedingNode: NodeDetails): Promise<NodeDetails> {
        return null;
    }

    async closestPrecedingNode(id: number): Promise<NodeDetails> {
        for(let i=this.fingers.length-1; i>=0; i--){
            let fingerId = this.fingers[i].id;
            if(fingerId > this.nodeDetails.id && fingerId < id){
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