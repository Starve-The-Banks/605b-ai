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
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        marginBottom: '32px',
        paddingTop: '20px',
      }}>
        <Link href="/" style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#fafafa',
          textDecoration: 'none',
          display: 'inline-block',
        }}>
          605b<span style={{ color: '#f7d047' }}>.ai</span>
        </Link>
      </div>

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
              minHeight: '44px',
            },
            card: { 
              backgroundColor: '#18181b', 
              border: '1px solid #27272a',
              width: '100%',
              maxWidth: '400px',
            },
            formFieldInput: {
              minHeight: '44px',
            },
            socialButtonsBlockButton: {
              minHeight: '44px',
            },
          }
        }}
      />
    </div>
  );
}
