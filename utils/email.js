import nodemailer from 'nodemailer';

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_FROM, // 'Jonas Schmedtmann <hello@jonas.io>',
    to: options.to,
    subject: options.subject,
    html: options.text
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions, function(err, info){
    if(err){
      console.log(err)
    }else{
      console.log(info)
    }
  });
};

export default sendEmail;