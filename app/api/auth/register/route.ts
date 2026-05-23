import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();

    // Validate the body against our schema
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      // If validation fails, return the error messages
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if an account with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password before storing it
    // bcrypt.hash(password, 12) — the 12 is the "salt rounds" (higher = more secure but slower)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user in the database
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    // Generate a JWT token so they're immediately logged in after registering
    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}