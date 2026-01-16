async function searchResults(keyword) {
    try {
        const url = `https://wetriedtls.com/query?adult=true&query_string=${encodeURIComponent(keyword)}`;
        const response = await soraFetch(url);
        const json = await response.json();

        if (!Array.isArray(json?.data)) {
            return JSON.stringify([]);
        }

        const results = json.data.map(item => ({
            title: item.title,
            image: item.cover ?? "",
            href: `https://wetriedtls.com/series/${item.series_slug}`
        }));

        return JSON.stringify(results);
    } catch (e) {
        console.log("Wetried search error:", e);
        return JSON.stringify([]);
    }
}


async function extractDetails(url) {
    try {
        const res = await soraFetch(url);
        const html = await res.text();

        // description est déjà dans l’API, mais fallback HTML
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
        const description = descMatch ? descMatch[1] : '';

        return JSON.stringify([{
            description,
            aliases: '',
            airdate: ''
        }]);
    } catch (e) {
        return JSON.stringify([{
            description: '',
            aliases: '',
            airdate: ''
        }]);
    }
async function extractChapters(url) {
    try {
        const slug = url.split('/series/')[1];
        if (!slug) return JSON.stringify([]);

        const apiUrl = `https://wetriedtls.com/series/${slug}`;
        const res = await soraFetch(apiUrl);
        const html = await res.text();

        // les données sont injectées en JS
        const dataMatch = html.match(/__NEXT_DATA__\s*=\s*({[\s\S]*?});/);
        if (!dataMatch) return JSON.stringify([]);

        const data = JSON.parse(dataMatch[1]);
        const chaptersData =
            data?.props?.pageProps?.series?.chapters ?? [];

        const chapters = chaptersData.map((ch, i) => ({
            href: `https://wetriedtls.com/series/${slug}/${ch.slug}`,
            number: i + 1,
            title: ch.title
        }));

        return JSON.stringify(chapters);
    } catch (e) {
        console.log("extractChapters error:", e);
        return JSON.stringify([]);
    }
}

async function extractText(url) {
    try {
        const res = await soraFetch(url);
        const html = await res.text();

        const match = html.match(/<div class="chapter-content">([\s\S]*?)<\/div>/i);
        if (!match) return '';

        return cleanText(match[1]);
    } catch (e) {
        console.log('extractText error:', e);
        return '';
    }
}


function cleanText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{2,}/g, '\n\n')
        .trim();
}
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);
    } catch(e) {
        return await fetch(url, options);
    }
}
