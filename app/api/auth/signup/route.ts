import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      height,
      weight,
      gender,
    } = body as Record<string, string>;

    if (!name || !email || !password || !height || !weight || !gender) {
      return NextResponse.json(
        { error: "Please fill in every sign up field." },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = await createUser({
      id: randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      profile: {
        height: height.trim(),
        weight: weight.trim(),
        gender: gender.trim(),
      },
    });

    await startSession(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
