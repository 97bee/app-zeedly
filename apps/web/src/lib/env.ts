function normalizeTrpcUrl(value: string | undefined) {
  const url = (value?.trim() || "http://localhost:3001/trpc").replace(/\/+$/, "");
  return url.endsWith("/trpc") ? url : `${url}/trpc`;
}

export const env = {
  NEXT_PUBLIC_API_URL: normalizeTrpcUrl(process.env.NEXT_PUBLIC_API_URL),
  NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY?.trim() ?? "",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
};
