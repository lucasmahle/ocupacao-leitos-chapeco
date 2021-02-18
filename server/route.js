const controller = require('./controller');

const route = async app => {

    // controller.index({}, {send: () => {}});

    app.get('/', controller.index);

    app.get('/data', controller.covidData);

    app.all('*', controller.notFound);
};

module.exports = route;