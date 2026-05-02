import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { to, subject, text } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.REPORT_FROM_EMAIL;

    if (!apiKey || !from) {
      return NextResponse.json(
        { message: "Missing RESEND_API_KEY or REPORT_FROM_EMAIL" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
    });

    return NextResponse.json({ message: "Email sent.", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}