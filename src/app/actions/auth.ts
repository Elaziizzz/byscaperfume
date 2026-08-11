"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (email === "karyabahan123@gmail.com" && password === "karyabahan33") {
    // Set cookie valid for 7 days
    cookies().set("auth", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7 
    });
    return { success: true };
  }

  return { success: false, error: "Email atau Password salah" };
}

export async function logout() {
  cookies().delete("auth");
  redirect("/login");
}
