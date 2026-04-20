import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";
import { getGeminiIntakeTargets, normalizeIntakeTargets, normalizeProfile } from "@/lib/intake";
import { NutrientTargets } from "@/lib/types";

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
    const {
      name,
      age,
      height,
      weight,
      gender,
      intakeTargets,
      resetTargets,
    } = body as Record<string, string | boolean | Partial<NutrientTargets>>;

    const profile = normalizeProfile(user.profile);
    const nextProfileBase = {
      ...profile,
      age: typeof age === "string" ? age.trim() || profile.age : profile.age,
      height: typeof height === "string" ? height.trim() || profile.height : profile.height,
      weight: typeof weight === "string" ? weight.trim() || profile.weight : profile.weight,
      gender: typeof gender === "string" ? gender.trim() || profile.gender : profile.gender,
    };

    const shouldUseGeminiTargets = resetTargets === true;
    const targetUpdate = shouldUseGeminiTargets
      ? await getGeminiIntakeTargets(nextProfileBase)
      : null;

    const updatedUser = await updateUser({
      ...user,
      name: typeof name === "string" ? name.trim() || user.name : user.name,
      profile: {
        ...nextProfileBase,
        intakeTargets: targetUpdate
          ? targetUpdate.targets
          : intakeTargets && typeof intakeTargets === "object"
            ? normalizeIntakeTargets(intakeTargets)
            : profile.intakeTargets,
        intakeSource: targetUpdate
          ? targetUpdate.source
          : intakeTargets && typeof intakeTargets === "object"
            ? "manual"
            : profile.intakeSource,
        intakeUpdatedAt:
          targetUpdate || (intakeTargets && typeof intakeTargets === "object")
            ? new Date().toISOString()
            : profile.intakeUpdatedAt,
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
