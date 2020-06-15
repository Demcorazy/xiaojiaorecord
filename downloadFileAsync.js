const http = require('https');
const fs = require('fs');

module.exports = function downloadFileAsync(uri, dest) {
    return new Promise((resolve, reject) => {
        // 确保dest路径存在
        const file = fs.createWriteStream(dest);

        http.get(uri, (res) => {
            if (res.statusCode !== 200) {
                reject(response.statusCode);
                return;
            }

            res.on('end', () => {
                // console.log('download end');
            });

            // 进度、超时等

            file.on('finish', () => {
                console.log(uri + ' file download finished');
                file.close(resolve);
            }).on('error', (err) => {
                fs.unlink(dest);
                reject(err.message);
            })

            res.pipe(file);
        });
    });
}