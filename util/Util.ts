//import { HASH_NUM_OF_BITS } from "./Constants";

// export const getHash = (str: string): number => {
//     let counter = 0;
//     while(true){
//         let hashId = hash(str+(counter++)) % Math.pow(2, HASH_NUM_OF_BITS);
//         let successorNode = findSuccessor(hashId);
//         if(successorNode.nodeDetails.id !== hashId){
//             return hashId;
//         }
//     }

//     return 2;
// };

const hash = (str:String): number => {
    var hash = 0
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      let chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  
  const str = 'localhost:4000'
  console.log(str, hash(str))