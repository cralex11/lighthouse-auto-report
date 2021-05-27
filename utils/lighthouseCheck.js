const jsonfile = require('jsonfile')
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

const converter = require('json-2-csv')

const {isMobile} = require('./constants.js');
const constants = require('lighthouse/lighthouse-core/config/constants')
const {checkFileName, showNUnderscore} = require('./utils')


const date = new Date();
const dirName = `${date.getHours()}H_${date.getMinutes()}M_${date.getDate()}D_${date.getMonth()}M_${date.getFullYear()}Y`.toLowerCase();
let index = 1;

let options = (!isMobile && {/*logLevel: 'info',*/
    output: 'html',
    onlyCategories: ['performance'],
    formFactor: 'desktop',
    throttling: constants.throttling.desktopDense4G,
    screenEmulation: constants.screenEmulationMetrics.desktop,
    emulatedUserAgent: constants.userAgents.desktop,
}) || {/*logLevel: 'info',*/ output: 'html', onlyCategories: ['performance']};


exports.lighthouseCheck = async ({data, OUTPUT_OPTION, OUTPUT_DIRECTORY_NAME, newReport = true}) => {
    let scoresArray = [];
    let prevData = {};

    //check and create reports folder
    if (!fs.existsSync(`./${OUTPUT_DIRECTORY_NAME}`)) {
        fs.mkdirSync(`./${OUTPUT_DIRECTORY_NAME}`);
    }
    //check if it have to create new report
    if (!newReport)
        try {
            prevData = jsonfile.readFileSync('./report.json', err => console.log(err));
        } catch (e) {
            console.log(e);
        }

    //check and create html folder for reports
    if (OUTPUT_OPTION === 'html') {
        if (!fs.existsSync(`./reports`))
            fs.mkdirSync(`./reports`);
        if (!fs.existsSync(`./reports/html`))
            fs.mkdirSync(`./reports/html`);
        if (!fs.existsSync(`./reports/html/${dirName}`))
            fs.mkdirSync(`./reports/html/${dirName}`);
    }

    //browser init
    const chrome = await chromeLauncher.launch({chromeFlags: ['--headless', '--no-sandbox']});
    options.port = chrome.port;

    //Get score for each link
    for (const url of data) {

        //check if link is empty and pass it
        if (url.toString().trim().length < 2) continue;


        //Get results
        const runnerResult = await lighthouse(url, options);

        //check if output is html
        if (OUTPUT_OPTION === 'html') {
            const fileName = `report_${index}`
                || 'report';
            index++;
            const reportHtml = runnerResult.report;
            fs.writeFileSync(`./reports/html/${dirName}/${fileName}.html`, reportHtml);
        }


        //Refract results
        const score = runnerResult.lhr.categories.performance.score * 100;
        const firstContentfulPaint = runnerResult.lhr.audits['first-contentful-paint'].displayValue
        const largestContentfulPaint = runnerResult.lhr.audits['largest-contentful-paint'].displayValue
        const speedIndex = runnerResult.lhr.audits['speed-index'].displayValue
        const cumulativeLayoutShift = runnerResult.lhr.audits['cumulative-layout-shift'].displayValue

        //Collect data
        if (OUTPUT_OPTION !== 'csv')
            scoresArray.push({
                [url]: {
                    score,
                    firstContentfulPaint,
                    largestContentfulPaint,
                    speedIndex,
                    cumulativeLayoutShift
                }
            });
        else
            scoresArray.push({
                "site": url,
                score: parseFloat(score.toString()),
                firstContentfulPaint: parseFloat(firstContentfulPaint.toString()),
                largestContentfulPaint: parseFloat(largestContentfulPaint.toString()),
                speedIndex: parseFloat(speedIndex.toString()),
                cumulativeLayoutShift: parseFloat(cumulativeLayoutShift.toString())

            });

        // `.lhr` is the Lighthouse Result as a JS object
        console.log('\n\nReport is done for', runnerResult.lhr.finalUrl);
        console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);
    }

    await chrome.kill();


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
            let formattedResult = `${showNUnderscore(5)} ${isMobile ? "Mobile Testing" : "Desktop Testing"} ${showNUnderscore(5)}`;
            scoresArray.forEach(el => Object.entries(el).forEach(([key, val]) =>
                formattedResult += `\n${showNUnderscore(key.length + 6 + key.length * 0.1)}\nSite: ${key}\nScore: ${val['score']} \nfirstContentfulPaint: ${parseFloat(val['firstContentfulPaint'])}s \nlargestContentfulPaint: ${parseFloat(val['largestContentfulPaint'])}s \nspeedIndex: ${parseFloat(val['speedIndex'])}s \ncumulativeLayoutShift: ${parseFloat(val['cumulativeLayoutShift'])}\n`))


            let txtFileName = checkFileName({fileName: dirName, OUTPUT_DIRECTORY_NAME});
            fs.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report${txtFileName}.txt`, formattedResult);

            console.log("\n" + formattedResult)
            console.log("File Name: " + txtFileName)
            break;
        }
        case "json": {
            jsonfile.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report_${formattedDate}.json`, scoresArray, {space: 2/*, flag: 'a'*/});
            converter.json2csv(scoresArray, (err, csv) => {
                if (err) return console.log(err)

                fs.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report_${formattedDate}.csv`, csv)

            }, {
                expandArrayObjects: true
            })


            break;
        }

        case "html": {
            break;
        }
        case "csv": {

            converter.json2csv(scoresArray, (err, csv) => {
                if (err) return console.log(err)
                let fileName = checkFileName({fileName: dirName, OUTPUT_DIRECTORY_NAME});
                fs.writeFileSync(`./${OUTPUT_DIRECTORY_NAME}/report_${fileName}.csv`, csv)

            })
            break;
        }


    }

}
