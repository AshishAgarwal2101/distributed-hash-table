import RemoteServer from "./remote/RemoteServer";

async function main() {
    console.log(`Length of Arguments: ${process.argv.length}`);

    let host = process.argv[2];
    let port = Number(process.argv[3]);
    let refNodeHost = null;
    let refNodePort = null;
    let hashId = null;
    if(process.argv.length > 4){
        refNodeHost = process.argv[4];
        refNodePort = Number(process.argv[5]);
    }
    if(process.argv.length > 6){
        hashId = Number(process.argv[6]);
    }
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`RefNode Host: ${refNodeHost}`);
    console.log(`RefNode Port: ${refNodePort}`);

    let server = new RemoteServer(host, port, hashId);
    server.startServer(refNodeHost, refNodePort);
}

main();