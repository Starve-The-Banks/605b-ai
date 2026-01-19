import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isBetaWhitelisted } from '@/lib/beta';

// Lazy initialization
let stripe = null;
let redis = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe').default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Bureau addresses
const BUREAU_ADDRESSES = {
  equifax: {
    name: 'Equifax Information Services LLC',
    address: 'P.O. Box 740256',
    city: 'Atlanta',
    state: 'GA',
    zip: '30374',
  },
  experian: {
    name: 'Experian',
    address: 'P.O. Box 4500',
    city: 'Allen',
    state: 'TX',
    zip: '75013',
  },
  transunion: {
    name: 'TransUnion LLC',
    address: 'P.O. Box 2000',
    city: 'Chester',
    state: 'PA',
    zip: '19016',
  },
};

// Validate token format (64-character hex token)
const TOKEN_REGEX = /^[a-f0-9]{64}$/;

export async function GET(request) {
  try {
    const redisClient = getRedis();
    const stripeClient = getStripe();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order');
    const intakeToken = searchParams.get('intake'); // Beta-only: direct intake token
    const docType = searchParams.get('doc') || 'all';

    // Check for beta whitelist access
    const { userId } = await auth();
    let isBeta = false;
    if (userId) {
      const user = await currentUser();
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      isBeta = isBetaWhitelisted(userEmail);
    }

    let orderData;

    // Beta users can use intake token directly (bypasses payment verification)
    if (isBeta && intakeToken) {
      if (!TOKEN_REGEX.test(intakeToken)) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
      }

      const intakeDataRaw = await redisClient.get(`it:intake:${intakeToken}`);
      if (!intakeDataRaw) {
        return NextResponse.json({ error: 'Intake data not found or expired' }, { status: 404 });
      }

      const intakeData = typeof intakeDataRaw === 'string' ? JSON.parse(intakeDataRaw) : intakeDataRaw;
      orderData = { ...intakeData, status: 'paid', isBetaAccess: true };
    } else {
      // Normal flow: require order ID and payment verification
      if (!orderId) {
        return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
      }

      // Validate order ID format to prevent injection attacks
      if (!TOKEN_REGEX.test(orderId)) {
        return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
      }

      // Get order data
      const orderDataRaw = await redisClient.get(`idt-order:${orderId}`);
      if (!orderDataRaw) {
        return NextResponse.json({ error: 'Order not found or expired' }, { status: 404 });
      }

      orderData = typeof orderDataRaw === 'string' ? JSON.parse(orderDataRaw) : orderDataRaw;

      // Verify payment was completed
      if (orderData.status !== 'paid') {
        // Check Stripe session status
        if (orderData.stripeSessionId) {
          const session = await stripeClient.checkout.sessions.retrieve(orderData.stripeSessionId);
          if (session.payment_status === 'paid') {
            orderData.status = 'paid';
            await redisClient.set(`idt-order:${orderId}`, JSON.stringify(orderData), { ex: 86400 * 7 });
          } else {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
          }
        } else {
          return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
        }
      }
    }

    // Generate PDF based on docType
    const doc = new PDFDocument({ margin: 72, size: 'LETTER' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Helper function to add a new page with header
    const addPage = (title) => {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(11).font('Helvetica');
    };

    // Page 1: Cover / What To Do Next
    doc.fontSize(24).font('Helvetica-Bold').text('Identity Theft Dispute Packet', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Prepared for: ${orderData.fullName}`, { align: 'center' });
    doc.text(`Generated: ${today}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('What To Do Next');
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica');

    const steps = [
      'Review all documents in this packet carefully before sending.',
      'Sign and date the FTC Identity Theft Affidavit where indicated.',
      'Make copies of everything for your records.',
      'Send each bureau letter to the correct address via Certified Mail with Return Receipt.',
      'Send creditor letters to each fraudulent creditor.',
      'Keep all tracking numbers and receipts.',
      'Mark your calendar: Bureaus have 4 business days to block reported items (per FCRA §605B).',
      'Follow up if you do not receive confirmation within 30 days.',
    ];

    steps.forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`, { indent: 20 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);
    doc.fontSize(10).fillColor('#666666');
    doc.text('IMPORTANT: This packet is self-service software output. 605b.ai does not send these documents on your behalf, contact bureaus or creditors for you, or guarantee any outcomes. You are responsible for reviewing, signing, and mailing all materials.', {
      align: 'left',
    });
    doc.fillColor('#000000');

    // Page 2: FTC Identity Theft Affidavit
    addPage('FTC Identity Theft Affidavit');

    doc.fontSize(10).font('Helvetica-Bold').text('VICTIM INFORMATION');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text(`Name: ${orderData.fullName}`);
    doc.text(`Address: ${orderData.address}`);
    doc.text(`${orderData.city}, ${orderData.state} ${orderData.zip}`);
    doc.text(`Date of Birth: ${new Date(orderData.dob).toLocaleDateString('en-US')}`);
    doc.text(`SSN (last 4): XXX-XX-${orderData.ssnLast4}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('DECLARATION');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text('I, the undersigned, declare under penalty of perjury that the information provided in this affidavit is true and correct to the best of my knowledge.');
    doc.moveDown(0.5);
    doc.text('I did not authorize anyone to use my name or personal information to seek the money, credit, loans, goods, or services described in this report.');
    doc.moveDown(0.5);
    doc.text('I did not receive any benefit, money, goods, or services as a result of the events described in this report.');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('FRAUDULENT ACCOUNTS IDENTIFIED:');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    orderData.creditors.forEach((creditor) => {
      doc.text(`• ${creditor}`, { indent: 20 });
    });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('AFFECTED CREDIT BUREAUS:');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    orderData.bureaus.forEach((bureau) => {
      doc.text(`• ${bureau.charAt(0).toUpperCase() + bureau.slice(1)}`, { indent: 20 });
    });
    doc.moveDown(2);

    doc.text('_________________________________          _______________');
    doc.text('Signature                                                      Date');
    doc.moveDown(2);
    doc.text(`${orderData.fullName}`);
    doc.text('(Print Name)');

    // Page 3+: Bureau Letters (605B)
    orderData.bureaus.forEach((bureau) => {
      const bureauInfo = BUREAU_ADDRESSES[bureau];
      addPage(`FCRA §605B Identity Theft Block Request - ${bureauInfo.name}`);

      doc.text(today);
      doc.moveDown(1);

      doc.text(bureauInfo.name);
      doc.text(bureauInfo.address);
      doc.text(`${bureauInfo.city}, ${bureauInfo.state} ${bureauInfo.zip}`);
      doc.moveDown(1);

      doc.text(`Re: Identity Theft Block Request Under FCRA §605B`);
      doc.text(`Consumer: ${orderData.fullName}`);
      doc.text(`SSN (last 4): XXX-XX-${orderData.ssnLast4}`);
      doc.moveDown(1);

      doc.text('To Whom It May Concern:');
      doc.moveDown(0.5);

      doc.text('I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. §1681c-2 (Section 605B), I am requesting that you block the following fraudulent information from my credit report within four (4) business days of receiving this request:');
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('Fraudulent Accounts to Block:');
      doc.font('Helvetica');
      orderData.creditors.forEach((creditor) => {
        doc.text(`• ${creditor}`, { indent: 20 });
      });
      doc.moveDown(0.5);

      doc.text('Enclosed with this letter, please find:');
      doc.text('1. A copy of my FTC Identity Theft Affidavit', { indent: 20 });
      doc.text('2. A copy of my government-issued identification', { indent: 20 });
      doc.text('3. Proof of my current address', { indent: 20 });
      doc.moveDown(0.5);

      doc.text('Under FCRA §605B, you are required to:');
      doc.text('• Block the reported information within 4 business days', { indent: 20 });
      doc.text('• Notify the furnisher of the block', { indent: 20 });
      doc.text('• Notify me that the block has been implemented', { indent: 20 });
      doc.moveDown(0.5);

      doc.text('Please send written confirmation of the block to my address listed above.');
      doc.moveDown(1);

      doc.text('Sincerely,');
      doc.moveDown(2);
      doc.text('_________________________________');
      doc.text(orderData.fullName);
      doc.text(orderData.address);
      doc.text(`${orderData.city}, ${orderData.state} ${orderData.zip}`);
    });

    // Creditor Letter Template
    addPage('Creditor Dispute Letter Template');

    doc.text('[DATE]');
    doc.moveDown(0.5);
    doc.text('[CREDITOR NAME]');
    doc.text('[CREDITOR ADDRESS]');
    doc.moveDown(1);

    doc.text(`Re: Fraudulent Account - Identity Theft`);
    doc.text(`Account Number: [ACCOUNT NUMBER IF KNOWN]`);
    doc.text(`Consumer: ${orderData.fullName}`);
    doc.moveDown(1);

    doc.text('To Whom It May Concern:');
    doc.moveDown(0.5);

    doc.text('I am writing to dispute an account that was fraudulently opened in my name. I am a victim of identity theft and did not authorize, open, or benefit from this account.');
    doc.moveDown(0.5);

    doc.text('Pursuant to the Fair Credit Reporting Act (FCRA) and the Fair Debt Collection Practices Act (FDCPA), I request that you:');
    doc.moveDown(0.5);
    doc.text('1. Cease all collection activity on this fraudulent account', { indent: 20 });
    doc.text('2. Remove any negative information reported to credit bureaus', { indent: 20 });
    doc.text('3. Provide copies of all documentation related to this account', { indent: 20 });
    doc.text('4. Confirm in writing that this account has been closed and removed', { indent: 20 });
    doc.moveDown(0.5);

    doc.text('Enclosed please find a copy of my FTC Identity Theft Affidavit and supporting documentation.');
    doc.moveDown(1);

    doc.text('Sincerely,');
    doc.moveDown(2);
    doc.text(orderData.fullName);
    doc.text(orderData.address);
    doc.text(`${orderData.city}, ${orderData.state} ${orderData.zip}`);

    // Certified Mail Checklist
    addPage('Certified Mail Checklist');

    doc.fontSize(11).text('Use this checklist to track your certified mailings. Keep all receipts and tracking numbers.');
    doc.moveDown(1);

    const mailings = [
      ...orderData.bureaus.map((b) => ({
        recipient: BUREAU_ADDRESSES[b].name,
        address: `${BUREAU_ADDRESSES[b].address}, ${BUREAU_ADDRESSES[b].city}, ${BUREAU_ADDRESSES[b].state} ${BUREAU_ADDRESSES[b].zip}`,
      })),
      ...orderData.creditors.map((c) => ({
        recipient: c,
        address: '[Look up address on statement or online]',
      })),
    ];

    mailings.forEach((mailing, i) => {
      doc.font('Helvetica-Bold').text(`${i + 1}. ${mailing.recipient}`);
      doc.font('Helvetica').text(`   Address: ${mailing.address}`, { indent: 20 });
      doc.text('   □ Letter prepared', { indent: 20 });
      doc.text('   □ Copies made for records', { indent: 20 });
      doc.text('   □ Sent via Certified Mail', { indent: 20 });
      doc.text('   Tracking #: _______________________________', { indent: 20 });
      doc.text('   Date Sent: _______________________________', { indent: 20 });
      doc.text('   Return Receipt Received: □ Yes  □ No', { indent: 20 });
      doc.moveDown(1);
    });

    // USPS Mailing Instructions
    addPage('USPS Certified Mail Instructions');

    doc.text('Sending your dispute letters via Certified Mail with Return Receipt provides proof of delivery, which may be important if you need to demonstrate compliance with deadlines.');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('Step-by-Step Instructions:');
    doc.font('Helvetica');
    doc.moveDown(0.5);

    const mailSteps = [
      'Go to your local USPS post office (not a mailbox drop).',
      'Request "Certified Mail with Return Receipt Requested" (PS Form 3800).',
      'Fill out the green Return Receipt card (PS Form 3811) with your address.',
      'The postal clerk will give you a receipt with a tracking number.',
      'The current cost is approximately $7-10 per letter (rates may vary).',
      'Keep all receipts and tracking numbers with your copies.',
      'Track delivery online at usps.com using your tracking number.',
      'You will receive the signed green card back in the mail as proof of delivery.',
    ];

    mailSteps.forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Timeline Reminder:');
    doc.font('Helvetica');
    doc.text('• Credit bureaus must block identity theft items within 4 business days (FCRA §605B)');
    doc.text('• If you don\'t receive confirmation within 30 days, follow up in writing');
    doc.text('• Keep all correspondence for at least 7 years');

    // Finalize PDF
    doc.end();

    const pdfBuffer = await pdfPromise;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="identity-theft-packet-${orderId.slice(0, 8)}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Packet generation error:', error);
    // Don't expose internal error messages to clients
    return NextResponse.json(
      { error: 'Failed to generate packet. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
