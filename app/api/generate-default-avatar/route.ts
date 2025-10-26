import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Read the null_profile.jpg from the public folder
    const imagePath = join(process.cwd(), 'public', 'null_profile.jpg');
    const imageBuffer = readFileSync(imagePath);
    
    // Convert to base64 with proper data URL format
    const base64 = imageBuffer.toString('base64');
    const base64Image = `data:image/jpeg;base64,${base64}`;
    
    
    return NextResponse.json({
      base64Image: base64Image
    });
  } catch (error) {
    console.error('Error generating default avatar:', error);
    return NextResponse.json({ 
      error: 'Failed to generate default avatar',
      base64Image: 'null_profile.jpg'
    }, { status: 500 });
  }
}
