const fs = require('fs');
const path = require('path');
const moment = require('moment');
const database = require('./database');
const business = require('../business/main');


const private = {
    async todaysDataWasFetched(dataCollection) {
        const today = moment();

        const data = await dataCollection.findOne({
            $and: [
                { "date": { $gte: today.set('hours', 0).set('minutes', 0).set('seconds', 0).toDate() } },
                { "date": { $lt: today.set('hours', 23).set('minutes', 59).set('seconds', 59).toDate() } }
            ]
        });

        return data != null;
    },

    async shouldFetchData(fetchCollection) {
        const lastChecked = await fetchCollection.find().sort({ date: -1 }).limit(1).toArray();

        if (lastChecked.length == 0)
            return true;
            
        // Fetch once each 30 minutes
        const minutesSinceLastFetch = moment().diff(lastChecked[0].date, 'minutes');

        return minutesSinceLastFetch > 30;
    },

    async processData({ dataCollection, fetchCollection }) {
        const covidData = await business(dataCollection);

        if (covidData.length > 0)
            await dataCollection.insertMany(covidData);

        await fetchCollection.insertOne({
            date: new Date
        });
    }
};

const controller = {
    async index(req, res) {
        try {
            const html = fs.readFileSync(path.join(__dirname, './render.html')).toString();

            res.send(html);
        } catch (error) {
            console.error(error);
            res.send("Ocorreu uma falha ao gerar o gráfico");
        }
    },

    async covidData(req, res) {
        try {
            const db = await database();

            const fetchCollection = db.collection('fetch');
            const dataCollection = db.collection('data');

            const todaysDataWasFetched = await private.todaysDataWasFetched(dataCollection);
            if (!todaysDataWasFetched) {
                console.log('Get last time that was fetched');

                const shouldFetchData = await private.shouldFetchData(fetchCollection);

                if (shouldFetchData) {
                    console.log('Fetch data');
                    await private.processData({ dataCollection, fetchCollection });
                }
            }

            const covidData = await dataCollection.find().sort({ date: 1 }).toArray();

            res.json({
                status: true,
                data: covidData.map(data => ({
                    UTIHospitalRegional: data.UTIHospitalRegional,
                    UTIPrivada: data.UTIPrivada,
                    UTIPublica: data.UTIPublica,
                    UTIUnimed: data.UTIUnimed,
                    date: data.date
                }))
            });
        } catch (error) {
            console.error(error);
            res.json({
                status: false
            });
        }
    },

    notFound(req, res) {
        res.send("404 - Página não encontrada");
    }
};

module.exports = controller;