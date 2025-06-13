import phash from "sharp-phash";

export const getPhash = async (url: string): Promise<string | null> => {
  const response = await fetch(url, { method: "GET" });
  const isImage = response.headers.get("content-type")?.startsWith("image/");
  if (!isImage) return null;
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return await phash(buffer);
};
