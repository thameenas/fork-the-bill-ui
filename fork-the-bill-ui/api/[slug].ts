import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Define the expense interface (simplified version)
interface Expense {
  restaurantName: string;
  totalAmount: number;
  payerName: string;
  slug: string;
}

// Function to fetch expense data from your backend API
async function fetchExpense(slug: string): Promise<Expense | null> {
  try {
    // Replace with your actual API endpoint
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${apiBaseUrl}/expense/${slug}`);
    
    if (!response.ok) {
      return null;
    }
    
    const expense = await response.json();
    return expense;
  } catch (error) {
    console.error('Error fetching expense:', error);
    return null;
  }
}

// Function to generate HTML with dynamic meta tags
function generateHTML(expense: Expense | null, slug: string, baseHTML: string): string {
  if (!expense) {
    // Return default HTML if expense not found
    return baseHTML;
  }

  const title = `${expense.restaurantName} - Fork the bill`;
  const description = `Split the bill from ${expense.restaurantName}. Total: ₹${expense.totalAmount.toFixed(2)} paid by ${expense.payerName}. Join to claim your items!`;
  const url = `https://${process.env.VERCEL_URL || 'localhost:3000'}/${slug}`;
  const image = `https://${process.env.VERCEL_URL || 'localhost:3000'}/logo512.png`;

  // Replace the default meta tags with dynamic ones
  let html = baseHTML;
  
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${title}</title>`
  );
  
  // Replace description
  html = html.replace(
    /<meta name="description" content=".*?"\/>/,
    `<meta name="description" content="${description}"/>`
  );
  
  // Replace Open Graph tags
  html = html.replace(
    /<meta property="og:title" content=".*?"\/>/,
    `<meta property="og:title" content="${title}"/>`
  );
  
  html = html.replace(
    /<meta property="og:description" content=".*?"\/>/,
    `<meta property="og:description" content="${description}"/>`
  );
  
  html = html.replace(
    /<meta property="og:url" content=".*?"\/>/,
    `<meta property="og:url" content="${url}"/>`
  );
  
  html = html.replace(
    /<meta property="og:image" content=".*?"\/>/,
    `<meta property="og:image" content="${image}"/>`
  );

  return html;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  // Check if this is a bot/crawler request
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|twitter|linkedin/i.test(userAgent);
  
  if (!isCrawler) {
    // For regular users, redirect to the React app
    return res.redirect(302, `/${slug}`);
  }

  try {
    // Read the built index.html file
    const htmlPath = path.join(process.cwd(), 'build', 'index.html');
    let baseHTML: string;
    
    try {
      baseHTML = fs.readFileSync(htmlPath, 'utf8');
    } catch (error) {
      // Fallback to public/index.html if build doesn't exist
      const publicHtmlPath = path.join(process.cwd(), 'public', 'index.html');
      baseHTML = fs.readFileSync(publicHtmlPath, 'utf8');
    }

    // Fetch expense data
    const expense = await fetchExpense(slug);
    
    // Generate HTML with dynamic meta tags
    const html = generateHTML(expense, slug, baseHTML);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error generating HTML:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
