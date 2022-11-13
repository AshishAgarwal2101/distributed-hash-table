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
    constructor(host: string, port: number){
        super(host, port);
    }

    getServer(): grpc.Server {
        let server = new grpc.Server();
        server.addService(routeguide.RouteGuide.service, {
            dummyRemote: this.dummyRemote.bind(this),
            getSuccessorRemote: this.getSuccessorRemote.bind(this)
        });
    
        return server;
    };

    startServer(): void {
        let server = this.getServer();
        server.bind(`localhost:${this.nodeDetails.port}`, grpc.ServerCredentials.createInsecure());
        server.start();
        console.log(`Server started at ${this.nodeDetails.host}:${this.nodeDetails.port}`)
    }

    dummyRemote(call, callback) {
        callback(null, {dummyKey: "This is a dummy response for " + call.request.id});
    };
    
    getSuccessorRemote(call, callback) {
        callback(null, {id: 2, host: "http://abc.com", port: 4040});
    };
}

export default RemoteServer;