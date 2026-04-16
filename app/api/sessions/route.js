import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const sessions = await ChatSession.find({}).sort({ updatedAt: -1 }).select('title updatedAt mood');
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    // Default initial bot message
    const initialMessage = {
      role: "bot",
      content: "Hello there! I am your AI. Give me something to react to..."
    };

    const newSession = await ChatSession.create({
      title: "New Chat",
      messages: [initialMessage],
      mood: "default"
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
