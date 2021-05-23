const fs = require('fs');
const jsonfile = require('jsonfile')
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

//config
const GENERATE_NEW_REPORT = false;
const OUTPUT_DIRECTORY_NAME = 'reports';
//----------------------------------------------------------


const readFile = (filePath) => {
    return fs.readFileSync(filePath, 'utf8').split('\r\n');
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
        if (url.toString().trim().length < 2) continue;

        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const options = {/*logLevel: 'info',*/ output: 'html', onlyCategories: ['performance'], port: chrome.port};
        const runnerResult = await lighthouse(url, options);

        // `.report` is the HTML report as a string
        // const reportHtml = runnerResult.report;
        // fs.writeFileSync('lhreport.html', reportHtml);

        const score = runnerResult.lhr.categories.performance.score * 100;
        scoresArray.push({[url]: {score}});

        // `.lhr` is the Lighthouse Result as a JS object
        console.log('\n\nReport is done for', runnerResult.lhr.finalUrl);
        console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);
        await chrome.kill();
    }
    if (!fs.existsSync(`./${OUTPUT_DIRECTORY_NAME}`)) {
        fs.mkdirSync(`./${OUTPUT_DIRECTORY_NAME}`);
    }
    const date = new Date();
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
    jsonfile.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report_${formattedDate}.json`, scoresArray, {space: 2/*, flag: 'a'*/});


}


const data = readFile('./urls.txt');

lighthouseCheck({data, newReport: GENERATE_NEW_REPORT}).then(() => {
    console.log('done')
}).catch(err => console.log(err));

