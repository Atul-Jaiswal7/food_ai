import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile,
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { name, height, weight, gender } = body as Record<string, string>;

    const updatedUser = await updateUser({
      ...user,
      name: name?.trim() || user.name,
      profile: {
        height: height?.trim() || user.profile.height,
        weight: weight?.trim() || user.profile.weight,
        gender: gender?.trim() || user.profile.gender,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
