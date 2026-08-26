import { NextResponse } from "next/server";
import { syncRiderMerit } from "@/lib/apex-os/merit";

export async function POST(request: Request) {
    try {
        const { riderPhone } = await request.json();

        if (!riderPhone) {
            return NextResponse.json({ error: "Rider phone required" }, { status: 400 });
        }

        await syncRiderMerit(riderPhone);

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error("Merit API Error:", error);
        const message = error instanceof Error ? error.message : "Internal Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
