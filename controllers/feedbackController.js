const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send feedback email
const sendFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "ghostclonerd@gmail.com", // Send to the same email address
      subject: name ? `Feedback from ${name}` : 'Anonymous Feedback',
      text: `
        New feedback received:
        
        Name: ${name || 'Not provided'}
        Email: ${email || 'Not provided'}
        Message: ${message}
      `,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Create transporter and send email
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully'
    });
  } catch (error) {
    console.error('Error sending feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send feedback'
    });
  }
};

module.exports = {
  sendFeedback
};
