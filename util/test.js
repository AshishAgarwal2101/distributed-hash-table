//This function is to just test different function. Ignore This


const hashes=[];
var hash = 0;
const getHash = (str,counter)  => {
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      let chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return (hash% Math.pow(2, 4))
    if (hashes.includes(hashId)){
      console.log(str+('' + counter))
      hash(str+String(counter),counter+1) % Math.pow(2, 4)
    }

  }
  
  
  const str = 'localhost:4000'
  console.log(str, getHash(str))

  const str2 = 'localhost:4034'
  console.log(str2, getHash(str2))

  const str3 = 'localhost:4032'
  console.log(str3, getHash(str3))

  const str4 = 'localhost:4033'
  console.log(str4, getHash(str4))

  const str5 = 'localhost:4036'
  console.log(str4, getHash(str4))

  const str6 = 'localhost:2035'
  console.log(str4, getHash(str4))

  const str7 = 'localhost:5067'
  console.log(str4, getHash(str4))
  