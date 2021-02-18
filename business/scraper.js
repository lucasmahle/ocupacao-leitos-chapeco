const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

module.exports = class Scraper {
    constructor() {
        this.endpoint = null;
        this.urlpdfs = null;
        this.selector = null;
        this.extension = null;
        this.destination = null;
        this.fileProcessedHandler = null;
        this.$ = null;
        this.fileList = [];
        this.downloadedFiles = [];
    }

    setEndpoint(endpoint) {
        this.endpoint = endpoint;
    }

    setPdfsUrl(urlpdfs) {
        this.urlpdfs = urlpdfs;
    }

    setDestination(destination) {
        this.destination = destination;
        if(!fs.existsSync(this.destination)){
            fs.mkdirSync(this.destination);
        }
    }

    shouldProcessedHandle(callback) {
        this.fileProcessedHandler = callback;
    }

    findNodes(selector) {
        if (this.$ == null) throw new Error('Page was not fetched');
        this.selector = selector;
        this.nodes = this.$(this.selector);


        this.nodes.each((i, a) => {
            const $this = this.$(a);
            this.fileList.push({
                name: $this.text(),
                url: $this.attr('href')
            });
        });
    }

    filterByExtension(extension) {
        this.fileList = this.fileList.filter((file) => {
            const { name } = file;
            const fileExtension = name.split('.').pop();

            return fileExtension.toLowerCase() == extension.toLowerCase();
        });
    }

    async fetchPageContent() {
        const response = await axios.default({
            url: this.endpoint + this.urlpdfs,
        });

        this.$ = cheerio.load(response.data);
    }

    async downloadFiles() {
        const downloadPromisses = this.fileList.map(async (file) => {
            const date = file.name.trim().substr(0, 8);
            const fileName = `${date}.pdf`;
            const filePath = path.join(this.destination, fileName);

            const shouldDownloadFile = await this.fileProcessedHandler(fileName);
            
            if (this.fileProcessedHandler == null || !shouldDownloadFile)
                return null;

            console.log('Downloading: ' + fileName);

            const response = await axios.default({
                url: this.endpoint + '/' + file.url,
                responseType: 'stream'
            });

            if(response.headers['content-type'] != 'application/pdf'){
                console.error(`${fileName} is not a PDF file!`);
                return null;
            }

            const stream = fs.createWriteStream(filePath);

            response.data.pipe(stream);

            const pdfContent = await (new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    stream.close();
                    resolve(filePath);
                });
                stream.on('error', (e) => {
                    console.error(e);
                    resolve(null);
                });
            }));

            return pdfContent;
        });

        this.downloadedFiles = (await Promise.all(downloadPromisses)).filter(file => file != null);
    }

    getFiles() {
        return this.downloadedFiles;
    }
}