import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.TMDB_API_KEY;
    if (!API_KEY) throw new Error("Missing TMDB_API_KEY env var");
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    } else {
      return NextResponse.json({}, { status: 500 });
    }
  }
}
