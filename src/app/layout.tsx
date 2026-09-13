import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { fontBody, fontHeading } from "@/lib/fonts";
import "./globals.css";
const GA_MEASUREMENT_ID="G-SP3SE2ND1D";
const siteUrl=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";
const title="Stronger Steps | Improve Strength, Balance & Confidence After 50";
const description="Join the Stronger Steps Workshop, a guided wellness experience specially designed for adults over 50. Safely improve your strength, balance, and independence.";
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:title,template:"%s | Stronger Steps"},description,keywords:["health after 50","elder wellness","improve balance","strength training for seniors","independent living","senior fitness workshop"],alternates:{canonical:"/"},openGraph:{type:"website",url:siteUrl,siteName:"Stronger Steps",title,description,images:[{url:"/assets/images/hero.png",width:1200,height:630,alt:"Stronger Steps Workshop"}],locale:"en_IN"},twitter:{card:"summary_large_image",title,description,images:["/assets/images/hero.png"]}};
export const viewport:Viewport={themeColor:"#2b5c4d",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${fontHeading.variable} ${fontBody.variable} antialiased`}>{children}</body><GoogleAnalytics gaId={GA_MEASUREMENT_ID}/></html>}
