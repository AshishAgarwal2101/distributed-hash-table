import path from "path";
import { HASH_NUM_OF_BITS } from "../util/Constants";
import { getHash, fingerMath } from "../util/Util";
import { getClient } from "../remote/RemoteClient";
const PROTO_PATH = path.resolve(__dirname, "../remote/protos/route_guide.proto");

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

interface FingerTable {
  start: number;
  successor: NodeDetails;
}

class ChordNode {
    id: number;
    host: string;
    port: number;
    nodeDetails: NodeDetails;
    successors: Array<NodeDetails> = [];
    predecessor: NodeDetails = NULL_NODE_DETAILS;
    fingers: Array<NodeDetails> = [{id: 1050, host: "localhost", port: 4002}];
    fingerTable: Array<FingerTable> = [
    {
      start: null,
      successor: NULL_NODE_DETAILS
    }
    ];
    fixFinger: number = 0;

    constructor(host: string, port: number){
        this.nodeDetails = {
            id: 1000,
            //id: getHash(`$host:$port`),
            host: host,
            port: port
        }
    }

    mySelf(): NodeDetails {
        return {
          id: this.id,
          host: this.host,
          port: this.port
        };
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
        try {
            let closestPrecedingClient = getClient(closestPrecedingNode.host, closestPrecedingNode.port);
            let succ = await closestPrecedingClient.getSuccessorRemote({id});
            console.log(`Found successor with ${succ.id} ${succ.host}:${succ.port}`);
            return succ;
        } catch(error) {
            console.error(`Error while trying to find successor from remote node ${closestPrecedingNode.id}`);
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

    async findPredecessor(id: number) {
        // n' = n;
        let nPrime = this.mySelf();
        let nPSuccessor = await this.getSuccessor(nPrime);
        // (maximum chord nodes = 2^m) * (length of finger table = m)
        let counter = 2 ** HASH_NUM_OF_BITS * HASH_NUM_OF_BITS;

        while (!(fingerMath(id, nPrime.id, false, nPSuccessor.id, true))
            && (nPrime.id !== nPSuccessor.id)
            && (counter >= 0)) {
            counter--;
            nPrime = await this.closestPrecedingNode(id);

            nPSuccessor = await this.getSuccessor(nPrime);
        }

        return nPrime;
    }

    async getSuccessor(nodeDetails: NodeDetails) {
        // get nSuccessor
        let nSuccessor = this.fingerTable[0].successor;
        return nSuccessor;
    }

    async join(knownNode: NodeDetails): Promise<void> {
        let bitSize = HASH_NUM_OF_BITS;
        this.fingerTable.pop();
        // initialize finger table with  values
        for (let i = 0; i < HASH_NUM_OF_BITS; i++) {
            this.fingerTable.push({
                start: (this.id + 2 ** i) % (2 ** HASH_NUM_OF_BITS),
                successor: this.mySelf()
            });
        }

        // if (n')
        if (knownNode && this.confirmExist(knownNode)) {
            await this.initFingerTable(knownNode);
            await this.updateOthers();
        } else {
            // this is the first node, initialize
            this.predecessor = this.mySelf();
        }
    }

    async confirmExist(knownNode: NodeDetails): Promise<boolean> {
      // @ts-ignore
        return !(this.mySelf() == knownNode.id);
    }

    async initFingerTable(nPrime: NodeDetails) {
        let nPrimeSuccessor = NULL_NODE_DETAILS;
        this.fingerTable[0].successor = nPrimeSuccessor;

        for (let i = 0; i < HASH_NUM_OF_BITS - 1; i++) {
          if (
            fingerMath(
              this.fingerTable[i + 1].start,
              this.id,
              true,
              this.fingerTable[i].successor.id,
              false
            )
          ) {
            this.fingerTable[i + 1].successor = this.fingerTable[i].successor;
          } else {
            try {
              this.fingerTable[i + 1].successor = await this.findSuccessor(this.fingerTable[i + 1].start);
            } catch (err) {
              console.log("initFingerTable: findSuccessor() failed with ", err);
            }
          }
        }
    }

    async updateFingerTable(message, callback) {
        const sNode = message.request.node;
        const index = message.request.index;

        // if ( s 'is in' [n, finger[i].node) )
        if (fingerMath(sNode.id, this.id, true, this.fingerTable[index].successor.id, false)) {
            // finger[i].node = s;
            this.fingerTable[index].successor = sNode;
            // p = predecessor;
            const pClient = callback(`localhost:${this.predecessor.port}`, PROTO_PATH, "Node");
            // p.update_finger_table(s, i);
            console.log(`lupdateFingerTable`);
            try {
                await pClient.updateFingerTable({ sNode, index });
            } catch (err) {
                console.error("Error updating the finger table ");
            }

            // TODO: Figure out how to determine if the above had an RC of 0
            callback(null, {});
        }

        // TODO: Figure out how to determine if the above had an RC of 0
        callback(null, {});
    }

    async updateOthers() {
        let pNode = NULL_NODE_DETAILS;
        let pNodeSearchID;
        let pNodeClient;
        // for i = 1 to m
        for (let i = 0; i < this.fingerTable.length; i++) {
            pNodeSearchID = (this.id - 2 ** i + 2 ** HASH_NUM_OF_BITS) % (2 ** HASH_NUM_OF_BITS);

            // p = find_predecessor(n - 2^(i - 1));
             try {
                 pNode = await this.findPredecessor(pNodeSearchID);
            } catch (err) {
            }

            // p.update_finger_table(n, i);
            if (this.id !== pNode.id) {
                pNodeClient = callback(`localhost:${pNode.port}`, PROTO_PATH, "Node");
                try {
                    await pNodeClient.updateFingerTable({ node: this.mySelf(), index: i });
                } catch (err) {
                    console.log("updateOthers: client.updateFingerTable error ", err);
                }
            }
        }
    }

    async fixNextFinger() {
        const i = Math.ceil(Math.random() * (HASH_NUM_OF_BITS - 1));

        this.fingerTable[i].successor = await this.findSuccessor(
          this.fingerTable[this.fixFinger].start
        );

        if (this.fixFinger < this.fingerTable.length - 1) {
            this.fixFinger++;
        } else {
            this.fixFinger = 0;
        }
    }
}

export default ChordNode;