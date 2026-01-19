export const fetcher = async ({ url, role }: { url: string; role: string }) => {
  const res = await fetch(`${url}?userRole=${role}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
};
