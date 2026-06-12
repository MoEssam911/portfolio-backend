export default () => ({
  mail: {
    // Resend API key. When empty the contact endpoint returns delivered:false
    // and the frontend falls back to a mailto: link.
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    // Verified Resend sender. Defaults to Resend's shared sandbox address, which
    // only delivers to the Resend account owner — set a verified domain sender
    // for production delivery.
    from: process.env.MAIL_FROM ?? 'Portfolio Contact <onboarding@resend.dev>',
    // Optional override for the recipient. When empty the owner's
    // settings.contactEmail is used as the destination.
    to: process.env.CONTACT_TO ?? '',
  },
});
