const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const response = await got({
        method: 'get',
        url: 'http://mapiv5.caixin.com//m/api/getWapIndexListByPage?page=1&callback=&_=1560140003179',
        headers: {
            Referer: `http://mapiv5.caixin.com/`,
            Host: 'mapiv5.caixin.com',
        },
    });

    const data = response.data.data.list;

    const items = await Promise.all(
        data.map(async (item) => {
            const link = item.web_url;
            const summary = `<blockquote><p>${item.summary}</p></blockquote><img src="${item.pics}">`;

            const fullText = await ctx.cache.tryGet(link, async () => {
                const result = await got.get(link);

                const $ = cheerio.load(result.data);

                return $('#Main_Content_Val').html();
            });

            return {
                title: item.title,
                description: fullText ? summary + fullText : summary,
                link: link,
                pubDate: new Date(item.time * 1000),
                author: item.author_name,
            };
        })
    );

    ctx.state.data = {
        title: `财新网 - 首页`,
        link: `http://www.caixin.com/`,
        description: '财新网 - 首页',
        item: items,
    };
};
