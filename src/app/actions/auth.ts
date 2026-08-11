"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (email === "karyabahan123@gmail.com" && password === "karyabahan33") {
    // Session Cookie (otomatis hilang saat browser/tab ditutup)
    const cookieStore = await cookies();
    cookieStore.set("auth", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      // maxAge DIHAPUS agar menjadi Session Cookie
    });
    return { success: true };
  }

  return { success: false, error: "Email atau Password salah" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth");
  cookieStore.delete("store"); // also clear store on logout
  redirect("/login");
}

export async function selectStore(storeId: string) {
  const cookieStore = await cookies();
  cookieStore.set("store", storeId, { 
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}

export async function clearStore() {
  const cookieStore = await cookies();
  cookieStore.delete("store");
  redirect("/store-select");
}
