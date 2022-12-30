const ffs = require("kyofuuc").init({
    responseType: "text"
});
const { default: parse } = require("node-html-parser");

module.exports = class W5123Animes {

    static buildFullUrl(part) {
        return part.startsWith("/") ? `https://w5.123animes.mobi${part}` : part;
    }

    static cleanMoviesList(html, url, cb) {
        const result = [];
        const root = parse(html);
        const movies = root.querySelectorAll('.film-list > .item > .inner');
        for (const movie of movies) {
            const fileNameEL = movie.querySelectorAll('a')[1];
            const medialLink = fileNameEL?.getAttribute("href");
            result.push({
                source: "w5.123animes.mobi",
                title: fileNameEL.text.trim(),
                media_link: W5123Animes.buildFullUrl(medialLink),
                type: "anime",
                preview_image: W5123Animes.buildProxyPath(
                    W5123Animes.buildFullUrl(movie.querySelector('a > img')
                        ?.getAttribute("data-src")), "content_type=image/jpeg")
            });
        }
        cb(result);
    }

}
