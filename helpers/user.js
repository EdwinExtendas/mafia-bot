//TODO: figure out how to get file out of here
const fs = require('fs');
const User = require('../models/user');
const Crime = require('../models/crime');
const Prison = require('../models/prison');
const Garage = require('../models/garage');
const mongoose = require('mongoose');

module.exports = {
    name: "user",
    async initUser(author, reset = false) {
        if (author.bot) return;

        let user_data = await User.findOne({id: author.id});

        if (user_data && !reset) return;

        if (reset) {
            await User.deleteOne({
                id: author.id
            });
        }


        const user = new User({
            _id: mongoose.Types.ObjectId(),
            username: author.username,
            id: author.id,
            cash: 0,
            exp: 0,
            health: 100
        });
        user.save();

        let now = new Date();
        const crime = new Crime({
            _id: mongoose.Types.ObjectId(),
            id: author.id,
            crime: now,
            crime_counter: 0,
            org_crime: now,
            org_crime_counter: 0,
            gta: now,
            gta_counter: 0
        });
        crime.save();

        const prison = new Prison({
            _id: mongoose.Types.ObjectId(),
            id: author.id,
            prison_time: now,
            escape_chance: true,
            breakouts: 0
        });
        prison.save();

        const garage = new Garage({
            _id: mongoose.Types.ObjectId(),
            id: crime.id,
            car_id: 0,
            name: '',
            image_path: '',
            damage: 0
        });

        garage.save();
        console.log(`Created user: ${author.id}`);
    },
    async increaseUserCash(user, cash) {
        await User.updateOne({
            id: user.id
        }, {$inc: {cash: cash} });
    },
    async updateUser(user){
        await User.updateOne({
            id: user.id
        }, user);
    },
    checkDeath(message, health, damage) {
        var new_health = health - damage;
        if (new_health <= 0) {
            message.channel.send("You have died... All your progress has reset.");
            return true;
        }
        return false;
    },
    getUserOutOfArray(users, user_id) {
        for (var i=0; i < users.length; i++) {
            if (users[i].id === user_id) {
                return users[i];
            }
        }
    },
    async getUserCrimePrison(author) {

        let result = await User.aggregate([
            {
                $match: {id: author.id}
            },
            {
                $lookup: {
                    from: "prisons",
                    localField: "id",
                    foreignField: "id",
                    as: "prison"
                }
            },
            {
                $unwind: "$prison"
            },
            {
                $lookup: {
                    from: "crimes",
                    localField: "id",
                    foreignField: "id",
                    as: "crime"
                }
            },
            {
                $unwind: "$crime"
            },
        ]);

        return result[0]
    }
}
