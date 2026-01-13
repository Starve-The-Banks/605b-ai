import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((auth, req) => {
  // Force redirect from Vercel preview URLs to production domain
  const host = req.headers.get('host') || '';
  const isVercelPreview = host.includes('.vercel.app') && !host.startsWith('605b-ai');
  
  if (isVercelPreview && process.env.NEXT_PUBLIC_APP_URL) {
    const productionUrl = new URL(req.url);
    productionUrl.host = new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    return NextResponse.redirect(productionUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
