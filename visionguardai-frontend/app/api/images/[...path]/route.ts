import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for authenticated image requests
 * This allows Next.js Image component to load images that require authentication
 * Token should be passed as a query parameter: ?token=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params
    const imagePath = path.join('/')
    
    // Get token from query parameter
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - token required' },
        { status: 401 }
      )
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    // Fetch image from backend with authentication
    const response = await fetch(`${API_URL}/api/${imagePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get image data
    const imageData = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return image with appropriate headers
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
