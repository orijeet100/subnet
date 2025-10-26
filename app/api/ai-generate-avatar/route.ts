import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentTitle, agentDescription, imageDescription } = body;

    if (!agentTitle || !imageDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a comprehensive prompt for the AI image generation
    const prompt = `Create a professional avatar image for an AI agent named "${agentTitle}". 
    
Agent Description: ${agentDescription || 'AI Assistant'}

User Request: ${imageDescription}

Requirements:
- Professional, clean, and modern design
- Square format (1:1 aspect ratio)
- High quality, detailed
- Suitable for use as a profile picture
- Avoid text or words in the image
- Make it visually appealing and distinctive

Style: Digital art, professional, clean, modern`;

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    // Fetch the image and convert to base64 to avoid CORS issues
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ 
      imageUrl: dataUrl,
      originalUrl: imageUrl 
    });
  } catch (error) {
    console.error('Error generating AI avatar:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI avatar' },
      { status: 500 }
    );
  }
}
