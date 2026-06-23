# Komiku REST API Migration

This branch migrates the app data layer away from direct `komiku.org` HTML scraping and into the documented Komiku REST API at:

`https://komiku-rest-api.vercel.app`

Docs source:

`https://vernsg.is-a.dev/komiku-api-docs`

## Endpoint mapping

- Home latest updates: `GET /terbaru`
- Home recommendations: `GET /rekomendasi`
- Home popular sections: `GET /komik-populer`
- Explore default list: `GET /pustaka` and `GET /pustaka/page/:page`
- Search: `GET /search?q=:keyword`
- Genre list: `GET /genre-all`
- Genre detail: `GET /genre/:slug` and `GET /genre/:slug/page/:page`
- Colored comics: `GET /berwarna` and `GET /berwarna/:page`
- Manga detail: `GET /detail-komik/:slug`
- Chapter reader: `GET /baca-chapter/:slug/:chapter`

## Notes

The documented API does not expose direct query endpoints for every old scraper filter such as `tipe`, `status`, or `orderby`. Those filters are preserved in the internal app API where possible by filtering the documented API response shape after data is fetched.
