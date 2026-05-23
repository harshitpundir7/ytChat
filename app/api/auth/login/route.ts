import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // IMPORTANT: We give the same error whether the email doesn't exist
    // OR the password is wrong. This prevents "user enumeration" attacks
    // where an attacker can test if an email is registered.
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hash
    // bcrypt.compare does this securely without you having to hash the input
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}