const fs = require('fs');

const generateString = (length) => {
    let result = '_';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const checkFileName = ({fileName, OUTPUT_DIRECTORY_NAME}) => {
    if (fs.existsSync(`./${OUTPUT_DIRECTORY_NAME}/report${fileName}.txt`))
        return checkFileName({fileName: fileName + generateString(2), OUTPUT_DIRECTORY_NAME});
    return fileName

}

const showNUnderscore = n => '_'.repeat(n)


module.exports = {
    generateString,
    checkFileName,
    showNUnderscore
}
