
const fetch = require("node-fetch");
var mongoose = require("mongoose");
const AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const { waterfall } = require("async");
const ONE_HOUR = 3600000;
const SOLAR_GRADE = 1;
const WIND_GRADE = 2;


let mongoDB = "mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const findAndLogAdviceOne = async (GRADE) => {
    var advice_card = await findAdvice(GRADE);
    console.log("Second Call");
    console.log(advice_card);

    return advice_card;
}

const findAndLogAdviceTwo = async (GRADE) => {
    var advice_card = await findAndLogAdviceOne(GRADE);
    console.log("Third Call");
    console.log(advice_card);
}

const findAdvice = (GRADE) => {
    return AdviceCard.findOne({ grade: GRADE })
        .exec()
        .then((card) => {
            console.log("First call");
            console.log(card);
            return card;
        })
        .catch((err) => {
            return err;
        });
};

//findAndLogAdviceTwo(SOLAR_GRADE);

// TEsting on save


// Monitor Solar 
const SaveAndLogAdviceOne = async (GRADE) => {
    let pctIncrease = 12;
    var advice_card = await saveAdvice(pctIncrease, GRADE);
    console.log("First Call:");
    console.log(advice_card);

    return advice_card;
}


// Monitor Wind
const SaveAndLogAdviceTwo = async (GRADE) => {
    let pctIncrease = 15;
    var advice_card = await saveAdvice(pctIncrease, GRADE);
    console.log("Second Call:");
    console.log(advice_card);

    return advice_card;
}

// Monitor CallStack
const eventCallStack = async () => {
    var advice_card_one = await SaveAndLogAdviceOne(SOLAR_GRADE);
    var advice_card_two = await SaveAndLogAdviceTwo(WIND_GRADE);
    console.log("Third Call");
    console.log(advice_card_one);
    console.log(advice_card_two);

    UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
        console.log(user_profiles);
    });
}


// Create Advice
const saveAdvice = (pctIncrease, GRADE) => {
    advice_card = new AdviceCard({
        class: "event",
        grade: GRADE,
        title: "The Sun is out!",
        message: `Heyooo, sun's out guns out.. ${pctIncrease}% increased solar energy production at the moment, enjoy the clean energy`
    })

    return advice_card.save()
        .then((new_card) => {
            console.log("On save\n");
            console.log(new_card);
            return new_card;
        })
        .catch((err) => {
            return err;
        });
};


eventCallStack();
