const fs = require('fs');
const jsonfile = require('jsonfile')
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

//config
const GENERATE_NEW_REPORT = true;
const OUTPUT_DIRECTORY_NAME = 'reports';
//All options: json, txt, html
//For this option GENERATE_NEW_REPORT should be true!!!
const OUTPUT_OPTION = 'txt';
//----------------------------------------------------------

const date = new Date();
const dirName = `${date.getHours()}H_${date.getMinutes()}M_${date.getDate()}D_${date.getMonth()}M_${date.getFullYear()}Y`.toLowerCase();
let index = 1;

const readFile = (filePath) => {
    return fs.readFileSync(filePath, 'utf8').split(process.platform==="win32"?'\r\n':'\n');
}

const lighthouseCheck = async ({data, newReport = true}) => {
    let scoresArray = [];

    let prevData = {};
    if (!newReport)
        try {
            prevData = jsonfile.readFileSync('./report.json', err => console.log(err));
        } catch (e) {
            console.log(e);
        }

    // if (!prevData) prevData = {}


    for (const url of data) {
        //check if link is empty
        if (OUTPUT_OPTION === 'html') {
            if (!fs.existsSync(`./reports`))
                fs.mkdirSync(`./reports`);
            if (!fs.existsSync(`./reports/html`))
                fs.mkdirSync(`./reports/html`);
            if (!fs.existsSync(`./reports/html/${dirName}`))
                fs.mkdirSync(`./reports/html/${dirName}`);
        }
        if (url.toString().trim().length < 2) continue;

        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless', '--no-sandbox']});
        const options = {/*logLevel: 'info',*/ output: 'html', onlyCategories: ['performance'], port: chrome.port};
        const runnerResult = await lighthouse(url, options);

        // `.report` is the HTML report as a string
        if (OUTPUT_OPTION === 'html') {
            // const fileName = url.slice(8).replace('///g', '_').replace('/./g', '_').replace('/-/g', '_') || 'report';
            const fileName = `report_${index}`
                || 'report';
            index++;
            const reportHtml = runnerResult.report;
            fs.writeFileSync(`./reports/html/${dirName}/${fileName}.html`, reportHtml);
        }

        const score = runnerResult.lhr.categories.performance.score * 100;
        const firstContentfulPaint = runnerResult.lhr.audits['first-contentful-paint'].displayValue
        const largestContentfulPaint = runnerResult.lhr.audits['largest-contentful-paint'].displayValue
        const speedIndex = runnerResult.lhr.audits['speed-index'].displayValue
        const cumulativeLayoutShift = runnerResult.lhr.audits['cumulative-layout-shift'].displayValue

        scoresArray.push({[url]: {score, firstContentfulPaint, largestContentfulPaint, speedIndex,cumulativeLayoutShift}});
        // `.lhr` is the Lighthouse Result as a JS object
        console.log('\n\nReport is done for', runnerResult.lhr.finalUrl);
        console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);
        await chrome.kill();
    }
    if (!fs.existsSync(`./${OUTPUT_DIRECTORY_NAME}`)) {
        fs.mkdirSync(`./${OUTPUT_DIRECTORY_NAME}`);
    }
    let formattedDate = `${date.getHours()}:${date.getMinutes()}_${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
    if (!newReport) {
        prevData[formattedDate] = scoresArray;
        // console.log(prevData)
        jsonfile.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report.json`, prevData, {space: 2/*, flag: 'a'*/});
        return;
    }

    //generate new report
    formattedDate = `${date.getHours()}H_${date.getMinutes()}M_${date.getDate()}D_${date.getMonth()}M_${date.getFullYear()}Y`.toLowerCase()
    // console.log(formattedDate)
    switch (OUTPUT_OPTION) {
        case "txt": {
            let formattedResult = '';
            scoresArray.forEach(el => Object.entries(el).forEach(([key, val]) => formattedResult += `\n________________________\nSite: ${key}\nScore: ${val['score']} \nfirstContentfulPaint: ${parseFloat(val['firstContentfulPaint'])}s \nlargestContentfulPaint: ${parseFloat(val['largestContentfulPaint'])}s \nspeedIndex: ${parseFloat(val['speedIndex'])}s \ncumulativeLayoutShift: ${parseFloat(val['cumulativeLayoutShift'])}\n`))

            console.log("\n" + formattedResult)
            fs.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report.txt`, formattedResult);
            break;
        }
        case "json": {
            jsonfile.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report_${formattedDate}.json`, scoresArray, {space: 2/*, flag: 'a'*/});
            break;
        }

        case "html": {
            break;
        }


    }

}


const data = readFile('./urls.txt');

lighthouseCheck({data, newReport: GENERATE_NEW_REPORT}).then(() => {
    console.log('done')
}).catch(err => console.log(err));

