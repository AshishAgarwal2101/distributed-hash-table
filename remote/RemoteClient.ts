import grpcCaller from "grpc-caller";

let PROTO_PATH = __dirname + '/protos/route_guide.proto';

export const getClient = (host, port) => {
    // const client = connect({ host, port });
    try{
        let client = grpcCaller(host + ":" + port, PROTO_PATH, "RouteGuide", undefined, { "grpc.keepalive_time_ms": 10000, "grpc.keepalive_timeout_ms": 5000});
        return client;
    } catch(e) {
        console.log(`Failed to connect to client with ${host} and ${port}`);
        throw e;
    }
};