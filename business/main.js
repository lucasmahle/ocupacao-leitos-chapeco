const path = require('path');
const Scraper = require('./scraper');
const Reader = require('./reader');

const main = async (dataCollection) => {
    const scraper = new Scraper();

    scraper.setEndpoint('https://www.chapeco.sc.gov.br');
    scraper.setPdfsUrl('/documentos/67/documentoCategoria');
    scraper.setDestination(path.resolve(__dirname, './files'));

    await scraper.fetchPageContent();

    scraper.findNodes('.listagem-documentos li a');
    scraper.filterByExtension('pdf');

    scraper.shouldProcessedHandle(async fileName => {
        const hasDataForThisDay = await dataCollection.countDocuments({ file: fileName })

        return hasDataForThisDay == 0;
    });

    await scraper.downloadFiles();

    const files = scraper.getFiles();
    
    const readerPromisses = files.map(async (file) => {
        const reader = new Reader(file);

        await reader.parseContent();

        const publicITUValue = reader.getPublicITUValue();
        const privateITUValue = reader.getPrivateITUValue();
        const RHITUValue = reader.getRHITUValue();
        const UnimedITUValue = reader.getUnimedITUValue();
        const date = reader.getDate();

        return {
            UTIPublica: publicITUValue,
            UTIPrivada: privateITUValue,
            UTIHospitalRegional: RHITUValue,
            UTIUnimed: UnimedITUValue,
            date,
            file: path.basename(file)
        };
    });

    const output = await Promise.all(readerPromisses);
    
    return output;
};

module.exports = main;