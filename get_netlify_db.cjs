const https = require('https');

https.get('https://eagle-futsal-academy.netlify.app/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = 'https://eagle-futsal-academy.netlify.app' + jsMatch[1];
      console.log('Fetching JS:', jsUrl);
      https.get(jsUrl, (res2) => {
         let js = '';
         res2.on('data', d => js += d);
         res2.on('end', () => {
            const matches = js.match(/eagle-futsal-db[a-zA-Z0-9_-]*/g);
            console.log('Found appIds:', [...new Set(matches)]);
         });
      });
    } else {
      console.log('No JS found in HTML');
    }
  });
}).on('error', e => console.error(e));
