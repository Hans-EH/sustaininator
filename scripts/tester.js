const ONE_HOUR = 3600000;

setInterval(() => {
    // Fetched from db
    let advice_created = new Date("Wed May 12 2021 14:35:00 GMT+0200 (GMT+02:00)");

    if ((new Date() - advice_created) > ONE_HOUR) {
        console.log(`Yes : ${new Date() - advice_created}`);
    }
}, 1000);



