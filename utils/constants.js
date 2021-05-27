

const isMobile = !process.argv.includes('desktop');
const output_options = ['html', 'json', 'csv', 'txt'];


module.exports = {
    isMobile,
    output_options
}
