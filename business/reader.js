const pdfParser = require('pdf-parse');
const fs = require('fs');

module.exports = class Reader {
    constructor(filePath) {
        this.filePath = filePath;
        this.content = null;
        this.text = null;
        this.PDFcontent = null;

        this._loadFileContent();
    }

    _loadFileContent() {
        this.PDFcontent = fs.readFileSync(this.filePath);
    }

    _getMonthNumberByDescription(month) {
        switch (month.substr(0, 3)) {
            case 'jan': return 0;
            case 'fev': return 1;
            case 'mar': return 2;
            case 'abr': return 3;
            case 'mai': return 4;
            case 'jun': return 5;
            case 'jul': return 6;
            case 'ago': return 7;
            case 'set': return 8;
            case 'out': return 9;
            case 'nov': return 10;
            case 'dez': return 11;
        }
    }

    async parseContent() {
        this.content = await pdfParser(this.PDFcontent);
        this.text = this.content.text;
    }

    getPublicITUValue() {
        try {
            const matches = /LEITOS UTI PÚBLICO(?:[\s])?([0-9]+)/.exec(this.text);
            return parseInt(matches[1]);
        } catch (error) {
            console.log(this.filePath);
            console.log(this.text);
            console.error(error);
        }
    }

    getPrivateITUValue() {
        try {
            const matches = /LEITOS UTI PRIVADO(?:[\s])?([0-9]+)/.exec(this.text);
            return parseInt(matches[1]);
        } catch (error) {
            console.log(this.filePath);
            console.log(this.text);
            console.error(error);
        }
    }

    getRHITUValue() {
        try {
            const matches = /LEITOS UTI \(HRO\)(?:[\s])?([0-9]+)/.exec(this.text);
            return parseInt(matches[1]);
        } catch (error) {
            console.log(this.filePath);
            console.log(this.text);
            console.error(error);
        }
    }

    getUnimedITUValue() {
        try {
            const matches = /LEITOS UTI \(UNIMED\)(?:[\s])?([0-9]+)/.exec(this.text);
            return parseInt(matches[1]);
        } catch (error) {
            console.log(this.filePath);
            console.log(this.text);
            console.error(error);
        }
    }

    getDate() {
        try {
            const matches = /Chapecó,(?:[\s]+)?([0-9]+)(?:[\s]+)?de(?:[\s]+)?([a-z]+)(?:[\s]+)?de(?:[\s]+)?([0-9]+)/.exec(this.text);
            const day = matches[1];
            const month = matches[2];
            const year = matches[3];
            return new Date(year, this._getMonthNumberByDescription(month), day, 12, 0, 0);
        } catch (error) {
            console.log(this.filePath);
            console.log(this.text);
            console.error(error);
        }
    }
}