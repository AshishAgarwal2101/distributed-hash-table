import RemoteServer from "./remote/RemoteServer";

async function main() {
    console.log(`Length of Arguments: ${process.argv.length}`);

    let host = process.argv[2];
    let port = Number(process.argv[3]);
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);

    let server = new RemoteServer(host, port);
    server.startServer();
    let successorResponse = await server.findSuccessor(1100);

    console.log("Response: ", successorResponse);
}

main();