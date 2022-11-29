import grpcCaller from "grpc-caller";

let PROTO_PATH = __dirname + '/protos/route_guide.proto';

export const getClient = (host, port) => {
    try{
        let client = grpcCaller(host + ":" + port, PROTO_PATH, "RouteGuide");
        return client;
    } catch(e) {
        console.log(`Failed to connect to client with ${host} and ${port}`);
        throw e;
    }
};