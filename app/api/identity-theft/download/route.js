import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

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

export async function GET(request) {
  try {
    const stripeClient = getStripe();
    const redisClient = getRedis();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve Stripe session and verify payment
    let session;
    try {
      session = await stripeClient.checkout.sessions.retrieve(sessionId);
    } catch (e) {
      console.error('Failed to retrieve Stripe session:', e);
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    // Verify this is an identity theft packet purchase
    if (session.metadata?.productId !== 'identity_theft_packet') {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }

    // Get intake token from session metadata
    const intakeToken = session.metadata?.intakeToken;
    if (!intakeToken) {
      return NextResponse.json({ error: 'Missing intake data' }, { status: 400 });
    }

    // Retrieve intake data from Redis
    const intakeDataRaw = await redisClient.get(`it:intake:${intakeToken}`);
    if (!intakeDataRaw) {
      return NextResponse.json({ error: 'Intake data expired. Please contact support.' }, { status: 410 });
    }

    const intakeData = typeof intakeDataRaw === 'string' ? JSON.parse(intakeDataRaw) : intakeDataRaw;

    // Generate PDF
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
    doc.fontSize(12).font('Helvetica').text(`Prepared for: ${intakeData.fullName}`, { align: 'center' });
    doc.text(`Generated: ${today}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('What To Do Next');
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica');

    const steps = [
      'Review all documents in this packet carefully before sending.',
      'Sign and date the FTC Identity Theft Affidavit where indicated.',
      'Make copies of everything for your records.',
      'Attach copies of your government-issued ID and proof of address.',
      'Send each bureau letter to the correct address via Certified Mail with Return Receipt.',
      'Send creditor letters to each fraudulent creditor.',
      'Keep all tracking numbers and receipts.',
      'Mark your calendar: Bureaus have 4 business days to block reported items (per FCRA Section 605B).',
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

    doc.fontSize(10).font('Helvetica-Bold').text('SECTION 1: VICTIM INFORMATION');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text(`Full Legal Name: ${intakeData.fullName}`);
    doc.text(`Current Address: ${intakeData.address}`);
    doc.text(`City, State, ZIP: ${intakeData.city}, ${intakeData.state} ${intakeData.zip}`);
    doc.text(`Date of Birth: ${new Date(intakeData.dob).toLocaleDateString('en-US')}`);
    doc.text(`Social Security Number (last 4): XXX-XX-${intakeData.ssnLast4}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('SECTION 2: DECLARATION');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text('I, the undersigned, declare under penalty of perjury under the laws of the United States of America that the information provided in this affidavit is true and correct to the best of my knowledge.');
    doc.moveDown(0.5);
    doc.text('I am a victim of identity theft. I did NOT authorize anyone to use my name or personal information to seek the money, credit, loans, goods, or services described in this report.');
    doc.moveDown(0.5);
    doc.text('I did NOT receive any benefit, money, goods, or services as a result of the events described in this report.');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('SECTION 3: FRAUDULENT ACCOUNTS IDENTIFIED');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    intakeData.creditors.forEach((creditor, i) => {
      doc.text(`${i + 1}. ${creditor}`, { indent: 20 });
    });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('SECTION 4: AFFECTED CREDIT BUREAUS');
    doc.moveDown(0.5);
    doc.font('Helvetica');
    intakeData.bureaus.forEach((bureau) => {
      doc.text(`- ${bureau.charAt(0).toUpperCase() + bureau.slice(1)}`, { indent: 20 });
    });
    doc.moveDown(2);

    doc.font('Helvetica-Bold').text('SIGNATURE (Sign in ink after printing)');
    doc.moveDown(1);
    doc.font('Helvetica');
    doc.text('_________________________________________________          ____________________');
    doc.text('Victim Signature                                                                       Date');
    doc.moveDown(2);
    doc.text(`Printed Name: ${intakeData.fullName}`);

    // Bureau Letters (605B) - one per selected bureau
    intakeData.bureaus.forEach((bureau) => {
      const bureauInfo = BUREAU_ADDRESSES[bureau];
      addPage(`FCRA Section 605B Identity Theft Block Request`);

      doc.fontSize(11);
      doc.text(today);
      doc.moveDown(1);

      doc.font('Helvetica-Bold').text('SEND VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED');
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(bureauInfo.name);
      doc.text(bureauInfo.address);
      doc.text(`${bureauInfo.city}, ${bureauInfo.state} ${bureauInfo.zip}`);
      doc.moveDown(1);

      doc.font('Helvetica-Bold').text('Re: Identity Theft Block Request Under FCRA Section 605B');
      doc.font('Helvetica');
      doc.text(`Consumer Name: ${intakeData.fullName}`);
      doc.text(`SSN (last 4 digits): XXX-XX-${intakeData.ssnLast4}`);
      doc.text(`Current Address: ${intakeData.address}, ${intakeData.city}, ${intakeData.state} ${intakeData.zip}`);
      doc.moveDown(1);

      doc.text('To Whom It May Concern:');
      doc.moveDown(0.5);

      doc.text('I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. Section 1681c-2 (Section 605B), I hereby request that you block the following fraudulent information from my credit report within four (4) business days of receiving this request.');
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('FRAUDULENT ACCOUNTS TO BE BLOCKED:');
      doc.font('Helvetica');
      doc.moveDown(0.3);
      intakeData.creditors.forEach((creditor, i) => {
        doc.text(`${i + 1}. ${creditor}`, { indent: 20 });
      });
      doc.moveDown(0.5);

      doc.text('I did not authorize the opening of these accounts and did not receive any benefit from them. These accounts are the result of identity theft.');
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('ENCLOSED DOCUMENTS:');
      doc.font('Helvetica');
      doc.text('1. FTC Identity Theft Affidavit (signed)', { indent: 20 });
      doc.text('2. Copy of government-issued photo identification', { indent: 20 });
      doc.text('3. Proof of current address (utility bill, bank statement, etc.)', { indent: 20 });
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('REQUIRED ACTIONS UNDER FCRA SECTION 605B:');
      doc.font('Helvetica');
      doc.text('- Block the fraudulent information within 4 business days of receipt', { indent: 20 });
      doc.text('- Notify the furnisher(s) of the block', { indent: 20 });
      doc.text('- Provide written confirmation to me that the block has been implemented', { indent: 20 });
      doc.moveDown(0.5);

      doc.text('Please send written confirmation of the completed block to my address listed above. I reserve all rights under the Fair Credit Reporting Act and other applicable laws.');
      doc.moveDown(1);

      doc.text('Sincerely,');
      doc.moveDown(2);
      doc.text('_________________________________________________');
      doc.text(`${intakeData.fullName}`);
      doc.text(`${intakeData.address}`);
      doc.text(`${intakeData.city}, ${intakeData.state} ${intakeData.zip}`);
    });

    // Creditor Dispute Letter Template
    addPage('Creditor Dispute Letter Template');

    doc.fontSize(10).fillColor('#666666');
    doc.text('INSTRUCTIONS: Copy this letter for each fraudulent creditor. Fill in the bracketed information, sign, and send via Certified Mail.');
    doc.fillColor('#000000');
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text('[DATE]');
    doc.moveDown(0.5);
    doc.text('[CREDITOR NAME]');
    doc.text('[CREDITOR ADDRESS]');
    doc.text('[CITY, STATE ZIP]');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('Re: Fraudulent Account - Identity Theft Dispute');
    doc.font('Helvetica');
    doc.text('Account Number: [ACCOUNT NUMBER - if known]');
    doc.text(`Consumer Name: ${intakeData.fullName}`);
    doc.moveDown(1);

    doc.text('To Whom It May Concern:');
    doc.moveDown(0.5);

    doc.text('I am writing to formally dispute an account that was fraudulently opened in my name without my knowledge or authorization. I am a victim of identity theft.');
    doc.moveDown(0.5);

    doc.text('I did NOT open this account, authorize anyone to open this account on my behalf, or receive any benefit from this account.');
    doc.moveDown(0.5);

    doc.text('Pursuant to the Fair Credit Reporting Act (FCRA), Fair Debt Collection Practices Act (FDCPA), and applicable state laws, I request that you:');
    doc.moveDown(0.3);
    doc.text('1. Immediately cease all collection activity on this fraudulent account', { indent: 20 });
    doc.text('2. Close this account and remove it from your records as fraud', { indent: 20 });
    doc.text('3. Remove any negative information reported to credit bureaus', { indent: 20 });
    doc.text('4. Provide copies of all account documentation, including the application', { indent: 20 });
    doc.text('5. Confirm in writing that this account has been closed and reported as fraud', { indent: 20 });
    doc.moveDown(0.5);

    doc.text('Enclosed please find a copy of my FTC Identity Theft Affidavit and supporting identification documents.');
    doc.moveDown(0.5);

    doc.text('Please respond within 30 days. Failure to properly investigate this dispute may result in additional legal action.');
    doc.moveDown(1);

    doc.text('Sincerely,');
    doc.moveDown(2);
    doc.text('_________________________________________________');
    doc.text(`${intakeData.fullName}`);
    doc.text(`${intakeData.address}`);
    doc.text(`${intakeData.city}, ${intakeData.state} ${intakeData.zip}`);

    // Certified Mail Checklist
    addPage('Certified Mail Tracking Checklist');

    doc.fontSize(10).fillColor('#666666');
    doc.text('Use this checklist to track all mailings. Keep all receipts and the green return receipt cards as proof of delivery.');
    doc.fillColor('#000000');
    doc.moveDown(1);

    doc.fontSize(11);

    // Bureau mailings
    doc.font('Helvetica-Bold').text('CREDIT BUREAU MAILINGS:');
    doc.font('Helvetica');
    doc.moveDown(0.5);

    intakeData.bureaus.forEach((bureau, i) => {
      const b = BUREAU_ADDRESSES[bureau];
      doc.font('Helvetica-Bold').text(`${i + 1}. ${b.name}`);
      doc.font('Helvetica');
      doc.text(`   Address: ${b.address}, ${b.city}, ${b.state} ${b.zip}`, { indent: 10 });
      doc.text('   [ ] Letter printed and signed', { indent: 10 });
      doc.text('   [ ] ID copy attached', { indent: 10 });
      doc.text('   [ ] Affidavit copy attached', { indent: 10 });
      doc.text('   [ ] Sent via Certified Mail', { indent: 10 });
      doc.text('   Tracking Number: _________________________________', { indent: 10 });
      doc.text('   Date Sent: _______________________________________', { indent: 10 });
      doc.text('   Return Receipt Received: [ ] Yes  [ ] No  Date: ________', { indent: 10 });
      doc.moveDown(0.5);
    });

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('CREDITOR MAILINGS:');
    doc.font('Helvetica');
    doc.moveDown(0.5);

    intakeData.creditors.forEach((creditor, i) => {
      doc.font('Helvetica-Bold').text(`${i + 1}. ${creditor}`);
      doc.font('Helvetica');
      doc.text('   Address: ________________________________________', { indent: 10 });
      doc.text('   [ ] Letter printed and signed', { indent: 10 });
      doc.text('   [ ] Sent via Certified Mail', { indent: 10 });
      doc.text('   Tracking Number: _________________________________', { indent: 10 });
      doc.text('   Date Sent: _______________________________________', { indent: 10 });
      doc.text('   Return Receipt Received: [ ] Yes  [ ] No  Date: ________', { indent: 10 });
      doc.moveDown(0.5);
    });

    // USPS Mailing Instructions
    addPage('USPS Certified Mail Instructions');

    doc.text('Sending your dispute letters via Certified Mail with Return Receipt Requested creates a legal record of delivery. This documentation may be critical if you need to prove compliance with timelines or pursue further action.');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('HOW TO SEND CERTIFIED MAIL:');
    doc.font('Helvetica');
    doc.moveDown(0.5);

    const mailInstructions = [
      'Go to your local USPS post office (not a blue mailbox).',
      'Tell the clerk you need "Certified Mail with Return Receipt Requested."',
      'The clerk will provide PS Form 3800 (Certified Mail Receipt) and PS Form 3811 (Return Receipt card - the green card).',
      'Fill out the green Return Receipt card with YOUR return address.',
      'Attach the green card to each envelope.',
      'Pay the fees (approximately $7-10 per letter for certified mail + return receipt; rates vary).',
      'Keep the white receipt with the tracking number.',
      'The green card will be signed upon delivery and mailed back to you.',
      'Track delivery online at usps.com using your tracking number.',
    ];

    mailInstructions.forEach((instruction, i) => {
      doc.text(`${i + 1}. ${instruction}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('IMPORTANT TIMELINES:');
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.text('- Credit bureaus must block identity theft items within 4 business days (FCRA Section 605B)');
    doc.text('- If you do not receive written confirmation within 30 days, send a follow-up letter');
    doc.text('- Keep all correspondence and receipts for at least 7 years');
    doc.text('- Document everything with dates and tracking numbers');

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('IF YOU DO NOT RECEIVE A RESPONSE:');
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.text('1. Send a follow-up letter via Certified Mail referencing your original letter');
    doc.text('2. File a complaint with the Consumer Financial Protection Bureau (CFPB) at consumerfinance.gov');
    doc.text('3. File a complaint with the Federal Trade Commission (FTC) at reportfraud.ftc.gov');
    doc.text('4. Consider consulting with a consumer rights attorney');

    // Finalize PDF
    doc.end();

    const pdfBuffer = await pdfPromise;

    // Mark this intake as used (optional: delete after first download or keep for re-downloads)
    // We'll keep it but mark it as downloaded
    const updatedIntake = { ...intakeData, downloadedAt: new Date().toISOString() };
    await redisClient.set(`it:intake:${intakeToken}`, JSON.stringify(updatedIntake), { ex: 604800 }); // Keep for 7 days

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="identity-theft-dispute-packet.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Download generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate packet' },
      { status: 500 }
    );
  }
}
