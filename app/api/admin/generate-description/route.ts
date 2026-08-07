import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(request: Request) {
    try {
        const { name, category } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // 1. If Gemini API Key exists, use it for high-quality AI copy
        if (GEMINI_API_KEY) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Write a professional, persuasive, and high-converting marketing description for a tech product.
                                Product Name: ${name}
                                Category: ${category}
                                Target Market: Kenya
                                Style: Premium, concise, benefit-focused.
                                Max 60 words.`
                            }]
                        }]
                    })
                });

                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiText) {
                    return NextResponse.json({ description: aiText.trim() });
                }
            } catch (err) {
                console.error("Gemini API Error:", err);
            }
        }

        // 2. Fallback to advanced Template System if API fails or is missing
        const adjectives = ["Premium", "Elite", "High-performance", "Crystal-clear", "Next-gen", "Seamless", "Durable", "Sleek", "Professional", "Authentic"];
        const powerWords = ["Immersive", "lightning-fast", "military-grade", "precision-engineered", "studio-quality"];
        const verbs = ["Elevate", "Upgrade", "Transform", "Master", "Experience", "Secure", "Empower"];

        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const power = powerWords[Math.floor(Math.random() * powerWords.length)];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];

        let description = "";

        switch (category) {
            case "airpods":
                description = `${adj} audio experience with the new ${name}. Featuring ${power} active noise cancellation, deep immersive bass, and a comfortable ergonomic design perfect for daily use. ${verb} your music today with authentic quality.`;
                break;
            case "chargers":
                description = `${adj} power delivery for your devices. The ${name} ensures ${power} charging speeds while protecting your battery health with smart heat management. ${verb} your charging game.`;
                break;
            case "cases":
                description = `${power} protection meets elegant design. The ${name} offers a ${adj.toLowerCase()} fit with shock-absorbent materials and a premium soft-touch finish. ${verb} your device in style.`;
                break;
            case "watches":
                description = `Stay connected and track your fitness with the ${adj} ${name}. Features a vivid display, ${power} health monitoring, and seamless sync with your phone. ${verb} your lifestyle.`;
                break;
            default:
                description = `${adj} ${name} designed for those who demand the best. Engineered for ${power} reliability and performance in every situation. ${verb} the difference with Apexstores.`;
        }

        return NextResponse.json({ description });

    } catch {
        return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
    }
}
