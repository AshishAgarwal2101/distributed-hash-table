import grpc from "grpc";
import { loadSync } from "@grpc/proto-loader";
import ChordNode from "../local/ChordNode";
import path from "path";

let PROTO_PATH = __dirname + '/protos/route_guide.proto';
let packageDefinition = loadSync(
    path.resolve(PROTO_PATH),
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
let protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
let routeguide: any = (grpc.loadPackageDefinition(packageDefinition)).chord;

class RemoteServer extends ChordNode {
    constructor(host: string, port: number, hashId: number){
        super(host, port, hashId);
    }

    getServer(): grpc.Server {
        let server = new grpc.Server();
        server.addService(routeguide.RouteGuide.service, {
            dummyRemote: this.dummyRemote.bind(this),
            getSuccessorRemote: this.getSuccessorRemote.bind(this),
            notifyRemote : this.notifyRemote.bind(this),
            getFingerTableRemote: this.getFingerTableRemote.bind(this),
            getPredecessorRemote: this.getPredecessorRemote.bind(this),
            putRemote: this.putRemote.bind(this),
            getRemote: this.getRemote.bind(this)
        });
    
        return server;
    };

    startServer(refNodeHost: string, refNodePort: number): void {
        let server = this.getServer();
        server.bind(`localhost:${this.nodeDetails.port}`, grpc.ServerCredentials.createInsecure());
        server.start();
        console.log(`Server started at ${this.nodeDetails.host}:${this.nodeDetails.port}`);

        if(refNodeHost && refNodePort) {
            this.join({id: null, host: refNodeHost, port: refNodePort});
        }
        else {
            this.create();
        }
    }

    dummyRemote(call, callback) {
        callback(null, {dummyKey: "This is a dummy response for " + call.request.id});
    };
    
    async getSuccessorRemote(call, callback) {
        let nodeDetails = await this.findSuccessor(call.request.id);
        callback(null, nodeDetails);
    };

    async notifyRemote(call,callback){
        await this.notify(call.request.predecessor);
    }

    async getFingerTableRemote(call, callback) {
        let fingerTable = this.findFingerTable();
        callback(null, fingerTable);
    }

    async getPredecessorRemote(call, callback) {
        let predecessor = this.findPredecessor();
        callback(null, {predecessor} );
    }

    async putRemote(call, callback) {
        let insertResult = await this.put(call.request.key, call.request.val);
        callback(null, insertResult);
    }

    async getRemote(call, callback) {
        let getResult = await this.get(call.request.key);
        callback(null, getResult);
    }
}

export default RemoteServer;