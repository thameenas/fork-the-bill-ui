export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop();
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's a social media crawler
  const isCrawler = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot/i.test(userAgent);
  
  if (!isCrawler) {
    // Regular users get redirected to the React app
    return Response.redirect(url.origin + '/' + slug, 302);
  }
  
  try {
    // Get the API base URL from environment or use a default
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    
    // Fetch expense data from your backend
    const expenseResponse = await fetch(`${apiBaseUrl}/expense/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!expenseResponse.ok) {
      throw new Error(`Failed to fetch expense: ${expenseResponse.status}`);
    }
    
    const expense = await expenseResponse.json();
    
    // Generate the share URL
    const shareUrl = `${url.origin}/${slug}`;
    
    // Create description with restaurant name and total
    const description = `Join the bill split for ${expense.restaurantName}. Total: ₹${expense.totalAmount.toFixed(2)} split among ${expense.people.length} people.`;
    
    // Generate HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <link rel="icon" href="${url.origin}/favicon.ico"/>
    <link rel="icon" type="image/png" sizes="32x32" href="${url.origin}/favicon.png"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Dynamic meta tags for social sharing -->
    <title>${expense.restaurantName} - Bill Split | Fork the Bill</title>
    <meta name="description" content="${description}"/>
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="${shareUrl}"/>
    <meta property="og:title" content="${expense.restaurantName} - Bill Split | Fork the Bill"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${url.origin}/logo512.png"/>
    <meta property="og:site_name" content="Fork the Bill"/>
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:url" content="${shareUrl}"/>
    <meta name="twitter:title" content="${expense.restaurantName} - Bill Split"/>
    <meta name="twitter:description" content="${description}"/>
    <meta name="twitter:image" content="${url.origin}/logo512.png"/>
    
    <!-- WhatsApp specific (uses Open Graph) -->
    <meta property="og:image:width" content="512"/>
    <meta property="og:image:height" content="512"/>
    
    <!-- Additional meta for better sharing -->
    <meta name="author" content="Fork the Bill"/>
    <meta name="keywords" content="bill splitting, expense sharing, ${expense.restaurantName}, restaurant bill"/>
    
    <!-- Redirect script for crawlers that execute JavaScript -->
    <script>
      // Small delay to ensure meta tags are read, then redirect
      setTimeout(function() {
        if (typeof window !== 'undefined') {
          window.location.replace('${shareUrl}');
        }
      }, 100);
    </script>
    
    <!-- Fallback refresh for crawlers -->
    <meta http-equiv="refresh" content="1;url=${shareUrl}">
</head>
<body>
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>${expense.restaurantName}</h1>
        <p>Bill Split - Total: ₹${expense.totalAmount.toFixed(2)}</p>
        <p>Split among ${expense.people.length} people</p>
        <p><a href="${shareUrl}">Click here if you're not redirected automatically</a></p>
    </div>
</body>
</html>`;
    
    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Error generating meta tags:', error);
    
    // Fallback HTML with generic meta tags
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Fork the Bill - Split Bills Easily</title>
    <meta name="description" content="Easily split restaurant bills with friends!"/>
    <meta property="og:title" content="Fork the Bill - Split Bills Easily"/>
    <meta property="og:description" content="Easily split restaurant bills with friends!"/>
    <meta property="og:url" content="${url.origin}/${slug}"/>
    <meta property="og:type" content="website"/>
    <meta property="og:image" content="${url.origin}/logo512.png"/>
    <script>
      setTimeout(function() {
        if (typeof window !== 'undefined') {
          window.location.replace('${url.origin}/${slug}');
        }
      }, 100);
    </script>
    <meta http-equiv="refresh" content="1;url=${url.origin}/${slug}">
</head>
<body>
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>Fork the Bill</h1>
        <p>Loading bill split...</p>
        <p><a href="${url.origin}/${slug}">Click here if you're not redirected automatically</a></p>
    </div>
</body>
</html>`;
    
    return new Response(fallbackHtml, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60', // Shorter cache for fallback
      },
    });
  }
}
