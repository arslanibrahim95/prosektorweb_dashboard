import { NextResponse } from 'next/server';

/**
 * GET /api/docs/ui
 * 
 * Serves the Scalar API reference UI for interactive API documentation
 */
export async function GET() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>ProsektorWeb API Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <!-- Scalar API Reference -->
  <script
    id="api-reference"
    data-url="/api/docs"
    data-configuration='{"theme":"purple","layout":"modern","showSidebar":true}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
    });
}
