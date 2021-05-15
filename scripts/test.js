
async function dummy_API(){
    let data = [];
    setTimeout(function(){
        data = [100,120,130,140,130,120,150,170,120,100,90,80,70,60,70,80,30,20,15,20,30,20,50,40,30,60,70,80];
        return data;
    },2000)
}

async function reduceCarbonImpact(){
    try{
        //get from profile data
        let saving_procent = 50;
        saving_procent = saving_procent / 100;
        //forecasts data to collect
        let data = [100,120,130,140,130,120,150,170,120,100,90,80,70,60,70,80,30,20,15,20,30,20,50,40,30,60,70,80];
        //last datapoint, to be copied
        let data_now = 100;
        console.log(data);
        //i is hours here
        let output = [];
        for(let i = 0; i < data.length; i++){
            if(data_now > data[i] && data[i] < (data_now*saving_procent)){
                output.push(i);
                output.push(data[i]);
                output.push(saving_procent);
                break;
            }
        }
        console.log(`If you wait ${output[0]} hours, you can save ${(1-(output[1]/data_now))*100}% compared to the current carbon footprint per KWh, which achieves your goal of saving ${output[2]*100}%`);
    }catch(err){
        console.log();
    }finally{
        console.log("executed correctly");
    }
}

reduceCarbonImpact();