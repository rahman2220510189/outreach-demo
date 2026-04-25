const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sendEmail = async ({ toEmail, subject, body, contactName }) => {
    
    const sesClient = new SESClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    const htmlBody = `
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Hi ${contactName || 'there'},</p>
            
            ${body}

            <br/>
            <hr/>
            <p style="font-size: 12px; color: #999;">
              You received this email because we found 
your business online.
                If you do not wish to receive further emails, 
                <a href="${process.env.CLIENT_URL}/api/contacts/unsubscribe?email=${toEmail}">
                    click here to unsubscribe
                </a>.
            </p>
            <p style="font-size: 12px; color: #999;">
                Ainoviro | Cyprus
            </p>
        </body>
    </html>
    `;

    const params = {
        Source: process.env.AWS_SES_FROM_EMAIL,
        Destination: {
            ToAddresses: [toEmail]
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: htmlBody,
                    Charset: 'UTF-8'
                }
            }
        }
    };

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    return result;
};

module.exports = { sendEmail };