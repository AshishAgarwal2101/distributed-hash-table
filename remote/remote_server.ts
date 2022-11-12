let grpc = require('@grpc/grpc-js');
let protoLoader = require('@grpc/proto-loader');

let PROTO_PATH = __dirname + '/protos/route_guide.proto';
let packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
let protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
let routeguide = protoDescriptor.chord;

const dummyRemote = (call, callback) => {
    callback(null, {dummyKey: "This is a dummy response for " + call.request.id});
};

const getSuccessorRemote = (call, callback) => {
    callback(null, {id: 2, host: "http://abc.com", port: 4040});
};

const getServer = () => {
    let server = new grpc.Server();
    server.addService(routeguide.RouteGuide.service, {
        dummyRemote,
        getSuccessorRemote
    });

    return server;
};

let routeServer = getServer();
routeServer.bindAsync("localhost:50051", grpc.ServerCredentials.createInsecure(), () => {
    routeServer.start();
    console.log("Started Server at port " + 50051);
});

exports.dummyRemote = dummyRemote;
exports.getSuccessorRemote = getSuccessorRemote;