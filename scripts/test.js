const fetch = require("node-fetch");
require("dotenv").config();


async function monitorSolar() {
    try {
        // Fetch all the good shit
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        let data = await fetch(URI).then((response) => response.json());

        let dataTimestamp = [];
        let dataSolar = [];

        for (let i = 0; i < data.result.records.length; i = i + 2) {
            dataTimestamp.push(data.result.records[i].Minutes5DK.slice(-8, -6));
            dataSolar.push(data.result.records[i].SolarPower + data.result.records[i + 1].SolarPower);
        }


        let dayTimeSolar = [];
        for (let j = 0; dataTimestamp.length; j++) {
            if (parseInt(dataTimestamp[j]) > 05 || parseInt(dataTimestamp[j] < 22)) {
                //console.log(dataTimestamp[j]);
                dayTimeSolar.push(dataSolar[j]);
            }
        }


        console.log(dataSolar[0]);
        console.log(sum);


        console.log
    } catch {
        console.error(error);
    }
}

monitorSolar();