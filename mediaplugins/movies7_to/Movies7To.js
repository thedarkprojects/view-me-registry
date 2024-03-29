
module.exports = Movies7To = {

    ffs: null,
    parse: null,

    buildFullUrl(part) {
        return part?.startsWith("/") ? `https://movies7.to${part}` : part;
    },

    cleanMoviesList(html, url, cb) {
        const result = [];
        const root = Movies7To.parse(html);
        const movies = root.querySelectorAll('.m-item');
        for (const movie of movies) {
            const infoEl = movie.querySelector('.m-info');
            const fileNameEL = infoEl.querySelector('.m-title');
            const medialLink = fileNameEL.getAttribute("href") ?? "";
            result.push({
                source: "movies7.rs",
                title: fileNameEL.text.trim(),
                scrapper_class_name: "Movies7To",
                media_link: Movies7To.buildFullUrl(medialLink),
                type: medialLink.includes("/tv") ? "show" : "movie",
                preview_image: movie.querySelector('img').getAttribute("data-src")
            });
        }
        cb(result);
    },

    // base
    async cleanMoviePage(html, url, cb) {
        const result = {};
        const servers = [];
        const seasons = [];
        const similarMovies = [];
        const root = Movies7To.parse(html);
        result.source = "movies7.rs";
        result.scrapper_class_name = "Movies7To";
        result.synopsis = root.querySelector(".section-description").querySelector("p").text.trim();

        const dpes = root.querySelectorAll('.dp-element');
        for (const dpe of dpes) {
            const dpeText = dpe.text.replace(/\s\s+/g, '');
            if (dpeText.includes("Title:")) result.title = dpeText.substring(6).trim();
            if (dpeText.includes("Released:")) result.release_date = dpeText.substring(9).trim();
            if (dpeText.includes("Genre:")) result.genres = dpeText.substring(6).trim().split(",").filter(n => n);
            if (dpeText.includes("Casts:")) result.casts = dpeText.substring(6).trim().split(",").filter(n => n);
        }

        const movies = root.querySelectorAll('.flw-item');
        for (const movie of movies) {
            const fileNameEL = movie.querySelector('.film-name');
            const medialLink = fileNameEL.querySelector('a').getAttribute("href");
            similarMovies.push({
                source: "movies7.rs",
                title: fileNameEL.text.trim(),
                media_link: medialLink.startsWith("/") ? `https://movies7.rs${medialLink}` : medialLink,
                type: medialLink.includes("/tv") ? "show" : "movie",
                preview_image: movie.querySelector('img').getAttribute("data-src")
            });
        }
        result.similarMovies = similarMovies;

        const serversEls = root.querySelector(".dp-s-line").querySelectorAll('.nav-item');
        for (const server of serversEls) {
            const link = server.querySelector("a");
            servers.push({
                name: link.text.trim(),
                link: Movies7To.buildFullUrl(link.getAttribute("href"))
            });
        }
        result.servers = servers;

        const seasonsEls = root.querySelector(".slt-seasons-dropdown")?.querySelectorAll('a');
        for (const seasonEl of (seasonsEls || [])) {
            const link = seasonEl;
            const seasonId = link.getAttribute("data-id");
            seasons.push({
                seasonId,
                name: link.text.trim(),
                episodes: [],
                episodes_link: `https://movies7.rs/ajax/v2/season/episodes/${seasonId}`
            });
        }

        let responseCounter = seasons.length;
        function resportResponse() {
            if (responseCounter <= 0) cb(result);
            //Movies7To.logger.log("COUNTER", responseCounter);
        }
        // WHY? for speed sake dont want to wait 5 minute and above to fetch series
        // with over 20 seasons, call the requests in threads then report on complete
        Promise.all(seasons.map((season, index) => Movies7To.ffs.get(season.episodes_link, { index }))).then(responses => {
            responseCounter -= seasons.length;
            responses.forEach((res, index) => {
                const epRoot = Movies7To.parse(res.body);
                const eps = epRoot.querySelectorAll(".nav-link");
                responseCounter += eps.length;
                eps.forEach((ep, eindex) => {
                    seasons[res.config.index].episodes.push({
                        title: ep.text.trim(), servers: []
                    });
                    const epId = ep.getAttribute("data-id");
                    Movies7To.ffs.get(`https://movies7.rs/ajax/v2/episode/servers/${epId}`, { eindex }).then((sres) => {
                        const epServers = [];
                        responseCounter -= 1;
                        const serverRoot = Movies7To.parse(sres.body);
                        const serverEls = serverRoot.querySelectorAll(".nav-link");
                        serverEls.forEach((serverEl, sindex) => {
                            const linkId = serverEl.getAttribute("data-id");
                            epServers.push({
                                name: serverEl.text.trim(),
                                link: url.replace(/\/tv\//, '/watch-tv/') + "." + linkId
                            });
                        });

                        seasons[res.config.index].episodes[sres.config.eindex].servers = epServers;
                        resportResponse();
                    }).catch(eerr => {
                        responseCounter -= 1; resportResponse();
                        Movies7To.logger.error("FETCH SOAP2DAY.RS EPISODES.SERVER", eerr);
                    });
                })
            });
        }).catch(err => {
            Movies7To.logger.error("FETCH SOAP2DAY.RS EPISODES", err);
            responseCounter -= seasons.length; resportResponse();
        });

        result.seasons = seasons;
        resportResponse();
    }

}
