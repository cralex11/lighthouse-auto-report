const fs = require('fs');

const {isMobile, output_options} = require('./utils/constants.js')
const {showNUnderscore} = require('./utils/utils')
const {lighthouseCheck} = require('./utils/lighthouseCheck.js')


//config
const GENERATE_NEW_REPORT = true;
const OUTPUT_DIRECTORY_NAME = 'reports';
//All options: json, txt, html, csv
//For this option GENERATE_NEW_REPORT should be true!!!
const OUTPUT_OPTION = process.argv.find(el => output_options.includes(el) && el)||'csv';

//----------------------------------------------------------


//--------------------------
//Functions

const readFile = (filePath) => {
    return fs.readFileSync(filePath, 'utf8').split(process.platform === "win32" ? '\r\n' : '\n');
}


const data = readFile('./urls.txt');

console.log(!isMobile ? 'Desktop testing\n' : 'Mobile testing\n');

console.time()
lighthouseCheck({data, OUTPUT_OPTION, OUTPUT_DIRECTORY_NAME, newReport: GENERATE_NEW_REPORT}).then(() => {
    console.log(showNUnderscore(4) + "Success" + showNUnderscore(4))
    console.timeEnd()
}).catch(err => console.log(err));

