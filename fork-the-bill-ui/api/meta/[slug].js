// Check if the request is from a social media crawler
function isSocialCrawler(userAgent) {
  const crawlers = [
    'facebookexternalhit',
    'WhatsApp',
    'Twitterbot',
    'LinkedInBot',
    'TelegramBot',
    'SkypeUriPreview',
    'SlackBot',
    'DiscordBot',
    'GoogleBot'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

// Fetch expense data from your API
async function fetchExpense(slug) {
  try {
    // Replace with your actual API endpoint
    const apiUrl = 'https://o2mda6dn1i.execute-api.eu-north-1.amazonaws.com/prod';
    const response = await fetch(`${apiUrl}/expense/${slug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch expense: ${response.status}`);
      return null;
    }

  return await response.json();
  } catch (error) {
    console.error('Error fetching expense:', error);
    return null;
  }
}

// Generate the HTML with dynamic meta tags
function generateMetaHTML(expense, baseUrl) {
  const title = `Bill Split at ${expense.restaurantName} - Fork the Bill`;
  const description = `${expense.payerName} paid $${expense.totalAmount.toFixed(2)} at ${expense.restaurantName}. Split this bill with your friends!`;
  const url = `${baseUrl}/${expense.slug}`;
  const imageUrl = `${baseUrl}/logo512.png`; // You can create a dynamic image later
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <link rel="icon" href="${baseUrl}/favicon.ico"/>
    <link rel="icon" type="image/png" sizes="32x32" href="${baseUrl}/favicon.png"/>
    <link rel="icon" type="image/png" sizes="16x16" href="${baseUrl}/favicon.png"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}"/>
    <meta name="description" content="${description}"/>
    <meta name="keywords" content="bill splitting, expense sharing, receipt scanner, split bill, restaurant bill, ${expense.restaurantName}"/>
    <meta name="author" content="Fork the Bill"/>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="${url}"/>
    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${description}"/>
    <meta property="og:image" content="${imageUrl}"/>
    <meta property="og:site_name" content="Fork the Bill"/>

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image"/>
    <meta property="twitter:url" content="${url}"/>
    <meta property="twitter:title" content="${title}"/>
    <meta property="twitter:description" content="${description}"/>
    <meta property="twitter:image" content="${imageUrl}"/>

    <!-- WhatsApp specific -->
    <meta property="og:image:width" content="512"/>
    <meta property="og:image:height" content="512"/>
    <meta property="og:image:type" content="image/png"/>
    
    <!-- Additional meta for better sharing -->
    <meta name="robots" content="index, follow"/>
    <meta name="language" content="English"/>
    <meta name="revisit-after" content="7 days"/>
    
    <link rel="apple-touch-icon" href="${baseUrl}/logo192.png"/>
    <link rel="manifest" href="${baseUrl}/manifest.json"/>
    
    <!-- Redirect script for non-crawlers -->
    <script>
      // Only redirect if this is not a crawler
      if (typeof window !== 'undefined' && window.location) {
        // Small delay to ensure meta tags are read
        setTimeout(function() {
          window.location.href = '${url}';
        }, 100);
      }
    </script>
</head>
<body>
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
        <h1>Bill Split at ${expense.restaurantName}</h1>
        <p>${description}</p>
        <p>If you are not redirected automatically, <a href="${url}">click here</a>.</p>
    </div>
</body>
</html>`;
}

// Default HTML for when expense is not found
function generateDefaultHTML(baseUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <link rel="icon" href="${baseUrl}/favicon.ico"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#000000"/>
    
    <title>Fork the Bill - Split Bills Easily</title>
    <meta name="description" content="Easily split restaurant bills with friends!"/>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="${baseUrl}"/>
    <meta property="og:title" content="Fork the Bill - Split Bills Easily"/>
    <meta property="og:description" content="Easily split restaurant bills with friends!"/>
    <meta property="og:image" content="${baseUrl}/logo512.png"/>
    
    <script>
      if (typeof window !== 'undefined' && window.location) {
        setTimeout(function() {
          window.location.href = '${baseUrl}';
        }, 100);
      }
    </script>
</head>
<body>
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
        <h1>Fork the Bill</h1>
        <p>Easily split restaurant bills with friends!</p>
        <p>If you are not redirected automatically, <a href="${baseUrl}">click here</a>.</p>
    </div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(404).json({ error: 'Not found' });
  }

  const userAgent = req.headers['user-agent'] || '';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  // Since we're using Vercel rewrites, this function will only be called for crawlers
  // or when explicitly accessing /meta/:slug
  
  // Fetch expense data
  const expense = await fetchExpense(slug);
  
  let html;
  if (expense) {
    html = generateMetaHTML(expense, baseUrl);
  } else {
    html = generateDefaultHTML(baseUrl);
  }
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // Cache for 5 minutes
  return res.status(200).send(html);
}
