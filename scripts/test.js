const fetch = require("node-fetch");

async function monitorSolar() {
    try {
        // Fetch URI for solar data
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        let data = await fetch(URI).then((response) => response.json());

        // Create raw data arrays
        let dataTimestamp = [];
        let dataSolar = [];

        // Find sum of DK1 and DK2 and push to arrays
        for (let i = 0; i < data.result.records.length; i = i + 2) {
            dataTimestamp.push(data.result.records[i].Minutes5DK.slice(-8, -6));
            dataSolar.push(data.result.records[i].SolarPower + data.result.records[i + 1].SolarPower);
        }

        // Create daytime solar energy array
        let dayTimeSolar = [];

        // "13" -> 13
        // Push solar data points to array is timestamp is between 22:00 -> 05:00
        for (let j = 0; j < dataTimestamp.length; j++) {
            if (parseInt(dataTimestamp[j].slice(-8, -6)) > 05 && parseInt(dataTimestamp[j]) < 21) {
                dayTimeSolar.push(dataSolar[j]);
                //console.log(`${dataTimestamp[j]} -> Solar: ${dataSolar[j]}`); // TEST
            }
        }

        // Sum all daytime solar data points
        let sum = 0;
        dayTimeSolar.forEach(dataPoint => {
            sum += dataPoint
        });

        // Find Average of daytime solar datapoints
        let average = sum / dayTimeSolar.length;
        console.log(`Average solar prod: ${average}`); // TEST

        // Compare current energy prod, with average
        if (dataSolar[0] >= average) {
            console.log(`Current: ${dataSolar[0]} is smaller than average: ${average}`); // TEST
        } 
        
    } catch (e) {
        console.error(e);
    }
}

monitorSolar();