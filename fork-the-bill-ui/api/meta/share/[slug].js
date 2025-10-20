export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop();
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's a social media crawler
  const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|SkypeUriPreview|Slackbot|TelegramBot|Applebot|Googlebot/i.test(userAgent);
  
  // If it's not a crawler, redirect to the React app
  if (!isCrawler) {
    return Response.redirect(`${url.origin}/${slug}`, 302);
  }
  
  // If it's not a valid slug, return 404
  if (!slug || slug.includes('.')) {
    return new Response(null, { status: 404 });
  }

  try {
    // Fetch expense data from your API
    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    const expenseResponse = await fetch(`${apiUrl}/${slug}`);
    
    if (!expenseResponse.ok) {
      // If expense not found, return default HTML
      return new Response(getDefaultHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const expense = await expenseResponse.json();
    
    // Generate dynamic meta tags
    const title = `${expense.restaurantName} - ₹${expense.totalAmount.toFixed(2)} Bill Split`;
    const description = `Join the bill split for ${expense.restaurantName}! Total: ₹${expense.totalAmount.toFixed(2)} paid by ${expense.payerName}. ${expense.people?.length || 0} people involved.`;
    const imageUrl = `${url.origin}/logo512.png`;
    const billUrl = `${url.origin}/${slug}`;

    const html = generateHTML({
      title,
      description,
      imageUrl,
      billUrl,
      slug
    });

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error fetching expense:', error);
    return new Response(getDefaultHTML(), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function generateHTML({ title, description, imageUrl, billUrl, slug }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    
    <!-- Dynamic Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${billUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
   
    
    <!-- WhatsApp specific -->
    <meta property="og:site_name" content="Fork the Bill" />
    <meta property="og:locale" content="en_US" />
    
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Redirect to React app -->
    <script>
      // Immediately redirect to the React app
      window.location.replace('/${slug}');
    </script>
    
    <!-- Fallback for no-JS -->
    <noscript>
      <meta http-equiv="refresh" content="0; url=/${slug}" />
    </noscript>
  </head>
  <body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
      <h1>Loading ${title}...</h1>
      <p>${description}</p>
      <p><a href="/${slug}">Click here if you're not redirected automatically</a></p>
    </div>
  </body>
</html>`;
}

function getDefaultHTML() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Fork the Bill - Easily split restaurant bills and expenses with friends" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Fork the Bill - Split Bills Easily" />
    <meta property="og:description" content="Easily split restaurant bills with friends!" />
    <meta property="og:image" content="/logo512.png" />
    
    <title>Fork the Bill - Split Bills Easily</title>
    
    <script>
      window.location.replace('/');
    </script>
  </head>
  <body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
      <h1>Fork the Bill</h1>
      <p>Redirecting...</p>
    </div>
  </body>
</html>`;
}
