module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, location = 'United States' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Get SearchAPI key from environment variables
    const searchApiKey = process.env.SEARCH_API_KEY || 'xcFdkkUfgZ2AN43MsYbixfo8';
    
    if (!searchApiKey) {
      return res.status(500).json({ error: 'SearchAPI key not configured' });
    }

    // Search for Chargebee-related information
    const searchResponse = await fetch(`https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query + ' site:chargebee.com OR chargebee')}&api_key=${searchApiKey}&location=${location}&num=5`);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('SearchAPI error:', searchResponse.status, errorData);
      return res.status(searchResponse.status).json({ 
        error: errorData.error?.message || 'SearchAPI request failed' 
      });
    }

    const searchData = await searchResponse.json();
    
    // Extract and format the search results
    const results = searchData.organic_results || [];
    const formattedResults = results.map(result => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link,
      position: result.position
    }));

    // Create a comprehensive answer based on search results
    let answer = '';
    let relevantLink = null;
    
    if (formattedResults.length > 0) {
      const snippets = formattedResults.slice(0, 3).map(r => r.snippet).join(' ');
      answer = `Based on the latest information about Chargebee: ${snippets}`;
      
      // Get the most relevant Chargebee link from search results
      relevantLink = formattedResults.find(result => 
        result.link && result.link.includes('chargebee.com')
      )?.link || null;
      
      // Add some context based on the query
      const queryLower = query.toLowerCase();
      if (queryLower.includes('pricing') || queryLower.includes('cost')) {
        answer += ' For detailed pricing information, I recommend visiting the Chargebee pricing page or contacting their sales team for a customized quote.';
      } else if (queryLower.includes('feature') || queryLower.includes('capability')) {
        answer += ' Chargebee offers comprehensive subscription management features designed to help businesses scale their recurring revenue operations.';
      } else if (queryLower.includes('integration')) {
        answer += ' Chargebee integrates with numerous popular business tools and payment gateways to streamline your workflow.';
      }
    } else {
      // Fallback response when no search results
      answer = getFallbackAnswer(query);
    }

    // Return in OpenAI-compatible format for the frontend
    const response = {
      choices: [{
        message: {
          content: answer
        }
      }],
      search_results: formattedResults,
      relevant_link: relevantLink // Add the most relevant Chargebee link
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('API route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

  // Fallback answer method
  function getFallbackAnswer(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('pricing')) {
      return "Chargebee offers flexible pricing plans starting from $99/month for the Launch plan (up to $100K ARR), $249/month for Scale (up to $1M ARR), and custom pricing for Rise (enterprise). All plans include a 14-day free trial with no setup fees.";
    } else if (queryLower.includes('feature')) {
      return "Chargebee provides comprehensive subscription management including automated billing, dunning management, revenue recognition, customer portal, analytics & reporting, tax compliance, payment processing, and integrations with 100+ business tools.";
    } else if (queryLower.includes('integration')) {
      return "Chargebee seamlessly integrates with popular tools like Salesforce, HubSpot, Slack, QuickBooks, Xero, Stripe, PayPal, Razorpay, and many more. It also provides REST APIs and webhooks for custom integrations.";
    } else if (queryLower.includes('trial')) {
      return "Yes! Chargebee offers a 14-day free trial with no credit card required. You get full access to all features during the trial period to test the platform thoroughly.";
    } else {
      return "Chargebee is a comprehensive subscription billing and revenue operations platform that helps businesses automate their recurring billing, manage subscriptions, and optimize revenue operations. For specific information, I recommend visiting chargebee.com or contacting their support team.";
    }
  }
};
