import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
    interface HealthStatus {
        status: string;
        timestamp: string;
        services: {
            database: string;
            resend: string;
            mpesa: string;
            gemini: string;
        }
    }

    const health: HealthStatus = {
        status: "Healthy",
        timestamp: new Date().toISOString(),
        services: {
            database: "Unknown",
            resend: process.env.RESEND_API_KEY ? "Configured" : "Missing",
            mpesa: (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET) ? "Configured" : "Missing",
            gemini: process.env.GOOGLE_GEMINI_API_KEY ? "Configured" : "Missing"
        }
    };

    try {
        if (supabase) {
            const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
            if (!error) {
                health.services.database = "Connected";
            } else {
                health.services.database = "Error: " + error.message;
                health.status = "Degraded";
            }
        } else {
            health.services.database = "Not Initialized";
            health.status = "Down";
        }
    } catch {
        health.services.database = "Connection Failed";
        health.status = "Down";
    }

    return NextResponse.json(health);
}
