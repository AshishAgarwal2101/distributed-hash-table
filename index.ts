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

    constructor(host, port){
        this.nodeDetails = {
            id: getHash(`$host:$port`),
            host: host,
            port: port
        }
    }

    isItMyNode(nodeDetails: NodeDetails) : boolean {
        if(nodeDetails.id == this.nodeDetails.id) return true;
        return false;
    }
    
    async joinCluster() : Promise<void> {
        let bitSize = HASH_NUM_OF_BITS;
    };
}

export default ChordNode;