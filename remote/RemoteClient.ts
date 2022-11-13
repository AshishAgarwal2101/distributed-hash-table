import grpcCaller from "grpc-caller";

let PROTO_PATH = __dirname + '/protos/route_guide.proto';

export const getClient = (host, port) => {
    return grpcCaller(host + ":" + port, PROTO_PATH, "RouteGuide");
};
