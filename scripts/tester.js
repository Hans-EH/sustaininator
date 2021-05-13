/* const ONE_HOUR = 3600000;

setInterval(() => {
    // Fetched from db
    let advice_created = new Date("Wed May 12 2021 14:35:00 GMT+0200 (GMT+02:00)");

    if ((new Date() - advice_created) > ONE_HOUR) {
        console.log(`Yes : ${new Date() - advice_created}`);
    }
}, 1000); */

var assert = require('assert');

let i = 9;
try{
  assert(!(i%2));
}
catch (e) { console.log(e)}


async function testAsync(){
  return new Promise((resolve,reject)=>{
      //here our function should be implemented 
      setTimeout(()=>{
        console.log("Hello 111 from inside the testAsync function");
        //resolve("SUCC");
        console.log("Hello 333 from inside the testAsync function");
        reject("ERR");
      } , 2000);
  });
}

function testAsync2(){
  return new Promise((resolve,reject)=>{
      //here our function should be implemented 
      setTimeout(()=>{
        console.log("Hello 444 from inside the testAsync function");
        resolve(console.log("Hello 555 inside the testAsync function"));
        console.log("Hello 666 from inside the testAsync function");
        //reject();
      } , 2000);
  });
}

async function callerFun(){
  try{
    console.log("Caller");
    await testAsync();
  }
  catch(e){
    console.log(e);
  }
  try{
    console.log("After waiting");
    console.log("Caller 2");
    await testAsync2();
    console.log("After MORE waiting");
  }
  catch(e){
    console.log(e);
  }
}

callerFun();

