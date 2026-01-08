"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <Link href="/" style={{
        position: 'absolute',
        top: '32px',
        left: '40px',
        fontSize: '24px',
        fontWeight: '700',
        color: '#fafafa',
        textDecoration: 'none',
      }}>
        605b<span style={{ color: '#f7d047' }}>.ai</span>
      </Link>

      <SignIn 
        afterSignInUrl="/dashboard"
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            colorPrimary: '#f7d047',
            colorBackground: '#18181b',
            colorInputBackground: '#27272a',
            colorInputText: '#fafafa',
            colorText: '#fafafa',
          },
          elements: {
            formButtonPrimary: {
              backgroundColor: '#f7d047',
              color: '#09090b',
            },
            card: { 
              backgroundColor: '#18181b', 
              border: '1px solid #27272a' 
            },
          }
        }}
      />
    </div>
  );
}
