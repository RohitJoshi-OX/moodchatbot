// PHASE 4: Streaming API Route
// Instead of waiting for the full reply, we pipe Groq's chunks directly to the browser!

export async function POST(request) {
  try {
    const { message } = await request.json();

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        stream: true, // ← The magic flag that enables streaming!
        messages: [
          {
            role: "system",
            content: `You are a conversational AI. You MUST always start your response with a mood tag on its own line.
Choose from exactly one of:
[MOOD:happy]
[MOOD:angry]
[MOOD:mysterious]
[MOOD:default]

Pick the mood that best fits the emotional tone of your reply. Then write your natural response after it.

Example:
[MOOD:happy]
That's absolutely wonderful to hear! I'm so glad things are going well for you.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq Error:", errText);
      return new Response("Groq API Error", { status: 500 });
    }

    // Create a ReadableStream that processes Groq's Server-Sent Events (SSE)
    // and pipes clean text chunks directly to the browser
    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Groq sends SSE lines like: "data: {...json...}"
            const rawChunk = decoder.decode(value, { stream: true });
            const lines = rawChunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content || '';
                if (text) {
                  // Send only the raw text to the browser
                  controller.enqueue(new TextEncoder().encode(text));
                }
              } catch {
                // Ignore malformed JSON chunks
              }
            }
          }
        } catch (err) {
          controller.error(err);
        }
      }
    });

    // Return a streaming plain-text response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error("Backend Error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
