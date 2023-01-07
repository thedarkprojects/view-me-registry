
module.exports = XVideos = {

    ffs: null,
    parse: null,

    buildFullUrl(part) {
        return part.startsWith("/") ? `https://xvideos.com${part}` : part;
    },

    cleanMoviesList(html, url, cb) {
        const result = [];
        const root = XVideos.parse(html);
        const movies = root.querySelectorAll('.thumb-block');
        for (const movie of movies) {
            const fileNameEL = movie.querySelector('.thumb-under > p > a');
            if (!fileNameEL?.getAttribute("title")) continue;
            result.push({
                source: "xvideos.com",
                title: fileNameEL?.getAttribute("title").trim(),
                scrapper_class_name: "XVideos",
                media_link: XVideos.buildFullUrl(fileNameEL?.getAttribute("href")) + "%23show-related",
                type: "movie",
                preview_image: movie.querySelector('.thumb-inside > .thumb > a > img')?.getAttribute("data-src")
            });
        }
        cb(result);
    },

    async cleanMoviePage(html, url, cb) {
        const result = {};
        const similarMovies = [];
        const root = XVideos.parse(html);
        result.source = "xvideos.com";
        result.scrapper_class_name = "XVideos";
        result.title = result.synopsis = root?.querySelector(".page-title")?.text.trim();
        result.release_date = "";

        result.casts = [];
        result.genres = [];
        const genreEls = root.querySelectorAll(".video-tags-list > ul > li");
        for (const genreEl of genreEls) {
            if (genreEl.classList.contains("model")) {
                const href = genreEl.querySelector("a")?.getAttribute("href");
                result.casts.push(href/*href.substring(href.lastIndexOf("/")+1)*/);
                continue;
            };
            result.genres.push(genreEl?.text.trim());
        }

        const movies = root.querySelectorAll('.thumb-block');
        for (const movie of movies) {
            const fileNameEL = movie.querySelector('.thumb-under > p > a');
            const imageEl = movie.querySelector('.thumb-inside > .thumb > a > img');
            if (!fileNameEL?.getAttribute("title")) continue;
            similarMovies.push({
                source: "xvideos.com",
                title: fileNameEL?.getAttribute("title").trim(),
                scrapper_class_name: "XVideos",
                media_link: XVideos.buildFullUrl(fileNameEL?.getAttribute("href")) + "%23show-related",
                type: "movie",
                preview_image: imageEl ? imageEl?.getAttribute("src") : ""
            });
        }
        result.similarMovies = similarMovies;

        result.seasons = [];
        result.servers = [ { name: "Base", link: url } ];

        cb(result);
    }


}
