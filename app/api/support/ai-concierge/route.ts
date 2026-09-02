import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({
                response: "Hello! I'm currently in 'Standby' mode because the API key isn't linked. Please ensure the GOOGLE_GEMINI_API_KEY is configured in the environment variables so I can assist you with your technical needs."
            }, { status: 200 });
        }

        // 1. Fetch current inventory context for the AI
        let productsContext = "Here is our current inventory at Apexstores Kenya:\n";
        if (supabase) {
            const { data: products } = await supabase.from('products').select('id, name, price, category, description, stock');
            if (products) {
                products.forEach(p => {
                    productsContext += `- ${p.name} (${p.category}): Ksh ${p.price}. ${p.stock > 0 ? 'In Stock' : 'Sold Out'}. ${p.description?.substring(0, 50)}...\n`;
                });
            }
        }

        // 2. Query Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{
                            text: `You are the Apex AI Concierge for Apexstores Tech Kenya.
                            Your goal is to help customers find the best gadgets and tech accessories.
                            Be professional, friendly, and helpful.

                            Context:
                            ${productsContext}

                            Instructions:
                            - Suggest specific products from the inventory above based on their needs.
                            - If something is sold out, mention it but suggest an alternative.
                            - Always include the price in Ksh.
                            - Keep responses concise and focused on sales.
                            - If you mention a product, provide its ID like [PROD-ID] so the UI can link to it.

                            User Question: ${message}`
                        }]
                    }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiResponse) {
            return NextResponse.json({ response: aiResponse.trim() });
        } else {
            throw new Error("AI failed to generate a response.");
        }

    } catch (error: unknown) {
        console.error("AI Concierge Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
