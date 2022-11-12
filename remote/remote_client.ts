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

const getClient = () => {
    return new routeguide.RouteGuide('localhost:50051', grpc.credentials.createInsecure());
};

let routeClient = getClient();

const dummyRemoteClient = (callback) => {
    const dummyCallback = (error, dummyResponse) => {
        if(error){
            callback(error);
            return;
        }
        console.log("Dummy Response: ", dummyResponse);
    };
    routeClient.dummyRemote({id: 123}, dummyCallback);
};


dummyRemoteClient((error) => console.log("Got error: ", error));

routeClient.getSuccessorRemote({id: 2, nodeDetails: {id: 5, host: "http://fkf.vfvokd", port: 44}}, (error, response) => {
    console.log("Successor Response: ", response);
});

exports.dummyRemoteClient = dummyRemoteClient;