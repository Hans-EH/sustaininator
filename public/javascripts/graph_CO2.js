async function CO2Data() {
    try {
        //datapoints on 1 day
        const DATADAY = (60 * 24) / 5;


        let percentileSaved = 100 - "{{profile_data.sustainable_goals}}";
        //a function that creates the percentile line using preexisting moving average and a percentile.
        function createPercentileLine(p, inputData) {
            //percentile to calculate to.
            //p = Math.ceil(100 / p);
            inputData.sort(compareNumbers);
            //calculating percentile
            let percentileNr = Math.floor((inputData.length / 100) * p);
            //new dataline to be filled for use as a graph.
            let newDataLine = [];
            console.log(
                100 -
                p +
                "% saving, nr: " +
                percentileNr +
                ", value: " +
                inputData[percentileNr]
            );
            //duplicate the result to every datapoint through the day
            //in order for it to be plottet nicely
            for (let i = 0; i < DATADAY; i++) {
                newDataLine[i] = inputData[percentileNr];
            }
            return newDataLine;
        }

        //comparenumbers function, to be used with sort.
        function compareNumbers(a, b) {
            return a - b;
        }

        let loading = document.getElementById("loading-CO2");
        loading.style.display = "inline-block";
        let carbon_30 = await fetch("{{ carbon_30 }}").then((response) => response.json());
        let carbon_7 = await fetch("{{ carbon_7 }}").then((response) => response.json());
        let carbon_3 = await fetch("{{ carbon_3 }}").then((response) => response.json());
        let carbon_1 = await fetch("{{ carbon_1 }}").then((response) => response.json());
        let carbon_labels = await fetch("{{ carbon_labels }}").then((response) => response.json());

        var ctx = document.getElementById("chartCO2").getContext("2d");
        var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: "line",
            data: {
                labels: carbon_labels.slice(
                    carbon_labels.length - DATADAY,
                    carbon_labels.length
                ),
                datasets: [
                    {
                        label: "CO2 Emission last 24 hours",
                        borderColor: "rgb(0, 255, 0)",
                        fill: false,
                        data: carbon_1.slice(0, DATADAY),
                        yAxisID: 'y',
                    },
                    {
                        label:
                            "CO2 Emission 3 days running average",
                        borderColor: "rgb(255, 255, 0)",
                        fill: false,
                        data: carbon_3.slice(0, DATADAY),
                        hidden: true,
                        yAxisID: 'y',
                    },
                    {
                        label:
                            "CO2 Emission 7 days running average",
                        borderColor: "rgb(255, 153, 0)",
                        fill: false,
                        data: carbon_7.slice(0, DATADAY),
                        hidden: true,
                        yAxisID: 'y',
                    },
                    {
                        label:
                            "CO2 Emission 30 days running average",
                        borderColor: "rgb(255, 0, 0)",
                        fill: false,
                        data: carbon_30.slice(0, DATADAY),
                        yAxisID: 'y',

                    },
                    {
                        label:
                            "Saving " +
                            (100 - percentileSaved) +
                            "% of CO2 when the green line is under the black line (based upon red line minima and maxima).",
                        borderColor: "rgb(0, 0, 0)",
                        fill: false,
                        data: createPercentileLine(
                            percentileSaved,
                            carbon_30
                        ).slice(0, DATADAY),
                        steppedLine: true,
                        yAxisID: 'y',
                    },
                ],
            },
            // Configuration options go here
            options: {
                scales: {
                    yAxes: [{
                        id: 'y',
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'g / kWh',
                        },
                    }]

                },
                elements: {
                    point: {
                        radius: 0,
                        hitRadius: 10,
                        hoverRadius: 10,
                    },
                },
            },
        });
        loading.style.display = "none";
    } catch {
        console.log("CO2 emission graph not working");
    }
}