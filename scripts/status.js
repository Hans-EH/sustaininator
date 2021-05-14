const user_profile = require("../models/user_profile")

const statusCheck = async () => {
    user_profile.findOne({ id: "3asfdjfjsdf" }).exec(function (err, user_profile) {
        // logik














        if (user_status > 80) {
            console.log("You are doing very good");
        } else if (user_status > 60) {
            console.log("You are doing good");
        } else if (user_status > 40) {
            console.log("You are doing okay");
        } else if (user_status > 20) {
            console.log("Your performance is bad");
        } else if (user_status > 0) {
            console.log("Your performance is very bad");
        }
    });
}