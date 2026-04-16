import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const session = await ChatSession.findById(id);
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { messages, mood } = await request.json();
    
    await connectDB();
    
    // Auto-generate title based on first user message if it's still "New Chat"
    let updateData = { messages, mood };
    
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        // Just grab the first 30 chars for the title
        let newTitle = firstUserMsg.content.substring(0, 30);
        if (firstUserMsg.content.length > 30) newTitle += '...';
        updateData.title = newTitle;
      }
    }

    const session = await ChatSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
