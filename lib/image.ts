// Phone ki 5-10 MB wali photo seedha upload karne se site slow hoti hai aur Supabase storage (free 1 GB) bharta hai.
// Isliye upload se pehle browser me hi resize + JPEG compress karte hain (max 1600px).
// Fail ho jaye ya chhoti file ho to original hi jaata hai.
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<{ blob: Blob; ext: string }> {
  const original = { blob: file as Blob, ext: (file.name.split(".").pop() || "jpg").toLowerCase() };
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return original;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 600_000) { bmp.close(); return original; }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return original; }
    ctx.fillStyle = "#fff"; // transparent PNG ke peeche white (JPEG me alpha nahi hota)
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    return blob && blob.size < file.size ? { blob, ext: "jpg" } : original;
  } catch {
    return original;
  }
}
