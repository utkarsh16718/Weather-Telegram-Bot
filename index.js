const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const botToken = "6400661048:AAGMthXyUnKy-_2ZaMrtCaoTmdNiUFtKA5o";
const bot = new TelegramBot(botToken, { polling: true });


const apiKey = '552bb55b7421bb2125e669b948ae3839';
const subscribedUsers = new Set();

require("dotenv").config();

const cors = require("cors");
const passport = require("passport");
const authRoute = require("./routes/auth");
const cookieSession = require("cookie-session");
const passportStrategy = require("./passport");



const getDailyWeather = async (city) => {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
        );

        const weatherDescription = response.data.weather[0].description;
        const temperature = (response.data.main.temp - 273.15).toFixed(2);

        return `Today's weather in ${city}: ${weatherDescription}, Temperature: ${temperature}°C`;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        throw error;
    }
};


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(msg)
    bot.sendMessage(chatId, `Welcome ${msg.chat.first_name} to the Weather Bot! Use /subscribe to receive daily weather updates.`);
});


bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;
    subscribedUsers.add(chatId);
    bot.sendMessage(chatId, 'Subscribed for daily weather updates!');
});


bot.onText(/\/unsubscribe/, (msg) => {
    const chatId = msg.chat.id;
    subscribedUsers.delete(chatId);
    bot.sendMessage(chatId, 'Unsubscribed from daily weather updates.');
});


bot.onText(/\/weather (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const city = match[1];

    if (subscribedUsers.has(chatId)) {
        try {
            const weather = await getDailyWeather(city);
            bot.sendMessage(chatId, ` ${msg.chat.first_name} ${weather}`);
        } catch (error) {
            bot.sendMessage(chatId, 'Could not fetch weather data. Please try again later.');
        }
    } else {
        bot.sendMessage(chatId, 'You need to subscribe first to receive daily weather updates. Use /subscribe.');

    }

});
bot.onText(/\/echo (.+)/, (msg, match) => {
  
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    console.log(match)

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
    // console.log(chatId, msg);
});


app.use(express.json());
// app.post(`/bot${botToken}`, (req, res) => {
//     bot.handleUpdate(req.body, res);
//     console.log(req.body, res);
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });


app.use(
    cookieSession({
        name: "session",
        keys: ["utkarsh"],
        maxAge: 24 * 60 * 60 * 100,
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: "*",
       
    })
);

app.use("/auth", authRoute);
app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = 8000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
