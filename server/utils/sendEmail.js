import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
    try {
        // 🔍 STEP 1: Check ENV values
        console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
        console.log("🔐 EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 🔍 STEP 2: Verify Gmail connection
        await transporter.verify();
        console.log("✅ Gmail transporter verified");

        // 📤 STEP 3: Send mail
        await transporter.sendMail({
            from: `BYKAR Vehicle Rental <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });

        console.log("✅ Email sent successfully");

    } catch (error) {
        // 🔥 STEP 4: Show REAL error
        console.error(" Email error FULL:", error);
        throw error; // IMPORTANT: do not hide error
    }
};

export default sendEmail;
