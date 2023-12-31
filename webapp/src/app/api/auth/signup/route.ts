import prisma from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { generateMessage, isValidBody } from "@/lib/server/response-utils";
import { signToken } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isValidBody(body as never, ["email", "password", "rememberMe"]))
      throw new Error("Invalid request");
    const { email, password, rememberMe } = body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user !== null) {
      // Account already exists
      return NextResponse.json(
        generateMessage({
          message: "Account already exists",
          error: "Account already exists",
        }),
        { status: 409 }
      );
    }

    // Create a new account
    const hashedPassword = await bcrypt.hash(password, 10);
    // TODO: Validate the fields from the request body
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Successfully created the account -> Set cookies if rememberMe and redirect to recommendations
    if (rememberMe === true) {
      const token = signToken(
        {
          id: newUser.id,
          email: newUser.email,
          name: "",
        },
        { expiresIn: "30d" }
      );
      return NextResponse.json(
        generateMessage({
          message: "Successfully created account",
        }),
        {
          status: 200,
          headers: {
            "Set-Cookie": `token=${token}; Max-Age=${
              60 * 60 * 24 * 30
            }; Path=/; HttpOnly; SameSite=Lax`,
          },
        }
      );
    } else {
      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        name: "",
      });
      return NextResponse.json(
        generateMessage({
          message: "Successfully created account",
        }),
        {
          status: 200,
          headers: {
            "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax`,
          },
        }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      generateMessage({
        message: "Something went wrong",
        error: err instanceof Error ? err.message : "Something went wrong",
      }),
      { status: err instanceof Error ? 401 : 500 }
    );
  }
}
