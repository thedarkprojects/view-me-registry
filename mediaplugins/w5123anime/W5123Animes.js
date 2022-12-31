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
                scrapper_class_name: "W5123Animes",
                media_link: W5123Animes.buildFullUrl(medialLink),
                type: "anime",
                preview_image: W5123Animes.buildProxyPath(
                    W5123Animes.buildFullUrl(movie.querySelector('a > img')
                        ?.getAttribute("data-src")), "content_type=image/jpeg")
            });
        }
        cb(result);
    }
  
    static async cleanMoviePage(html, url, cb) {
        const result = {};
        const seasons = [];
        const similarMovies = [];
        const root = parse(html);
        result.type = "movie";
        result.source = "w5.123animes.mobi";
        result.scrapper_class_name = "W5123Animes";
        result.title = root.querySelector(".title").text.trim();
        result.synopsis = root.querySelector(".desc").text.trim();

        result.casts = [];
        const dpes = root.querySelectorAll('dd');
        result.release_date = dpes[dpes.length > 4 ? 4 : 3].text.trim();
        result.genres = dpes[dpes.length > 4 ? 1 : 0].text.trim().split(",").map(n => n.trim()).filter(n => n);

        

        const movies = root.querySelectorAll('.film-list > .item > .inner');
        for (const movie of movies) {
            const fileNameEL = movie.querySelectorAll('a')[1];
            const medialLink = fileNameEL?.getAttribute("href");
            similarMovies.push({
                source: "w5.123animes.mobi",
                title: fileNameEL.text.trim(),
                scrapper_class_name: "W5123Animes",
                media_link: W5123Animes.buildFullUrl(medialLink),
                type: "anime",
                preview_image: W5123Animes.buildProxyPath(
                    W5123Animes.buildFullUrl(movie.querySelector('a > img')
                        ?.getAttribute("data-src")), "content_type=image/jpeg")
            });
        }
        result.similarMovies = similarMovies;

        const episodes = [];
        const episodesEls = root.querySelectorAll('.server.mass > ul > li > a');
        for (let episodesElIndex = 0; episodesElIndex < episodesEls.length; episodesElIndex++) {
            const episodesEl = episodesEls[episodesElIndex];
            episodes.push({
                title: episodesEl.text.trim(),
                servers: [ { name: "Base", link: W5123Animes.buildFullUrl(episodesEl.getAttribute("href")) } ]
            });
        }
        let index = 1;
        const chunks = W5123Animes.chunkArray(episodes, 50);
        for (const chunk of chunks) {
            let newIndex = index + chunk.length;
            seasons.push({
                seasonId: index,
                name: `${index} - ${newIndex}`,
                episodes: chunk,
                episodes_link: url
            });
            index = newIndex;
        }

        result.seasons = seasons;
        if (result.seasons.length) {
            result.servers = [];
            result.type = "show";
        } else {
            result.servers = [ { name: "Base", link: url } ];
        }
        cb(result);
    }

    static chunkArray(arr, size) {
        var R = [];
        for (var i = 0; i < arr.length; i += size)
            R.push(arr.slice(i, i + size));
        return R;
    }

}
