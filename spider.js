let axios = require('axios');
let cheerio = require('cheerio');
let fs = require('fs');
let fsPromises = fs.promises;
let downloadFileAsync = require('./downloadFileAsync');
let baseurl = 'https://www.xjcbt.com/';
let linkmap = {};
let linktitle = {};
//mkdir
fsPromises.mkdir('./xjcbt/js', { recursive: true });
fsPromises.mkdir('./xjcbt/imgs', { recursive: true });
fsPromises.mkdir('./xjcbt/css', { recursive: true });

async function getOnePage(url) {
    let res = await axios.get(url);
    $ = cheerio.load(res.data);
    let html = res.data;
    //images
    let imgs = $('.mnmd-main-col img');
    for (let i = 0; i < imgs.length; i++) {
        let href = imgs[i].attribs.src;
        let filename = /\/([\d\w]+?\.[jpgnifebm]{3,4})/i.exec(href);
        if (filename && filename[1] && href.startsWith(baseurl) && !linkmap[href]) {
            linkmap[href] = './imgs/' + filename[1];
            let filepath = linkmap[href].replace('./', './xjcbt/');
            fsPromises.access(filepath, fs.constants.R_OK | fs.constants.W_OK).catch(() => {
                downloadFileAsync(href, filepath);
            });
            $(`img[src="${href}"]`).attr('src', linkmap[href]);
        }
    }
    //styles
    let styles = $('link[rel="stylesheet"]');
    for (let i = 0; i < styles.length; i++) {
        let href = styles[i].attribs.href;
        if (!href) continue;
        let filename = /\/([\d\w\.]+?\.css)/i.exec(href);
        if (filename && filename[1] && href.startsWith(baseurl) && !linkmap[href]) {
            linkmap[href] = './css/' + filename[1];
            let filepath = linkmap[href].replace('./', './xjcbt/');
            fsPromises.access(filepath, fs.constants.R_OK | fs.constants.W_OK).catch(() => {
                downloadFileAsync(href, filepath);
            });
            $(`link[rel="stylesheet"][href="${href}"]`).attr('href', linkmap[href]);
        }
    }
    //scripts
    let scripts = $('script[type="text/javascript"][src]');
    for (let i = 0; i < scripts.length; i++) {
        let href = scripts[i].attribs.src;
        if (!href) continue;
        let filename = /\/([\d\w\.]+?\.js)/i.exec(href);
        if (filename && filename[1] && href.startsWith(baseurl) && !linkmap[href]) {
            linkmap[href] = './js/' + filename[1];
            let filepath = linkmap[href].replace('./', './xjcbt/');
            fsPromises.access(filepath, fs.constants.R_OK | fs.constants.W_OK).catch(() => {
                downloadFileAsync(href, filepath);
            });
            $(`script[type="text/javascript"][src="${href}"]`).attr('src', linkmap[href]);
        }
    }
    return { $, url };
}
let url2filename = (url) => ('./' + url.replace(baseurl, '').replace('/', '-').replace('.html', '') + '.html');
async function article({ $, url }) {
    // prev&next url replace
    let next = $('div.posts-navigation__next a.posts-navigation__label').attr('href');
    if (next) {
        $(`a[href="${next}"]`).attr('href', url2filename(next));
    }
    let prev = $('div.posts-navigation__prev a.posts-navigation__label').attr('href');
    if (prev) {
        $(`a[href="${prev}"]`).attr('href', url2filename(prev));
    }
    await savepage({ $, url });
    return next;
}
async function savepage({ $, url }) {
    let currentname = url2filename(url);
    let title = $('h1.entry-title').text();
    linktitle[currentname] = title;
    await fsPromises.writeFile(currentname.replace('./', './xjcbt/'), $.html());
    console.log(title + ' finished');
}

(async() => {
    let next = baseurl + 'bandizip.html';
    while (next) {
        next = await article(await getOnePage(next));
    }
    //about
    await savepage(await getOnePage(baseurl + 'xjcbt'));
    await savepage(await getOnePage(baseurl + 'about'));
    await savepage(await getOnePage(baseurl + 'about/liuyan'));
    let indexhtml = '';
    for (key in linktitle) {
        indexhtml = indexhtml + `\n<p><a href="${key}">${linktitle[key]}</a></p>`;
    }
    await fsPromises.writeFile('./xjcbt/index.html', indexhtml);
    console.log('All done!');
})();